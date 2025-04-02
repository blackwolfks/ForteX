
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get bucket name from request
    const { bucketName } = await req.json();
    
    if (!bucketName) {
      return new Response(
        JSON.stringify({ error: "Bucket name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Database configuration missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (!bucketError && bucketData) {
      console.log(`Bucket '${bucketName}' exists, updating to be public`);
      
      // Update existing bucket
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['*/*']
      });
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Error updating bucket: ${updateError.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: `Bucket '${bucketName}' updated to be public` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Create new bucket
      console.log(`Bucket '${bucketName}' not found, creating new bucket`);
      
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        allowedMimeTypes: ['*/*']
      });
      
      if (createError) {
        return new Response(
          JSON.stringify({ error: `Error creating bucket: ${createError.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      // Create policies for the bucket
      try {
        // Create RLS policy for public read access
        const { error: policyError } = await supabase.rpc("create_storage_policy", {
          bucket_id: bucketName,
          policy_name: `Allow public read for ${bucketName}`,
          definition: `(bucket_id = '${bucketName}')`
        });
        
        if (policyError) {
          console.error(`Error creating policy: ${policyError.message}`);
        }
      } catch (policyError) {
        console.error(`Error creating policies: ${policyError}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: `Bucket '${bucketName}' created successfully` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );
    }
  } catch (error) {
    console.error(`Unexpected error: ${error}`);
    return new Response(
      JSON.stringify({ error: "An internal server error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
