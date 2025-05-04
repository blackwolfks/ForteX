
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
            -- Automatischer Error-Log
            if ForteX and ForteX.logError then
                ForteX.logError("Konfiguration konnte nicht geladen werden", {
                    details = tostring(result),
                    file_name = "config_fortex.lua",
                    error_code = "CONFIG_PARSE_ERROR"
                })
            end
        end
    else
        print("^1ForteX Fehler: Konfiguration konnte nicht geladen werden - " .. tostring(err) .. "^0")
        -- Automatischer Error-Log
        if ForteX and ForteX.logError then
            ForteX.logError("Konfiguration konnte nicht geladen werden", {
                details = tostring(err),
                file_name = "config_fortex.lua",
                error_code = "CONFIG_LOAD_ERROR"
            })
        end
    end
else
    print("^1ForteX Fehler: config_fortex.lua nicht gefunden^0")
    -- Automatischer Error-Log
    if ForteX and ForteX.logError then
        ForteX.logError("config_fortex.lua nicht gefunden", {
            file_name = "config_fortex.lua",
            error_code = "CONFIG_MISSING"
        })
    end
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
                
                -- Automatischer Error-Log
                if ForteX.logError then
                    ForteX.logError("API-Anfrage fehlgeschlagen", {
                        details = tostring(response.error),
                        error_code = "API_ERROR_" .. tostring(statusCode)
                    })
                end
            end
            if callback then callback(false, response) end
        end
    end, method, data and json.encode(data) or "", headers)
end

-- Verbesserte Log-Funktionen mit zusätzlichen Parametern
function ForteX.logToDatabase(level, message, options)
    if not ForteX.scriptId then
        print("^3ForteX Warnung: Logging nicht möglich - keine Lizenz geladen^0")
        return
    end
    
    options = options or {}
    
    -- Zusätzliche Felder für erweiterte Logging-Funktionalitäten
    local data = {
        license_key = Config.LicenseKey,
        server_key = Config.ServerKey,
        level = level,
        message = message,
        source = options.source or "script",
        details = options.details,
        error_code = options.error_code,
        client_ip = options.client_ip,
        file_name = options.file_name
    }
    
    ForteX.sendRequest("/log", "POST", data, function(success, response)
        if not success then
            print("^3ForteX Warnung: Log konnte nicht gespeichert werden^0")
        end
    end)
end

function ForteX.logInfo(message, options)
    ForteX.logToDatabase("info", message, options)
end

function ForteX.logWarning(message, options)
    ForteX.logToDatabase("warning", message, options)
end

function ForteX.logError(message, options)
    ForteX.logToDatabase("error", message, options)
end

function ForteX.logDebug(message, options)
    ForteX.logToDatabase("debug", message, options)
end

-- Verbesserte Lua-Fehlerbehandlung durch pcall-Wrapper
function ForteX.safeExecute(func, errorMessage, fileName)
    local status, result = pcall(func)
    if not status then
        local errorDetails = tostring(result)
        print("^1ForteX Fehler: " .. errorMessage .. " - " .. errorDetails .. "^0")
        
        -- Automatischer Error-Log
        ForteX.logError(errorMessage, {
            details = errorDetails,
            file_name = fileName,
            error_code = "RUNTIME_ERROR"
        })
        return false, result
    end
    return true, result
end

-- Erweiterte Funktion zum sicheren Laden von Lua-Code
function ForteX.safeLuaLoad(content, fileName)
    local func, err = load(content, fileName)
    if not func then
        print("^1ForteX Fehler: Lua-Code konnte nicht geladen werden - " .. tostring(err) .. "^0")
        
        -- Automatischer Error-Log
        ForteX.logError("Lua-Code konnte nicht geladen werden", {
            details = tostring(err),
            file_name = fileName,
            error_code = "LUA_SYNTAX_ERROR"
        })
        return false, nil
    end
    
    -- Führe den Code sicher aus
    return ForteX.safeExecute(func, "Fehler beim Ausführen von " .. fileName, fileName)
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
            
            -- Log erfolgreiche Lizenzvalidierung
            ForteX.logInfo("Lizenz erfolgreich validiert", {
                source = "license-check"
            })
            
            if callback then callback(true) end
        else
            print("^1ForteX Fehler: Lizenz ungültig oder Server nicht erreichbar!^0")
            
            -- Log Lizenzfehler
            if ForteX.scriptId then
                ForteX.logError("Lizenz ungültig oder Server nicht erreichbar", {
                    source = "license-check",
                    error_code = "LICENSE_INVALID"
                })
            end
            
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
    }
    
    ForteX.sendRequest("/file", "POST", {
        license_id = ForteX.scriptId,
        path = path
    }, function(success, response)
        if success and response and response.content then
            if callback then callback(true, response.content) end
        else
            print("^1ForteX Fehler: Datei '" .. path .. "' konnte nicht geladen werden!^0")
            
            -- Log Fehler beim Laden von Dateien
            ForteX.logError("Datei konnte nicht geladen werden", {
                source = "file-load",
                file_name = path,
                error_code = "FILE_LOAD_ERROR"
            })
            
            if callback then callback(false, nil) end
        end
    end)
}

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
                
                -- Datei als temporäre Ressource speichern
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
                    -- Sicheres Laden und Ausführen mit automatischer Fehlerbehandlung
                    local status, result = ForteX.safeLuaLoad(content, file)
                    
                    if status then
                        print("^2ForteX: Datei " .. file .. " erfolgreich geladen und ausgeführt!^0")
                        loaded = loaded + 1
                        
                        ForteX.logInfo("Datei erfolgreich geladen und ausgeführt", {
                            source = "file-execution",
                            file_name = file
                        })
                    else
                        print("^1ForteX Fehler: Ausführung fehlgeschlagen - " .. tostring(result) .. "^0")
                        failed = failed + 1
                        
                        ForteX.logError("Ausführung fehlgeschlagen", {
                            source = "file-execution",
                            file_name = file,
                            details = tostring(result),
                            error_code = "EXECUTION_ERROR"
                        })
                    end
                else
                    print("^3ForteX: Datei " .. file .. " erfolgreich geladen (nicht ausführbar)^0")
                    loaded = loaded + 1
                    
                    ForteX.logInfo("Datei erfolgreich geladen (nicht ausführbar)", {
                        source = "file-load",
                        file_name = file
                    })
                end
            else
                print("^1ForteX Fehler: Datei " .. file .. " konnte nicht geladen werden!^0")
                failed = failed + 1
                
                ForteX.logError("Datei konnte nicht geladen werden", {
                    source = "file-load",
                    file_name = file,
                    error_code = "FILE_LOAD_FAILED"
                })
            end
            
            -- Wenn alle Dateien verarbeitet wurden, Callback aufrufen
            if loaded + failed >= totalFiles then
                print("^3ForteX: " .. loaded .. "/" .. totalFiles .. " Dateien geladen, " .. failed .. " fehlgeschlagen^0")
                
                ForteX.logInfo("Dateien geladen", {
                    source = "files-summary",
                    details = loaded .. "/" .. totalFiles .. " Dateien geladen, " .. failed .. " fehlgeschlagen"
                })
                
                if callback then callback(loaded, failed) end
            end
        end)
    end
}

-- Lua-Error-Handler installieren um ungefangene Fehler zu loggen
local originalErrorHandler = nil

-- Funktion setzt einen benutzerdefinierten Error-Handler, der Fehler protokolliert
function ForteX.installErrorHandler()
    originalErrorHandler = error
    
    -- Override error function to log errors before passing to original handler
    error = function(err, level)
        -- Extrahiere Dateinamen und Zeilennummer aus der Fehlermeldung
        local fileName = "unknown"
        local errorDetails = tostring(err)
        
        -- Typisches Format für Lua-Fehler: [string "filename"]:line: message
        local fileMatch = string.match(errorDetails, '%[string "(.-)"%]:%d+:')
        if fileMatch then
            fileName = fileMatch
        end
        
        -- In die Konsole und Datenbank loggen
        print("^1ForteX Automatischer Error-Log: " .. errorDetails .. "^0")
        
        if ForteX.logError then
            ForteX.logError("Ungefangener Lua-Fehler", {
                source = "error-handler",
                file_name = fileName,
                details = errorDetails,
                error_code = "UNCAUGHT_ERROR"
            })
        end
        
        -- Original error handler aufrufen
        if originalErrorHandler then
            return originalErrorHandler(err, level)
        end
    end
    
    print("^2ForteX: Erweiterter Error-Handler installiert!^0")
}

-- ForteX initialisieren
CreateThread(function()
    print("^3ForteX: Initialisiere ForteX Remote Script Framework v" .. ForteX.version .. "^0")
    
    ForteX.checkLicense(function(valid)
        if valid then
            ForteX.loaded = true
            
            -- Error-Handler installieren
            ForteX.installErrorHandler()
            
            -- Event registrieren, um Skripte von anderen Ressourcen nachladen zu können
            RegisterNetEvent("ForteX:LoadScript")
            AddEventHandler("ForteX:LoadScript", function(path, cb)
                if not path then return end
                
                ForteX.loadRemoteFile(path, function(success, content)
                    if cb then
                        cb(success, content)
                    end
                })
            end)
            
            -- Event zum Laden von mehreren Dateien
            RegisterNetEvent("ForteX:LoadScripts")
            AddEventHandler("ForteX:LoadScripts", function(files, cb)
                if not files or type(files) ~= "table" then return end
                
                ForteX.loadRemoteFiles(files, function(loaded, failed)
                    if cb then
                        cb(loaded, failed)
                    end
                })
            end)
            
            -- Standardmäßige Dateien laden, falls konfiguriert
            if Config.AutoloadFiles and type(Config.AutoloadFiles) == "table" and #Config.AutoloadFiles > 0 then
                print("^3ForteX: Lade " .. #Config.AutoloadFiles .. " konfigurierte Dateien...^0")
                ForteX.loadRemoteFiles(Config.AutoloadFiles)
            end
            
            print("^2ForteX: Erfolgreich initialisiert und betriebsbereit!^0")
            
            -- Log erfolgreiche Initialisierung
            ForteX.logInfo("Framework erfolgreich initialisiert", {
                source = "initialization"
            })
        else
            print("^1ForteX Fehler: Initialisierung fehlgeschlagen - Ungültige Lizenz!^0")
        }
    })
})

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

-- Exportiere Logging-Funktionen damit andere Ressourcen sie nutzen können
exports("logInfo", function(message, options)
    ForteX.logInfo(message, options)
end)

exports("logWarning", function(message, options)
    ForteX.logWarning(message, options)
end)

exports("logError", function(message, options)
    ForteX.logError(message, options)
end)

exports("logDebug", function(message, options)
    ForteX.logDebug(message, options)
end)
