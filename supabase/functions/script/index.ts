
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS headers definition
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-license-key, x-server-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Extract license key and server key from various sources
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
    
    // Validate required credentials
    if (!licenseKey || !serverKey) {
      return new Response(
        "-- Error: License key and server key are required\nprint(\"^1Error:^0 License key and server key are required\")",
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200 // Send 200 but with error message as Lua code
        }
      );
    }
    
    // Extract client IP
    let rawClientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    let clientIp = rawClientIp.split(",")[0].trim(); // Get first IP address
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        "-- Error: Database configuration missing\nprint(\"^1Error:^0 Server configuration error\")",
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify license
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    // Handle database errors
    if (error) {
      console.error("Database error:", error);
      return new Response(
        `-- Database error\nprint("^1Error:^0 Database error: ${error.message}")`,
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        }
      );
    }
    
    // Handle invalid license
    if (!data || !data.valid) {
      return new Response(
        `-- Invalid license\nprint("^1Error:^0 Invalid license or server key")`,
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        }
      );
    }
    
    // Check if license is active
    if (!data.aktiv) {
      return new Response(
        `-- License inactive\nprint("^1Error:^0 License is not active")`,
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        }
      );
    }
    
    // Check IP restriction
    if (data.server_ip && data.server_ip !== "*") {
      const storedIp = data.server_ip.trim();
      if (storedIp !== clientIp) {
        return new Response(
          `-- IP restriction error\nprint("^1Error:^0 IP restriction failed")\nprint("Expected IP: ${storedIp}")\nprint("Your IP: ${clientIp}")`,
          {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200
          }
        );
      }
    }
    
    // Handle script files
    const pathParts = url.pathname.split('/');
    const specificFile = pathParts.length > 2 ? pathParts.slice(2).join('/') : null;
    
    if (data.has_file_upload) {
      if (specificFile) {
        try {
          const { data: fileData, error: fileError } = await supabase.storage
            .from("script")
            .download(`${data.id}/${specificFile}`);
          
          if (fileError) {
            return new Response(
              `-- File not found\nprint("^1Error:^0 File '${specificFile}' not found")`,
              {
                headers: { ...corsHeaders, "Content-Type": "text/plain" },
                status: 200
              }
            );
          }
          
          const scriptContent = await fileData.text();
          return new Response(scriptContent, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200
          });
        } catch (downloadError) {
          return new Response(
            `-- File error\nprint("^1Error:^0 Could not download file '${specificFile}'")`,
            {
              headers: { ...corsHeaders, "Content-Type": "text/plain" },
              status: 200
            }
          );
        }
      }
      
      // List available files
      try {
        const { data: files, error: listError } = await supabase.storage
          .from("script")
          .list(data.id.toString());
        
        if (listError || !files || files.length === 0) {
          return new Response(
            `-- No files found\nprint("^2ForteX Framework^0: No files found. Please upload files via web interface.")`,
            {
              headers: { ...corsHeaders, "Content-Type": "text/plain" },
              status: 200
            }
          );
        }
        
        // Look for main.lua or first Lua file
        let mainFile = files.find(f => f.name === "main.lua") || files.find(f => f.name.endsWith('.lua')) || files[0];
        
        try {
          const { data: fileData, error: fileError } = await supabase.storage
            .from("script")
            .download(`${data.id}/${mainFile.name}`);
          
          if (fileError) {
            return new Response(
              `-- File error\nprint("^1Error:^0 Could not load script file")`,
              {
                headers: { ...corsHeaders, "Content-Type": "text/plain" },
                status: 200
              }
            );
          }
          
          const scriptContent = await fileData.text();
          return new Response(scriptContent, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200
          });
        } catch (downloadError) {
          return new Response(
            `-- File error\nprint("^1Error:^0 Could not read script file")`,
            {
              headers: { ...corsHeaders, "Content-Type": "text/plain" },
              status: 200
            }
          );
        }
      } catch (error) {
        return new Response(
          `-- Storage error\nprint("^1Error:^0 Could not access script storage")`,
          {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200
          }
        );
      }
    }
    
    // Return script from database if no file upload
    if (!data.script_file) {
      return new Response(
        `-- No script available\nprint("^2ForteX Framework^0: No script file found. Please upload a script via web interface.")`,
        {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200
        }
      );
    }
    
    // Return the script with proper content type
    return new Response(data.script_file, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      `-- Server error\nprint("^1Error:^0 Internal server error occurred")`,
      {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200
      }
    );
  }
});
