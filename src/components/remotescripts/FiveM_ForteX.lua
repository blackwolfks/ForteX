
--[[ 
  ForteX Framework - Remote Script Loader
  Modular implementation for secure remote script loading
]]

local Logger = require("utils/logger")
local Base64 = require("utils/base64")
local ScriptLoader = require("core/loader")

-- Show logo on startup
Logger.ShowASCIILogo()

-- Load configuration
local resourceName = GetCurrentResourceName()
local configFile = LoadResourceFile(resourceName, "config.lua")

if not configFile then
    Logger.error("Error: config.lua could not be loaded")
    return
end

-- Execute config file
local configFunc, configError = load(configFile)
if not configFunc then
    Logger.error("Error loading config.lua: " .. tostring(configError))
    return
end

configFunc()

-- Validate configuration
if not CONFIG then
    Logger.error("Error: CONFIG table not found")
    return
end

if not CONFIG.LicenseKey or not CONFIG.ServerKey then
    Logger.error("Error: License key or ServerKey not configured")
    Logger.error("Please enter valid values in config.lua")
    return
end

-- Display configuration
Logger.success("Configuration loaded:")
Logger.success("License key = '" .. CONFIG.LicenseKey .. "'")
Logger.success("Server-Key = '" .. CONFIG.ServerKey .. "'")
Logger.success("Debug mode = " .. tostring(CONFIG.Debug))

if not CONFIG.ServerUrl then
    CONFIG.ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/verify-license"
    Logger.debug("Warning: ServerUrl not configured, using default URL", CONFIG.Debug)
end

Logger.success("Server-URL = " .. CONFIG.ServerUrl)

-- Main script loading function
local function LoadRemoteScript()
    Logger.log("Loading remote script...")
    Logger.log("Using license key: '" .. CONFIG.LicenseKey .. "' and server key: '" .. CONFIG.ServerKey .. "'")
    Logger.log("Server-URL: " .. CONFIG.ServerUrl)
    
    local auth = Base64.base64encode(CONFIG.LicenseKey .. ":" .. CONFIG.ServerKey)
    
    PerformHttpRequest(CONFIG.ServerUrl, function(statusCode, responseData, responseHeaders)
        if statusCode ~= 200 then
            Logger.error("Error fetching script: " .. tostring(statusCode))
            return
        end
        
        local scripts = json.decode(responseData)
        if not scripts then
            Logger.error("Invalid response format")
            return
        end
        
        ScriptLoader.LoadRemoteScripts(scripts)
    end, "GET", "", {
        ["Authorization"] = "Basic " .. auth,
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey,
        ["User-Agent"] = "FiveM-ForteX/1.0",
        ["Accept"] = "application/json"
    })
end

-- Register commands and event handlers
RegisterCommand('fortex_reload', function(source, args, rawCommand)
    if source == 0 then
        Logger.log("Manual reload of remote script...")
        Logger.ShowASCIILogo()
        LoadRemoteScript()
    end
end, true)

RegisterCommand('fortex_config', function(source, args, rawCommand)
    if source == 0 then
        print("^2Current ForteX Configuration:^0")
        print("^3License Key: ^0" .. CONFIG.LicenseKey)
        print("^3Server Key: ^0" .. CONFIG.ServerKey)
        print("^3Server URL: ^0" .. CONFIG.ServerUrl)
        print("^3Debug Mode: ^0" .. tostring(CONFIG.Debug or false))
        print("^3Auto-Update: ^0" .. tostring(CONFIG.AutoUpdate or false))
    end
end, true)

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        Logger.success("Resource started")
        Logger.ShowASCIILogo()
        Wait(1000)
        LoadRemoteScript()
    end
end)

-- Setup auto-update if enabled
if CONFIG.AutoUpdate then
    Citizen.CreateThread(function()
        while true do
            Wait(CONFIG.UpdateInterval * 60000)
            Logger.debug("Performing automatic update...", CONFIG.Debug)
            LoadRemoteScript()
        end
    end)
end

Logger.success("Framework initialized")
