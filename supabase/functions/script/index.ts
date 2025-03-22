
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
    const { data: fileData, error: fileError } = await supabase.storage
      .from("script")
      .download(`${licenseId}/${filePath}`);
    
    if (fileError) {
      return { content: null, error: `File '${filePath}' not found` };
    }
    
    const scriptContent = await fileData.text();
    return { content: scriptContent, error: null };
  } catch (downloadError) {
    return { content: null, error: `Could not download file '${filePath}'` };
  }
}

// List available files from storage
async function listScriptFiles(supabase: any, licenseId: string): Promise<{ files: any[] | null, error: string | null }> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from("script")
      .list(licenseId.toString());
    
    if (listError || !files || files.length === 0) {
      return { 
        files: null, 
        error: "No files found. Please upload files via web interface." 
      };
    }
    
    return { files, error: null };
  } catch (error) {
    return { files: null, error: "Could not access script storage" };
  }
}

// Get and return main script file
async function getMainScriptFile(supabase: any, licenseId: string, files: any[]): Promise<{ content: string | null, error: string | null }> {
  // Look for main.lua or first Lua file
  let mainFile = files.find(f => f.name === "main.lua") || files.find(f => f.name.endsWith('.lua')) || files[0];
  
  return await getScriptFile(supabase, licenseId, mainFile.name);
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Extract license key and server key
    const { licenseKey, serverKey } = await extractKeys(req);
    
    // Validate required credentials
    if (!licenseKey || !serverKey) {
      return createErrorResponse("License key and server key are required");
    }
    
    // Extract client IP
    const clientIp = getClientIp(req);
    
    // Initialize Supabase client
    const { client: supabase, error: initError } = initSupabaseClient();
    if (initError) {
      return createErrorResponse("Server configuration error");
    }
    
    // Verify license
    const licenseVerification = await verifyLicense(supabase, licenseKey, serverKey);
    if (!licenseVerification.valid) {
      return createErrorResponse(licenseVerification.error);
    }
    
    const licenseData = licenseVerification.data;
    
    // Check IP restriction
    const ipCheck = checkIpRestriction(licenseData, clientIp);
    if (!ipCheck.passed) {
      return createErrorResponse(ipCheck.error as string, `Expected IP: ${ipCheck.expected}\nYour IP: ${clientIp}`);
    }
    
    // Handle script files
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const specificFile = pathParts.length > 2 ? pathParts.slice(2).join('/') : null;
    
    if (licenseData.has_file_upload) {
      if (specificFile) {
        const { content, error } = await getScriptFile(supabase, licenseData.id, specificFile);
        if (error) {
          return createErrorResponse(error);
        }
        
        return new Response(content, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        });
      }
      
      // List available files
      const { files, error: listError } = await listScriptFiles(supabase, licenseData.id);
      
      if (listError) {
        return createErrorResponse(listError);
      }
      
      // Get main script file
      const { content, error } = await getMainScriptFile(supabase, licenseData.id, files as any[]);
      
      if (error) {
        return createErrorResponse(error);
      }
      
      return new Response(content, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200
      });
    }
    
    // Return script from database if no file upload
    if (!licenseData.script_file) {
      return createErrorResponse("No script file found. Please upload a script via web interface.");
    }
    
    // Return the script with proper content type
    return new Response(licenseData.script_file, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error occurred");
  }
});
