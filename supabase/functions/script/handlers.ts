
// Import necessary modules and helper functions from other files
import { verifyLicense, checkIpRestriction, initSupabaseClient, addScriptLog } from "./database.ts";
import { getRequest, createSuccessResponse, createErrorResponse } from "./response.ts";
import { corsHeaders } from "./cors.ts";

// Function to get client IP address from request headers
function getClientIp(req: Request): string | undefined {
  // Try to get the IP from common headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  // Use the first IP if x-forwarded-for contains multiple IPs
  return (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || undefined;
}

// Main handler function for Deno edge function
export async function handleRequest(req: Request) {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    // Parse the request and extract data
    const { requestData, requestMethod, requestError } = await getRequest(req);
    
    if (requestError || !requestData) {
      console.error("Error parsing request:", requestError);
      return createErrorResponse("Invalid request format", 400);
    }
    
    // Get license and server key from request
    const { licenseKey, serverKey } = requestData;
    const clientIp = getClientIp(req);
    
    // Validate required fields
    if (!licenseKey || !serverKey) {
      return createErrorResponse("licenseKey and serverKey are required", 400);
    }
    
    // Initialize Supabase client
    const { client: supabase, error: initError } = initSupabaseClient();
    if (initError || !supabase) {
      console.error("Failed to initialize Supabase client:", initError);
      return createErrorResponse("Database connection error", 500);
    }
    
    // Verify the license
    const licenseData = await verifyLicense(supabase, licenseKey, serverKey);
    if (!licenseData || !licenseData.valid) {
      const errorMsg = licenseData?.error || "Invalid license";
      
      // Log the failed license check if we have a license ID
      if (licenseData && licenseData.id) {
        await addScriptLog(
          supabase,
          licenseData.id, 
          'error',
          'License verification failed',
          'license-check',
          errorMsg,
          'E1001',
          clientIp
        );
      }
      
      return createErrorResponse(errorMsg, 403);
    }
    
    // Check IP restriction if clientIp is available
    if (clientIp) {
      const ipCheck = checkIpRestriction(licenseData, clientIp);
      if (!ipCheck.passed) {
        await addScriptLog(
          supabase,
          licenseData.id, 
          'error',
          `IP restriction failed: ${clientIp} not authorized`,
          'ip-check',
          `Expected: ${ipCheck.expected}, Got: ${clientIp}`,
          'E1002',
          clientIp
        );
        
        return createErrorResponse(ipCheck.error || "IP restriction failed", 403);
      }
    }
    
    // Process the specific request type
    switch (requestMethod) {
      case "verify":
        // For verify requests, we just return success as we've already verified the license
        await addScriptLog(
          supabase,
          licenseData.id, 
          'info',
          'License verification successful',
          'license-check',
          undefined,
          undefined,
          clientIp
        );
        
        return createSuccessResponse({
          valid: true,
          scriptName: licenseData.script_name,
          hasFileUpload: licenseData.has_file_upload || false
        });
      
      case "log":
        // For log requests, add the log to the database
        const { level, message, source, details, errorCode, fileName } = requestData;
        
        if (!level || !message) {
          return createErrorResponse("level and message are required for log requests", 400);
        }
        
        // Validate log level
        if (!['info', 'warning', 'error', 'debug'].includes(level)) {
          return createErrorResponse(`Invalid log level: ${level}`, 400);
        }
        
        const logResult = await addScriptLog(
          supabase,
          licenseData.id,
          level,
          message,
          source,
          details,
          errorCode,
          clientIp,
          fileName
        );
        
        if (!logResult.success) {
          return createErrorResponse(logResult.error || "Failed to add log", 500);
        }
        
        return createSuccessResponse({
          logged: true,
          id: logResult.id
        });
      
      default:
        await addScriptLog(
          supabase,
          licenseData.id, 
          'warning',
          `Unknown request method: ${requestMethod}`,
          'api',
          JSON.stringify(requestData),
          'E1003',
          clientIp
        );
        
        return createErrorResponse(`Unknown request method: ${requestMethod}`, 400);
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return createErrorResponse("Internal server error: " + (error.message || "Unknown error"), 500);
  }
}
