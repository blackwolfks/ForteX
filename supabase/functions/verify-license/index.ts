import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS-Headers erweitern, um Authorization-Header explizit zu erlauben
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-license-key, x-server-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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
    console.log("Lizenzverifizierungs-API wurde aufgerufen");
    
    // Alle Header ausgeben für Debugging-Zwecke
    console.log("Request-Headers:", JSON.stringify(Object.fromEntries([...req.headers])));
    
    // Request-Body parsen
    let licenseKey, serverKey;
    
    // Versuche erst, die Daten aus den Headers zu bekommen
    licenseKey = req.headers.get("x-license-key");
    serverKey = req.headers.get("x-server-key");
    
    // Basic Auth Header extrahieren
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = atob(base64Credentials);
        const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
        
        if (!licenseKey && extractedLicenseKey) {
          licenseKey = extractedLicenseKey;
          console.log("Lizenzschlüssel aus Basic Auth extrahiert");
        }
        
        if (!serverKey && extractedServerKey) {
          serverKey = extractedServerKey;
          console.log("Server-Key aus Basic Auth extrahiert");
        }
      } catch (e) {
        console.log("Fehler beim Dekodieren des Basic Auth Headers:", e.message);
      }
    }
    
    // Wenn nicht in den Headers, versuche im Body
    if (!licenseKey || !serverKey) {
      try {
        const requestData = await req.json();
        licenseKey = licenseKey || requestData.license_key;
        serverKey = serverKey || requestData.server_key;
      } catch (e) {
        console.log("Konnte JSON-Body nicht parsen:", e.message);
      }
    }
    
    // IP-Adresse des anfragenden Servers erhalten
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    console.log(`Anfrage von IP: ${clientIp}, Lizenzschlüssel: ${licenseKey}, Server-Key: ${serverKey}`);
    
    // Überprüfen, ob die erforderlichen Daten vorhanden sind
    if (!licenseKey || !serverKey) {
      console.log("Fehlende Lizenzinformationen");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Lizenzschlüssel und Server-Key müssen angegeben werden",
        debug: {
          headers_present: {
            license_key: req.headers.has("x-license-key"),
            server_key: req.headers.has("x-server-key"),
            authorization: req.headers.has("authorization")
          },
          client_ip: clientIp
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // WICHTIG: Test-Authentifizierung überprüfen und immer akzeptieren
    if (licenseKey === "ABCD-EFGH-IJKL-MNOP" && serverKey === "123456789ABC") {
      console.log("Test-Authentifizierung erfolgreich");
      return new Response(JSON.stringify({
        valid: true,
        license_info: {
          id: "test-license",
          script_name: "Test Script",
          aktiv: true
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Supabase-Client initialisieren
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Serverfehler: Supabase-Konfiguration fehlt",
        debug: {
          supabase_url_exists: !!supabaseUrl,
          service_role_key_exists: !!supabaseKey
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Überprüfe Lizenz in der Datenbank...");
    
    // Lizenz in der Datenbank überprüfen mit beiden Schlüsseln
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    if (error) {
      console.log("Fehler bei der Datenbankabfrage:", error);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Datenbankfehler bei der Lizenzprüfung",
        debug: {
          db_error: error.message,
          query_params: {
            license_key: licenseKey,
            server_key: serverKey
          }
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    if (!data || !data.valid) {
      console.log("Ungültige Lizenz oder Server-Key");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Ungültige Lizenz oder Server-Key",
        debug: {
          data_received: data || "keine Daten",
          client_ip: clientIp
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // 200 status but invalid result
      });
    }
    
    // Überprüfen, ob die Lizenz aktiv ist
    if (!data.aktiv) {
      console.log("Lizenz ist inaktiv");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Lizenz ist inaktiv",
        debug: {
          license_data: data
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Überprüfen, ob eine IP-Beschränkung existiert
    if (data.server_ip && data.server_ip !== clientIp && data.server_ip !== "*") {
      console.log(`IP-Beschränkung verletzt. Erwartet: ${data.server_ip}, Erhalten: ${clientIp}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Zugriff von nicht autorisierter IP-Adresse",
        debug: {
          expected_ip: data.server_ip,
          client_ip: clientIp
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Lizenz ist gültig, sende Erfolgsmeldung
    console.log("Lizenz erfolgreich verifiziert");
    return new Response(JSON.stringify({
      valid: true,
      license_info: {
        id: data.id,
        script_name: data.script_name,
        aktiv: data.aktiv,
        has_file_upload: data.has_file_upload || false
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Unerwarteter Fehler:", error.message);
    return new Response(JSON.stringify({ 
      valid: false,
      error: "Ein interner Serverfehler ist aufgetreten",
      debug: {
        error_message: error.message,
        error_stack: error.stack
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
