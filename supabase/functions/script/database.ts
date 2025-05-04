
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// Initialize Supabase client
export function initSupabaseClient(): { client: any, error: string | null } {
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

// Verify license using Supabase RPC
export async function verifyLicense(supabase: any, licenseKey: string, serverKey: string): Promise<any> {
  try {
    console.log("Überprüfe Lizenz mit check_license_by_keys Funktion");
    
    // Explizit Lizenz- und Server-Key trimmen, um Leerzeichen zu entfernen
    const trimmedLicenseKey = licenseKey.trim();
    const trimmedServerKey = serverKey.trim();
    
    console.log(`Trimmed-Keys: License='${trimmedLicenseKey}', Server='${trimmedServerKey}'`);
    
    // Call the RPC function to check the license with explicit parameter names
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: trimmedLicenseKey,
      p_server_key: trimmedServerKey
    });
    
    console.log("RPC Response:", data);
    
    if (error) {
      console.error("RPC Fehler:", error);
      return { valid: false, error: error.message, id: null };
    }

    // Prüfen ob ein Array zurückkommt
    const licenseData = Array.isArray(data) ? data[0] : data;
    
    if (!licenseData || !licenseData.valid) {
      console.warn("Lizenz ungültig laut RPC:", licenseData);
      return { valid: false, id: null };
    }
    
    // If we get here, the license is valid and we have data
    console.log("Lizenz erfolgreich verifiziert:", licenseData);
    return licenseData;
    
  } catch (error) {
    console.error("License verification error:", error);
    return { valid: false, error: "License verification failed: " + (error as Error).message, id: null };
  }
}

// Log events to the script_logs table
export async function addScriptLog(
  supabase: any,
  licenseId: string | null,
  level: 'info' | 'warning' | 'error' | 'debug',
  message: string,
  source: string,
  details?: string,
  errorCode?: string,
  clientIp?: string,
  fileName?: string
): Promise<boolean> {
  if (!supabase) {
    console.error("Cannot log: supabase client is null");
    return false;
  }
  
  try {
    // If there's no license ID, we can't log to the database
    if (!licenseId) {
      console.warn("Cannot log to database without license ID");
      return false;
    }
    
    console.log(`Logging to database: [${level}] ${message}`);
    
    try {
      const { data, error } = await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: level,
        p_message: message,
        p_source: source,
        p_details: details || null,
        p_error_code: errorCode || null,
        p_client_ip: clientIp || null,
        p_file_name: fileName || null
      });
      
      if (error) {
        console.error("Error writing log to database:", error);
        return false;
      }
      
      console.log("Log written to database successfully");
      return true;
    } catch (rpcError) {
      console.error("Exception during RPC call to add_script_log:", rpcError);
      
      // Try the alternate version of the function if there's an ambiguity error
      if (rpcError.toString().includes("Could not choose the best candidate function")) {
        console.log("Attempting to call alternate version of add_script_log");
        
        const { data, error } = await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: level,
          p_message: message,
          p_source: source,
          p_details: details || null,
          p_error_code: errorCode || null,
          p_client_ip: clientIp || null,
          p_file_name: fileName || null,
          p_user_id: null // Explicitly set user_id to null for the new function signature
        });
        
        if (error) {
          console.error("Error with alternate function call:", error);
          return false;
        }
        
        console.log("Log written to database successfully using alternate function");
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error("Exception while logging to database:", error);
    return false;
  }
}

// Check IP restriction
export function checkIpRestriction(licenseData: any, clientIp: string): { passed: boolean, error?: string, expected?: string } {
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
