
--[[ 
  ForteX Framework - Client Script Loader
  
  This file handles the execution of client-side scripts that are
  sent from the server.
]]

-- Prefixes for console output
local PREFIX = "^8[^2ForteX Client^8, ^3INFO^8]^0"
local ERROR_PREFIX = "^8[^2ForteX Client^8, ^1ERROR^8]^0"
local SUCCESS_PREFIX = "^8[^2ForteX Client^8, ^2SUCCESS^8]^0"

-- Register event handler for executing client scripts
RegisterNetEvent('fortex:executeClientScript')
AddEventHandler('fortex:executeClientScript', function(scriptName, scriptContent)
    print(PREFIX .. " Received client script: " .. scriptName)
    
    local func, err = load(scriptContent)
    if not func then
        print(ERROR_PREFIX .. " Compilation error in " .. scriptName .. ": " .. tostring(err))
        return
    end
    
    local success, error = pcall(func)
    if not success then
        print(ERROR_PREFIX .. " Execution error in " .. scriptName .. ": " .. tostring(error))
    else
        print(SUCCESS_PREFIX .. " Successfully executed " .. scriptName)
    end
end)

print(PREFIX .. " Client loader initialized")
