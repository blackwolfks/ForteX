
import { corsHeaders } from "./cors.ts";

// Create a standardized success response
export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Create a standardized error response
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Parse and validate request data
export async function getRequest(req: Request): Promise<{ requestData: any; requestMethod: string; requestError: string | null }> {
  try {
    // Check for required method
    if (req.method !== "POST") {
      return { 
        requestData: null, 
        requestMethod: "", 
        requestError: "Only POST requests are supported" 
      };
    }

    // Parse JSON body
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return { 
        requestData: null, 
        requestMethod: "", 
        requestError: "Content-Type must be application/json" 
      };
    }

    const body = await req.json();
    const requestMethod = body.method || "";

    if (!requestMethod) {
      return { 
        requestData: body, 
        requestMethod: "", 
        requestError: "Method is required in request body" 
      };
    }

    return { 
      requestData: body, 
      requestMethod, 
      requestError: null 
    };
  } catch (error) {
    console.error("Request parsing error:", error);
    return { 
      requestData: null, 
      requestMethod: "", 
      requestError: `Invalid request: ${error.message}` 
    };
  }
}
