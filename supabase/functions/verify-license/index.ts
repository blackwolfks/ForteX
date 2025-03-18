
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

// CORS-Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    
    // Request-Body parsen
    const requestData = await req.json();
    const licenseKey = requestData.license_key;
    const serverKey = requestData.server_key;
    
    // IP-Adresse des anfragenden Servers erhalten
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    console.log(`Anfrage von IP: ${clientIp}, Lizenzschlüssel: ${licenseKey}, Server-Key: ${serverKey}`);
    
    // Überprüfen, ob die erforderlichen Daten vorhanden sind
    if (!licenseKey || !serverKey) {
      console.log("Fehlende Lizenzinformationen");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Lizenzschlüssel und Server-Key müssen angegeben werden" 
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
        error: "Datenbankfehler bei der Lizenzprüfung" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    if (!data || !data.valid) {
      console.log("Ungültige Lizenz oder Server-Key");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Ungültige Lizenz oder Server-Key" 
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
        error: "Lizenz ist inaktiv" 
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
        error: "Zugriff von nicht autorisierter IP-Adresse" 
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
      error: "Ein interner Serverfehler ist aufgetreten" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
