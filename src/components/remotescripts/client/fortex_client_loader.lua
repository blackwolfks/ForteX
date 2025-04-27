
--[[ 
  ForteX Framework - Client Script Loader
  
  This file handles the execution of client-side scripts that are
  sent from the server.
]]

-- Prefixes for console output
local PREFIX = "^8[^2ForteX Client^8, ^3INFO^8]^0"
local ERROR_PREFIX = "^8[^2ForteX Client^8, ^1ERROR^8]^0"
local SUCCESS_PREFIX = "^8[^2ForteX Client^8, ^2SUCCESS^8]^0"

-- Cache für die Kosatka-Konfiguration
local cachedKosatkaConfig = nil

-- Register event handler for executing client scripts
RegisterNetEvent('fortex:executeClientScript')
AddEventHandler('fortex:executeClientScript', function(fileName, scriptContent)
    print(PREFIX .. " Received client script: " .. fileName)
    
    local func, err = load(scriptContent)
    if not func then
        print(ERROR_PREFIX .. " Compilation error in " .. fileName .. ": " .. tostring(err))
        return
    end
    
    local success, error = pcall(func)
    if not success then
        print(ERROR_PREFIX .. " Execution error in " .. fileName .. ": " .. tostring(error))
    else
        print(SUCCESS_PREFIX .. " Successfully executed " .. fileName)
    end
end)

-- Konfigurationsdatei laden
if CONFIG and CONFIG.ConfigFileName then
    ForteX.LoadFile(CONFIG.ConfigFileName, function(success, data)
        if success then
            local cfg = json.decode(data)
            if cfg and cfg.Signature == CONFIG.ConfigSignature then
                cachedKosatkaConfig = cfg
                print(SUCCESS_PREFIX .. " Config '" .. CONFIG.ConfigFileName .. "' erfolgreich geladen & validiert!")
            else
                print(ERROR_PREFIX .. " Ungültige Config oder falsche Signatur! Erwartet: " .. CONFIG.ConfigSignature)
            end
        else
            print(ERROR_PREFIX .. " Fehler beim Laden der Config-Datei: " .. CONFIG.ConfigFileName)
        end
    end)
end

print(PREFIX .. " Client loader initialized")

