
// Authentication related functions for the script edge function

import { corsHeaders } from "./cors.ts";
import { createErrorResponse } from "./response.ts";

// Function to verify license key and server key with the database
export async function verifyLicense(supabase: any, licenseKey: string, serverKey: string) {
  try {
    console.log(`Verifying license: ${licenseKey} with server key: ${serverKey}`);

    const { data, error } = await supabase.rpc('check_license_by_keys', {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });

    if (error) {
      console.error("License verification database error:", error);
      return { valid: false, error: `Database error: ${error.message}`, id: null };
    }

    if (!data || !data.valid) {
      console.log("Invalid license or server key combination");
      return { valid: false, error: "Invalid license or server key", id: null };
    }

    if (!data.aktiv) {
      console.log("License is not active");
      return { valid: false, error: "License is not active", id: data.id };
    }

    console.log(`License verified successfully for: ${data.script_name}`);
    
    // Return all license data
    return data;
  } catch (error) {
    console.error("Error in verifyLicense:", error);
    return { valid: false, error: `Verification error: ${error.message}`, id: null };
  }
}

// Function to check if the client IP matches the server IP restriction
export function checkIpRestriction(licenseData: any, clientIp: string): { passed: boolean, error?: string, expected?: string } {
  // If no server IP is specified in the license, there's no restriction
  if (!licenseData.server_ip || licenseData.server_ip.trim() === "") {
    console.log("No IP restriction for this license");
    return { passed: true };
  }
  
  // If client IP is not provided, we can't verify
  if (!clientIp) {
    console.log("No client IP provided, can't verify IP restriction");
    return { passed: false, error: "Client IP could not be determined" };
  }

  // Check if the client IP matches the restricted IP
  const restrictedIp = licenseData.server_ip.trim();
  const matches = clientIp.trim() === restrictedIp;
  
  console.log(`IP check: Client ${clientIp} against restricted ${restrictedIp}: ${matches ? 'MATCH' : 'MISMATCH'}`);
  
  if (!matches) {
    return { 
      passed: false, 
      error: "Server IP does not match restriction", 
      expected: restrictedIp 
    };
  }
  
  return { passed: true };
}

// Add script log to database
export async function addScriptLog(
  supabase: any,
  licenseId: string,
  level: 'info' | 'warning' | 'error' | 'debug',
  message: string,
  source?: string,
  details?: string,
  errorCode?: string,
  clientIp?: string,
  fileName?: string
) {
  try {
    if (!licenseId) {
      console.warn("Missing license ID for log");
      return { success: false, error: "License ID is required for logging" };
    }

    const { data, error } = await supabase.rpc('add_script_log', {
      p_license_id: licenseId,
      p_level: level,
      p_message: message,
      p_source: source,
      p_details: details,
      p_error_code: errorCode,
      p_client_ip: clientIp,
      p_file_name: fileName
    });

    if (error) {
      console.error("Error adding script log:", error);
      return { success: false, error: `Logging error: ${error.message}` };
    }

    return { success: true, id: data };
  } catch (error) {
    console.error("Exception in addScriptLog:", error);
    return { success: false, error: `Unexpected logging error: ${error}` };
  }
}

// Initialize Supabase client for use in edge function
export function initSupabaseClient() {
  try {
    // Use Deno.env to get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return { client: null, error: "Missing Supabase environment variables" };
    }

    // Import Supabase client from CDN
    // @ts-ignore - TS won't recognize dynamic imports in Deno
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js");

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return { client, error: null };
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    return { client: null, error };
  }
}
