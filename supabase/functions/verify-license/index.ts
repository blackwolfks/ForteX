
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS-Headers definieren
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-license-key, x-server-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // CORS Preflight-Anfragen behandeln
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Alle Header ausgeben für Debugging-Zwecke
    console.log("Request-Headers:", JSON.stringify(Object.fromEntries([...req.headers])));
    
    // Lizenzschlüssel und Server-Key aus verschiedenen Quellen extrahieren
    let licenseKey, serverKey;
    
    // 1. Aus Headers
    licenseKey = req.headers.get("x-license-key");
    serverKey = req.headers.get("x-server-key");
    
    // 2. Aus Basic Auth
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = atob(base64Credentials);
        const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
        
        if (!licenseKey && extractedLicenseKey) {
          licenseKey = extractedLicenseKey;
        }
        
        if (!serverKey && extractedServerKey) {
          serverKey = extractedServerKey;
        }
      } catch (e) {
        console.error("Fehler beim Dekodieren des Basic Auth Headers:", e);
      }
    }
    
    // 3. Aus Body
    let bodyData = {};
    try {
      if (req.method === "POST") {
        const clonedReq = req.clone();
        const text = await clonedReq.text();
        
        try {
          bodyData = JSON.parse(text);
          
          if (!licenseKey && bodyData.license_key) {
            licenseKey = bodyData.license_key;
          }
          if (!serverKey && bodyData.server_key) {
            serverKey = bodyData.server_key;
          }
        } catch (jsonError) {
          console.error("JSON-Parsing-Fehler:", jsonError);
        }
      }
    } catch (e) {
      console.error("Fehler beim Lesen des Request-Body:", e);
    }
    
    // Trimmen um Leerzeichen zu entfernen
    if (licenseKey) licenseKey = licenseKey.trim();
    if (serverKey) serverKey = serverKey.trim();
    
    console.log(`Überprüfe Lizenz: Lizenzschlüssel=${licenseKey}, Server-Key=${serverKey}`);
    
    if (!licenseKey || !serverKey) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Lizenzschlüssel und Server-Key müssen angegeben werden" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }
    
    // Supabase-Client initialisieren
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Serverfehler: Datenbankkonfiguration fehlt" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // IP-Adresse des anfragenden Clients erfassen
    let clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    console.log(`Client-IP (original): ${clientIp}`);
    
    // IP-Adresse bereinigen: Nehme nur die erste IP, wenn mehrere durch Komma getrennt sind
    if (clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }
    
    console.log(`Client-IP (bereinigt): ${clientIp}`);
    
    // Direkte Abfrage über beide Tabellen durchführen
    try {
      // 1. Zuerst in server_licenses suchen
      console.log("Prüfe in server_licenses Tabelle");
      const { data: licenseData, error: licenseError } = await supabase
        .from('server_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('server_key', serverKey)
        .maybeSingle();
      
      if (licenseError) {
        console.log("Fehler bei server_licenses:", licenseError);
      }
      
      // Wenn ein Ergebnis gefunden wurde, überprüfe IP-Beschränkung
      if (licenseData) {
        console.log("Lizenz in server_licenses gefunden:", licenseData);
        
        // IP-Adressüberprüfung
        if (licenseData.server_ip && licenseData.server_ip !== "*") {
          // Überprüfe, ob die Client-IP mit der gespeicherten IP übereinstimmt
          if (licenseData.server_ip !== clientIp) {
            console.log(`IP-Beschränkung verletzt. Erwartet: ${licenseData.server_ip}, Erhalten: ${clientIp}`);
            return new Response(JSON.stringify({ 
              valid: false, 
              error: "IP-Adressüberprüfung fehlgeschlagen", 
              message: "Die IP-Adresse stimmt nicht mit der autorisierten IP überein" 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403
            });
          }
          console.log("IP-Adressüberprüfung erfolgreich");
        }
        
        return new Response(JSON.stringify({ 
          valid: true,
          id: licenseData.id,
          license_key: licenseData.license_key,
          server_key: licenseData.server_key, // Wichtig: Server-Key mit zurückgeben
          script_name: licenseData.script_name,
          script_file: licenseData.script_file,
          server_ip: licenseData.server_ip,
          aktiv: licenseData.aktiv,
          has_file_upload: licenseData.has_file_upload
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }
      
      // 2. Dann in script_files suchen
      console.log("Prüfe in script_files Tabelle");
      const { data: oldLicenseData, error: oldLicenseError } = await supabase
        .from('script_files')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('server_key', serverKey)
        .maybeSingle();
      
      if (oldLicenseError) {
        console.log("Fehler bei script_files:", oldLicenseError);
      }
      
      // Wenn ein Ergebnis gefunden wurde, überprüfe IP-Beschränkung
      if (oldLicenseData) {
        console.log("Lizenz in script_files gefunden:", oldLicenseData);
        
        // IP-Adressüberprüfung
        if (oldLicenseData.server_ip && oldLicenseData.server_ip !== "*") {
          // Überprüfe, ob die Client-IP mit der gespeicherten IP übereinstimmt
          if (oldLicenseData.server_ip !== clientIp) {
            console.log(`IP-Beschränkung verletzt. Erwartet: ${oldLicenseData.server_ip}, Erhalten: ${clientIp}`);
            return new Response(JSON.stringify({ 
              valid: false, 
              error: "IP-Adressüberprüfung fehlgeschlagen", 
              message: "Die IP-Adresse stimmt nicht mit der autorisierten IP überein" 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403
            });
          }
          console.log("IP-Adressüberprüfung erfolgreich");
        }
        
        return new Response(JSON.stringify({ 
          valid: true,
          id: oldLicenseData.id,
          license_key: oldLicenseData.license_key,
          server_key: oldLicenseData.server_key, // Wichtig: Server-Key mit zurückgeben
          script_name: oldLicenseData.script_name,
          script_file: oldLicenseData.script_file,
          server_ip: oldLicenseData.server_ip,
          aktiv: oldLicenseData.aktiv,
          has_file_upload: oldLicenseData.has_file_upload
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }
      
      // 3. RPC-Funktion als letzte Option versuchen
      console.log("Versuche RPC Funktion check_license_by_keys");
      const { data: rpcData, error: rpcError } = await supabase.rpc("check_license_by_keys", {
        p_license_key: licenseKey,
        p_server_key: serverKey
      });
      
      if (rpcError) {
        console.log("RPC-Funktion fehlgeschlagen:", rpcError);
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "Datenbankfehler bei der Lizenzprüfung",
          details: rpcError.message
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        });
      }
      
      if (!rpcData || !rpcData.valid) {
        console.log("Keine gültige Lizenz gefunden:", rpcData);
        
        // Explizite Abfrage zur Fehlerbehebung
        const { data: allLicenses, error: licenseQueryError } = await supabase
          .from('server_licenses')
          .select('license_key, server_key')
          .eq('license_key', licenseKey)
          .limit(5);
        
        if (!licenseQueryError && allLicenses && allLicenses.length > 0) {
          console.log("Gefundene Lizenzen für diesen Key (ohne Server-Key):", allLicenses);
        }
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "Ungültige Lizenz oder Server-Key",
          provided: {
            license_key: licenseKey,
            server_key: serverKey
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        });
      }
      
      // IP-Adressüberprüfung für RPC-Ergebnis
      if (rpcData.server_ip && rpcData.server_ip !== "*") {
        // Überprüfe, ob die Client-IP mit der gespeicherten IP übereinstimmt
        if (rpcData.server_ip !== clientIp) {
          console.log(`IP-Beschränkung verletzt. Erwartet: ${rpcData.server_ip}, Erhalten: ${clientIp}`);
          return new Response(JSON.stringify({ 
            valid: false, 
            error: "IP-Adressüberprüfung fehlgeschlagen", 
            message: "Die IP-Adresse stimmt nicht mit der autorisierten IP überein" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403
          });
        }
        console.log("IP-Adressüberprüfung erfolgreich");
      }
      
      // RPC-Ergebnis zurückgeben mit expliziter Einbeziehung des Server-Keys
      console.log("Lizenz mit RPC-Funktion validiert:", rpcData);
      
      return new Response(JSON.stringify({
        valid: true,
        id: rpcData.id,
        license_key: rpcData.license_key,
        server_key: serverKey, // Explizit den erhaltenen Server-Key zurückgeben
        script_name: rpcData.script_name,
        script_file: rpcData.script_file,
        server_ip: rpcData.server_ip,
        aktiv: rpcData.aktiv,
        has_file_upload: rpcData.has_file_upload
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
      
    } catch (error) {
      console.error("Allgemeiner Fehler bei der Datenbankabfrage:", error);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Datenbankfehler bei der Lizenzprüfung" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
  } catch (error) {
    console.error("Unerwarteter Fehler:", error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: "Ein interner Serverfehler ist aufgetreten" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
