
import { handleCors, corsHeaders } from "./cors.ts";
import { extractKeys, getClientIp } from "./auth.ts";
import { initSupabaseClient, verifyLicense } from "./database.ts";
import { getScriptFile } from "./storage.ts";
import { createErrorResponse } from "./response.ts";

// Main handler function for the Edge Function
export async function handleRequest(req: Request): Promise<Response> {
    // 1️⃣ Handle CORS preflight requests
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        console.log(`Received ${req.method} request to ${new URL(req.url).pathname}`);

        // 2️⃣ Extract license and server key
        const { licenseKey, serverKey } = await extractKeys(req);

        if (!licenseKey || !serverKey) {
            console.error("Missing credentials");
            return createErrorResponse("License key and server key are required");
        }

        // 3️⃣ Initialize Supabase client
        const { client: supabase, error: dbError } = initSupabaseClient();
        if (dbError) {
            console.error("DB Error:", dbError);
            return createErrorResponse("Database connection error");
        }

        // 4️⃣ Perform license verification
        const licenseData = await verifyLicense(supabase, licenseKey, serverKey);

        if (!licenseData.valid) {
            console.warn("Invalid license data");
            return createErrorResponse("Invalid license or server key");
        }

        // 5️⃣ Check if script file is assigned
        if (!licenseData.script_file) {
            console.warn("No script file assigned");
            return createErrorResponse("No script file assigned to this license. Please add one in the admin panel.");
        }

        // 6️⃣ Load script file from storage
        const scriptContent = await getScriptFile(supabase, licenseData.script_file);

        if (!scriptContent) {
            console.error("Script file not found:", licenseData.script_file);
            return createErrorResponse("The assigned script file was not found in storage");
        }

        // 7️⃣ Success: Deliver script
        console.log(`Script '${licenseData.script_file}' successfully delivered`);
        return new Response(scriptContent, {
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
