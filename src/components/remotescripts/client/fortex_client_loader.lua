
--[[ 
  ForteX Framework - Client Script Loader
  
  This file handles the execution of client-side scripts that are
  sent from the server.
]]

-- Prefixes for console output
local PREFIX = "^8[^2ForteX Client^8, ^3INFO^8]^0"
local ERROR_PREFIX = "^8[^2ForteX Client^8, ^1ERROR^8]^0"
local SUCCESS_PREFIX = "^8[^2ForteX Client^8, ^2SUCCESS^8]^0"
local DEBUG_PREFIX = "^8[^2ForteX Client^8, ^5DEBUG^8]^0"

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

-- Function to handle JSON parsing with better error handling
local function SafeJsonDecode(jsonString, fileName)
    if not jsonString or jsonString == "" then
        print(ERROR_PREFIX .. " Empty content for " .. fileName)
        return nil
    end
    
    -- Try to decode the JSON content
    local success, result = pcall(json.decode, jsonString)
    
    if not success then
        print(ERROR_PREFIX .. " JSON parsing error in " .. fileName .. ": " .. tostring(result))
        
        -- Debug the JSON content
        if CONFIG and CONFIG.Debug then
            print(DEBUG_PREFIX .. " JSON content preview: " .. jsonString:sub(1, 100) .. (jsonString:len() > 100 and "..." or ""))
            
            -- Try to identify common JSON errors
            if jsonString:match("'") then
                print(DEBUG_PREFIX .. " Hint: JSON uses double quotes (\"), not single quotes (').")
            end
            
            if not jsonString:match("^%s*{") then
                print(DEBUG_PREFIX .. " Hint: JSON objects should start with '{'.")
            end
            
            if jsonString:match(",%s*}") then
                print(DEBUG_PREFIX .. " Hint: JSON doesn't allow trailing commas before closing brackets.")
            end
        end
        
        return nil
    end
    
    return result
end

-- Konfigurationsdatei laden
if CONFIG and CONFIG.ConfigFileName then
    ForteX.LoadFile(CONFIG.ConfigFileName, function(success, data)
        if success then
            local fileName = CONFIG.ConfigFileName
            print(DEBUG_PREFIX .. " Config loaded, file size: " .. tostring(#data) .. " bytes")
            
            -- Handle file extension specifically
            local fileExt = fileName:match("%.([^%.]+)$"):lower()
            if fileExt == "json" then
                local cfg = SafeJsonDecode(data, fileName)
                if cfg and cfg.Signature == CONFIG.ConfigSignature then
                    cachedKosatkaConfig = cfg
                    print(SUCCESS_PREFIX .. " Config '" .. fileName .. "' successfully loaded & validated!")
                else
                    print(ERROR_PREFIX .. " Invalid config or wrong signature! Expected: " .. CONFIG.ConfigSignature)
                end
            elseif fileExt == "lua" then
                local func, err = load(data)
                if func then
                    local success, cfg = pcall(func)
                    if success and cfg and cfg.Signature == CONFIG.ConfigSignature then
                        cachedKosatkaConfig = cfg
                        print(SUCCESS_PREFIX .. " Config '" .. fileName .. "' successfully loaded & validated!")
                    else
                        print(ERROR_PREFIX .. " Invalid config or wrong signature! Expected: " .. CONFIG.ConfigSignature)
                    end
                else
                    print(ERROR_PREFIX .. " Error compiling Lua config: " .. tostring(err))
                end
            else
                print(ERROR_PREFIX .. " Unsupported file extension: " .. fileExt)
            end
        else
            print(ERROR_PREFIX .. " Error loading config file: " .. CONFIG.ConfigFileName)
        end
    end)
end

print(PREFIX .. " Client loader initialized")
