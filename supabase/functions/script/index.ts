
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { handleRequest } from "./handlers.ts";

console.log("Remote Script function started");

serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled exception in server:", error);
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
