
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Environment variables are automatically available
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Database client with service role privileges
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Type for license verification response
export interface LicenseVerificationResult {
  valid: boolean;
  license_key?: string;
  script_name?: string;
  server_ip?: string;
  aktiv?: boolean;
  id?: string;
  has_file_upload?: boolean;
  error?: string;
  debug?: Record<string, any>;
}

// Function to verify license using both keys
export async function verifyLicenseByKeys(
  licenseKey: string,
  serverKey: string,
  clientIp?: string
): Promise<LicenseVerificationResult> {
  try {
    // Call the RPC function to check the license keys
    const { data, error } = await supabase.rpc('check_license_by_keys', {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });

    if (error) {
      console.error('Error verifying license:', error);
      return {
        valid: false,
        error: `Database error: ${error.message}`,
        debug: { dbError: error }
      };
    }

    // If no license is found, or data is an empty array
    if (!data || !data.length || !data[0].valid) {
      return {
        valid: false,
        error: 'Invalid license or server key',
        debug: { data }
      };
    }

    const licenseData = data[0];

    // Check if the license is active
    if (!licenseData.aktiv) {
      return {
        valid: false,
        error: 'License is not active',
        debug: { licenseData }
      };
    }

    // Check IP restriction if it exists
    if (licenseData.server_ip && licenseData.server_ip !== '*' && clientIp) {
      if (licenseData.server_ip !== clientIp) {
        return {
          valid: false,
          error: 'IP-Adressüberprüfung fehlgeschlagen',
          debug: {
            expected_ip: licenseData.server_ip,
            client_ip: clientIp
          }
        };
      }
    }

    return {
      valid: true,
      license_key: licenseData.license_key,
      script_name: licenseData.script_name,
      server_ip: licenseData.server_ip,
      aktiv: licenseData.aktiv,
      id: licenseData.id,
      has_file_upload: licenseData.has_file_upload
    };
  } catch (error) {
    console.error('Exception in verifyLicenseByKeys:', error);
    return {
      valid: false,
      error: `Unexpected error: ${error.message}`,
      debug: { exception: error.toString() }
    };
  }
}
