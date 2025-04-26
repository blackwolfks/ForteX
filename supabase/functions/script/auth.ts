// Helper functions for extracting and validating authentication data
import { corsHeaders } from "./cors.ts";

// Extract client IP from request headers
export function getClientIp(req: Request): string {
  let rawClientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  return rawClientIp.split(",")[0].trim(); // Get first IP address
}

export async function extractKeys(req: Request) {
    let licenseKey = null;
    let serverKey = null;

    // 1. Basic Auth hat Priorität
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
        try {
            const base64Credentials = authHeader.split(" ")[1];
            const credentials = atob(base64Credentials);
            const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
            licenseKey = extractedLicenseKey;
            serverKey = extractedServerKey;
        } catch (e) {
            console.error("Fehler beim Dekodieren von Basic Auth:", e);
        }
    }

    // 2. Falls Basic Auth fehlt, Header nutzen
    if (!licenseKey) licenseKey = req.headers.get("x-license-key");
    if (!serverKey) serverKey = req.headers.get("x-server-key");

    // 3. Falls noch leer, URL-Parameter prüfen
    const url = new URL(req.url);
    const urlParams = url.searchParams;
    if (!licenseKey && urlParams.has("license_key")) licenseKey = urlParams.get("license_key");
    if (!serverKey && urlParams.has("server_key")) serverKey = urlParams.get("server_key");

    return { licenseKey, serverKey };
}
