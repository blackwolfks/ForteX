
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS-Headers erweitern, um Authorization-Header explizit zu erlauben
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
    const url = new URL(req.url);
    console.log("Script API wurde aufgerufen:", url.pathname);
    
    // Alle Header ausgeben für Debugging-Zwecke
    console.log("Request-Headers:", JSON.stringify(Object.fromEntries([...req.headers])));
    
    // Lizenzschlüssel und Server-Key aus den Headers extrahieren
    let licenseKey = req.headers.get("x-license-key");
    let serverKey = req.headers.get("x-server-key");
    let bodyData = {};
    
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
    
    // Alternative: Extrahiere aus dem Body, falls die Headers nicht gesetzt sind
    if (!licenseKey || !serverKey) {
      try {
        if (req.method === "POST") {
          bodyData = await req.json();
          if (!licenseKey && bodyData.license_key) {
            licenseKey = bodyData.license_key;
            console.log("Lizenzschlüssel aus dem Body extrahiert");
          }
          if (!serverKey && bodyData.server_key) {
            serverKey = bodyData.server_key;
            console.log("Server-Key aus dem Body extrahiert");
          }
        }
      } catch (e) {
        console.log("Keine Body-Daten vorhanden oder kein gültiges JSON:", e.message);
      }
    }
    
    // IP-Adresse des anfragenden Servers erhalten
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    console.log(`Anfrage von IP: ${clientIp}, Lizenzschlüssel: ${licenseKey}, Server-Key: ${serverKey}`);
    
    // Überprüfen, ob die erforderlichen Authentifizierungsdaten vorhanden sind
    if (!licenseKey || !serverKey) {
      console.log("Fehlende Authentifizierungsdaten");
      return new Response(JSON.stringify({ 
        error: "Fehlende Authentifizierungsdaten",
        message: "Bitte stellen Sie sicher, dass die X-License-Key und X-Server-Key Header oder entsprechende POST-Parameter gesetzt sind.",
        debug: {
          headers_present: {
            license_key: req.headers.has("x-license-key"),
            server_key: req.headers.has("x-server-key"),
            authorization: req.headers.has("authorization")
          },
          client_ip: clientIp,
          url: req.url
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Supabase-Client initialisieren
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert");
      return new Response(JSON.stringify({ 
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
    
    console.log("Überprüfe Lizenz mit check_license_by_keys Funktion");
    
    // Lizenz in der Datenbank überprüfen mit beiden Schlüsseln
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    if (error) {
      console.log("Fehler bei der Lizenzüberprüfung:", error);
      return new Response(JSON.stringify({ 
        error: "Fehler bei der Lizenzüberprüfung",
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
      console.log("Ungültige Lizenz oder Server-Key:", data);
      return new Response(JSON.stringify({ 
        error: "Ungültige Authentifizierungsdaten",
        debug: {
          data_received: data || "keine Daten"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Überprüfen, ob die Lizenz aktiv ist
    if (!data.aktiv) {
      console.log("Lizenz ist inaktiv");
      return new Response(JSON.stringify({ 
        error: "Lizenz ist inaktiv"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    
    // Überprüfen, ob eine IP-Beschränkung existiert
    if (data.server_ip && data.server_ip !== clientIp && data.server_ip !== "*") {
      console.log(`IP-Beschränkung verletzt. Erwartet: ${data.server_ip}, Erhalten: ${clientIp}`);
      return new Response(JSON.stringify({ 
        error: "Zugriff von nicht autorisierter IP-Adresse",
        debug: {
          expected_ip: data.server_ip,
          client_ip: clientIp
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    
    // Extrahiere spezifischen Dateipfad aus der URL
    // Format: /api/script/filename.lua
    const pathParts = url.pathname.split('/');
    const specificFile = pathParts.length > 2 ? pathParts.slice(2).join('/') : null;
    
    // Überprüfen, ob ein Skript-Datei-Upload existiert
    if (data.has_file_upload) {
      // Wenn ein spezifischer Dateipfad angefordert wurde
      if (specificFile) {
        console.log(`Spezifische Datei angefordert: ${specificFile}`);
        
        // Vollständigen Pfad erstellen
        const fullPath = `${data.id}/${specificFile}`;
        
        // Datei herunterladen
        const { data: fileData, error: fileError } = await supabase.storage
          .from("script-files")
          .download(fullPath);
        
        if (fileError) {
          console.log("Fehler beim Herunterladen der Datei:", fileError);
          return new Response(JSON.stringify({ error: "Fehler beim Herunterladen der Datei" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
        
        // Datei als Text senden
        const fileText = await fileData.text();
        console.log(`Datei erfolgreich gesendet: ${fullPath}`);
        
        return new Response(fileText, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200,
        });
      }
      
      // Wenn keine spezifische Datei angefordert wurde, listet Dateien auf
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from("script-files")
        .list(data.id.toString());
      
      if (storageError) {
        console.log("Fehler beim Abrufen der Script-Dateien:", storageError);
        return new Response(JSON.stringify({ error: "Fehler beim Abrufen der Script-Dateien" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // Wenn es keine Dateien gibt, aber eine main.lua, diese verwenden
      let mainFile = storageFiles.find(file => file.name === "main.lua");
      
      // Wenn keine main.lua Datei gefunden wurde, nach anderen Dateien suchen
      if (!mainFile) {
        const luaFiles = storageFiles.filter(file => file.name.endsWith('.lua'));
        if (luaFiles.length > 0) {
          mainFile = luaFiles[0]; // Erste .lua-Datei verwenden
        } else if (storageFiles.length > 0) {
          mainFile = storageFiles[0]; // Irgendeine Datei verwenden
        }
      }
      
      if (!mainFile) {
        console.log("Keine Skriptdateien gefunden");
        return new Response(JSON.stringify({ error: "Keine Skriptdateien gefunden" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      
      // Skript-Datei herunterladen
      const { data: fileData, error: fileError } = await supabase.storage
        .from("script-files")
        .download(`${data.id}/${mainFile.name}`);
      
      if (fileError) {
        console.log("Fehler beim Herunterladen der Skriptdatei:", fileError);
        return new Response(JSON.stringify({ error: "Fehler beim Herunterladen der Skriptdatei" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // Datei als Text senden
      const scriptText = await fileData.text();
      console.log(`Skriptdatei erfolgreich gesendet: ${mainFile.name}`);
      
      return new Response(scriptText, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200,
      });
    }
    
    // Wenn kein Datei-Upload, dann das Skript aus der Datenbank senden
    if (!data.script_file) {
      console.log("Kein Skript in der Datenbank gefunden");
      return new Response(JSON.stringify({ 
        error: "Kein Skript gefunden"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
    
    console.log("Skript erfolgreich gesendet");
    return new Response(data.script_file, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Unerwarteter Fehler:", error.message);
    return new Response(JSON.stringify({ 
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
