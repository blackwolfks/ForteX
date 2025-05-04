
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { handleRequest } from "./handlers.ts";
import { initSupabaseClient } from "./database.ts";

console.log("Remote Script function started");

// Log function start to database
async function logFunctionStart() {
  try {
    const { client, error } = initSupabaseClient();
    if (error || !client) {
      console.error("Failed to initialize Supabase client for startup log:", error);
      return;
    }
    
    await client.rpc("add_script_log", {
      p_license_id: null,
      p_level: "info",
      p_message: "Script function started",
      p_source: "server",
      p_details: `Remote Script function initialized at ${new Date().toISOString()}`
    });
    
    console.log("Function start logged to database");
  } catch (error) {
    console.error("Error logging function start:", error);
  }
}

// Log at startup
logFunctionStart();

serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled exception in server:", error);
    
    // Try to log the unhandled exception
    try {
      const { client } = initSupabaseClient();
      await client.rpc("add_script_log", {
        p_license_id: null,
        p_level: "error",
        p_message: "Unhandled exception",
        p_source: "server",
        p_details: error instanceof Error ? error.message : String(error),
        p_error_code: "500"
      });
    } catch (logError) {
      console.error("Failed to log unhandled exception:", logError);
    }
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred on the server"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }
});

console.log("Remote Script function initialized and ready to receive requests");
