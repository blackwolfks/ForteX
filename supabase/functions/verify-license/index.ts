
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
    
    // Zuerst die neuere Tabelle 'server_licenses' abfragen
    try {
      console.log("Prüfe in server_licenses Tabelle");
      const { data: licenseData, error: licenseError } = await supabase
        .from('server_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('server_key', serverKey)
        .single();
        
      if (licenseError) {
        console.log("Fehler bei server_licenses oder keine Ergebnisse:", licenseError);
        
        // Fallback: Ältere Tabelle 'script_files' abfragen
        console.log("Prüfe in script_files Tabelle");
        const { data: oldLicenseData, error: oldLicenseError } = await supabase
          .from('script_files')
          .select('*')
          .eq('license_key', licenseKey)
          .eq('server_key', serverKey)
          .single();
          
        if (oldLicenseError) {
          console.log("Fehler bei script_files oder keine Ergebnisse:", oldLicenseError);
          
          // RPC-Funktion als letzte Option versuchen
          console.log("Versuche RPC Funktion check_license_by_keys");
          const { data: rpcData, error: rpcError } = await supabase.rpc("check_license_by_keys", {
            p_license_key: licenseKey,
            p_server_key: serverKey
          });
          
          if (rpcError || !rpcData || !rpcData.valid) {
            console.log("RPC-Funktion nicht erfolgreich:", rpcError || "Ungültiges Ergebnis");
            
            // Existieren die Tabellen überhaupt?
            const { data: tableInfo, error: tableError } = await supabase
              .from('server_licenses')
              .select('id')
              .limit(1);
              
            if (tableError) {
              console.log("server_licenses Tabelle existiert nicht:", tableError);
            } else {
              console.log("server_licenses Tabelle existiert, aber keine Übereinstimmung für die angegebenen Schlüssel.");
            }
            
            return new Response(JSON.stringify({ 
              valid: false, 
              error: "Ungültige Lizenz oder Server-Key" 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401
            });
          }
          
          return new Response(JSON.stringify(rpcData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          });
        }
        
        return new Response(JSON.stringify({ 
          valid: true,
          id: oldLicenseData.id,
          license_key: oldLicenseData.license_key,
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
      
      return new Response(JSON.stringify({ 
        valid: true,
        id: licenseData.id,
        license_key: licenseData.license_key,
        script_name: licenseData.script_name,
        script_file: licenseData.script_file,
        server_ip: licenseData.server_ip,
        aktiv: licenseData.aktiv,
        has_file_upload: licenseData.has_file_upload
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
