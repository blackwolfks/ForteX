
// Extract keys from various sources in the request
export async function extractKeys(req: Request) {
    let licenseKey = null;
    let serverKey = null;

    // 1️⃣ Basic Auth hat höchste Priorität
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

    // 2️⃣ Falls Basic Auth fehlt oder unvollständig, verwende Header
    if (!licenseKey) licenseKey = req.headers.get("x-license-key");
    if (!serverKey) serverKey = req.headers.get("x-server-key");

    // 3️⃣ Falls noch immer leer, prüfe URL-Parameter
    const url = new URL(req.url);
    const urlParams = url.searchParams;
    if (!licenseKey && urlParams.has("license_key")) licenseKey = urlParams.get("license_key");
    if (!serverKey && urlParams.has("server_key")) serverKey = urlParams.get("server_key");

    console.log(`Extracted Keys -> LicenseKey: ${licenseKey}, ServerKey: ${serverKey}`);
    return { licenseKey, serverKey };
}

// Client-IP extrahieren (falls benötigt)
export function getClientIp(req: Request) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    return req.headers.get("cf-connecting-ip") || "unknown";
}
