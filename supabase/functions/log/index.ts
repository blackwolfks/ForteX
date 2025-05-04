
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Initialize Supabase client
function initSupabaseClient(): { client: any, error: string | null } {
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

// Helper function to check if a value is a valid UUID
function isValidUuid(value: any): boolean {
  if (!value) return false;
  if (value === 'all') return false;
  
  // Simple UUID format validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(value));
}

// Main function to handle the request
async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { license_id, level, message, source } = body;
    
    if (!license_id) {
      return new Response(JSON.stringify({ error: 'Missing license_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!isValidUuid(license_id)) {
      return new Response(JSON.stringify({ error: 'Invalid license_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!level || !['info', 'warning', 'error', 'debug'].includes(level)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing level parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase client
    const { client: supabase, error: dbError } = initSupabaseClient();
    if (dbError) {
      console.error("Database connection error:", dbError);
      return new Response(JSON.stringify({ error: 'Database connection error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract optional parameters
    const { details, error_code, client_ip, file_name } = body;
    
    // Call the RPC function to add the log
    const params = {
      p_license_id: license_id,
      p_level: level,
      p_message: message,
      p_source: source || null,
      p_details: details || null,
      p_error_code: error_code || null,
      p_client_ip: client_ip || null,
      p_file_name: file_name || null
    };
    
    console.log("Calling add_script_log with parameters:", params);
    
    try {
      const { data: logId, error: rpcError } = await supabase.rpc("add_script_log", params);
      
      if (rpcError) {
        console.error("Error calling add_script_log RPC:", rpcError);
        return new Response(JSON.stringify({ error: 'Failed to add log entry', details: rpcError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ id: logId, success: true }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error("Exception calling add_script_log RPC:", error);
      return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Start the server
serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled exception:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
