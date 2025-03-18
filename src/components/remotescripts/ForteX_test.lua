
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
local configFile = LoadResourceFile(resourceName, "ForteX_config.lua")

if not configFile then
    print("^1Fehler: ForteX_config.lua nicht gefunden^0")
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

-- Base64-Encoding Funktion (von FiveM_ForteX.lua kopiert)
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

-- API-Anfrage Beispiel
local function TestApiRequest()
    print("^3Teste API-Verbindung...^0")
    
    -- Basis-Autorisation Header erstellen
    local auth = base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
    
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
        
        print("^2API-Test erfolgreich!^0")
        if responseData then
            print("^3Erste 100 Zeichen der Antwort: ^0" .. responseData:sub(1, 100) .. "...")
        end
    end, "GET", "", {
        ["Authorization"] = "Basic " .. auth,
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-ForteX-Test/1.0",
        ["Accept"] = "text/plain"
    })
end

-- Warte 2 Sekunden und führe den API-Test aus
Citizen.CreateThread(function()
    Wait(2000)
    TestApiRequest()
end)

-- Befehle zum Testen
RegisterCommand('fortex_test', function(source, args, rawCommand)
    if source == 0 then
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
