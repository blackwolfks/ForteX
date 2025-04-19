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
 #       #     # #    #     #    ####### #     #    
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
    CONFIG.ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/verify-license"
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

-- Hilfsfunktion zur JSON-Dekodierung
local function DecodeJSON(jsonString)
    -- Prüfen ob die Eingabe gültig ist
    if not jsonString or jsonString == "" then
        return nil, "Leerer JSON-String"
    end
    
    -- Wir verwenden das native FiveM JSON-Dekodierungssystem
    local success, result = pcall(function()
        return json.decode(jsonString)
    end)
    
    if not success then
        return nil, "JSON-Dekodierungsfehler: " .. tostring(result)
    end
    
    return result, nil
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
            
            -- Prüfe auf JSON-Antwort
            if preview:match("^%s*{") then
                print(DEBUG_PREFIX .. " Die Antwort enthält JSON, versuche zu dekodieren...^7")
                local jsonData, jsonError = DecodeJSON(responseData)
                
                if jsonError then
                    print(ERROR_PREFIX .. " Fehler beim Dekodieren des JSON: " .. tostring(jsonError) .. "^7")
                elseif jsonData then
                    -- Verarbeite JSON je nach Inhalt
                    if jsonData.error then
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
                    elseif jsonData.valid then
                        print(SUCCESS_PREFIX .. " Lizenz erfolgreich validiert.^7")
                        if jsonData.script_file then
                            print(SUCCESS_PREFIX .. " Script-Datei: " .. tostring(jsonData.script_file) .. "^7")
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
            
            -- Prüfe auf Dateinamen-Header
            if responseHeaders["X-Script-Filename"] then
                print(DEBUG_PREFIX .. " Dateiname aus Header: " .. responseHeaders["X-Script-Filename"] .. "^7")
            end
        end
    end
end

-- Funktion zur direkten Überprüfung der Lizenz in der Datenbank
function VerifyLicenseWithDatabase(licenseKey, serverKey, callback)
    local verificationUrl = CONFIG.ServerUrl
    
    print(DEBUG_PREFIX .. " Überprüfe Lizenz: " .. licenseKey .. " / " .. serverKey .. "^7")
    
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
                local jsonData, jsonError = DecodeJSON(responseData)
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
        
        -- JSON-Antwort parsen
        local result, parseError = DecodeJSON(responseData)
        if parseError or not result then
            print(ERROR_PREFIX .. " Fehler beim Dekodieren der Server-Antwort: " .. tostring(parseError or "Ungültiges Format") .. "^7")
            if callback then callback(false, "Ungültiges Antwortformat") end
            return
        end
        
        if result.valid then
            print(SUCCESS_PREFIX .. " Lizenz erfolgreich in der Datenbank validiert!^7")
            if result.server_ip then
                print(SUCCESS_PREFIX .. " Server-IP: " .. (result.server_ip == "*" and "Alle IPs erlaubt" or result.server_ip) .. "^7")
            end
            
            -- Jetzt den Skript-Endpunkt aufrufen, um das Skript zu laden
            local scriptUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script"
            print(SUCCESS_PREFIX .. " Versuche Skript zu laden von: " .. scriptUrl .. "^7")
            
            PerformHttpRequest(scriptUrl, function(scriptStatusCode, scriptContent, scriptHeaders)
                if scriptStatusCode ~= 200 then
                    print(ERROR_PREFIX .. " Fehler beim Laden des Scripts: " .. tostring(scriptStatusCode) .. "^7")
                    if callback then callback(false, "Script-Ladefehler: " .. tostring(scriptStatusCode)) end
                    return
                end
                
                -- Überprüfen, ob die Antwort Lua-Code oder eine Fehlermeldung ist
                if scriptContent:match("^%s*--") or scriptContent:match("^%s*function") or scriptContent:match("^%s*local") then
                    -- Sieht wie Lua-Code aus
                    print(SUCCESS_PREFIX .. " Script erfolgreich geladen. Führe aus...^7")
                    
                    -- Extrahiere den Skriptnamen aus dem Content (falls vorhanden) oder verwende den Dateinamen aus dem Header
                    local scriptName = "main.lua"
                    
                    -- Versuche zuerst, den Dateinamen aus dem Header zu extrahieren
                    if scriptHeaders and scriptHeaders["X-Script-Filename"] then
                        scriptName = scriptHeaders["X-Script-Filename"]
                    else
                        -- Fallback: Versuche den Namen aus dem Skript-Kommentar zu extrahieren
                        local nameMatch = scriptContent:match("%-%-%s*@name%s*([^\r\n]+)")
                        if nameMatch then
                            scriptName = nameMatch
                        end
                    end
                    
                    print(SUCCESS_PREFIX .. " Führe Datei aus: ^3" .. scriptName .. "^7")
                    
                    -- Code im txAdmin anzeigen
                    print("^2=== Dateiinhalt von " .. scriptName .. " ===^7")
                    print("^3" .. scriptContent .. "^7")
                    print("^2=== Ende der Datei ===^7")
                    
                    if CONFIG.Debug then
                        print(DEBUG_PREFIX .. " Skript-Inhalt (ersten 100 Zeichen): " .. scriptContent:sub(1, 100))
                    end
                    if callback then callback(true, result, scriptContent, scriptName) end
                else
                    -- Versuche es als JSON zu parsen (könnte eine Fehlermeldung sein)
                    local errorData, _ = DecodeJSON(scriptContent)
                    if errorData and errorData.error then
                        print(ERROR_PREFIX .. " Server-Fehler: " .. errorData.error .. "^7")
                        if callback then callback(false, errorData.error) end
                    else
                        -- Wenn es kein JSON ist, geben wir den Inhalt als Fehler zurück
                        print(ERROR_PREFIX .. " Unerwartete Antwort vom Script-Server. Inhalt: " .. scriptContent:sub(1, 100) .. "^7")
                        if callback then callback(false, "Unerwartetes Antwortformat vom Script-Server") end
                    end
                end
            end, "GET", "", {
                ["Authorization"] = authHeader,
                ["X-License-Key"] = licenseKey,
                ["X-Server-Key"] = serverKey,
                ["User-Agent"] = "FiveM-ForteX/1.0",
                ["Accept"] = "application/json",
                ["Content-Type"] = "application/json"
            })
        else
            print(ERROR_PREFIX .. " Lizenz in der Datenbank nicht gültig oder nicht gefunden^7")
            if result.error then
                print(ERROR_PREFIX .. " Server-Fehler: " .. tostring(result.error) .. "^7")
            end
            if callback then callback(false, "Ungültige Lizenz") end
        end
    end, "POST", json.encode({
        license_key = licenseKey,
        server_key = serverKey
    }), {
        ["Content-Type"] = "application/json",  -- Explicitly set to application/json
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["X-License-Key"] = licenseKey,
        ["X-Server-Key"] = serverKey,
        ["Authorization"] = authHeader,
        ["Accept"] = "application/json"
    })
end

-- Funktion zum Laden und Ausführen des Remote-Skripts
function LoadRemoteScript()
    print(PREFIX .. " Lade Remote-Skript...^7")
    print(PREFIX .. " Verwende Lizenzschlüssel: '" .. CONFIG.LicenseKey .. "' und Server-Key: '" .. CONFIG.ServerKey .. "'")
    print(PREFIX .. " Server-URL: " .. CONFIG.ServerUrl .. "^7")
    
    -- Zuerst die Lizenz in der Datenbank überprüfen
    VerifyLicenseWithDatabase(CONFIG.LicenseKey, CONFIG.ServerKey, function(isValid, result, scriptContent, scriptFilename)
        if not isValid then
            print(ERROR_PREFIX .. " Lizenzprüfung fehlgeschlagen^7")
            return
        end
        
        -- Wenn ein Script zurückgegeben wurde, führe es aus
        if scriptContent then
            -- Skript validieren
            local isValid, scriptOrError = ValidateScript(scriptContent)
            if not isValid then
                print(ERROR_PREFIX .. " Skript-Validierung fehlgeschlagen: " .. scriptOrError .. "^7")
                return
            end
            
            -- Skript ausführen
            print(PREFIX .. " Führe Skript aus: ^3" .. (scriptFilename or "main.lua") .. "^7")
            local func, err = load(scriptContent)
            if func then
                local success, error = pcall(func)
                if success then
                    print(SUCCESS_PREFIX .. " Skript ^3" .. (scriptFilename or "main.lua") .. "^0 erfolgreich geladen und ausgeführt^7")
                else
                    print(ERROR_PREFIX .. " Fehler beim Ausführen des Skripts: " .. tostring(error) .. "^7")
                end
            else
                print(ERROR_PREFIX .. " Fehler beim Kompilieren des Skripts: " .. tostring(err) .. "^7")
            end
        else
            print(SUCCESS_PREFIX .. " Lizenz validiert, aber kein Script zum Ausführen gefunden.^7")
        end
    end)
end

-- ForteX API für andere Ressourcen
ForteX = {}

-- Funktion zum Anzeigen einer Liste aller verfügbaren Lua-Dateien
ForteX.ListAvailableFiles = function(callback)
    -- Zuerst die Lizenz überprüfen
    VerifyLicenseWithDatabase(CONFIG.LicenseKey, CONFIG.ServerKey, function(isValid, result)
        if not isValid then
            print(ERROR_PREFIX .. " Lizenzprüfung fehlgeschlagen - Dateiliste wird nicht abgerufen^7")
            if callback then callback(false, "Ungültige Lizenz") end
            return
        end
        
        -- Dateien auflisten
        local scriptUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script/list"
        local authHeader = "Basic " .. base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
        
        print(SUCCESS_PREFIX .. " Rufe verfügbare Dateien ab...^7")
        
        PerformHttpRequest(scriptUrl, function(statusCode, responseData, responseHeaders)
            if CONFIG.Debug then
                DebugResponse(statusCode, responseData, responseHeaders)
            end
            
            if statusCode ~= 200 then
                print(ERROR_PREFIX .. " Fehler beim Abrufen der Dateiliste: " .. tostring(statusCode) .. "^7")
                if callback then callback(false, "Fehler: " .. tostring(statusCode)) end
                return
            end
            
            local fileList, parseError = DecodeJSON(responseData)
            if parseError or not fileList then
                print(ERROR_PREFIX .. " Fehler beim Dekodieren der Dateiliste: " .. tostring(parseError) .. "^7")
                if callback then callback(false, "Ungültiges Antwortformat") end
                return
            end
            
            -- Dateien in der Konsole anzeigen
            print("^2Verfügbare Lua-Dateien:^7")
            print("^3================================^7")
            local luaFileCount = 0
            for _, file in ipairs(fileList) do
                if file.name:match("%.lua$") then
                    luaFileCount = luaFileCount + 1
                    print("^2[" .. luaFileCount .. "]^7 ^3" .. file.name .. "^7")
                    if CONFIG.Debug and file.size then
                        print("    ^8Größe: " .. tostring(file.size) .. " bytes^7")
                    end
                end
            end
            
            if luaFileCount == 0 then
                print("^1Keine Lua-Dateien gefunden.^7")
            end
            
            print("^3================================^7")
            print("^2Gesamt Lua-Dateien:^7 ^3" .. luaFileCount .. "^7")
            
            if callback then callback(true, fileList) end
        end, "GET", "", {
            ["Content-Type"] = "application/json",
            ["X-License-Key"] = CONFIG.LicenseKey,
            ["X-Server-Key"] = CONFIG.ServerKey,
            ["Authorization"] = authHeader,
            ["User-Agent"] = "FiveM-ForteX/1.0",
            ["Accept"] = "application/json"
        })
    end)
end

-- Befehl zum Anzeigen der verfügbaren Dateien hinzufügen
RegisterCommand('fortex_files', function(source, args, rawCommand)
    if source == 0 then -- Nur von der Konsole aus
        print(PREFIX .. " Rufe verfügbare Dateien ab...^7")
        ForteX.ListAvailableFiles()
    end
end, true)

-- Funktion zum Laden einer bestimmten Datei
ForteX.LoadFile = function(filePath, callback)
    -- Zuerst die Lizenz in der Datenbank überprüfen
    VerifyLicenseWithDatabase(CONFIG.LicenseKey, CONFIG.ServerKey, function(isValid, result)
        if not isValid then
            print(ERROR_PREFIX .. " Lizenzprüfung in der Datenbank fehlgeschlagen - Datei wird nicht geladen^7")
            if callback then callback(false, "Ungültige Lizenz") end
            return
        end
        
        -- Jetzt die eigentliche Datei laden
        local scriptUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script/" .. filePath
        local authHeader = "Basic " .. base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
        
        print(SUCCESS_PREFIX .. " Versuche Datei zu laden: " .. scriptUrl .. "^7")
        
        PerformHttpRequest(scriptUrl, function(statusCode, responseData, responseHeaders)
            if CONFIG.Debug then
                DebugResponse(statusCode, responseData, responseHeaders)
            end
            
            if statusCode ~= 200 then
                print(ERROR_PREFIX .. " Fehler beim Abrufen der Datei: " .. tostring(statusCode) .. "^7")
                if callback then callback(false, "Fehler: " .. tostring(statusCode)) end
                return
            end
            
            -- Den Dateinamen aus den Header-Informationen auslesen
            local actualFilename = filePath
            if responseHeaders and responseHeaders["X-Script-Filename"] then
                actualFilename = responseHeaders["X-Script-Filename"]
                print(SUCCESS_PREFIX .. " Tatsächlicher Dateiname: ^3" .. actualFilename .. "^7")
            end
            
            -- Code im txAdmin anzeigen
            print("^2=== Dateiinhalt von " .. actualFilename .. " ===^7")
            print("^3" .. responseData .. "^7")
            print("^2=== Ende der Datei ===^7")
            
            print(SUCCESS_PREFIX .. " Datei erfolgreich geladen: ^3" .. actualFilename .. "^7")
            if callback then callback(true, responseData, actualFilename) end
        end, "GET", "", {
            ["Content-Type"] = "application/json",
            ["X-License-Key"] = CONFIG.LicenseKey,
            ["X-Server-Key"] = CONFIG.ServerKey,
            ["Authorization"] = authHeader,
            ["User-Agent"] = "FiveM-ForteX/1.0",
            ["X-Requested-Filename"] = filePath:match("[^/]+$") or filePath, -- Extrahiert den Dateinamen ohne Pfad
            ["Accept"] = "application/json"
        })
end

-- Beispielfunktion zum Ausführen einer bestimmten Datei
ForteX.ExecuteFile = function(filePath, callback)
    ForteX.LoadFile(filePath, function(success, data, actualFilename)
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
        
        -- Den tatsächlichen Dateinamen verwenden oder aus dem Content extrahieren
        local scriptName = actualFilename or filePath
        if not actualFilename then
            local nameMatch = data:match("%-%-%s*@name%s*([^\r\n]+)")
            if nameMatch then
                scriptName = nameMatch
            end
        end
        
        print(SUCCESS_PREFIX .. " Führe Datei aus: ^3" .. scriptName .. "^7")
        
        -- Code im txAdmin anzeigen vor der Ausführung
        print("^2=== Ausführe Dateiinhalt von " .. scriptName .. " ===^7")
        print("^3" .. data .. "^7")
        print("^2=== Ende der Datei ===^7")
        
        local success, error = pcall(func)
        if not success then
            print(ERROR_PREFIX .. " Fehler beim Ausführen der Datei: " .. tostring(error) .. "^7")
            if callback then callback(false, "Ausführungsfehler: " .. tostring(error)) end
            return
        end
        
        print(SUCCESS_PREFIX .. " Datei ^3" .. scriptName .. "^0 erfolgreich ausgeführt^7")
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

-- Befehl zum Anzeigen der aktuellen Konfiguration
RegisterCommand('fortex_config', function(source, args, rawCommand)
    if source == 0 then
        print("^2Aktuelle ForteX Konfiguration:^0")
        print("^3License Key: ^0" .. CONFIG.LicenseKey)
        print("^3Server Key: ^0" .. CONFIG.ServerKey)
        print("^3Server URL: ^0" .. CONFIG.ServerUrl)
        print("^3Debug Modus: ^0" .. tostring(CONFIG.Debug or false))
        print("^3Auto-Update: ^0" .. tostring(CONFIG.AutoUpdate or false))
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
