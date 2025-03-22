
-- Dieses Datei wird nur für Kompatibilität beibehalten.
-- Bitte benutzen Sie stattdessen config.lua

-- Diese Warnmeldung erscheint nur, wenn die Datei direkt geladen wird
print("^8[^1ForteX^8, ^1WARNUNG^8]^0 ForteX_config.lua ist veraltet. Bitte benutzen Sie stattdessen config.lua.")

-- Initialisiere CONFIG, falls es noch nicht existiert
if not CONFIG then 
    CONFIG = {}
end

-- Wenn keine Konfiguration in config.lua vorhanden ist, setze Standardwerte
if not CONFIG.LicenseKey then
    CONFIG.LicenseKey = "ABCD-EFGH-IJKL-MNOP"
end

if not CONFIG.ServerKey then
    CONFIG.ServerKey = "123456789ABC"
end

if not CONFIG.ServerUrl then
    CONFIG.ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/verify-license"
end

if CONFIG.Debug == nil then
    CONFIG.Debug = true
end

if CONFIG.AutoUpdate == nil then
    CONFIG.AutoUpdate = true
end

if not CONFIG.UpdateInterval then
    CONFIG.UpdateInterval = 60
end
