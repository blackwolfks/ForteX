
-- Script validation utilities
local function ValidateScript(scriptData)
    if not scriptData or scriptData == "" then
        return false, "Empty script received"
    end
    
    if scriptData:find("_G%s-=%s-nil") then
        return false, "Potentially harmful code detected"
    end
    
    return true, scriptData
end

return {
    ValidateScript = ValidateScript
}
