
import { handleCors, corsHeaders } from "./cors.ts";
import { extractKeys, getClientIp } from "./auth.ts";
import { initSupabaseClient, verifyLicense, checkIpRestriction } from "./database.ts";
import { getScriptFile, listScriptFiles, getMainScriptFile, generateSampleScript } from "./storage.ts";
import { createErrorResponse } from "./response.ts";

// Main handler function
export async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    console.log(`Received ${req.method} request to ${new URL(req.url).pathname}`);
    
    // Extract license key and server key
    const { licenseKey, serverKey } = await extractKeys(req);
    
    // Validate required credentials
    if (!licenseKey || !serverKey) {
      console.error("Missing credentials - License key or server key not provided");
      return createErrorResponse("License key and server key are required");
    }
    
    console.log(`Processing request with License Key: ${licenseKey.substring(0, 4)}**** and Server Key: ${serverKey.substring(0, 4)}****`);
    
    // Extract client IP
    const clientIp = getClientIp(req);
    console.log(`Client IP: ${clientIp}`);
    
    // Initialize Supabase client
    const { client: supabase, error: initError } = initSupabaseClient();
    if (initError) {
      console.error("Supabase client initialization error:", initError);
      return createErrorResponse("Server configuration error");
    }
    
    // Verify license
    console.log("Verifying license...");
    const licenseVerification = await verifyLicense(supabase, licenseKey, serverKey);
    if (!licenseVerification.valid) {
      console.error("License verification failed:", licenseVerification.error);
      return createErrorResponse(licenseVerification.error);
    }
    
    const licenseData = licenseVerification.data;
    console.log(`License verified for script: ${licenseData.script_name}`);
    
    // Check IP restriction
    const ipCheck = checkIpRestriction(licenseData, clientIp);
    if (!ipCheck.passed) {
      console.error(`IP restriction failed. Expected: ${ipCheck.expected}, Got: ${clientIp}`);
      return createErrorResponse(ipCheck.error as string, `Expected IP: ${ipCheck.expected}\nYour IP: ${clientIp}`);
    }
    
    // Handle script files
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const specificFile = pathParts.length > 2 ? pathParts.slice(2).join('/') : null;
    
    console.log(`Has file upload: ${licenseData.has_file_upload}, Specific file requested: ${specificFile || "None"}`);
    
    if (licenseData.has_file_upload) {
      if (specificFile) {
        console.log(`Attempting to retrieve specific file: ${specificFile}`);
        const { content, error, fileName } = await getScriptFile(supabase, licenseData.id, specificFile);
        if (error) {
          console.error(`Error retrieving specific file: ${error}`);
          return createErrorResponse(error);
        }
        
        console.log(`Successfully retrieved file: ${fileName || specificFile}`);
        
        // Add the actual filename as a header so client knows which file was loaded
        const headers = { 
          ...corsHeaders, 
          "Content-Type": "text/plain",
          "X-Script-Filename": fileName || specificFile
        };
        
        return new Response(content, {
          headers,
          status: 200
        });
      }
      
      // Liste Dateien im Bucket unter dem Lizenz-Ordner
      console.log(`Listing files for license: ${licenseData.id}`);
      const { files, error: listError } = await listScriptFiles(supabase, licenseData.id);
      
      if (listError) {
        console.error(`Error listing files: ${listError}`);
        
        // If this is a storage bucket issue, generate a sample script
        if (listError.includes("bucket does not exist")) {
          console.log("Generating sample script due to storage bucket issue");
          const sampleScript = generateSampleScript(licenseData);
          return new Response(sampleScript, {
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/plain",
              "X-Script-Filename": "sample.lua" 
            },
            status: 200
          });
        }
        
        return createErrorResponse(listError);
      }
      
      if (!files || files.length === 0) {
        console.log("No files found, generating sample script");
        const sampleScript = generateSampleScript(licenseData);
        return new Response(sampleScript, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/plain",
            "X-Script-Filename": "sample.lua" 
          },
          status: 200
        });
      }
      
      // Extract requested filename from headers if present
      let requestedFileName = null;
      const reqHeaders = Object.fromEntries(req.headers.entries());
      if (reqHeaders["x-requested-filename"]) {
        requestedFileName = reqHeaders["x-requested-filename"];
        console.log(`X-Requested-Filename header found: ${requestedFileName}`);
      }
      
      // Get main script file with preference for requested file
      console.log(`Retrieving script file with preference for: ${requestedFileName || "main files"}`);
      const { content, error, fileName } = await getMainScriptFile(supabase, licenseData.id, files as any[], requestedFileName);
      
      if (error) {
        console.error(`Error retrieving main script: ${error}`);
        return createErrorResponse(error);
      }
      
      console.log(`Successfully retrieved script file: ${fileName || "unknown.lua"}`);
      
      // Add the actual filename as a header
      const headers = { 
        ...corsHeaders, 
        "Content-Type": "text/plain",
        "X-Script-Filename": fileName || "main.lua" 
      };
      
      return new Response(content, {
        headers,
        status: 200
      });
    }
    
    // Return script from database if no file upload
    if (!licenseData.script_file) {
      console.log("No script file found in database");
      const sampleScript = generateSampleScript(licenseData);
      return new Response(sampleScript, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/plain",
          "X-Script-Filename": "sample.lua" 
        },
        status: 200
      });
    }
    
    // Return the script with proper content type
    console.log("Returning script from database");
    return new Response(licenseData.script_file, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/plain",
        "X-Script-Filename": `${licenseData.script_name || "script"}.lua`
      },
      status: 200
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error occurred");
  }
}
