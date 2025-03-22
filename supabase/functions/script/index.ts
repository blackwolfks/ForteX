import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS headers definition
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-license-key, x-server-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Extract keys from various sources in the request
async function extractKeys(req: Request): Promise<{ licenseKey: string | null, serverKey: string | null, bodyData: any }> {
  let licenseKey = req.headers.get("x-license-key");
  let serverKey = req.headers.get("x-server-key");
  let bodyData = {};
  
  // Extract from URL parameters
  const url = new URL(req.url);
  const urlParams = url.searchParams;
  if (urlParams.has("license_key") && urlParams.has("server_key")) {
    licenseKey = urlParams.get("license_key");
    serverKey = urlParams.get("server_key");
  }
  
  // Extract from Basic Auth
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = atob(base64Credentials);
      const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
      
      if (!licenseKey && extractedLicenseKey) licenseKey = extractedLicenseKey;
      if (!serverKey && extractedServerKey) serverKey = extractedServerKey;
    } catch (e) {
      console.error("Error decoding Basic Auth header:", e);
    }
  }
  
  // Extract from body if POST request
  if (req.method === "POST") {
    try {
      const clonedReq = req.clone();
      const text = await clonedReq.text();
      try {
        bodyData = JSON.parse(text);
        if (!licenseKey && bodyData.license_key) licenseKey = bodyData.license_key;
        if (!serverKey && bodyData.server_key) serverKey = bodyData.server_key;
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
      }
    } catch (e) {
      console.error("Error reading request body:", e);
    }
  }
  
  // Trim whitespace
  if (licenseKey) licenseKey = licenseKey.trim();
  if (serverKey) serverKey = serverKey.trim();
  
  return { licenseKey, serverKey, bodyData };
}

// Get client IP from request headers
function getClientIp(req: Request): string {
  let rawClientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  return rawClientIp.split(",")[0].trim(); // Get first IP address
}

// Initialize Supabase client
function initSupabaseClient(): { client: any, error: string | null } {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      client: null, 
      error: "Database configuration missing" 
    };
  }
  
  return { 
    client: createClient(supabaseUrl, supabaseKey),
    error: null
  };
}

// Create error response with Lua format
function createErrorResponse(message: string, details?: string): Response {
  let responseText = `-- Error: ${message}\nprint("^1Error:^0 ${message}")`;
  if (details) {
    responseText += `\nprint("${details}")`;
  }
  
  return new Response(responseText, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
    status: 200 // Send 200 but with error message as Lua code
  });
}

// Verify license using Supabase RPC
async function verifyLicense(supabase: any, licenseKey: string, serverKey: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    if (error) {
      console.error("Database error:", error);
      return { valid: false, error: `Database error: ${error.message}` };
    }
    
    if (!data || !data.valid) {
      return { valid: false, error: "Invalid license or server key" };
    }
    
    if (!data.aktiv) {
      return { valid: false, error: "License is not active" };
    }
    
    return { valid: true, data };
  } catch (error) {
    console.error("License verification error:", error);
    return { valid: false, error: "License verification failed" };
  }
}

// Check IP restriction
function checkIpRestriction(licenseData: any, clientIp: string): { passed: boolean, error?: string, expected?: string } {
  if (licenseData.server_ip && licenseData.server_ip !== "*") {
    const storedIp = licenseData.server_ip.trim();
    if (storedIp !== clientIp) {
      return { 
        passed: false, 
        error: "IP restriction failed",
        expected: storedIp
      };
    }
  }
  return { passed: true };
}

// Get specific file from storage
async function getScriptFile(supabase: any, licenseId: string, filePath: string): Promise<{ content: string | null, error: string | null }> {
  try {
    console.log(`Attempting to download file ${licenseId}/${filePath} from 'script' bucket`);
    
    // Check if script bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return { content: null, error: "Storage error: Could not list buckets" };
    }
    
    const scriptBucketExists = buckets.some((bucket: any) => bucket.name === "script");
    
    if (!scriptBucketExists) {
      console.error("Script bucket does not exist");
      return { content: null, error: "Storage error: Script bucket does not exist" };
    }
    
    // Attempt to download file with explicit public access header
    const { data: fileData, error: fileError } = await supabase.storage
      .from("script")
      .download(`${licenseId}/${filePath}`, {
        transform: {
          public: true
        }
      });
    
    if (fileError) {
      console.error(`File download error for ${licenseId}/${filePath}:`, fileError);
      return { content: null, error: `File '${filePath}' not found: ${fileError.message}` };
    }
    
    console.log(`Successfully downloaded file ${licenseId}/${filePath}`);
    const scriptContent = await fileData.text();
    return { content: scriptContent, error: null };
  } catch (downloadError) {
    console.error(`Exception in getScriptFile for ${licenseId}/${filePath}:`, downloadError);
    return { content: null, error: `Could not download file '${filePath}': ${downloadError.message}` };
  }
}

// List available files from storage
async function listScriptFiles(supabase: any, licenseId: string): Promise<{ files: any[] | null, error: string | null }> {
  try {
    console.log(`Listing files in bucket 'script' for license ${licenseId}`);
    
    // Check if script bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return { files: null, error: "Storage error: Could not list buckets" };
    }
    
    const scriptBucketExists = buckets.some((bucket: any) => bucket.name === "script");
    
    if (!scriptBucketExists) {
      console.error("Script bucket does not exist");
      return { files: null, error: "Storage error: Script bucket does not exist. Please create it in the Supabase dashboard." };
    }
    
    // First check if the license folder exists
    const { data: files, error: listError } = await supabase.storage
      .from("script")
      .list(licenseId.toString());
    
    if (listError) {
      console.error(`Error listing files for license ${licenseId}:`, listError);
      return { 
        files: null, 
        error: `Unable to list files: ${listError.message}` 
      };
    }
    
    if (!files || files.length === 0) {
      console.log(`No files found for license ${licenseId}`);
      return { 
        files: null, 
        error: "No files found. Please upload files via web interface." 
      };
    }
    
    console.log(`Found ${files.length} files for license ${licenseId}:`, 
      files.map((f: any) => f.name).join(", "));
    
    return { files, error: null };
  } catch (error) {
    console.error(`Exception in listScriptFiles for license ${licenseId}:`, error);
    return { files: null, error: `Could not access script storage: ${error.message}` };
  }
}

// Get and return main script file
async function getMainScriptFile(supabase: any, licenseId: string, files: any[]): Promise<{ content: string | null, error: string | null }> {
  // Look for main.lua or first Lua file
  let mainFile = files.find(f => f.name === "main.lua") || files.find(f => f.name.endsWith('.lua')) || files[0];
  
  if (!mainFile) {
    return { content: null, error: "No suitable script file found. Please upload a .lua file." };
  }
  
  console.log(`Using ${mainFile.name} as main script file`);
  return await getScriptFile(supabase, licenseId, mainFile.name);
}

// Generate a sample Lua script when no files are available
function generateSampleScript(licenseData: any): string {
  return `-- ForteX Auto-Generated Script
-- This is a sample script that was automatically generated
-- because no script files were found for this license.

print("^2==============================================^0")
print("^2ForteX Script Loader - Demo Script^0")
print("^2==============================================^0")
print("^3License Info:^0")
print("^3Script Name: ^0${licenseData.script_name || 'Unknown'}")
print("^3License Key: ^0${licenseData.license_key}")
print("^3==============================================^0")
print("^2This is a demo script. Please upload your script files^0")
print("^2through the web interface to replace this message.^0")
print("^2==============================================^0")

-- Register a simple command to demonstrate that the script works
RegisterCommand('fortex_demo', function(source, args, rawCommand)
    print("^2ForteX Demo Command Executed!^0")
    if source > 0 then -- Player
        TriggerClientEvent('chat:addMessage', source, {
            args = {"^2ForteX Demo", "Script is working correctly!"}
        })
    else -- Console
        print("^2ForteX Demo: Script is working correctly!^0")
    end
end, false)

print("^3Demo command 'fortex_demo' has been registered.^0")
`;
}

// Main handler function
serve(async (req) => {
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
        const { content, error } = await getScriptFile(supabase, licenseData.id, specificFile);
        if (error) {
          console.error(`Error retrieving specific file: ${error}`);
          return createErrorResponse(error);
        }
        
        console.log(`Successfully retrieved file: ${specificFile}`);
        return new Response(content, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        });
      }
      
      // List available files
      console.log(`Listing files for license: ${licenseData.id}`);
      const { files, error: listError } = await listScriptFiles(supabase, licenseData.id);
      
      if (listError) {
        console.error(`Error listing files: ${listError}`);
        
        // If this is a storage bucket issue, generate a sample script
        if (listError.includes("bucket does not exist")) {
          console.log("Generating sample script due to storage bucket issue");
          const sampleScript = generateSampleScript(licenseData);
          return new Response(sampleScript, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200
          });
        }
        
        return createErrorResponse(listError);
      }
      
      if (!files || files.length === 0) {
        console.log("No files found, generating sample script");
        const sampleScript = generateSampleScript(licenseData);
        return new Response(sampleScript, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        });
      }
      
      // Get main script file
      console.log("Retrieving main script file");
      const { content, error } = await getMainScriptFile(supabase, licenseData.id, files as any[]);
      
      if (error) {
        console.error(`Error retrieving main script: ${error}`);
        return createErrorResponse(error);
      }
      
      console.log("Successfully retrieved main script file");
      return new Response(content, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200
      });
    }
    
    // Return script from database if no file upload
    if (!licenseData.script_file) {
      console.log("No script file found in database");
      const sampleScript = generateSampleScript(licenseData);
      return new Response(sampleScript, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200
      });
    }
    
    // Return the script with proper content type
    console.log("Returning script from database");
    return new Response(licenseData.script_file, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error occurred");
  }
});
