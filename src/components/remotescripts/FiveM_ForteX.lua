--[[ 
  ForteX Framework - Remote Script Loader
  
  Diese Datei ermöglicht das sichere Laden von autorisierten Skripten über die
  Remote-Script-Verwaltung. Kunden können ihren Lizenzschlüssel in der config.lua eintragen
  und erhalten dann automatisch Zugriff auf die freigegebenen Dateien.
]]

-- ASCII Art für ForteX am Start anzeigen
local function ShowASCIILogo()
    print("^2")  -- Grün für bessere Sichtbarkeit
    print([[
 ######   #####  ######  ####### ####### #     # 
 #       #     # #     #    #    #        #   #  
 #       #     # #     #    #    #         # #   
 ######  #     # #####      #    #####      #   
 #       #     # #   #      #    #         # #    
 #       #     # #    #     #    #        #   #    
 #        #####  #     #    #    ####### #     #    
]])
    print("^0")  -- Zurück zur Standardfarbe
end

-- Farben und Prefixes für Konsolenausgaben definieren
local PREFIX = "^8[^2ForteX^8, ^3INFO^8]^0"
local SUCCESS_PREFIX = "^8[^2ForteX^8, ^2INFO^8]^0"
local ERROR_PREFIX = "^8[^2ForteX^8, ^1INFO^8]^0"
local DEBUG_PREFIX = "^8[^2ForteX^8, ^3INFO DEBUG^8]^0"

-- txAdmin Konsole unterstützen: Direkt beim Skriptladen ausführen
ShowASCIILogo()

-- Konfigurationsdatei laden
local resourceName = GetCurrentResourceName()
local configFile = LoadResourceFile(resourceName, "config.lua")

if not configFile then
    print(ERROR_PREFIX .. " Fehler: config.lua konnte nicht geladen werden^7")
    return
end

-- Config-Datei ausführen
local configFunc, configError = load(configFile)
if not configFunc then
    print(ERROR_PREFIX .. " Fehler beim Laden der config.lua: " .. tostring(configError) .. "^7")
    return
end

-- Config ausführen, um die CONFIG-Tabelle zu erstellen
configFunc()

-- Überprüfen, ob die Konfiguration korrekt ist
if not CONFIG then
    print(ERROR_PREFIX .. " Fehler: CONFIG Tabelle nicht gefunden^7")
    return
end

if not CONFIG.LicenseKey or not CONFIG.ServerKey then
    print(ERROR_PREFIX .. " Fehler: Lizenzschlüssel oder ServerKey nicht konfiguriert^7")
    print(ERROR_PREFIX .. " Bitte geben Sie gültige Werte in config.lua ein^7")
    return
end

-- Ausgabe der Konfigurationswerte mit Formatierung, um Leerzeichen zu erkennen
print(SUCCESS_PREFIX .. " Konfiguration geladen:")
print(SUCCESS_PREFIX .. " Lizenzschlüssel = '" .. CONFIG.LicenseKey .. "'")
print(SUCCESS_PREFIX .. " Server-Key = '" .. CONFIG.ServerKey .. "'")
print(SUCCESS_PREFIX .. " Debug-Modus = " .. tostring(CONFIG.Debug))

if not CONFIG.ServerUrl then
    CONFIG.ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script"
    print(DEBUG_PREFIX .. " Warnung: ServerUrl nicht konfiguriert, verwende Standard-URL^7")
end

print(SUCCESS_PREFIX .. " Server-URL = " .. CONFIG.ServerUrl)

-- Hilfsfunktion für Base64-Encoding
local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function base64encode(data)
    return ((data:gsub('.', function(x) 
        local r,b='',x:byte()
        for i=8,1,-1 do r=r..(b%2^i-b%2^(i-1)>0 and '1' or '0') end
        return r;
    end)..'0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
        if (#x < 6) then return '' end
        local c=0
        for i=1,6 do c=c+(x:sub(i,i)=='1' and 2^(6-i) or 0) end
        return b:sub(c+1,c+1)
    end)..({ '', '==', '=' })[#data%3+1])
end

-- Hilfsfunktion zur Skript-Validierung
function ValidateScript(scriptData)
    if not scriptData or scriptData == "" then
        return false, "Leeres Skript empfangen"
    end
    
    -- Prüfe auf HTML-Antwort (Fehlerfall)
    if scriptData:match("^%s*<!doctype") or scriptData:match("^%s*<html") then
        return false, "HTML-Antwort erhalten statt Lua-Code. Überprüfen Sie die ServerUrl in der Konfiguration."
    end
    
    return true, scriptData
end

-- Debug-Funktion für Antwortinhalte
function DebugResponse(statusCode, responseData, responseHeaders)
    if CONFIG.Debug then
        print(DEBUG_PREFIX .. " Status Code: " .. tostring(statusCode) .. "^7")
        
        if responseData then
            local previewLength = 100
            local preview = responseData:sub(1, previewLength)
            print(DEBUG_PREFIX .. " Antwortdaten (ersten " .. previewLength .. " Zeichen): " .. preview .. "^7")
            
            -- Prüfe auf bekannte Antwortprobleme
            if preview:match("<!doctype") or preview:match("<html") then
                print(ERROR_PREFIX .. " Die Antwort enthält HTML anstatt Lua-Code. Dies deutet auf ein Verbindungs- oder Konfigurationsproblem hin.^7")
                print(ERROR_PREFIX .. " Überprüfen Sie die ServerUrl in config.lua und stellen Sie sicher, dass sie direkt auf die Edge Function zeigt.^7")
            end
            
            -- Prüfe auf JSON-Antwort (wahrscheinlich ein Fehler)
            if preview:match("^%s*{") then
                local jsonData = json.decode(responseData)
                if jsonData and jsonData.error then
                    print(ERROR_PREFIX .. " Fehler vom Server erhalten: " .. tostring(jsonData.error) .. "^7")
                    
                    -- Spezielle Behandlung für IP-Fehler
                    if jsonData.error == "IP-Adressüberprüfung fehlgeschlagen" then
                        print(ERROR_PREFIX .. " Die Server-IP stimmt nicht mit der autorisierten IP überein.^7")
                        if jsonData.debug and jsonData.debug.expected_ip and jsonData.debug.client_ip then
                            print(ERROR_PREFIX .. " Erwartete IP: " .. jsonData.debug.expected_ip .. "^7")
                            print(ERROR_PREFIX .. " Ihre IP: " .. jsonData.debug.client_ip .. "^7")
                            print(ERROR_PREFIX .. " Bitte aktualisieren Sie die Server-IP in der Web-Admin-Oberfläche oder verwenden Sie '*' für alle IPs.^7")
                        end
                    end
                    
                    -- Debug-Informationen anzeigen, wenn vorhanden
                    if jsonData.debug then
                        print(DEBUG_PREFIX .. " Debug-Informationen: ")
                        for k, v in pairs(jsonData.debug) do
                            if type(v) == "table" then
                                print("  " .. k .. ": ")
                                for subk, subv in pairs(v) do
                                    print("    " .. subk .. ": " .. tostring(subv))
                                end
                            else
                                print("  " .. k .. ": " .. tostring(v))
                            end
                        end
                    end
                end
            end
        else
            print(DEBUG_PREFIX .. " Keine Antwortdaten erhalten^7")
        end
        
        if responseHeaders then
            print(DEBUG_PREFIX .. " Response Headers: ")
            for k, v in pairs(responseHeaders) do
                print("  " .. k .. ": " .. v)
            end
        end
    end
end

-- Funktion zur direkten Überprüfung der Lizenz in der Datenbank
function VerifyLicenseWithDatabase(licenseKey, serverKey, callback)
    local verificationUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/verify-license"
    
    print(DEBUG_PREFIX .. " Überprüfe Lizenz direkt in der Datenbank: " .. licenseKey .. " / " .. serverKey .. "^7")
    
    -- Erstelle einen Basic-Auth Header für die Authentifizierung
    local authHeader = "Basic " .. base64encode(licenseKey .. ":" .. serverKey)
    
    PerformHttpRequest(verificationUrl, function(statusCode, responseData, responseHeaders)
        if CONFIG.Debug then
            DebugResponse(statusCode, responseData, responseHeaders)
        end
        
        if statusCode ~= 200 then
            print(ERROR_PREFIX .. " Fehler bei der Datenbankabfrage: " .. tostring(statusCode) .. "^7")
            
            -- Prüfen auf IP-Beschränkungsfehler (403)
            if statusCode == 403 then
                local jsonData = json.decode(responseData)
                if jsonData and jsonData.error == "IP-Adressüberprüfung fehlgeschlagen" then
                    print(ERROR_PREFIX .. " Zugriff verweigert - Ihre Server-IP stimmt nicht mit der autorisierten IP überein^7")
                    if jsonData.debug and jsonData.debug.expected_ip and jsonData.debug.client_ip then
                        print(ERROR_PREFIX .. " Erwartete IP: " .. jsonData.debug.expected_ip .. "^7")
                        print(ERROR_PREFIX .. " Ihre IP: " .. jsonData.debug.client_ip .. "^7")
                    end
                    print(ERROR_PREFIX .. " Bitte aktualisieren Sie die IP-Beschränkung in der Web-Admin-Oberfläche^7")
                    if callback then callback(false, "IP-Beschränkung: Nicht autorisierte IP-Adresse") end
                    return
                end
            end
            
            if callback then callback(false, "Datenbankfehler: " .. tostring(statusCode)) end
            return
        end
        
        local result = json.decode(responseData)
        if not result then
            print(ERROR_PREFIX .. " Fehler beim Dekodieren der Server-Antwort^7")
            if callback then callback(false, "Ungültiges Antwortformat") end
            return
        end
        
        if result.valid then
            print(SUCCESS_PREFIX .. " Lizenz erfolgreich in der Datenbank validiert!^7")
            if result.server_ip then
                print(SUCCESS_PREFIX .. " Server-IP: " .. (result.server_ip == "*" and "Alle IPs erlaubt" or result.server_ip) .. "^7")
            end
            if callback then callback(true, result) end
        else
            print(ERROR_PREFIX .. " Lizenz in der Datenbank nicht gültig oder nicht gefunden^7")
            if callback then callback(false, "Ungültige Lizenz") end
        }
    end, "POST", json.encode({
        license_key = licenseKey,
        server_key = serverKey
    }), {
        ["Content-Type"] = "application/json",
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["X-License-Key"] = licenseKey,
        ["X-Server-Key"] = serverKey,
        ["Authorization"] = authHeader
    })
}

-- Funktion zum Laden und Ausführen des Remote-Skripts
function LoadRemoteScript()
    print(PREFIX .. " Lade Remote-Skript...^7")
    print(PREFIX .. " Verwende Lizenzschlüssel: '" .. CONFIG.LicenseKey .. "' und Server-Key: '" .. CONFIG.ServerKey .. "'")
    print(PREFIX .. " Server-URL: " .. CONFIG.ServerUrl .. "^7")
    
    -- Zuerst die Lizenz in der Datenbank überprüfen
    VerifyLicenseWithDatabase(CONFIG.LicenseKey, CONFIG.ServerKey, function(isValid, result)
        if not isValid then
            print(ERROR_PREFIX .. " Lizenzprüfung in der Datenbank fehlgeschlagen - versuche direkt das Skript zu laden^7")
            LoadScriptDirectly() -- Trotzdem versuchen, das Skript direkt zu laden
            return
        end
        
        -- Nach erfolgreicher Datenbankprüfung das Skript laden
        print(SUCCESS_PREFIX .. " Lizenz in der Datenbank bestätigt, lade Skript...^7")
        LoadScriptDirectly()
    end)
end

-- Funktion zum direkten Laden des Skripts
function LoadScriptDirectly()
    -- Die Keys einmal trimmen, um Leerzeichen zu entfernen
    local licenseKey = CONFIG.LicenseKey:gsub("^%s*(.-)%s*$", "%1")
    local serverKey = CONFIG.ServerKey:gsub("^%s*(.-)%s*$", "%1")
    
    print(DEBUG_PREFIX .. " Verwende bereinigte Keys: LicenseKey='" .. licenseKey .. "', ServerKey='" .. serverKey .. "'")
    
    -- Erstelle einen Basic-Auth Header für die Authentifizierung
    local authHeader = "Basic " .. base64encode(licenseKey .. ":" .. serverKey)
    
    -- Trage alle wichtigen Header und vor allem den Authorization-Header ein
    local headers = {
        ["Content-Type"] = "application/json",
        ["X-License-Key"] = licenseKey,
        ["X-Server-Key"] = serverKey,
        ["Authorization"] = authHeader,
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["Accept"] = "text/plain"
    }
    
    -- Debug: Zeige alle verwendeten Header an
    if CONFIG.Debug then
        print(DEBUG_PREFIX .. " Sende folgende Header:")
        for k, v in pairs(headers) do
            -- Wenn es ein Authorization-Header ist, zeige nur den Anfang an
            if k == "Authorization" then
                print("  " .. k .. ": " .. v:sub(1, 15) .. "...")
            else
                print("  " .. k .. ": " .. v)
            end
        end
    end
    
    local requestBody = json.encode({
        license_key = licenseKey,
        server_key = serverKey
    })
    
    PerformHttpRequest(CONFIG.ServerUrl, function(statusCode, responseData, responseHeaders)
        -- Debug-Informationen ausgeben
        DebugResponse(statusCode, responseData, responseHeaders)
        
        if statusCode ~= 200 then
            print(ERROR_PREFIX .. " Fehler beim Abrufen des Skripts: " .. tostring(statusCode) .. "^7")
            if statusCode == 401 then
                print(ERROR_PREFIX .. " Authentifizierungsfehler - überprüfen Sie Ihren Lizenzschlüssel und Server-Key^7")
                print(ERROR_PREFIX .. " Ihre Config-Werte: LicenseKey='" .. licenseKey .. "', ServerKey='" .. serverKey .. "'")
                print(ERROR_PREFIX .. " Prüfe ob die Authorization-Header korrekt gesendet wurden^7")
                
                -- Versuche erneut mit etwas Verzögerung und explizitem POST-Body
                Wait(1000)
                print(PREFIX .. " Versuche erneut mit explizitem POST-Body...^7")
                
                PerformHttpRequest(CONFIG.ServerUrl, function(retryStatusCode, retryResponseData, retryResponseHeaders)
                    DebugResponse(retryStatusCode, retryResponseData, retryResponseHeaders)
                    
                    if retryStatusCode == 200 then
                        print(SUCCESS_PREFIX .. " Zweiter Versuch erfolgreich!^7")
                        -- Skript validieren und ausführen
                        local isValid, scriptOrError = ValidateScript(retryResponseData)
                        if isValid then
                            -- Skript ausführen
                            local func, err = load(scriptOrError)
                            if func then
                                local success, error = pcall(func)
                                if success then
                                    print(SUCCESS_PREFIX .. " Skript erfolgreich geladen und ausgeführt^7")
                                else
                                    print(ERROR_PREFIX .. " Fehler beim Ausführen des Skripts: " .. tostring(error) .. "^7")
                                end
                            else
                                print(ERROR_PREFIX .. " Fehler beim Kompilieren des Skripts: " .. tostring(err) .. "^7")
                            end
                        else
                            print(ERROR_PREFIX .. " Skript-Validierung fehlgeschlagen: " .. scriptOrError .. "^7")
                        end
                    else
                        print(ERROR_PREFIX .. " Auch zweiter Versuch fehlgeschlagen: " .. tostring(retryStatusCode) .. "^7")
                        
                        -- Versuche einen dritten Versuch mit einer anderen Methode
                        print(PREFIX .. " Versuche dritten Versuch mit URL-Parameter...^7")
                        
                        local urlWithParams = CONFIG.ServerUrl .. "?license_key=" .. licenseKey .. "&server_key=" .. serverKey
                        PerformHttpRequest(urlWithParams, function(thirdStatusCode, thirdResponseData, thirdResponseHeaders)
                            DebugResponse(thirdStatusCode, thirdResponseData, thirdResponseHeaders)
                            
                            if thirdStatusCode == 200 then
                                print(SUCCESS_PREFIX .. " Dritter Versuch erfolgreich!^7")
                                -- Verarbeite die Antwort...
                                local isValid, scriptOrError = ValidateScript(thirdResponseData)
                                if isValid then
                                    -- Skript ausführen
                                    local func, err = load(scriptOrError)
                                    if func then
                                        local success, error = pcall(func)
                                        if success then
                                            print(SUCCESS_PREFIX .. " Skript erfolgreich geladen und ausgeführt^7")
                                        else
                                            print(ERROR_PREFIX .. " Fehler beim Ausführen des Skripts: " .. tostring(error) .. "^7")
                                        end
                                    else
                                        print(ERROR_PREFIX .. " Fehler beim Kompilieren des Skripts: " .. tostring(err) .. "^7")
                                    end
                                else
                                    print(ERROR_PREFIX .. " Skript-Validierung fehlgeschlagen: " .. scriptOrError .. "^7")
                                end
                            else
                                print(ERROR_PREFIX .. " Alle Versuche fehlgeschlagen. Bitte überprüfen Sie Ihre Lizenzschlüssel und Server-URL.^7")
                            end
                        end, "GET", "", headers)
                    end
                end, "POST", requestBody, headers)
            elseif statusCode == 403 then
                print(ERROR_PREFIX .. " Zugriff verweigert - möglicherweise IP-Beschränkung oder inaktive Lizenz^7")
            elseif statusCode == 404 then
                print(ERROR_PREFIX .. " Skript nicht gefunden^7")
            elseif statusCode == 0 then
                print(ERROR_PREFIX .. " Verbindungsfehler - überprüfen Sie die ServerUrl in der Konfiguration^7")
            elseif statusCode >= 500 then
                print(ERROR_PREFIX .. " Serverfehler - bitte kontaktieren Sie den Support^7")
            end
            return
        end
        
        -- Prüfen ob die Antwort ein JSON-Fehlerobjekt ist
        if responseData:match("^%s*{") then
            local jsonData = json.decode(responseData)
            if jsonData and jsonData.error then
                print(ERROR_PREFIX .. " Serverfehler: " .. tostring(jsonData.error) .. "^7")
                return
            end
        end
        
        print(SUCCESS_PREFIX .. " Skript erfolgreich abgerufen^7")
        
        -- Skript validieren
        local isValid, scriptOrError = ValidateScript(responseData)
        if not isValid then
            print(ERROR_PREFIX .. " Skript-Validierung fehlgeschlagen: " .. scriptOrError .. "^7")
            return
        end
        
        -- Skript ausführen
        print(PREFIX .. " Führe Skript aus...^7")
        local func, err = load(scriptOrError)
        if func then
            local success, error = pcall(func)
            if success then
                print(SUCCESS_PREFIX .. " Skript erfolgreich geladen und ausgeführt^7")
            else
                print(ERROR_PREFIX .. " Fehler beim Ausführen des Skripts: " .. tostring(error) .. "^7")
            end
        else
            print(ERROR_PREFIX .. " Fehler beim Kompilieren des Skripts: " .. tostring(err) .. "^7")
        end
    end, "POST", requestBody, headers)
end

-- ForteX API für andere Ressourcen
ForteX = {}

-- Funktion zum Laden einer bestimmten Datei
ForteX.LoadFile = function(filePath, callback)
    -- Zuerst die Lizenz in der Datenbank überprüfen
    VerifyLicenseWithDatabase(CONFIG.LicenseKey, CONFIG.ServerKey, function(isValid, result)
        if not isValid then
            print(ERROR_PREFIX .. " Lizenzprüfung in der Datenbank fehlgeschlagen - Datei wird nicht geladen^7")
            if callback then callback(false, "Ungültige Lizenz") end
            return
        end
        
        local url = CONFIG.ServerUrl .. "/" .. filePath
        local authHeader = "Basic " .. base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
        
        PerformHttpRequest(url, function(statusCode, responseData, responseHeaders)
            if CONFIG.Debug then
                DebugResponse(statusCode, responseData, responseHeaders)
            end
            
            if statusCode ~= 200 then
                print(ERROR_PREFIX .. " Fehler beim Abrufen der Datei: " .. tostring(statusCode) .. "^7")
                if callback then callback(false, "Fehler: " .. tostring(statusCode)) end
                return
            end
            
            if callback then callback(true, responseData) end
        end, "GET", "", {
            ["X-License-Key"] = CONFIG.LicenseKey,
            ["X-Server-Key"] = CONFIG.ServerKey,
            ["Authorization"] = authHeader,
            ["User-Agent"] = "FiveM-ForteX/1.0",
            ["Accept"] = "text/plain"
        })
    end)
end

-- Beispielfunktion zum Ausführen einer bestimmten Datei
ForteX.ExecuteFile = function(filePath, callback)
    ForteX.LoadFile(filePath, function(success, data)
        if not success then
            if callback then callback(false, data) end
            return
        end
        
        local func, err = load(data)
        if not func then
            print(ERROR_PREFIX .. " Fehler beim Kompilieren der Datei: " .. tostring(err) .. "^7")
            if callback then callback(false, "Kompilierfehler: " .. tostring(err)) end
            return
        end
        
        local success, error = pcall(func)
        if not success then
            print(ERROR_PREFIX .. " Fehler beim Ausführen der Datei: " .. tostring(error) .. "^7")
            if callback then callback(false, "Ausführungsfehler: " .. tostring(error)) end
            return
        end
        
        if callback then callback(true, "Datei erfolgreich ausgeführt") end
    end)
end

-- Befehl zum manuellen Neuladen des Skripts
RegisterCommand('fortex_reload', function(source, args, rawCommand)
    if source == 0 then -- Nur von der Konsole aus
        print(PREFIX .. " Manuelles Neuladen des Remote-Skripts...^7")
        -- Logo beim Reload anzeigen
        ShowASCIILogo()
        LoadRemoteScript()
    end
end, true)

-- Skript bei Ressourcenstart laden
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        print(SUCCESS_PREFIX .. " Ressource gestartet^7")
        -- Logo direkt beim Resource-Start anzeigen
        ShowASCIILogo()
        Wait(1000)
        LoadRemoteScript()
    end
end)

print(SUCCESS_PREFIX .. " Framework initialisiert^7")
