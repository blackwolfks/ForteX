
--[[ 
  ForteX Framework - Remote Script Loader
  
  Diese Datei ermöglicht das sichere Laden von autorisierten Skripten über die
  Remote-Script-Verwaltung. Kunden können ihren Lizenzschlüssel in der config.lua eintragen
  und erhalten dann automatisch Zugriff auf die freigegebenen Dateien.
]]

-- Konfigurationsdatei laden
local resourceName = GetCurrentResourceName()
local configFile = LoadResourceFile(resourceName, "config.lua")

if not configFile then
    print("^1[ForteX] Fehler: config.lua konnte nicht geladen werden^7")
    return
end

-- Config-Datei ausführen
local configFunc, configError = load(configFile)
if not configFunc then
    print("^1[ForteX] Fehler beim Laden der config.lua: " .. tostring(configError) .. "^7")
    return
end

configFunc()

-- Überprüfen, ob die Konfiguration korrekt ist
if not CONFIG then
    print("^1[ForteX] Fehler: CONFIG Tabelle nicht gefunden^7")
    return
end

if not CONFIG.LicenseKey or not CONFIG.ServerKey then
    print("^1[ForteX] Fehler: Lizenzschlüssel oder ServerKey nicht konfiguriert^7")
    return
end

if not CONFIG.ServerUrl then
    CONFIG.ServerUrl = "" -- Fill with your domain URL + /api/script
    print("^3[ForteX] Warnung: ServerUrl nicht konfiguriert, verwende Standard-URL^7")
end

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
    
    -- Prüfe auf schädliche Inhalte (Beispiel)
    if scriptData:find("_G%s-=%s-nil") then
        return false, "Potenziell schädlicher Code erkannt"
    end
    
    return true, scriptData
end

-- Funktion zum Laden und Ausführen des Remote-Skripts
function LoadRemoteScript()
    print("^2[ForteX] Lade Remote-Skript...^7")
    
    -- Basis-Autorisation Header erstellen
    local auth = base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
    
    PerformHttpRequest(CONFIG.ServerUrl, function(statusCode, responseData, responseHeaders)
        if statusCode ~= 200 then
            print("^1[ForteX] Fehler beim Abrufen des Skripts: " .. tostring(statusCode) .. "^7")
            if statusCode == 401 then
                print("^1[ForteX] Authentifizierungsfehler - überprüfen Sie Ihren Lizenzschlüssel und Server-Key^7")
            elseif statusCode == 403 then
                print("^1[ForteX] Zugriff verweigert - möglicherweise IP-Beschränkung oder inaktive Lizenz^7")
            elseif statusCode == 404 then
                print("^1[ForteX] Skript nicht gefunden^7")
            end
            return
        end
        
        print("^2[ForteX] Skript erfolgreich abgerufen^7")
        
        -- Skript validieren
        local isValid, scriptOrError = ValidateScript(responseData)
        if not isValid then
            print("^1[ForteX] Skript-Validierung fehlgeschlagen: " .. scriptOrError .. "^7")
            return
        end
        
        -- Skript ausführen
        print("^2[ForteX] Führe Skript aus...^7")
        local func, err = load(scriptOrError)
        if func then
            local success, error = pcall(func)
            if success then
                print("^2[ForteX] Skript erfolgreich geladen und ausgeführt^7")
            else
                print("^1[ForteX] Fehler beim Ausführen des Skripts: " .. tostring(error) .. "^7")
            end
        else
            print("^1[ForteX] Fehler beim Kompilieren des Skripts: " .. tostring(err) .. "^7")
        end
    end, "GET", "", {
        ["Authorization"] = "Basic " .. auth,
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["Accept"] = "text/plain"
    })
end

-- ForteX API für andere Ressourcen
ForteX = {}

-- Funktion zum Laden einer bestimmten Datei
ForteX.LoadFile = function(filePath, callback)
    local url = CONFIG.ServerUrl .. "/" .. filePath
    
    PerformHttpRequest(url, function(statusCode, responseData, responseHeaders)
        if statusCode ~= 200 then
            print("^1[ForteX] Fehler beim Abrufen der Datei: " .. tostring(statusCode) .. "^7")
            if callback then callback(false, "Fehler: " .. tostring(statusCode)) end
            return
        end
        
        if callback then callback(true, responseData) end
    end, "GET", "", {
        ["Authorization"] = "Basic " .. base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey),
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["Accept"] = "text/plain"
    })
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
            print("^1[ForteX] Fehler beim Kompilieren der Datei: " .. tostring(err) .. "^7")
            if callback then callback(false, "Kompilierfehler: " .. tostring(err)) end
            return
        end
        
        local success, error = pcall(func)
        if not success then
            print("^1[ForteX] Fehler beim Ausführen der Datei: " .. tostring(error) .. "^7")
            if callback then callback(false, "Ausführungsfehler: " .. tostring(error)) end
            return
        end
        
        if callback then callback(true, "Datei erfolgreich ausgeführt") end
    end)
end

-- Skript bei Ressourcenstart laden
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        print("^2[ForteX] Ressource gestartet^7")
        Wait(1000) -- Kurze Verzögerung
        LoadRemoteScript()
    end
end)

-- Auch beim Start laden
Citizen.CreateThread(function()
    Wait(2000) -- Kurze Verzögerung beim Start
    LoadRemoteScript()
end)

-- Befehl zum manuellen Neuladen des Skripts
RegisterCommand('fortex_reload', function(source, args, rawCommand)
    if source == 0 then -- Nur von der Konsole aus
        print("^2[ForteX] Manuelles Neuladen des Remote-Skripts...^7")
        LoadRemoteScript()
    end
end, true)

print("^2[ForteX] Framework initialisiert^7")
