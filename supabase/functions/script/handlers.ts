
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
            // We cannot log this error to the database since we couldn't connect
            return createErrorResponse("Database connection error");
        }

        // Verify license
        const licenseData = await verifyLicense(supabase, licenseKey, serverKey);
        
        if (!licenseData.valid) {
            console.warn("Invalid license data");
            // Log invalid license attempt (without a license ID)
            try {
                await supabase.rpc("add_script_log", {
                    p_license_id: null,
                    p_level: "error",
                    p_message: "Invalid license or server key",
                    p_source: "auth",
                    p_details: `Access attempt with invalid credentials from IP: ${clientIp}`,
                    p_client_ip: clientIp
                });
            } catch (logError) {
                console.error("Failed to log invalid license attempt:", logError);
            }
            
            return createErrorResponse("Invalid license or server key");
        }

        // Log successful license verification
        try {
            await supabase.rpc("add_script_log", {
                p_license_id: licenseData.id,
                p_level: "info",
                p_message: "License verified successfully",
                p_source: "auth",
                p_details: `Access from IP: ${clientIp}`,
                p_client_ip: clientIp
            });
        } catch (logError) {
            console.error("Failed to log successful verification:", logError);
            // Continue despite logging failure
        }

        // Get scripts content directly from storage using license ID
        const scriptResult = await getAllScriptFiles(supabase, licenseData.id);
        
        if (!scriptResult || scriptResult.error || !scriptResult.content) {
            const errorMsg = "No script files found for this license";
            console.warn(errorMsg, scriptResult?.error || "No content");
            
            // Log the error
            try {
                await supabase.rpc("add_script_log", {
                    p_license_id: licenseData.id,
                    p_level: "warning",
                    p_message: errorMsg,
                    p_source: "storage",
                    p_details: scriptResult?.error?.message || "No files available",
                    p_client_ip: clientIp
                });
            } catch (logError) {
                console.error("Failed to log script retrieval error:", logError);
            }
            
            return createErrorResponse(errorMsg);
        }

        // Success: Return scripts as JSON
        console.log(`Scripts successfully delivered for license ${licenseData.id}`);
        
        // Log successful script delivery
        try {
            await supabase.rpc("add_script_log", {
                p_license_id: licenseData.id,
                p_level: "info",
                p_message: "Scripts successfully delivered",
                p_source: "server",
                p_details: `Delivered ${scriptResult.content.length} files`,
                p_client_ip: clientIp
            });
        } catch (logError) {
            console.error("Failed to log successful delivery:", logError);
            // Continue despite logging failure
        }
        
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
            // Try to initialize Supabase for error logging
            const { client: supabase } = initSupabaseClient();
            
            // Log the error without requiring a license ID
            await supabase.rpc("add_script_log", {
                p_license_id: null,
                p_level: "error",
                p_message: "Internal server error",
                p_source: "server",
                p_details: errorMsg,
                p_error_code: "500",
                p_client_ip: getClientIp(req)
            });
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }
        
        return createErrorResponse("Internal server error");
    }
}
