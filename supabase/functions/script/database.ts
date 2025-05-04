
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
      return { valid: false, error: error.message };
    }

    // Prüfen ob ein Array zurückkommt
    const licenseData = Array.isArray(data) ? data[0] : data;
    
    if (!licenseData || !licenseData.valid) {
      console.warn("Lizenz ungültig laut RPC:", licenseData);
      return { valid: false };
    }
    
    // If we get here, the license is valid and we have data
    console.log("Lizenz erfolgreich verifiziert:", licenseData);
    return licenseData;
    
  } catch (error) {
    console.error("License verification error:", error);
    return { valid: false, error: "License verification failed: " + (error as Error).message };
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

// Log message to the database
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
): Promise<{ success: boolean, id?: string, error?: string }> {
  try {
    // Validate license ID is a valid UUID before sending to database
    if (licenseId && !isValidUUID(licenseId)) {
      console.error("Invalid license ID format:", licenseId);
      return { 
        success: false, 
        error: "Invalid license ID format" 
      };
    }

    console.log("Adding script log with params:", { 
      licenseId, level, message, source, 
      details: details?.substring(0, 20) + "...", // Truncate for logging
      errorCode, clientIp, fileName 
    });

    // Call the add_script_log RPC function
    const { data, error } = await supabase.rpc("add_script_log", {
      p_license_id: licenseId,
      p_level: level,
      p_message: message,
      p_source: source || null,
      p_details: details || null,
      p_error_code: errorCode || null,
      p_client_ip: clientIp || null,
      p_file_name: fileName || null
    });

    if (error) {
      console.error("Error adding script log:", error);
      return { 
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      id: data
    };
  } catch (error) {
    console.error("Exception adding script log:", error);
    return { 
      success: false,
      error: (error as Error).message
    };
  }
}

// Helper function to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
