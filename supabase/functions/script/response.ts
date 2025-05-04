
import { corsHeaders } from "./cors.ts";

// Create error response with Lua format
export function createErrorResponse(message: string, details?: string): Response {
  let responseText = `-- Error: ${message}\nprint("^1Error:^0 ${message}")`;
  if (details) {
    responseText += `\nprint("${details}")`;
  }
  
  return new Response(responseText, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
    status: 200 // Send 200 but with error message as Lua code
  });
}
