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
    let bodyData: any = {};
    
    // URL-Parameter prüfen
    const urlParams = url.searchParams;
    if (urlParams.has("license_key") && urlParams.has("server_key")) {
      console.log("Lizenzschlüssel und Server-Key aus URL-Parametern erkannt");
      licenseKey = urlParams.get("license_key");
      serverKey = urlParams.get("server_key");
    }
    
    // Basic Auth Header extrahieren
    const authHeader = req.headers.get("authorization");
    console.log("Authorization Header:", authHeader ? "vorhanden" : "nicht vorhanden");
    
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = atob(base64Credentials);
        console.log("Dekodierte Credentials:", credentials);
        const [extractedLicenseKey, extractedServerKey] = credentials.split(":");
        
        if (!licenseKey && extractedLicenseKey) {
          licenseKey = extractedLicenseKey;
          console.log("Lizenzschlüssel aus Basic Auth extrahiert:", licenseKey);
        }
        
        if (!serverKey && extractedServerKey) {
          serverKey = extractedServerKey;
          console.log("Server-Key aus Basic Auth extrahiert:", serverKey);
        }
      } catch (e) {
        console.log("Fehler beim Dekodieren des Basic Auth Headers:", e.message);
      }
    }
    
    // Alternative: Extrahiere aus dem Body, falls die Headers nicht gesetzt sind
    if (!licenseKey || !serverKey) {
      try {
        if (req.method === "POST") {
          const clonedReq = req.clone();
          const text = await clonedReq.text();
          console.log("Request body:", text);
          
          try {
            bodyData = JSON.parse(text);
            console.log("Parsed body data:", bodyData);
            
            if (!licenseKey && bodyData.license_key) {
              licenseKey = bodyData.license_key;
              console.log("Lizenzschlüssel aus dem Body extrahiert:", licenseKey);
            }
            if (!serverKey && bodyData.server_key) {
              serverKey = bodyData.server_key;
              console.log("Server-Key aus dem Body extrahiert:", serverKey);
            }
          } catch (jsonError) {
            console.log("JSON-Parsing-Fehler:", jsonError.message);
          }
        }
      } catch (e) {
        console.log("Keine Body-Daten vorhanden oder kein gültiges JSON:", e.message);
      }
    }
    
    // Keys trimmen, um Leerzeichen zu entfernen
    if (licenseKey) licenseKey = licenseKey.trim();
    if (serverKey) serverKey = serverKey.trim();
    
    // Verbesserte IP-Adress-Extraktion
    let rawClientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    // Extrahiere die erste IP, wenn mehrere durch Komma getrennt sind
    let clientIp = rawClientIp;
    if (rawClientIp.includes(",")) {
      clientIp = rawClientIp.split(",")[0].trim();
    }
    
    console.log(`Anfrage von IP: ${clientIp} (Original: ${rawClientIp}), Lizenzschlüssel: ${licenseKey}, Server-Key: ${serverKey}`);
    
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
          url_params: {
            license_key: urlParams.has("license_key"),
            server_key: urlParams.has("server_key")
          },
          client_ip: clientIp,
          raw_client_ip: rawClientIp,
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
    let { data, error } = await supabase.rpc("check_license_by_keys", {
      p_license_key: licenseKey,
      p_server_key: serverKey
    });
    
    // Wenn es einen Fehler gibt, versuche alternative Abfragen
    if (error) {
      console.log("Fehler bei der ersten Lizenzüberprüfung, versuche alternative Methode:", error);
      
      // Probiere es mit einem direkten Datenbankzugriff
      try {
        console.log("Prüfe in server_licenses Tabelle...");
        const { data: licenseData, error: licenseError } = await supabase
          .from('server_licenses')
          .select('*')
          .eq('license_key', licenseKey)
          .eq('server_key', serverKey)
          .single();
        
        if (!licenseError && licenseData) {
          // Umwandeln in das erwartete Format
          data = {
            valid: true,
            id: licenseData.id,
            license_key: licenseData.license_key,
            script_name: licenseData.script_name,
            script_file: licenseData.script_file,
            server_ip: licenseData.server_ip,
            aktiv: licenseData.aktiv,
            has_file_upload: licenseData.has_file_upload
          };
          console.log("Lizenz direkt aus der Datenbank gefunden:", data);
        } else {
          console.log("Lizenz nicht in server_licenses gefunden, versuche script_files:", licenseError);
          
          // Versuche es mit der alten Tabelle "script_files"
          const { data: oldLicenseData, error: oldLicenseError } = await supabase
            .from('script_files')
            .select('*')
            .eq('license_key', licenseKey)
            .eq('server_key', serverKey)
            .single();
          
          if (!oldLicenseError && oldLicenseData) {
            data = {
              valid: true,
              id: oldLicenseData.id,
              license_key: oldLicenseData.license_key,
              script_name: oldLicenseData.script_name,
              script_file: oldLicenseData.script_file,
              server_ip: oldLicenseData.server_ip,
              aktiv: oldLicenseData.aktiv,
              has_file_upload: oldLicenseData.has_file_upload
            };
            console.log("Lizenz in script_files gefunden:", data);
          } else {
            console.log("Lizenz auch nicht in script_files gefunden:", oldLicenseError);
            
            // Versuche eine direkte Debug-Abfrage aller Lizenzen
            const { data: allLicenses, error: allLicensesError } = await supabase
              .from('server_licenses')
              .select('license_key, server_key')
              .limit(5);
            
            if (!allLicensesError && allLicenses) {
              console.log("Vorhandene Lizenzen (max. 5):", allLicenses);
            }
          }
        }
      } catch (dbError) {
        console.log("Fehler beim direkten Datenbankzugriff:", dbError);
      }
    }
    
    if (!data || !data.valid) {
      console.log("Ungültige Lizenz oder Server-Key:", data);
      return new Response(JSON.stringify({ 
        error: "Ungültige Authentifizierungsdaten",
        debug: {
          data_received: data || "keine Daten",
          license_key_provided: licenseKey,
          server_key_provided: serverKey
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
    
    // Verbesserte IP-Beschränkungsprüfung
    if (data.server_ip && data.server_ip !== "*") {
      const storedIp = data.server_ip.trim();
      console.log(`Vergleiche IPs - Gespeichert: '${storedIp}', Client: '${clientIp}'`);
      
      if (storedIp !== clientIp) {
        console.log(`IP-Beschränkung verletzt. Erwartet: ${storedIp}, Erhalten: ${clientIp}, Original: ${rawClientIp}`);
        return new Response(JSON.stringify({ 
          error: "IP-Adressüberprüfung fehlgeschlagen",
          message: "Die IP-Adresse stimmt nicht mit der autorisierten IP überein",
          debug: {
            expected_ip: storedIp,
            client_ip: clientIp,
            raw_client_ip: rawClientIp
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }
    
    // Wenn die IP-Adresse übereinstimmt oder keine Beschränkung vorhanden ist
    if (data.server_ip) {
      console.log(`IP-Überprüfung erfolgreich. Server-IP: ${data.server_ip}, Client-IP: ${clientIp}`);
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
        
        // Prüfen, ob der Bucket existiert
        try {
          // Buckets auflisten
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          
          if (bucketsError) {
            console.log("Fehler beim Auflisten der Buckets:", bucketsError);
          } else {
            const scriptBucketExists = buckets.some(bucket => bucket.name === "script");
            
            if (!scriptBucketExists) {
              console.log("Script-Bucket existiert nicht, versuche ihn zu erstellen");
              
              // Bucket erstellen
              const { error: createBucketError } = await supabase.storage.createBucket("script", {
                public: false
              });
              
              if (createBucketError) {
                console.log("Fehler beim Erstellen des Buckets:", createBucketError);
                // Trotzdem fortfahren, da der Bucket vielleicht doch existiert
              } else {
                console.log("Script-Bucket erfolgreich erstellt");
              }
            } else {
              console.log("Script-Bucket existiert bereits");
            }
          }
        } catch (bucketError) {
          console.log("Fehler beim Überprüfen/Erstellen des Buckets:", bucketError);
          // Fortfahren und versuchen, die Datei trotzdem zu laden
        }
        
        try {
          // Datei herunterladen
          const { data: fileData, error: fileError } = await supabase.storage
            .from("script")
            .download(fullPath);
          
          if (fileError) {
            console.log("Fehler beim Herunterladen der Datei:", fileError);
            return new Response(JSON.stringify({ 
              error: "Fehler beim Herunterladen der Datei", 
              debug: { 
                path: fullPath,
                error_message: fileError.message,
                error_details: fileError
              }
            }), {
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
        } catch (downloadError) {
          console.log("Fehler beim Herunterladen der Datei:", downloadError);
          
          // Wenn die Datei nicht gefunden wird, sende eine nützliche Fehlermeldung
          return new Response(`
          -- Datei nicht gefunden: ${specificFile}
          -- Für Lizenz: ${licenseKey}
          
          print("^1ForteX Framework^0: Datei '${specificFile}' konnte nicht gefunden werden!")
          print("^1ForteX Framework^0: Bitte laden Sie die Datei über die Web-Admin-Oberfläche hoch.")
          `, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200, // 200 statt 404 senden, damit der Code trotzdem ausgeführt wird
          });
        }
      }
      
      // Versuchen wir, alle Dateien aufzulisten
      try {
        // Wenn keine spezifische Datei angefordert wurde, listet Dateien auf
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from("script")
          .list(data.id.toString());
        
        if (storageError) {
          console.log("Fehler beim Abrufen der Script-Dateien:", storageError);
          
          // Versuche das Verzeichnis zu erstellen
          try {
            // Workaround: Leere Datei hochladen, um ein Verzeichnis zu erstellen
            const emptyFile = new Blob(['-- Leere Datei'], { type: 'text/plain' });
            const { error: uploadError } = await supabase.storage
              .from("script")
              .upload(`${data.id}/main.lua`, emptyFile);
            
            if (uploadError) {
              console.log("Fehler beim Erstellen des Verzeichnisses:", uploadError);
              return new Response(JSON.stringify({ 
                error: "Fehler beim Erstellen des Verzeichnisses",
                debug: {
                  error_message: uploadError.message,
                  license_id: data.id
                }
              }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
              });
            }
            
            console.log("Verzeichnis erfolgreich erstellt, sende Standardskript");
            
            // Standardskript zurückgeben
            return new Response(`
            -- ForteX Framework Skript
            -- Generiert für Lizenz ${licenseKey}
            
            print("^2ForteX Framework^0: Skript erfolgreich geladen!")
            
            -- Fügen Sie hier Ihren eigenen Code ein oder laden Sie Dateien über die Web-Admin-Oberfläche hoch
            `, {
              headers: { ...corsHeaders, "Content-Type": "text/plain" },
              status: 200,
            });
          } catch (dirError) {
            console.log("Unerwarteter Fehler beim Erstellen des Verzeichnisses:", dirError);
          }
          
          // Falls es einen Fehler gibt, senden wir trotzdem eine gültige Lua-Antwort
          return new Response(`
          -- ForteX Framework - Fehler beim Abrufen von Dateien
          -- Fehler: ${storageError.message}
          
          print("^2ForteX Framework^0: Verbindung hergestellt, aber keine Dateien gefunden.")
          print("^2ForteX Framework^0: Bitte laden Sie Dateien über die Web-Admin-Oberfläche hoch.")
          `, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200,
          });
        }
        
        // Wenn es keine Dateien gibt, aber wir den Bucket und das Verzeichnis haben
        if (!storageFiles || storageFiles.length === 0) {
          console.log("Keine Dateien im Verzeichnis gefunden, erstelle Standard-Skript");
          
          // Standard-Skript erzeugen
          const defaultScript = `
          -- ForteX Framework Skript
          -- Generiert für Lizenz ${licenseKey}
          
          print("^2ForteX Framework^0: Skript erfolgreich geladen!")
          print("^2ForteX Framework^0: Keine Dateien gefunden. Bitte laden Sie Dateien über die Web-Admin-Oberfläche hoch.")
          
          -- Fügen Sie hier Ihren eigenen Code ein oder laden Sie Dateien über die Web-Admin-Oberfläche hoch
          `;
          
          try {
            // Datei hochladen
            const defaultScriptBlob = new Blob([defaultScript], { type: 'text/plain' });
            const { error: uploadError } = await supabase.storage
              .from("script")
              .upload(`${data.id}/main.lua`, defaultScriptBlob);
            
            if (uploadError) {
              console.log("Fehler beim Hochladen des Standardskripts:", uploadError);
            } else {
              console.log("Standardskript erfolgreich hochgeladen");
            }
          } catch (uploadError) {
            console.log("Fehler beim Hochladen des Standardskripts:", uploadError);
          }
          
          return new Response(defaultScript, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200,
          });
        }
        
        // Wenn keine main.lua Datei gefunden wurde, nach anderen Dateien suchen
        let mainFile = storageFiles.find(file => file.name === "main.lua");
        
        if (!mainFile) {
          const luaFiles = storageFiles.filter(file => file.name.endsWith('.lua'));
          if (luaFiles.length > 0) {
            mainFile = luaFiles[0]; // Erste .lua-Datei verwenden
          } else if (storageFiles.length > 0) {
            mainFile = storageFiles[0]; // Irgendeine Datei verwenden
          }
        }
        
        if (!mainFile) {
          console.log("Keine Skriptdateien gefunden, obwohl das Verzeichnis nicht leer ist");
          
          // Standard-Skript erzeugen
          const defaultScript = `
          -- ForteX Framework Skript
          -- Generiert für Lizenz ${licenseKey}
          
          print("^2ForteX Framework^0: Skript erfolgreich geladen!")
          print("^2ForteX Framework^0: Keine Lua-Dateien gefunden. Bitte laden Sie Lua-Dateien über die Web-Admin-Oberfläche hoch.")
          
          -- Verzeichnisinhalt:
          ${storageFiles.map(file => `-- * ${file.name}`).join('\n')}
          `;
          
          return new Response(defaultScript, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200,
          });
        }
      
        try {
          // Skript-Datei herunterladen
          const { data: fileData, error: fileError } = await supabase.storage
            .from("script")
            .download(`${data.id}/${mainFile.name}`);
          
          if (fileError) {
            console.log("Fehler beim Herunterladen der Skriptdatei:", fileError);
            return new Response(JSON.stringify({ 
              error: "Fehler beim Herunterladen der Skriptdatei",
              debug: {
                file_name: mainFile.name,
                license_id: data.id,
                error_message: fileError.message
              }
            }), {
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
        } catch (downloadError) {
          console.log("Unerwarteter Fehler beim Herunterladen der Datei:", downloadError);
          
          // Auch bei Fehler eine gültige Lua-Antwort senden
          return new Response(`
          -- ForteX Framework - Fehler beim Herunterladen der Datei
          -- Datei: ${mainFile.name}
          -- Fehler: ${downloadError.message}
          
          print("^3ForteX Framework^0: Fehler beim Laden der Datei '${mainFile.name}'")
          print("^3ForteX Framework^0: " .. "${downloadError.message}")
          `, {
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
            status: 200,
          });
        }
      } catch (error) {
        console.log("Unerwarteter Fehler bei der Dateiabfrage:", error);
        
        // Standardskript erzeugen bei unerwartetem Fehler
        const defaultScript = `
        -- ForteX Framework Skript (Fehler-Fallback)
        -- Generiert für Lizenz ${licenseKey}
        
        print("^3ForteX Framework^0: Unerwarteter Fehler beim Laden der Dateien")
        print("^2ForteX Framework^0: System läuft trotzdem im Basismodus")
        
        -- Fügen Sie hier Ihren eigenen Code ein oder laden Sie Dateien über die Web-Admin-Oberfläche hoch
        `;
        
        return new Response(defaultScript, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
          status: 200,
        });
      }
    }
    
    // Wenn kein Datei-Upload, dann das Skript aus der Datenbank senden
    if (!data.script_file) {
      // Wenn kein Skript in der Datenbank, ein Standardskript senden
      const defaultScript = `
      -- ForteX Framework Skript
      -- Generiert für Lizenz ${licenseKey}
      
      print("^2ForteX Framework^0: Skript erfolgreich geladen!")
      
      -- Fügen Sie hier Ihren eigenen Code ein oder laden Sie ein Skript über die Web-Admin-Oberfläche hoch
      `;
      
      console.log("Kein Skript in der Datenbank gefunden, sende Standardskript");
      return new Response(defaultScript, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200,
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
