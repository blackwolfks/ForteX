
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SupabaseClient {
  client: any;
  error: Error | null;
}

interface LicenseData {
  valid: boolean;
  id?: string;
  script_name?: string;
  has_file_upload?: boolean;
  user_id?: string;
}

// Initialize Supabase client
export function initSupabaseClient(): SupabaseClient {
  try {
    // Get Supabase URL and anon key from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client
    const client = createClient(supabaseUrl, supabaseAnonKey);
    return { client, error: null };
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    return { client: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Verify license
export async function verifyLicense(supabase: any, licenseKey: string, serverKey: string): Promise<LicenseData> {
  try {
    console.log("Überprüfe Lizenz mit check_license_by_keys Funktion");
    // Trim whitespace from keys
    const trimmedLicenseKey = licenseKey.trim();
    const trimmedServerKey = serverKey.trim();
    console.log(`Trimmed-Keys: License='${trimmedLicenseKey}', Server='${trimmedServerKey}'`);

    // Call the check_license_by_keys RPC function
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: trimmedLicenseKey,
      p_server_key: trimmedServerKey
    });

    if (error) {
      console.error("RPC Error:", error);
      return { valid: false };
    }

    if (!data || data.length === 0) {
      console.warn("No license data returned");
      return { valid: false };
    }

    console.log("RPC Response:", data);

    // Extract license data from the first result
    const licenseData = data[0];
    console.log("Lizenz erfolgreich verifiziert:", licenseData);

    // Check if license is active
    if (!licenseData.aktiv) {
      console.warn("License is not active");
      return { valid: false };
    }

    // Return license data
    return {
      valid: true,
      id: licenseData.id,
      script_name: licenseData.script_name,
      has_file_upload: licenseData.has_file_upload,
      user_id: licenseData.user_id
    };
  } catch (error) {
    console.error("License verification error:", error);
    return { valid: false };
  }
}
