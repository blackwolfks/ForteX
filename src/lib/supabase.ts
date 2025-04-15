
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fewcmtozntpedrsluawj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZld2NtdG96bnRwZWRyc2x1YXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MDQ5MzYsImV4cCI6MjA1NzQ4MDkzNn0.4xh1npp9zRyXgXkBGB9auWw3gxOoajDYS8sAIopB-To";

// Create the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  }
});

// Define the types for database functions
export type RpcFunctionName = 
  | 'add_website_change_history'
  | 'create_website'
  | 'delete_website'
  | 'get_user_websites'
  | 'get_website_by_id'
  | 'get_website_change_history'
  | 'get_website_content'
  | 'save_website_content'
  | 'update_website'
  | 'update_website_status'
  | 'get_user_pro_status'
  | 'enable_pro_access'
  | 'get_user_licenses'        
  | 'create_license'           
  | 'regenerate_server_key'    
  | 'update_license'
  | 'delete_license'
  | 'get_file_access_for_license'  
  | 'update_file_access'
  | 'check_license_by_keys'
  | 'create_public_bucket';

// Define parameter types for each RPC function
export type RpcParams = {
  'add_website_change_history': {
    site_id: string;
    content_snapshot: any;
    changed_fields: string[];
  };
  'create_website': {
    website_name: string;
    website_url: string;
    website_template: string;
    website_shop_template: string;
    website_status?: string;
  };
  'delete_website': {
    site_id: string;
  };
  'get_user_websites': Record<string, never>;
  'get_website_by_id': {
    site_id: string;
  };
  'get_website_change_history': {
    site_id: string;
  };
  'get_website_content': {
    site_id: string;
  };
  'save_website_content': {
    site_id: string;
    content_data: any;
  };
  'update_website': {
    site_id: string;
    website_name: string;
    website_url: string;
    website_template: string;
    website_shop_template: string;
    website_status?: string;
  };
  'update_website_status': {
    site_id: string;
    website_status: string;
  };
  'get_user_pro_status': Record<string, never>;
  'enable_pro_access': Record<string, never>;
  'get_user_licenses': Record<string, never>;
  'create_license': {
    p_script_name: string;
    p_script_file?: string | null;
    p_server_ip?: string | null;
  };
  'regenerate_server_key': {
    p_license_id: string;
  };
  'update_license': {
    p_license_id: string;
    p_script_name?: string;
    p_script_file?: string | null;
    p_aktiv?: boolean;
    p_regenerate_server_key?: boolean;
    p_server_ip?: string | null;
    p_has_file_upload?: boolean;
  };
  'delete_license': {
    p_license_id: string;
  };
  'get_file_access_for_license': {
    p_license_id: string;
  };
  'update_file_access': {
    p_license_id: string;
    p_file_path: string;
    p_is_public: boolean;
  };
  'check_license_by_keys': {
    p_license_key: string;
    p_server_key: string;
  };
  'create_public_bucket': {
    bucket_name: string;
  };
};

// Define Order and Invoice types for external use
export interface Order {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_name?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_id?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
}

export interface Invoice {
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
  plan_name?: string;
  amount: number;
  currency: string;
  payment_method: string;
  invoice_number: string;
  invoice_date: string;
  invoice_url?: string;
}

// Define Product type for external use
export interface Product {
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
  user_id: string;
  created_at: string;
}

// Add the callRPC function
export const callRPC = async <F extends RpcFunctionName>(
  functionName: F,
  params: RpcParams[F]
): Promise<{ data: any | null; error: Error | null }> => {
  console.log(`Calling RPC function: ${functionName} with params:`, params);
  
  try {
    // Check if the user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error(`Error in RPC call to ${functionName}: User is not authenticated`);
      return { data: null, error: new Error('User is not authenticated') };
    }

    // Use the session token for authentication
    const authToken = sessionData.session.access_token;
    
    // Make sure the API key and auth token are included in every request
    const { data, error } = await supabase.rpc(functionName as any, params, {
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    } as any);

    if (error) {
      console.error(`Error in RPC call to ${functionName}:`, error);
      return { data: null, error };
    }

    console.log(`RPC call to ${functionName} successful:`, data);
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in RPC call to ${functionName}:`, error);
    return { data: null, error: error as Error };
  }
};

// Define the checkStorageBucket function
export async function checkStorageBucket(bucketName: string): Promise<boolean> {
  try {
    console.log(`[checkStorageBucket] Checking if bucket '${bucketName}' exists...`);
    
    // First try to create using RPC function if available
    try {
      const { data: rpcData, error: rpcError } = await callRPC('create_public_bucket', {
        bucket_name: bucketName
      });
      
      if (!rpcError) {
        console.log(`[checkStorageBucket] Successfully created/checked bucket '${bucketName}' via RPC`);
        return true;
      }
      
      console.warn("[checkStorageBucket] RPC method failed, will try direct method:", rpcError);
    } catch (e) {
      console.warn("[checkStorageBucket] Error calling RPC function:", e);
    }
    
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("[checkStorageBucket] Error listing buckets:", listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log(`[checkStorageBucket] Bucket '${bucketName}' does not exist, creating...`);
      
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['*/*']
      });
      
      if (createError) {
        console.error(`[checkStorageBucket] Error creating bucket '${bucketName}':`, createError);
        return false;
      }
      
      console.log(`[checkStorageBucket] Successfully created bucket '${bucketName}'`, data);
      
      // Try to create a policy to allow public access if needed
      try {
        await callRPC('create_public_bucket', {
          bucket_name: bucketName
        });
      } catch (policyError) {
        console.warn("[checkStorageBucket] Could not set policies via RPC, but bucket was created");
      }
      
      return true;
    }
    
    console.log(`[checkStorageBucket] Bucket '${bucketName}' already exists`);
    return true;
  } catch (error) {
    console.error("[checkStorageBucket] Unexpected error:", error);
    return false;
  }
}
