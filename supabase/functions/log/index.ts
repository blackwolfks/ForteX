
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers for browser clients
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
}

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Extract the information from the request body
    const { 
      license_id,
      level,
      message,
      source,
      details,
      error_code,
      client_ip,
      file_name
    } = await req.json()

    // Validate required fields
    if (!license_id || !level || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: license_id, level, and message are required" 
        }),
        { 
          status: 400, 
          headers: corsHeaders 
        }
      )
    }

    // Call the RPC function to add the log
    const { data, error } = await supabase.rpc('add_script_log', {
      p_license_id: license_id,
      p_level: level,
      p_message: message,
      p_source: source || null,
      p_details: details || null,
      p_error_code: error_code || null,
      p_client_ip: client_ip || null,
      p_file_name: file_name || null
    })

    if (error) {
      console.error("Error adding log:", error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        log_id: data 
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error("Error processing log request:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
