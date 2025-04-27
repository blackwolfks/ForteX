
-- Logging utilities with consistent formatting
local PREFIX = "^8[^2ForteX^8, ^3INFO^8]^0"
local SUCCESS_PREFIX = "^8[^2ForteX^8, ^2INFO^8]^0"
local ERROR_PREFIX = "^8[^2ForteX^8, ^1INFO^8]^0"
local DEBUG_PREFIX = "^8[^2ForteX^8, ^3INFO DEBUG^8]^0"

local function log(message)
    print(PREFIX .. " " .. message .. "^7")
end

local function success(message)
    print(SUCCESS_PREFIX .. " " .. message .. "^7")
end

local function error(message)
    print(ERROR_PREFIX .. " " .. message .. "^7")
end

local function debug(message, debugMode)
    if debugMode then
        print(DEBUG_PREFIX .. " " .. message .. "^7")
    end
end

local function ShowASCIILogo()
    print("^2")
    print([[
 ######   #####  ######  ####### ####### #     # 
 #       #     # #     #    #    #        #   #  
 #       #     # #     #    #    #         # #   
 ######  #     # #####      #    #####      #   
 #       #     # #   #      #    #         # #    
 #       #     # #    #     #    ####### #     #    
 #        #####  #     #    #    ####### #     #    
]])
    print("^0")
end

return {
    log = log,
    success = success,
    error = error,
    debug = debug,
    ShowASCIILogo = ShowASCIILogo
}
