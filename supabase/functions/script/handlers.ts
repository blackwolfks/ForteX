
import { handleCors, corsHeaders } from "./cors.ts";
import { extractKeys, getClientIp } from "./auth.ts";
import { initSupabaseClient, verifyLicense } from "./database.ts";
import { getScriptFile } from "./storage.ts";
import { createErrorResponse } from "./response.ts";

export async function handleRequest(req: Request): Promise<Response> {
    // CORS handling
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        console.log(`Received ${req.method} request to ${new URL(req.url).pathname}`);

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
            return createErrorResponse("Database connection error");
        }

        // Verify license
        const licenseData = await verifyLicense(supabase, licenseKey, serverKey);
        
        if (!licenseData.valid) {
            console.warn("Invalid license data");
            return createErrorResponse("Invalid license or server key");
        }

        // Get script content directly from storage using license ID
        const scriptResult = await getScriptFile(supabase, licenseData.id);
        
        if (!scriptResult || scriptResult.error) {
            console.warn("No script content found:", scriptResult?.error || "No content");
            return createErrorResponse("No script file found for this license");
        }

        // Success: Return script content
        console.log(`Script successfully delivered for license ${licenseData.id}`);
        return new Response(scriptResult.content, {
            headers: {
                ...corsHeaders,
                "Content-Type": "text/plain"
            },
            status: 200
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        return createErrorResponse("Internal server error");
    }
}
