
import { handleCors, corsHeaders } from "./cors.ts";
import { extractKeys, getClientIp } from "./auth.ts";
import { initSupabaseClient, verifyLicense } from "./database.ts";
import { getAllScriptFiles } from "./storage.ts";
import { createErrorResponse } from "./response.ts";

// Function to send logs to our centralized logging endpoint
async function logToSystem(
  supabase: any,
  licenseId: string | null,
  level: 'info' | 'warning' | 'error' | 'debug',
  message: string,
  source: string,
  details?: string,
  errorCode?: string,
  clientIp?: string,
  fileName?: string
): Promise<boolean> {
  try {
    if (!licenseId) {
      console.warn("Cannot log: Missing license ID");
      return false;
    }
    
    console.log(`Logging to system: [${level}] ${message}`);
    
    const logUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/log";
    
    const response = await fetch(logUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        license_id: licenseId,
        level,
        message,
        source,
        details,
        error_code: errorCode,
        client_ip: clientIp,
        file_name: fileName
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from logging service: ${response.status} ${errorText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception while logging to system:", error);
    return false;
  }
}

// New function to apply filter logic for license IDs
function applyLicenseFilter(query: any, licenseId: string | null | undefined): any {
  // Only apply the filter if licenseId exists and is not "all"
  if (licenseId && licenseId !== "all") {
    return query.eq("license_id", licenseId);
  }
  return query;
}

export async function handleRequest(req: Request): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        console.log(`Received ${req.method} request to ${new URL(req.url).pathname}`);
        
        // Extract license and server keys
        const { licenseKey, serverKey } = await extractKeys(req);
        const clientIp = getClientIp(req);
        
        if (!licenseKey || !serverKey) {
            console.error("Missing credentials");
            return createErrorResponse("License key and server key are required");
        }

        // Initialize Supabase client
        const { client: supabase, error: dbError } = initSupabaseClient();
        if (dbError) {
            console.error("Database connection error:", dbError);
            return createErrorResponse("Database connection error");
        }

        // Verify license
        const licenseData = await verifyLicense(supabase, licenseKey, serverKey);
        
        if (!licenseData.valid) {
            console.warn("Invalid license data");
            // Log the failed verification attempt, only if we have an ID
            if (licenseData.id) {
                await logToSystem(
                    supabase,
                    licenseData.id, 
                    'error',
                    'License verification failed',
                    'verify-license',
                    'Invalid license or server key',
                    'E1001',
                    clientIp
                );
            }
            return createErrorResponse("Invalid license or server key");
        }

        // Log successful license verification
        await logToSystem(
            supabase,
            licenseData.id,
            'info',
            `Script request received for ${licenseData.script_name}`,
            'verify-license',
            `Client IP: ${clientIp}`,
            null,
            clientIp
        );

        // Get scripts content directly from storage using license ID
        const scriptResult = await getAllScriptFiles(supabase, licenseData.id);
        
        if (!scriptResult || scriptResult.error || !scriptResult.content) {
            console.warn("No script content found:", scriptResult?.error || "No content");
            
            // Log the error
            await logToSystem(
                supabase,
                licenseData.id,
                'error',
                'No script files found',
                'storage',
                scriptResult?.error || 'No script files available',
                'E2001',
                clientIp
            );
            
            return createErrorResponse("No script files found for this license");
        }

        // Success: Return scripts as JSON
        console.log(`Scripts successfully delivered for license ${licenseData.id}`);
        
        // Log the successful delivery
        await logToSystem(
            supabase,
            licenseData.id,
            'info',
            `Scripts successfully delivered (${Object.keys(scriptResult.content).length} files)`,
            'delivery',
            `Files: ${Object.keys(scriptResult.content).join(', ')}`,
            null,
            clientIp
        );
        
        return new Response(JSON.stringify(scriptResult.content), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            },
            status: 200
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        
        // We may not have license data here, but we'll try to log what we can
        try {
            const { client: supabase } = initSupabaseClient();
            if (supabase) {
                await logToSystem(
                    supabase,
                    null, // We don't have license ID in this case
                    'error',
                    'Internal server error',
                    'system',
                    `Exception: ${(error as Error).message}`,
                    'E9999',
                    getClientIp(req)
                );
            }
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }
        
        return createErrorResponse("Internal server error");
    }
}
