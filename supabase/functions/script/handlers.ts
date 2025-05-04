
import { corsHeaders } from "./cors.ts";

// Define request types
export type RequestMethod = "verify" | "getFile" | "uploadFile" | "log";

export interface RequestData {
  licenseKey: string;
  serverKey: string;
  requestMethod?: RequestMethod;
  fileName?: string;
  fileContent?: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  message?: string;
  source?: string;
  details?: string;
  errorCode?: string;
  [key: string]: any;
}

// Parse request and return required data
export async function getRequest(req: Request) {
  let requestData: RequestData | null = null;
  let requestMethod: RequestMethod | null = null;
  let requestError: string | null = null;

  try {
    // Check if it's a POST request
    if (req.method !== "POST") {
      requestError = "Only POST requests are accepted";
      return { requestData, requestMethod, requestError };
    }

    // Try to parse JSON body
    try {
      requestData = await req.json();
    } catch (e) {
      requestError = "Invalid JSON format";
      return { requestData, requestMethod, requestError };
    }

    // Extract request method - default to "verify" if not provided
    requestMethod = requestData.requestMethod as RequestMethod || "verify";

    return { requestData, requestMethod, requestError };
  } catch (error) {
    requestError = `Request parsing error: ${(error as Error).message}`;
    return { requestData, requestMethod, requestError };
  }
}

// Create standardized success response
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
      status
    }
  );
}

// Create standardized error response
export function createErrorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status
    }
  );
}
