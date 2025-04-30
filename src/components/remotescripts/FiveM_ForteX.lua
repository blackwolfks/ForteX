
-- ForteX - Remote Script Framework für FiveM
-- Unterstützt dynamisches Nachladen von Skripten ohne Neustart

-- Konfiguration aus config_fortex.lua laden
local Config = {}
if LoadResourceFile(GetCurrentResourceName(), "config_fortex.lua") then
    local configData = LoadResourceFile(GetCurrentResourceName(), "config_fortex.lua")
    local func, err = load(configData)
    if func then
        local status, result = pcall(func)
        if status and type(result) == "table" then
            Config = result
        else
            print("^1ForteX Fehler: Konfiguration konnte nicht geladen werden - Fehlerhafte config_fortex.lua^0")
        end
    else
        print("^1ForteX Fehler: Konfiguration konnte nicht geladen werden - " .. tostring(err) .. "^0")
    end
else
    print("^1ForteX Fehler: config_fortex.lua nicht gefunden^0")
end

-- Überprüfen, ob Lizenzschlüssel und Server-Key gesetzt sind
if not Config.LicenseKey or Config.LicenseKey == "" then
    print("^1ForteX Fehler: Lizenzschlüssel nicht konfiguriert^0")
    return
end

if not Config.ServerKey or Config.ServerKey == "" then
    print("^1ForteX Fehler: Server-Key nicht konfiguriert^0")
    return
end

-- API URL konfigurieren
local apiUrl = Config.ApiUrl or "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script"

-- ForteX Hauptklasse
ForteX = {
    version = "1.0.0",
    loaded = false,
    files = {},
    scriptName = "",
    scriptId = "",
    license = nil
}

-- Funktion zum Senden von Anfragen mit dem Server-Key
function ForteX.sendRequest(endpoint, method, data, callback)
    local headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. Config.ServerKey
    }
    
    local url = apiUrl .. endpoint
    
    PerformHttpRequest(url, function(statusCode, responseText, headers)
        local response = nil
        
        if responseText and responseText ~= "" then
            response = json.decode(responseText)
        end
        
        if statusCode >= 200 and statusCode < 300 then
            if callback then callback(true, response) end
        else
            print("^1ForteX Fehler: API-Anfrage fehlgeschlagen (" .. tostring(statusCode) .. ")^0")
            if response and response.error then
                print("^1ForteX Fehler: " .. tostring(response.error) .. "^0")
            end
            if callback then callback(false, response) end
        end
    end, method, data and json.encode(data) or "", headers)
end

-- Lizenz überprüfen
function ForteX.checkLicense(callback)
    print("^3ForteX: Überprüfe Lizenz...^0")
    
    ForteX.sendRequest("/license", "POST", {
        license_key = Config.LicenseKey,
        server_key = Config.ServerKey
    }, function(success, response)
        if success and response and response.valid then
            print("^2ForteX: Lizenz gültig für Skript '" .. response.script_name .. "'!^0")
            ForteX.license = response
            ForteX.scriptName = response.script_name
            ForteX.scriptId = response.id
            if callback then callback(true) end
        else
            print("^1ForteX Fehler: Lizenz ungültig oder Server nicht erreichbar!^0")
            if callback then callback(false) end
        end
    end)
end

-- Datei(en) vom Remote-Server laden
function ForteX.loadRemoteFile(path, callback)
    if not ForteX.license then
        print("^1ForteX Fehler: Vor dem Laden von Dateien muss die Lizenz überprüft werden!^0")
        if callback then callback(false, nil) end
        return
    end
    
    ForteX.sendRequest("/file", "POST", {
        license_id = ForteX.scriptId,
        path = path
    }, function(success, response)
        if success and response and response.content then
            if callback then callback(true, response.content) end
        else
            print("^1ForteX Fehler: Datei '" .. path .. "' konnte nicht geladen werden!^0")
            if callback then callback(false, nil) end
        end
    end)
end

-- Mehrere Dateien laden und ausführen
function ForteX.loadRemoteFiles(filesList, callback)
    local loaded = 0
    local failed = 0
    local totalFiles = #filesList
    
    for i, file in ipairs(filesList) do
        ForteX.loadRemoteFile(file, function(success, content)
            if success and content then
                local fileName = "fortex_" .. string.gsub(file, "[^%w]", "_")
                ForteX.files[file] = fileName
                
                -- Datei als temporäre Ressource speichern und ausführen
                local resourceFile = LoadResourceFile(GetCurrentResourceName(), fileName)
                if resourceFile then
                    -- Wenn die Datei bereits existiert, löschen
                    os.remove(GetResourcePath(GetCurrentResourceName()) .. "/" .. fileName)
                end
                
                -- Neue Datei erstellen
                SaveResourceFile(GetCurrentResourceName(), fileName, content, -1)
                
                -- Je nach Dateityp unterschiedlich laden
                local extension = string.match(file, "%.([^%.]+)$")
                if extension == "lua" then
                    local func, err = load(content, fileName)
                    if func then
                        local status, error = pcall(func)
                        if status then
                            print("^2ForteX: Datei " .. file .. " erfolgreich geladen und ausgeführt!^0")
                            loaded = loaded + 1
                        else
                            print("^1ForteX Fehler: Ausführung fehlgeschlagen - " .. tostring(error) .. "^0")
                            failed = failed + 1
                        end
                    else
                        print("^1ForteX Fehler: Lua-Parsing fehlgeschlagen - " .. tostring(err) .. "^0")
                        failed = failed + 1
                    end
                else
                    print("^3ForteX: Datei " .. file .. " erfolgreich geladen (nicht ausführbar)^0")
                    loaded = loaded + 1
                end
            else
                print("^1ForteX Fehler: Datei " .. file .. " konnte nicht geladen werden!^0")
                failed = failed + 1
            end
            
            -- Wenn alle Dateien verarbeitet wurden, Callback aufrufen
            if loaded + failed >= totalFiles then
                print("^3ForteX: " .. loaded .. "/" .. totalFiles .. " Dateien geladen, " .. failed .. " fehlgeschlagen^0")
                if callback then callback(loaded, failed) end
            end
        end)
    end
end

-- ForteX initialisieren
CreateThread(function()
    print("^3ForteX: Initialisiere ForteX Remote Script Framework v" .. ForteX.version .. "^0")
    
    ForteX.checkLicense(function(valid)
        if valid then
            ForteX.loaded = true
            
            -- Event registrieren, um Skripte von anderen Ressourcen nachladen zu können
            RegisterNetEvent("ForteX:LoadScript")
            AddEventHandler("ForteX:LoadScript", function(path, cb)
                if not path then return end
                
                ForteX.loadRemoteFile(path, function(success, content)
                    if cb then
                        cb(success, content)
                    end
                end)
            end)
            
            -- Event zum Laden von mehreren Dateien
            RegisterNetEvent("ForteX:LoadScripts")
            AddEventHandler("ForteX:LoadScripts", function(files, cb)
                if not files or type(files) ~= "table" then return end
                
                ForteX.loadRemoteFiles(files, function(loaded, failed)
                    if cb then
                        cb(loaded, failed)
                    end
                end)
            end)
            
            -- Standardmäßige Dateien laden, falls konfiguriert
            if Config.AutoloadFiles and type(Config.AutoloadFiles) == "table" and #Config.AutoloadFiles > 0 then
                print("^3ForteX: Lade " .. #Config.AutoloadFiles .. " konfigurierte Dateien...^0")
                ForteX.loadRemoteFiles(Config.AutoloadFiles)
            end
            
            print("^2ForteX: Erfolgreich initialisiert und betriebsbereit!^0")
        else
            print("^1ForteX Fehler: Initialisierung fehlgeschlagen - Ungültige Lizenz!^0")
        end
    end)
end)

-- Export-Funktionen für andere Ressourcen
exports("isReady", function()
    return ForteX.loaded
end)

exports("loadFile", function(path, cb)
    ForteX.loadRemoteFile(path, cb)
end)

exports("loadFiles", function(files, cb)
    ForteX.loadRemoteFiles(files, cb)
end)
