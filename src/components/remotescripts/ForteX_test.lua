
--[[
  ForteX Test Script
  
  Dieses Skript demonstriert die Verwendung der API-Keys und wie sie zur Authentifizierung
  bei der ForteX API verwendet werden.
]]

-- ASCII Logo in Rot anzeigen für txAdmin
local function ShowLogo()
    print("^1")  -- Rot für txAdmin Konsole
    print([[
 ______         _       __  __
|  ____|       | |     \ \/ /
| |__ ___  _ __| |_ ___ \  / 
|  __/ _ \| '__| __/ _ \/  \
| | | (_) | |  | ||  __/  /
|_|  \___/|_|   \__\___| /  
                         
    ]])
    print("^0")  -- Zurück zur Standardfarbe
end

-- Logo beim Start anzeigen
ShowLogo()

-- Konfiguration einbinden
local resourceName = GetCurrentResourceName()
local configFile = LoadResourceFile(resourceName, "config.lua")

if not configFile then
    print("^1Fehler: config.lua nicht gefunden^0")
    return
end

-- Config ausführen
local configFunc, configError = load(configFile)
if not configFunc then
    print("^1Fehler beim Laden der Konfiguration: " .. tostring(configError) .. "^0")
    return
end

configFunc()

-- Überprüfen der Konfiguration
if not CONFIG then
    print("^1Fehler: CONFIG nicht gefunden^0")
    return
end

print("^2ForteX Test Script geladen^0")
print("^3License Key: ^0" .. CONFIG.LicenseKey)
print("^3Server Key: ^0" .. CONFIG.ServerKey)
print("^3Server URL: ^0" .. CONFIG.ServerUrl)

-- Base64-Encoding Funktion
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

-- JSON-Parsing Funktion
local function DecodeJSON(jsonString)
    if not jsonString or jsonString == "" then
        return nil, "Empty JSON string"
    end
    
    -- Verwenden des nativen FiveM JSON-Decoders
    local success, result = pcall(function()
        return json.decode(jsonString)
    end)
    
    if not success then
        return nil, "JSON decoding error: " .. tostring(result)
    end
    
    return result, nil
end

-- API-Anfrage Beispiel
local function TestApiRequest()
    print("^3Teste API-Verbindung...^0")
    
    -- Basis-Autorisation Header erstellen
    local auth = base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
    
    -- Zuerst die Lizenz verifizieren
    PerformHttpRequest(CONFIG.ServerUrl, function(statusCode, responseData, responseHeaders)
        if statusCode ~= 200 then
            print("^1API-Test fehlgeschlagen: Status " .. tostring(statusCode) .. "^0")
            if statusCode == 401 then
                print("^1Authentifizierungsfehler - überprüfen Sie Ihren Lizenzschlüssel und Server-Key^0")
                print("^3Hinweis: Stellen Sie sicher, dass die Test-Keys in der Datenbank eingetragen sind.^0")
                print("^3Für Test-Zwecke: LicenseKey = ABCD-EFGH-IJKL-MNOP, ServerKey = 123456789ABC^0")
            end
            return
        end
        
        -- Versuche die JSON-Antwort zu parsen
        local jsonData, jsonError = DecodeJSON(responseData)
        
        if jsonError then
            print("^1JSON-Parsing fehlgeschlagen: " .. jsonError .. "^0")
            print("^3Rohe Antwort: ^0" .. responseData:sub(1, 100) .. "...")
            return
        end
        
        if jsonData.valid then
            print("^2Lizenz ist gültig!^0")
            
            -- Zeige weitere Informationen an, wenn verfügbar
            if jsonData.script_name then
                print("^3Script-Name: ^0" .. jsonData.script_name)
            end
            
            if jsonData.script_file then
                print("^3Script-Datei: ^0" .. jsonData.script_file)
            end
            
            if jsonData.server_ip then
                print("^3Server-IP: ^0" .. (jsonData.server_ip == "*" and "Alle IPs erlaubt" or jsonData.server_ip))
            end
            
            -- Jetzt testen wir das Laden des Skripts
            print("^2Jetzt versuche ich das Skript zu laden...^0")
            
            -- Jetzt die eigentliche Skriptdatei laden
            local scriptUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script"
            
            PerformHttpRequest(scriptUrl, function(scriptStatusCode, scriptContent, scriptHeaders)
                if scriptStatusCode ~= 200 then
                    print("^1Skript-Ladefehler: Status " .. tostring(scriptStatusCode) .. "^0")
                    return
                end
                
                print("^2Skript erfolgreich geladen!^0")
                print("^3Skript-Inhalt (erste 100 Zeichen): ^0" .. scriptContent:sub(1, 100) .. "...")
                
                -- Prüfen, ob das Skript ausführbar ist
                local func, err = load(scriptContent)
                if func then
                    print("^2Skript ist syntaktisch korrekt und kann ausgeführt werden.^0")
                else
                    print("^1Skript kann nicht kompiliert werden: " .. tostring(err) .. "^0")
                    
                    -- Prüfen, ob es sich um eine JSON-Antwort handelt
                    local errorData, _ = DecodeJSON(scriptContent)
                    if errorData and errorData.error then
                        print("^1Server-Fehler: " .. errorData.error .. "^0")
                    end
                end
            end, "GET", "", {
                ["Authorization"] = "Basic " .. auth,
                ["X-License-Key"] = CONFIG.LicenseKey,
                ["X-Server-Key"] = CONFIG.ServerKey,
                ["User-Agent"] = "FiveM-ForteX-Test/1.0",
                ["Accept"] = "text/plain"
            })
        else
            print("^1Lizenz ist nicht gültig.^0")
            
            if jsonData.error then
                print("^1Fehler: ^0" .. jsonData.error)
            end
        end
    end, "POST", json.encode({
        license_key = CONFIG.LicenseKey,
        server_key = CONFIG.ServerKey
    }), {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Basic " .. auth,
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-ForteX-Test/1.0",
        ["Accept"] = "application/json"
    })
end

-- Warte 2 Sekunden und führe den API-Test aus
Citizen.CreateThread(function()
    Wait(2000)
    TestApiRequest()
end)

-- Befehle zum Testen
RegisterCommand('fortex_test', function(source, args, rawCommand)
    if source == 0 then -- Nur von der Konsole aus
        ShowLogo()
        TestApiRequest()
    end
end, true)

-- Befehl zum Testen mit den Beispiel-Keys, hilft bei der Fehlersuche
RegisterCommand('fortex_test_keys', function(source, args, rawCommand)
    if source == 0 then
        local originalLicenseKey = CONFIG.LicenseKey
        local originalServerKey = CONFIG.ServerKey
        
        -- Temporär die Test-Keys setzen
        CONFIG.LicenseKey = "ABCD-EFGH-IJKL-MNOP"
        CONFIG.ServerKey = "123456789ABC"
        
        print("^2Test mit Standard-Test-Keys:^0")
        print("^3Test License Key: ^0" .. CONFIG.LicenseKey)
        print("^3Test Server Key: ^0" .. CONFIG.ServerKey)
        
        TestApiRequest()
        
        -- Originalwerte wiederherstellen
        CONFIG.LicenseKey = originalLicenseKey
        CONFIG.ServerKey = originalServerKey
    end
end, true)

print("^2ForteX Test Script ist bereit.^0")
print("^3Verwenden Sie 'fortex_test' zum Testen oder 'fortex_test_keys' für Test mit Standard-Keys.^0")
