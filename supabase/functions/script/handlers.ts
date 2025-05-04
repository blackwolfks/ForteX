
import { handleCors, corsHeaders } from "./cors.ts";
import { extractKeys, getClientIp } from "./auth.ts";
import { initSupabaseClient, verifyLicense } from "./database.ts";
import { getAllScriptFiles } from "./storage.ts";
import { createErrorResponse } from "./response.ts";

export async function handleRequest(req: Request): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const clientIp = getClientIp(req);
        const requestPath = new URL(req.url).pathname;
        console.log(`Received ${req.method} request to ${requestPath} from IP ${clientIp}`);

        // Extract license and server keys
        const { licenseKey, serverKey } = await extractKeys(req);
        
        if (!licenseKey || !serverKey) {
            console.error("Missing credentials");
            return createErrorResponse("License key and server key are required");
        }

        // Initialize Supabase client
        const { client: supabase, error: dbError } = initSupabaseClient();
        if (dbError) {
            console.error("Database connection error:", dbError);
            await logScriptError(supabase, null, "error", "Database connection error", "server", dbError.message, null, clientIp);
            return createErrorResponse("Database connection error");
        }

        // Verify license
        const licenseData = await verifyLicense(supabase, licenseKey, serverKey);
        
        if (!licenseData.valid) {
            console.warn("Invalid license data");
            await logScriptError(supabase, null, "error", "Invalid license or server key", "auth", "License verification failed", null, clientIp);
            return createErrorResponse("Invalid license or server key");
        }

        // Log successful license verification
        await logScriptAccess(supabase, licenseData.id, "info", "License verified successfully", "auth", clientIp);

        // Get scripts content directly from storage using license ID
        const scriptResult = await getAllScriptFiles(supabase, licenseData.id);
        
        if (!scriptResult || scriptResult.error || !scriptResult.content) {
            const errorMsg = "No script files found for this license";
            console.warn(errorMsg, scriptResult?.error || "No content");
            await logScriptError(supabase, licenseData.id, "warning", errorMsg, "storage", scriptResult?.error?.message, null, clientIp);
            return createErrorResponse(errorMsg);
        }

        // Success: Return scripts as JSON
        console.log(`Scripts successfully delivered for license ${licenseData.id}`);
        await logScriptAccess(supabase, licenseData.id, "info", "Scripts successfully delivered", "server", clientIp);
        
        return new Response(JSON.stringify(scriptResult.content), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            },
            status: 200
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        
        try {
            const { client: supabase } = initSupabaseClient();
            await logScriptError(supabase, null, "error", "Internal server error", "server", errorMsg, "500", getClientIp(req));
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }
        
        return createErrorResponse("Internal server error");
    }
}

// Helper function to log script access
async function logScriptAccess(supabase: any, licenseId: string | null, level: string, message: string, source: string, clientIp: string | null) {
    try {
        if (!licenseId) return; // Skip if no license ID available
        
        await supabase.rpc("add_script_log", {
            p_license_id: licenseId,
            p_level: level,
            p_message: message,
            p_source: source,
            p_client_ip: clientIp,
            p_details: `Access from IP: ${clientIp || "unknown"}`
        });
    } catch (error) {
        console.error("Error logging script access:", error);
    }
}

// Helper function to log script errors
async function logScriptError(
    supabase: any, 
    licenseId: string | null, 
    level: string, 
    message: string, 
    source: string,
    details: string | null = null,
    errorCode: string | null = null,
    clientIp: string | null = null,
    fileName: string | null = null
) {
    try {
        // If we have a license ID, log with it
        if (licenseId) {
            await supabase.rpc("add_script_log", {
                p_license_id: licenseId,
                p_level: level,
                p_message: message,
                p_source: source,
                p_details: details,
                p_error_code: errorCode,
                p_client_ip: clientIp,
                p_file_name: fileName
            });
        } else {
            // Without license ID, we can only log to console
            console.error(`${level.toUpperCase()}: ${message}${details ? ` - ${details}` : ""}`);
        }
    } catch (error) {
        console.error("Error logging to database:", error);
    }
}
