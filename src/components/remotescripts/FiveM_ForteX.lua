
-- ForteX.lua - FiveM Lizenz-System
-- Entwickelt von ForteX-Team für sichere FiveM-Skript-Nutzung

CONFIG = {
    Debug = true,              -- Debug-Modus aktivieren/deaktivieren
    
    -- Hauptkonfiguration
    BaseURL = "",              -- URL zur API (wird automatisch aus license/server key generiert)
    APIRateLimitTime = 5000,   -- Mindestzeit zwischen API-Anfragen (ms)
    
    -- Authentifizierung
    LicenseKey = "",           -- Dein Lizenzschlüssel (wird aus der fxmanifest.lua gelesen)
    ServerKey = "",            -- Dein Server-Key (wird aus der fxmanifest.lua gelesen)
    
    -- Dateimanagement
    ConfigSignature = "",      -- Signatur für die Konfiguration
    ConfigFileName = nil,      -- Name der zu ladenden Konfigurationsdatei
    JsonContent = nil,         -- JSON-Inhalt zum Dekodieren (direkt als String)
    FilePathReplacements = {   -- Ersetzungen für lokale Dateipfade
        ["file/path/here"] = "replaced/path/here"
    },
    
    -- Anwendungssteuerung
    ExitOnFailure = false,     -- Skript beenden, wenn Validierung fehlschlägt
    HookTable = nil,           -- Tabelle, die beim Erfolg aufgerufen wird
    HookFn = nil,              -- Funktion, die beim Erfolg aufgerufen wird
    
    -- Eigene Header für API-Anfragen
    CustomHeaders = {}
}

local ForteX = {}  -- Namespace für ForteX-Funktionen
local cachedKosatkaConfig = nil  -- Cache für die geladene Konfiguration
local lastAPIRequestTime = 0  -- Zeitstempel der letzten API-Anfrage

-- Konstanten für Ausgaben
local SUCCESS_PREFIX = "^2[ForteX]^7"  -- Grüner Erfolgstext
local ERROR_PREFIX = "^1[ForteX]^7"    -- Roter Fehlertext
local INFO_PREFIX = "^5[ForteX]^7"     -- Blauer Infotext
local DEBUG_PREFIX = "^3[ForteX]^7"    -- Gelber Debug-Text

-- Hilfsfunktionen

-- Überprüft, ob ein String mit einem bestimmten Muster beginnt
local function startswith(str, pattern)
    return str:sub(1, #pattern) == pattern
end

-- Überprüft, ob ein String mit einem bestimmten Muster endet
local function endswith(str, pattern)
    return str:sub(-#pattern) == pattern
end

-- Debug-Ausgabe, wenn Debug-Modus aktiviert ist
local function debugLog(...)
    if CONFIG.Debug then
        print(DEBUG_PREFIX, ...)
    end
end

-- Sichere JSON-Dekodierung
local function SafeJsonDecode(jsonStr, fileIdentifier)
    if not jsonStr then return nil end
    
    local status, result = pcall(function()
        return json.decode(jsonStr)
    end)
    
    if status then
        return result
    else
        print(ERROR_PREFIX, "Failed to decode JSON" .. (fileIdentifier and (" from " .. fileIdentifier) or "") .. ": " .. tostring(result))
        return nil
    end
end

-- Prüft, ob ein API-Aufruf aufgrund des Rate-Limits möglich ist
local function CanMakeRequest()
    local currentTime = GetGameTimer()
    local timeSinceLastRequest = currentTime - lastAPIRequestTime
    
    if timeSinceLastRequest < CONFIG.APIRateLimitTime then
        debugLog("API rate limit hit. Need to wait " .. (CONFIG.APIRateLimitTime - timeSinceLastRequest) .. "ms more.")
        return false
    end
    
    lastAPIRequestTime = currentTime
    return true
end

-- Parst den Pfad aus der Konfiguration
local function ParseFilePath(path)
    if not path then
        return nil
    end
    
    -- Ersetzungen für bestimmte Pfade durchführen
    for search, replace in pairs(CONFIG.FilePathReplacements) do
        if path:find(search) then
            path = path:gsub(search, replace)
            debugLog("Replaced file path:", path)
        end
    end
    
    -- Prüfen ob es sich um einen Remotepfad handelt
    if startswith(path, "http") then 
        return path
    end
    
    -- Lokalen Pfad zurückgeben
    return path
end

-- Generiert die API-URL basierend auf der Konfiguration
local function GenerateApiUrl()
    -- Ein Standard-Fallback, wenn nichts konfiguriert ist
    if not CONFIG.LicenseKey or CONFIG.LicenseKey == "" or not CONFIG.ServerKey or CONFIG.ServerKey == "" then
        debugLog("No license or server key provided!")
        return nil
    end

    -- Basisurl bestimmen
    local baseUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script"
    if CONFIG.BaseURL and CONFIG.BaseURL ~= "" then
        baseUrl = CONFIG.BaseURL
    end
    
    -- Führende und nachfolgende Slashes entfernen, um Doppelslashes zu vermeiden
    if endswith(baseUrl, "/") then
        baseUrl = baseUrl:sub(1, -2)
    end
    
    return baseUrl
end

-- Liest den Inhalt einer lokalen Datei
local function ReadLocalFile(filePath, callback)
    debugLog("Reading local file:", filePath)
    
    -- FileExists-Check in einer separaten Funktion, falls nötig
    if not filePath then
        callback(false, "No file path specified")
        return
    end
    
    local resourceName = GetCurrentResourceName()
    local finalPath = filePath
    
    -- Je nach Pfadformat anpassen
    if not string.find(filePath, ":/") and not string.find(filePath, "./") then
        finalPath = resourceName .. "/" .. filePath
    end
    
    debugLog("Final path for local file:", finalPath)
    
    -- API zum Lesen der Datei
    PerformHttpRequest(finalPath, function(errorCode, fileContent, resultHeaders)
        if errorCode == 200 and fileContent and fileContent ~= "" then
            debugLog("Successfully read local file:", filePath)
            callback(true, fileContent)
        else
            debugLog("Failed to read local file:", filePath, "Error:", errorCode)
            callback(false, "Failed to read file: " .. tostring(errorCode))
        end
    end, "GET")
end

-- Hauptfunktionen von ForteX

-- Validiert eine Konfiguration gegen die erwartete Signatur
function ForteX.ValidateConfig(config, expectedSignature)
    if not config then
        return false, "Config is nil"
    end
    
    if not config.Signature then
        return false, "Config has no signature"
    end
    
    if config.Signature ~= expectedSignature then
        return false, "Invalid signature: " .. tostring(config.Signature) .. " expected: " .. tostring(expectedSignature)
    end
    
    return true, "Config validated successfully"
end

-- Führt einen API-Request durch
function ForteX.Request(endpoint, method, data, callback)
    if not CanMakeRequest() then
        debugLog("API rate limit prevented request to:", endpoint)
        if callback then
            callback(false, "Rate limited")
        end
        return
    end
    
    local requestData = data or {}
    local requestMethod = method or "GET"
    local apiUrl = GenerateApiUrl()
    
    if not apiUrl then
        debugLog("Failed to generate API URL")
        if callback then
            callback(false, "Failed to generate API URL")
        end
        return
    end
    
    local url = apiUrl
    if endpoint and endpoint ~= "" then
        url = apiUrl .. "/" .. endpoint
    end
    
    debugLog("Making request to:", url, "Method:", requestMethod)
    
    -- Headers für den Request vorbereiten
    local headers = {
        ["Content-Type"] = "application/json",
        ["license-key"] = CONFIG.LicenseKey,
        ["server-key"] = CONFIG.ServerKey
    }
    
    -- Custom Headers hinzufügen
    if CONFIG.CustomHeaders then
        for key, value in pairs(CONFIG.CustomHeaders) do
            headers[key] = value
        end
    end
    
    -- Request durchführen
    PerformHttpRequest(url, function(statusCode, responseText, responseHeaders)
        debugLog("API Response:", statusCode)
        
        if statusCode == 200 and responseText and responseText ~= "" then
            local response = SafeJsonDecode(responseText)
            if response then
                if callback then
                    callback(true, response)
                end
                return
            else
                debugLog("Failed to parse API response as JSON")
                if callback then
                    callback(false, "Invalid JSON response")
                end
                return
            end
        else
            debugLog("API request failed:", statusCode, responseText)
            if callback then
                callback(false, "API request failed: " .. tostring(statusCode))
            end
        end
    end, requestMethod, requestMethod ~= "GET" and json.encode(requestData) or "", headers)
end

-- Validiert die aktuelle Lizenz
function ForteX.ValidateLicense(callback)
    debugLog("Validating license...")
    
    ForteX.Request("", "GET", nil, function(success, data)
        if success and data and data.valid then
            debugLog("License validated successfully")
            if callback then
                callback(true, data)
            end
        else
            local errorMsg = "License validation failed"
            if data and data.error then
                errorMsg = data.error
            end
            
            debugLog("License validation failed:", errorMsg)
            if callback then
                callback(false, errorMsg)
            end
            
            if CONFIG.ExitOnFailure then
                print(ERROR_PREFIX, "License validation failed. Exiting resource.")
                -- Wenn wir im Server-Kontext sind
                if IsDuplicityVersion() then
                    -- StopResource(GetCurrentResourceName())
                    -- Wird nicht verwendet, da es zu hart wäre
                end
            end
        end
    end)
end

-- Lädt eine Datei (lokal oder remote)
function ForteX.LoadFile(filePath, callback)
    if not filePath then
        if callback then
            callback(false, "No file path provided")
        end
        return
    end
    
    local parsedPath = ParseFilePath(filePath)
    if not parsedPath then
        if callback then
            callback(false, "Failed to parse file path")
        end
        return
    end
    
    debugLog("Loading file:", parsedPath)
    
    -- Prüfen ob es sich um eine Remote- oder Lokale Datei handelt
    if startswith(parsedPath, "http") then
        -- Remote-Datei laden
        debugLog("Loading remote file:", parsedPath)
        
        PerformHttpRequest(parsedPath, function(statusCode, responseText, responseHeaders)
            if statusCode == 200 and responseText and responseText ~= "" then
                debugLog("Successfully loaded remote file:", parsedPath)
                if callback then
                    callback(true, responseText)
                end
            else
                debugLog("Failed to load remote file:", parsedPath, "Status:", statusCode)
                if callback then
                    callback(false, "Failed to load remote file: " .. tostring(statusCode))
                end
            end
        end, "GET")
    else
        -- Lokale Datei laden
        ReadLocalFile(parsedPath, function(success, content)
            if success then
                if callback then
                    callback(true, content)
                end
            else
                if callback then
                    callback(false, content) -- Fehlermeldung wird hier als content übergeben
                end
            end
        end)
    end
end

-- Initialisiert das ForteX-System
function ForteX.Init(customConfig)
    -- Konfiguration überschreiben, wenn übergeben
    if customConfig then
        for key, value in pairs(customConfig) do
            CONFIG[key] = value
        end
    end
    
    -- Validiert die Lizenz
    ForteX.ValidateLicense(function(success, data)
        if success then
            print(SUCCESS_PREFIX, "License validated successfully. Initializing...")
            
            -- Wenn eine Hook-Funktion definiert ist, rufen wir sie auf
            if CONFIG.HookFn and type(CONFIG.HookFn) == "function" then
                CONFIG.HookFn(data)
            end
            
            -- Oder wenn eine Hook-Tabelle mit einer OnValidated-Funktion definiert ist
            if CONFIG.HookTable and type(CONFIG.HookTable) == "table" and CONFIG.HookTable.OnValidated then
                CONFIG.HookTable.OnValidated(data)
            end
        else
            print(ERROR_PREFIX, "License validation failed:", data)
            
            if CONFIG.ExitOnFailure then
                print(ERROR_PREFIX, "Exiting due to license validation failure.")
                -- Hier könnte man den Resource beenden, wenn gewünscht
            end
        end
    end)
end

-- Automatische Initialisierung, wenn die Konfiguration in der fxmanifest.lua bereitgestellt wird
RegisterNetEvent("ForteX:SetConfig")
AddEventHandler("ForteX:SetConfig", function(config)
    if config then
        -- Konfiguration aus dem Server übernehmen
        for key, value in pairs(config) do
            CONFIG[key] = value
        end
        
        print(INFO_PREFIX, "Received configuration from server")
        
        -- ForteX initialisieren
        ForteX.Init()
    else
        print(ERROR_PREFIX, "Received empty configuration from server")
    end
end)

-- Exports für den Zugriff von außen
exports('GetConfig', function()
    return CONFIG
end)

exports('GetForteX', function()
    return ForteX
end)

exports('GetValidatedConfig', function()
    return cachedKosatkaConfig
end)

-- Automatische Initialisierung wenn direkt aufgerufen
Citizen.CreateThread(function()
    Wait(100) -- Kleiner Delay, damit die Events time haben zu registrieren
    
    -- Check ob die Konfiguration vom Server kommt oder lokal ist
    if CONFIG.LicenseKey and CONFIG.LicenseKey ~= "" and CONFIG.ServerKey and CONFIG.ServerKey ~= "" then
        print(INFO_PREFIX, "Using local configuration")
        ForteX.Init()
    end
end)

-- Direkt JSON dekodieren ohne zu laden
if CONFIG and CONFIG.JsonContent then
    local jsonString = CONFIG.JsonContent -- Nehmen Sie den JSON-String direkt
    if jsonString then
        local cfg = SafeJsonDecode(jsonString, CONFIG.ConfigFileName)
        if cfg and cfg.Signature == CONFIG.ConfigSignature then
            cachedKosatkaConfig = cfg
            print(SUCCESS_PREFIX .. " Config successfully decoded & validated!")
        else
            print(ERROR_PREFIX .. " Invalid config or wrong signature! Expected: " .. CONFIG.ConfigSignature)
        end
    else
        print(ERROR_PREFIX .. " No JSON content provided in CONFIG.JsonContent")
    end
end

-- Konfigurationsdatei laden (nur wenn kein JSON-String direkt bereitgestellt wurde)
if CONFIG and CONFIG.ConfigFileName and not (CONFIG and CONFIG.JsonContent) then
    ForteX.LoadFile(CONFIG.ConfigFileName, function(success, data)
        if success then
            local cfg = SafeJsonDecode(data, CONFIG.ConfigFileName)
            if cfg and cfg.Signature == CONFIG.ConfigSignature then
                cachedKosatkaConfig = cfg
                print(SUCCESS_PREFIX .. " Config successfully loaded & validated!")
            else
                print(ERROR_PREFIX .. " Invalid config or wrong signature! Expected: " .. CONFIG.ConfigSignature)
            end
        else
            print(ERROR_PREFIX .. " Failed to load config file: " .. CONFIG.ConfigFileName)
        end
    end)
end
