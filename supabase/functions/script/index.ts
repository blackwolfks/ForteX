
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleRequest } from "./handlers.ts"

// Start the server
serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled exception:", error);
    return new Response(
      `-- Error: Internal server error\nprint("^1Error:^0 Internal server error")`,
      {
        headers: { "Content-Type": "text/plain" },
        status: 500
      }
    );
  }
});
