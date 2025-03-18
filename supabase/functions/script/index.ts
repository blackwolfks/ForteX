
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS-Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-license-key, x-server-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
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
    console.log("Script API wurde aufgerufen");
    
    // Lizenzschlüssel und Server-Key aus den Headers extrahieren
    const licenseKey = req.headers.get("x-license-key");
    const serverKey = req.headers.get("x-server-key");
    
    // IP-Adresse des anfragenden Servers erhalten
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    console.log(`Anfrage von IP: ${clientIp}, Lizenzschlüssel: ${licenseKey?.substring(0, 4)}..., Server-Key: ${serverKey?.substring(0, 4)}...`);
    
    // Überprüfen, ob die erforderlichen Header vorhanden sind
    if (!licenseKey || !serverKey) {
      console.log("Fehlende Authentifizierungsdaten");
      return new Response(JSON.stringify({ error: "Fehlende Authentifizierungsdaten" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Supabase-Client initialisieren
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Lizenz in der Datenbank überprüfen mit beiden Schlüsseln
    const { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    if (error || !data || !data.valid) {
      console.log("Ungültige Lizenz oder Server-Key:", error);
      return new Response(JSON.stringify({ error: "Ungültige Authentifizierungsdaten" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Überprüfen, ob die Lizenz aktiv ist
    if (!data.aktiv) {
      console.log("Lizenz ist inaktiv");
      return new Response(JSON.stringify({ error: "Lizenz ist inaktiv" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    
    // Überprüfen, ob eine IP-Beschränkung existiert
    if (data.server_ip && data.server_ip !== clientIp) {
      console.log(`IP-Beschränkung verletzt. Erwartet: ${data.server_ip}, Erhalten: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Zugriff von nicht autorisierter IP-Adresse" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    
    // Überprüfen, ob ein Skript-Datei-Upload existiert
    if (data.has_file_upload) {
      // Dateien aus dem Storage abrufen
      const { data: storageData, error: storageError } = await supabase.storage
        .from("script-files")
        .list(data.id.toString());
      
      if (storageError) {
        console.log("Fehler beim Abrufen der Script-Dateien:", storageError);
        return new Response(JSON.stringify({ error: "Fehler beim Abrufen der Script-Dateien" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // Öffentlich freigegebene Dateien abrufen
      const { data: accessData, error: accessError } = await supabase
        .from("script_file_access")
        .select("file_path, is_public")
        .eq("license_id", data.id);
      
      if (accessError) {
        console.log("Fehler beim Abrufen der Datei-Zugriffsrechte:", accessError);
        return new Response(JSON.stringify({ error: "Fehler beim Abrufen der Zugriffsrechte" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // Öffentliche Dateien filtern
      const publicFiles = accessData?.filter(file => file.is_public) || [];
      
      // Wenn es keine öffentlichen Dateien gibt, aber eine main.lua, diese verwenden
      let mainFile = storageData.find(file => 
        publicFiles.some(pf => pf.file_path === `${data.id}/${file.name}`) || file.name === "main.lua"
      );
      
      // Wenn keine öffentliche oder main.lua Datei gefunden wurde, nach anderen Dateien suchen
      if (!mainFile) {
        const luaFiles = storageData.filter(file => file.name.endsWith('.lua'));
        if (luaFiles.length > 0) {
          mainFile = luaFiles[0]; // Erste .lua-Datei verwenden
        } else if (storageData.length > 0) {
          mainFile = storageData[0]; // Irgendeine Datei verwenden
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
      return new Response(JSON.stringify({ error: "Kein Skript gefunden" }), {
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
    return new Response(JSON.stringify({ error: "Ein interner Serverfehler ist aufgetreten" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
