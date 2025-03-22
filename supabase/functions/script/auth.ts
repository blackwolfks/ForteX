
// Extract keys from various sources in the request
export async function extractKeys(req: Request): Promise<{ licenseKey: string | null, serverKey: string | null, bodyData: any }> {
  let licenseKey = req.headers.get("x-license-key");
  let serverKey = req.headers.get("x-server-key");
  let bodyData = {};
  
  // Extract from URL parameters
  const url = new URL(req.url);
  const urlParams = url.searchParams;
  if (urlParams.has("license_key") && urlParams.has("server_key")) {
    licenseKey = urlParams.get("license_key");
    serverKey = urlParams.get("server_key");
  }
  
  // Extract from Basic Auth
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = atob(base64Credentials);
      const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
      
      if (!licenseKey && extractedLicenseKey) licenseKey = extractedLicenseKey;
      if (!serverKey && extractedServerKey) serverKey = extractedServerKey;
    } catch (e) {
      console.error("Error decoding Basic Auth header:", e);
    }
  }
  
  // Extract from body if POST request
  if (req.method === "POST") {
    try {
      const clonedReq = req.clone();
      const text = await clonedReq.text();
      try {
        bodyData = JSON.parse(text);
        if (!licenseKey && bodyData.license_key) licenseKey = bodyData.license_key;
        if (!serverKey && bodyData.server_key) serverKey = bodyData.server_key;
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
      }
    } catch (e) {
      console.error("Error reading request body:", e);
    }
  }
  
  // Trim whitespace
  if (licenseKey) licenseKey = licenseKey.trim();
  if (serverKey) serverKey = serverKey.trim();
  
  return { licenseKey, serverKey, bodyData };
}

// Get client IP from request headers
export function getClientIp(req: Request): string {
  let rawClientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  return rawClientIp.split(",")[0].trim(); // Get first IP address
}
