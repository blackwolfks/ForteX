
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
    
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: trimmedLicenseKey,
      p_server_key: trimmedServerKey
    });
    
    if (error) {
      console.error("Database error:", error);
      return { valid: false, error: `Database error: ${error.message}` };
    }
    
    if (!data || !data.valid) {
      console.error("Invalid license or server key");
      
      // Direktabfrage zur Fehlersuche
      const { data: directQuery, error: directError } = await supabase
        .from('server_licenses')
        .select('license_key, server_key')
        .eq('license_key', trimmedLicenseKey)
        .limit(1);
      
      if (!directError && directQuery && directQuery.length > 0) {
        console.log(`Lizenz gefunden, aber Server-Key stimmt nicht überein. DB-Key: ${directQuery[0].server_key}, Erhalten: ${trimmedServerKey}`);
      }
      
      return { valid: false, error: "Invalid license or server key" };
    }
    
    if (!data.aktiv) {
      console.error("License is not active");
      return { valid: false, error: "License is not active" };
    }
    
    console.log("License verification successful:", data);
    return { valid: true, data };
  } catch (error) {
    console.error("License verification error:", error);
    return { valid: false, error: "License verification failed" };
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
