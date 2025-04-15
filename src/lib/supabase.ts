
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a storage bucket exists and creates it if it doesn't
 * @param bucketName The name of the bucket to check/create
 * @returns A boolean indicating if the bucket exists or was created
 */
export async function checkStorageBucket(bucketName: string): Promise<boolean> {
  try {
    console.log(`[checkStorageBucket] Checking if bucket '${bucketName}' exists...`);
    
    // First try to create using RPC function if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_public_bucket', {
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
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['*/*']
      });
      
      if (createError) {
        console.error(`[checkStorageBucket] Error creating bucket '${bucketName}':`, createError);
        return false;
      }
      
      console.log(`[checkStorageBucket] Successfully created bucket '${bucketName}'`, data);
      
      // Try to create a policy to allow public access if needed
      try {
        await supabase.rpc('create_public_bucket', {
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
