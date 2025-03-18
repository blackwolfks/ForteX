
--[[ 
  FiveM Remote Script Loader
  
  Dieses Skript stellt eine sichere Verbindung mit Ihrer Webseite her
  und lädt autorisierte Skripte mit mehreren Sicherheitsebenen.
  
  Sicherheitsfeatures:
  1. Lizenzschlüssel-Validierung
  2. Server-Key-Authentifizierung
  3. IP-Adress-Validierung (optional)
]]

-- Konfiguration
CONFIG = {}
CONFIG.LicenseKey = "XXXX-XXXX-XXXX-XXXX" -- Ihr Lizenzschlüssel hier eintragen
CONFIG.ServerKey = "XXXXXXXXXXXX" -- Ihr Server-Key hier eintragen
CONFIG.ServerUrl = "https://ihre-website.de/api/script" -- API-URL anpassen

-- Debug-Modus (auf false setzen für Produktion)
CONFIG.Debug = true

-- Hilfsfunktion für Debug-Ausgaben
function DebugPrint(...)
    if CONFIG.Debug then
        print("[Remote Script Loader]", ...)
    end
end

-- Hilfsfunktion zum Base64-Encoding
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
    -- Hier könnten zusätzliche Validierungen implementiert werden
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
    DebugPrint("Lade Remote-Skript...")
    
    -- Basis-Autorisation Header erstellen
    local auth = base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
    
    PerformHttpRequest(CONFIG.ServerUrl, function(statusCode, responseData, responseHeaders)
        if statusCode ~= 200 then
            DebugPrint("Fehler beim Abrufen des Skripts: " .. tostring(statusCode))
            if statusCode == 401 then
                DebugPrint("Authentifizierungsfehler - überprüfen Sie Ihren Lizenzschlüssel und Server-Key")
            elseif statusCode == 403 then
                DebugPrint("Zugriff verweigert - möglicherweise IP-Beschränkung oder inaktive Lizenz")
            elseif statusCode == 404 then
                DebugPrint("Skript nicht gefunden")
            end
            return
        end
        
        DebugPrint("Skript erfolgreich abgerufen")
        
        -- Skript validieren
        local isValid, scriptOrError = ValidateScript(responseData)
        if not isValid then
            DebugPrint("Skript-Validierung fehlgeschlagen: " .. scriptOrError)
            return
        end
        
        -- Skript ausführen
        DebugPrint("Führe Skript aus...")
        local func, err = load(scriptOrError)
        if func then
            local success, error = pcall(func)
            if success then
                DebugPrint("Skript erfolgreich geladen und ausgeführt")
            else
                DebugPrint("Fehler beim Ausführen des Skripts: " .. tostring(error))
            end
        else
            DebugPrint("Fehler beim Kompilieren des Skripts: " .. tostring(err))
        end
    end, "GET", "", {
        ["Authorization"] = "Basic " .. auth,
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-RemoteLoader/1.0",
        ["Accept"] = "text/plain"
    })
end

-- Skript bei Ressourcenstart laden
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        DebugPrint("Ressource gestartet")
        Wait(1000) -- Kurze Verzögerung
        LoadRemoteScript()
    end
end)

-- Script auch beim Start laden
Citizen.CreateThread(function()
    Wait(2000) -- Kurze Verzögerung beim Start
    LoadRemoteScript()
end)

-- Periodische Aktualisierung (optional, für automatische Updates)
if CONFIG.AutoUpdate then
    Citizen.CreateThread(function()
        while true do
            Wait(CONFIG.UpdateInterval * 60000) -- Minuten in Millisekunden
            DebugPrint("Führe automatisches Update durch...")
            LoadRemoteScript()
        end
    end)
end

-- Befehl zum manuellen Neuladen des Skripts
RegisterCommand('reloadremote', function(source, args, rawCommand)
    if source == 0 then -- Nur von der Konsole aus
        DebugPrint("Manuelles Neuladen des Remote-Skripts...")
        LoadRemoteScript()
    end
end, true)

DebugPrint("Remote Script Loader initialisiert")
