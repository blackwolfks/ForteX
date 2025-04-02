import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// For older code parts that still use the direct import
export const supabase = supabaseClient;

// Type definitions for database tables
export type Product = {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  category: string;
  is_subscription: boolean;
  subscription_interval?: string;
  cfx_resource_id?: string;
  cfx_imported: boolean;
  image?: string;
  created_at: string;
  user_id: string;
};

export type Order = {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_id?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
};

export type User = {
  id: string;
  email: string;
  name: string;
  two_factor_enabled: boolean;
  two_factor_method: "email" | "phone" | "authenticator" | null;
  phone_number: string | null;
};

export type Invoice = {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  billing_address: {
    address: string;
    city: string;
    postal_code: string;
    country: string;
  };
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_url?: string;
};

// Type for server licenses with fully qualified fields
export type ServerLicense = {
  id: string;
  license_key: string;
  server_key: string;
  script_name: string;
  script_file?: string | null;
  server_ip?: string | null;
  aktiv: boolean;
  has_file_upload: boolean;
  created_at: string;
  updated_at?: string;
};

// Type for file access permissions
export type FileAccess = {
  id: string;
  license_id: string;
  file_path: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

// Improved function to check and create a storage bucket
export const checkStorageBucket = async (bucketName: string = 'script'): Promise<boolean> => {
  try {
    console.log(`Checking storage bucket '${bucketName}'...`);
    
    // Get authentication session to ensure we're properly authenticated
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("Authentication error:", sessionError);
      return false;
    }
    
    // First try to get the bucket directly to see if it exists
    const { data: bucketData, error: bucketError } = await supabaseClient.storage.getBucket(bucketName);
    
    if (!bucketError && bucketData) {
      console.log(`Bucket '${bucketName}' exists, ensuring it's public...`);
      
      // Update the bucket to be public
      const { error: updateError } = await supabaseClient.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['*/*'],
        fileSizeLimit: 50 * 1024 * 1024  // 50MB limit
      });
      
      if (updateError) {
        console.error(`Error updating bucket '${bucketName}':`, updateError);
      } else {
        console.log(`Bucket '${bucketName}' updated to be public`);
      }
      
      return true;
    }
    
    console.log(`Bucket '${bucketName}' does not exist. Attempting to create it...`);
    
    // Create the bucket with public access
    const { data, error: createError } = await supabaseClient.storage.createBucket(bucketName, {
      public: true,  // Make bucket public
      fileSizeLimit: 50 * 1024 * 1024  // 50MB limit
    });
    
    if (createError) {
      console.error(`Error creating bucket '${bucketName}':`, createError);
      
      // If the error is related to RLS, try a different approach
      if (createError.message && createError.message.includes('violates row-level security policy')) {
        console.log('RLS policy violation detected. The bucket might already exist but not be accessible.');
        
        // Try to use a different approach through RPC
        const { data: rpcData, error: rpcError } = await supabaseClient.rpc('create_public_bucket', {
          bucket_name: bucketName
        });
        
        if (rpcError) {
          console.error('RPC approach also failed:', rpcError);
          return false;
        }
        
        console.log('Successfully created bucket via RPC function');
        return true;
      }
      
      return false;
    }
    
    console.log(`Bucket '${bucketName}' successfully created.`);
    return true;
  } catch (error) {
    console.error("Unexpected error checking/creating the bucket:", error);
    return false;
  }
};
