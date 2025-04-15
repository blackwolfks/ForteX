
import { createErrorResponse } from "./response.ts";
import { corsHeaders } from "./cors.ts";

// Alle Referenzen von 'script' zu 'websites' ändern
export async function listScriptFiles(supabase: any, licenseId: string) {
  try {
    console.log(`Listing files for license: ${licenseId}`);
    
    // Prüfen, ob Bucket existiert
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('websites');
      if (bucketError) {
        console.error(`Error getting bucket 'websites': ${bucketError.message}`);
        return { files: null, error: `Storage bucket 'websites' does not exist` };
      }
    } catch (bucketError) {
      console.error(`Exception checking bucket: ${bucketError}`);
      return { files: null, error: `Error checking storage bucket` };
    }
    
    // Liste Dateien im Bucket unter dem Lizenz-Ordner
    const { data, error } = await supabase.storage
      .from('websites')
      .list(`scripts/${licenseId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error listing files: ${error.message}`);
      return { files: null, error: `Failed to list files: ${error.message}` };
    }
    
    console.log(`Found ${data?.length || 0} files for license ${licenseId}`);
    return { files: data, error: null };
  } catch (error) {
    console.error(`Exception in listScriptFiles: ${error}`);
    return { files: null, error: `Unexpected error listing files` };
  }
}

export async function getScriptFile(supabase: any, licenseId: string, filePath: string) {
  try {
    console.log(`Getting file: ${licenseId}/${filePath}`);
    
    // Normalisieren des Dateipfads
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = `scripts/${licenseId}/${normalizedFilePath}`;
    
    // Prüfen, ob die Datei existiert
    try {
      const { data: fileExists } = await supabase.storage
        .from('websites')
        .list(`scripts/${licenseId}`, {
          search: normalizedFilePath.split('/').pop()
        });
      
      if (!fileExists || fileExists.length === 0) {
        console.error(`File not found: ${fullPath}`);
        return { content: null, error: `File not found: ${normalizedFilePath}` };
      }
    } catch (checkError) {
      console.error(`Error checking file existence: ${checkError}`);
    }
    
    // Datei herunterladen
    const { data, error } = await supabase.storage
      .from('websites')
      .download(fullPath);
    
    if (error) {
      console.error(`Error downloading file: ${error.message}`);
      return { content: null, error: `Failed to download file: ${error.message}` };
    }
    
    // Blob in Text umwandeln
    const content = await data.text();
    console.log(`Successfully downloaded file: ${fullPath}`);
    return { content, error: null };
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    return { content: null, error: `Unexpected error getting file` };
  }
}

// Gleiche Anpassungen für getMainScriptFile
export async function getMainScriptFile(supabase: any, licenseId: string, files: any[]) {
  console.log(`Finding main script file for license: ${licenseId}`);
  
  // First try to find important files by name
  const mainFileNames = ['fxmanifest.lua', 'index.lua', 'main.lua', '__resource.lua'];
  
  for (const fileName of mainFileNames) {
    const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    if (file) {
      console.log(`Found main file by name: ${fileName}`);
      return await getScriptFile(supabase, licenseId, file.name);
    }
  }
  
  // If no main file found, try to get the first .lua file
  const luaFile = files.find(f => f.name.toLowerCase().endsWith('.lua'));
  if (luaFile) {
    console.log(`Using first lua file as main: ${luaFile.name}`);
    return await getScriptFile(supabase, licenseId, luaFile.name);
  }
  
  // If no lua file found, just get the first file
  if (files.length > 0) {
    console.log(`No lua file found, using first file: ${files[0].name}`);
    return await getScriptFile(supabase, licenseId, files[0].name);
  }
  
  console.error(`No files found for license: ${licenseId}`);
  return { content: null, error: 'No files found' };
}

// Generate a sample script if no script files are found
export function generateSampleScript(licenseData: any) {
  const licenseKey = licenseData?.license_key || 'XXXX-XXXX-XXXX-XXXX';
  const serverKey = licenseData?.server_key || 'XXXXXXXXXXXX';
  
  return `-- ForteX Framework - Beispiel Skript
-- Generiert für Lizenz: ${licenseKey}

-- Konfiguration
local CONFIG = {
    LicenseKey = "${licenseKey}",  -- Ihr Lizenzschlüssel
    ServerKey = "${serverKey}",    -- Ihr Server-Key
    Debug = true                   -- Debug-Modus aktivieren
}

-- Variablen
local isInitialized = false

-- Funktionen
function Initialize()
    if isInitialized then return end
    
    print("ForteX Script wird initialisiert...")
    print("Lizenz: " .. CONFIG.LicenseKey)
    
    -- Hier können Sie weitere Initialisierungsschritte hinzufügen
    
    isInitialized = true
    print("ForteX Script erfolgreich initialisiert!")
end

-- Registriere Ereignisse
RegisterNetEvent("fortex:initialize")
AddEventHandler("fortex:initialize", Initialize)

-- Initialisiere beim Ressourcenstart
AddEventHandler("onResourceStart", function(resourceName) 
    if GetCurrentResourceName() ~= resourceName then return end
    Initialize()
end)

-- Beispielfunktion zur Verwendung in Ihrem Skript
function GetForteXVersion()
    return "1.0.0"
end

print("ForteX Script geladen. Verwenden Sie die 'fortex:initialize' Event, um es zu initialisieren.")
`;
}
