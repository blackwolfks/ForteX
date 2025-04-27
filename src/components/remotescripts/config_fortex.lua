
-- ForteX Framework Konfiguration

CONFIG = {
    -- Ihr Lizenzschlüssel (erhalten Sie von der Web-Admin-Oberfläche)
    LicenseKey = "5cff-b103-2238-9b68",  -- Updated license key from the screenshot
    
    -- Ihr Server-Key (erhalten Sie von der Web-Admin-Oberfläche)
    ServerKey = "bff8d152ba74",  -- Updated server key from the screenshot
    
    -- Die URL des API-Servers - WICHTIG: Verwenden Sie die korrekte Supabase-URL ohne Umleitungen
    ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/verify-license",
    
    -- Script URL für das eigentliche Script - direkt auf den edge function endpoint
    ScriptUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script",
    
    -- Debug-Modus (auf true setzen für mehr Informationen)
    Debug = true,
    
    -- Automatische Updates aktivieren
    AutoUpdate = true,
    
    -- Intervall für automatische Updates (in Minuten)
    UpdateInterval = 60
}
