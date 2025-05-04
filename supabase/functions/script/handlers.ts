
import { extractKeys } from "./auth.ts";
import { getScriptFiles } from "./storage.ts";
import { createSuccessResponse, createErrorResponse } from "./response.ts";

export async function handleRequest(req: Request): Promise<Response> {
  console.log(`Received ${req.method} request to /script`);
  
  try {
    // Extract license and server keys from the request
    const { licenseKey, serverKey, clientIp } = await extractKeys(req);
    
    console.log(`Extracted Keys -> LicenseKey: ${licenseKey}, ServerKey: ${serverKey}`);

    if (!licenseKey || !serverKey) {
      return createErrorResponse("Missing license key or server key", 400);
    }

    // Verify the license with the database
    console.log("Überprüfe Lizenz mit check_license_by_keys Funktion");
    
    // Trim whitespace from keys
    const trimmedLicenseKey = licenseKey.trim();
    const trimmedServerKey = serverKey.trim();
    
    console.log(`Trimmed-Keys: License='${trimmedLicenseKey}', Server='${trimmedServerKey}'`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Verify license using the RPC function
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/check_license_by_keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        p_license_key: trimmedLicenseKey,
        p_server_key: trimmedServerKey
      })
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error(`Error verifying license: ${errorText}`);
      return createErrorResponse(`Lizenzüberprüfung fehlgeschlagen: ${errorText}`, 401);
    }
    
    const licenseData = await verifyResponse.json();
    console.log("RPC Response:", JSON.stringify(licenseData, null, 2));
    
    // Check if the license is valid
    if (!licenseData || licenseData.length === 0 || !licenseData[0].valid) {
      return createErrorResponse("Ungültige Lizenz oder Server-Key", 401);
    }
    
    const license = licenseData[0];
    console.log(`Lizenz erfolgreich verifiziert: ${JSON.stringify(license)}`);
    
    // Log the script request
    try {
      const logResponse = await fetch(`${supabaseUrl}/functions/v1/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
        body: JSON.stringify({
          license_id: license.id,
          level: "info",
          message: `Script request received for ${license.script_name}`,
          source: "verify-license",
          details: `Client IP: ${clientIp}`,
          client_ip: clientIp
        })
      });
      
      if (logResponse.ok) {
        console.log(`Logging to database: [info] Script request received for ${license.script_name}`);
      } else {
        console.error("Error writing log to database:", await logResponse.json());
      }
    } catch (logError) {
      console.error("Error writing to log endpoint:", logError);
    }

    // Fetch the script files for the license
    console.log(`Fetching script files for license ID: ${license.id}`);
    const scriptFiles = await getScriptFiles(license.id);
    
    // Log successful script delivery
    try {
      const fileNames = Object.keys(scriptFiles).join(", ");
      await fetch(`${supabaseUrl}/functions/v1/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
        body: JSON.stringify({
          license_id: license.id,
          level: "info",
          message: `Scripts successfully delivered (${Object.keys(scriptFiles).length} files)`,
          source: "delivery",
          details: `Files: ${fileNames}`,
          client_ip: clientIp
        })
      });
      
      console.log(`Scripts successfully delivered for license ${license.id}`);
      console.log(`Logging to database: [info] Scripts successfully delivered (${Object.keys(scriptFiles).length} files)`);
    } catch (logError) {
      console.error("Error writing log to database:", logError);
    }
    
    return createSuccessResponse(scriptFiles);
    
  } catch (error) {
    console.error("Error in script handler:", error);
    return createErrorResponse(`Server error: ${error.message}`, 500);
  }
}
