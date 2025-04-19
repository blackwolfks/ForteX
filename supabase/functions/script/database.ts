
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
    
    // First attempt: Try using the RPC function which should be the primary method
    const { data: rpcData, error: rpcError } = await supabase.rpc("check_license_by_keys", {
      p_license_key: trimmedLicenseKey,
      p_server_key: trimmedServerKey
    });
    
    if (rpcError) {
      console.error("RPC error:", rpcError);
      
      // Second attempt: Direct database query as fallback
      console.log("Fallback: Direkte Datenbankabfrage der server_licenses Tabelle");
      const { data: directData, error: directError } = await supabase
        .from('server_licenses')
        .select('*')
        .eq('license_key', trimmedLicenseKey)
        .eq('server_key', trimmedServerKey)
        .limit(1)
        .single();
      
      if (directError) {
        console.error("Direct query error:", directError);
        
        // Third attempt: Check if license exists but server key doesn't match
        console.log("Überprüfe, ob Lizenz existiert aber Server-Key nicht stimmt");
        const { data: licenseCheck } = await supabase
          .from('server_licenses')
          .select('license_key, server_key')
          .eq('license_key', trimmedLicenseKey)
          .limit(1);
          
        if (licenseCheck && licenseCheck.length > 0) {
          console.error(`Lizenz gefunden, aber Server-Key stimmt nicht überein. DB-Key: ${licenseCheck[0].server_key}, Erhalten: ${trimmedServerKey}`);
          return { valid: false, error: "Server key does not match license key", license_found: true };
        }
        
        return { valid: false, error: `Database error: ${directError.message}` };
      }
      
      if (directData) {
        console.log("Lizenz direkt in der Datenbank gefunden:", directData);
        return { 
          valid: true, 
          data: {
            ...directData,
            id: directData.id,
            license_key: directData.license_key,
            server_key: directData.server_key,
            script_name: directData.script_name,
            script_file: directData.script_file,
            server_ip: directData.server_ip,
            aktiv: directData.aktiv,
            has_file_upload: directData.has_file_upload
          }
        };
      }
      
      // If we got here, no license was found via direct query either
      return { valid: false, error: "Invalid license or server key" };
    }
    
    if (!rpcData) {
      console.error("RPC returned no data");
      return { valid: false, error: "Database returned no data" };
    }
    
    if (!rpcData.valid) {
      console.error("Invalid license or server key according to RPC");
      return { valid: false, error: "Invalid license or server key" };
    }
    
    if (!rpcData.aktiv) {
      console.error("License is not active");
      return { valid: false, error: "License is not active" };
    }
    
    console.log("License verification successful:", rpcData);
    return { valid: true, data: rpcData };
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
