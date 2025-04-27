
-- Script loading and execution core functionality
local Logger = require("utils/logger")
local Validator = require("utils/validator")

local function ExecuteScript(fileName, content)
    Logger.log("Loading file: ^3" .. fileName .. "^7")
    
    local func, err = load(content)
    if func then
        local success, error = pcall(func)
        if success then
            Logger.success("Script ^3" .. fileName .. "^0 loaded successfully")
        else
            Logger.error("Error executing " .. fileName .. ": " .. tostring(error))
        end
    else
        Logger.error("Error compiling " .. fileName .. ": " .. tostring(err))
    end
end

local function LoadRemoteScripts(scripts)
    if type(scripts) ~= "table" then
        Logger.error("Invalid script format received")
        return false
    end
    
    Logger.success("Found script files:")
    local fileCount = 0
    for fileName, _ in pairs(scripts) do
        fileCount = fileCount + 1
        Logger.log("^3" .. fileCount .. ".^7 " .. fileName)
    end
    Logger.success("Total ^3" .. fileCount .. "^7 script files found")
    
    for fileName, content in pairs(scripts) do
        local isValid, scriptOrError = Validator.ValidateScript(content)
        if isValid then
            ExecuteScript(fileName, content)
        else
            Logger.error("Validation failed for " .. fileName .. ": " .. scriptOrError)
        end
    end
    
    return true
end

return {
    LoadRemoteScripts = LoadRemoteScripts
}
