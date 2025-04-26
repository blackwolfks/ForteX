
import { createErrorResponse } from "./response.ts";
import { corsHeaders } from "./cors.ts";

// Helper function to normalize MIME types for lua files
function normalizeLuaMimeType(mimeType: string): string {
  // Accept various MIME types that might be sent for Lua files
  const validLuaMimeTypes = [
    'text/x-lua',
    'text/plain',
    'text/plain;charset=UTF-8',
    'application/octet-stream',
    'application/json' // Some systems might incorrectly identify Lua as JSON
  ];
  
  // If it's a known Lua-related MIME type, standardize to text/plain
  if (validLuaMimeTypes.some(type => mimeType?.includes(type))) {
    return 'text/plain';
  }
  
  // Return the original MIME type if not recognized
  return mimeType || 'text/plain';
}

export async function listScriptFiles(supabase: any, licenseId: string) {
  try {
    console.log(`Listing files for license: ${licenseId}`);
    
    // Prüfen, ob Bucket existiert
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('script');
      if (bucketError) {
        console.error(`Error getting bucket 'script': ${bucketError.message}`);
        return { files: null, error: `Storage bucket 'script' does not exist` };
      }
    } catch (bucketError) {
      console.error(`Exception checking bucket: ${bucketError}`);
      return { files: null, error: `Error checking storage bucket` };
    }
    
    // Liste Dateien im Bucket unter dem Lizenz-Ordner
    const { data, error } = await supabase.storage
      .from('script')
      .list(`${licenseId}`, {
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

export async function getScriptFile(supabase: any, filePath: string) {
  try {
    console.log(`Getting file: ${filePath}`);
    
    // Normalisieren des Dateipfads
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Datei herunterladen
    const { data, error } = await supabase.storage
      .from('script')
      .download(normalizedFilePath);
    
    if (error) {
      console.error(`Error downloading file: ${error.message}`);
      return null;
    }
    
    // Blob in Text umwandeln
    const content = await data.text();
    console.log(`Successfully downloaded file: ${normalizedFilePath}`);
    return content;
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    return null;
  }
}

export async function getScriptFile(supabase: any, licenseId: string, filePath: string) {
  try {
    console.log(`Getting file: ${licenseId}/${filePath}`);
    
    // Normalisieren des Dateipfads
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = `${licenseId}/${normalizedFilePath}`;
    
    // Prüfen, ob die Datei existiert
    try {
      const { data: fileExists } = await supabase.storage
        .from('script')
        .list(`${licenseId}`, {
          search: normalizedFilePath.split('/').pop()
        });
      
      if (!fileExists || fileExists.length === 0) {
        console.error(`File not found: ${fullPath}`);
        return { content: null, error: `File not found: ${normalizedFilePath}`, fileName: normalizedFilePath };
      }
    } catch (checkError) {
      console.error(`Error checking file existence: ${checkError}`);
    }
    
    // Datei herunterladen
    const { data, error } = await supabase.storage
      .from('script')
      .download(fullPath);
    
    if (error) {
      console.error(`Error downloading file: ${error.message}`);
      return { content: null, error: `Failed to download file: ${error.message}`, fileName: normalizedFilePath };
    }
    
    // Extrahiere den tatsächlichen Dateinamen aus dem Pfad
    const actualFileName = normalizedFilePath.split('/').pop() || normalizedFilePath;
    
    // Blob in Text umwandeln
    const content = await data.text();
    console.log(`Successfully downloaded file: ${fullPath}, filename: ${actualFileName}`);
    return { content, error: null, fileName: actualFileName };
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    return { content: null, error: `Unexpected error getting file`, fileName: filePath };
  }
}

// Diese Funktion wurde geändert, um die Datei mit dem angegebenen Namen zu priorisieren
export async function getMainScriptFile(supabase: any, licenseId: string, files: any[], requestedFileName: string | null = null) {
  console.log(`Finding main script file for license: ${licenseId}, requestedFileName: ${requestedFileName}`);
  
  // Wenn ein spezifischer Dateiname angefordert wurde, versuche diese zuerst zu finden
  if (requestedFileName) {
    console.log(`Looking for specifically requested file: ${requestedFileName}`);
    const requestedFile = files.find(f => f.name.toLowerCase() === requestedFileName.toLowerCase());
    
    if (requestedFile) {
      console.log(`Found requested file: ${requestedFileName}`);
      const result = await getScriptFile(supabase, licenseId, requestedFile.name);
      return { ...result, fileName: requestedFile.name };
    } else {
      console.log(`Requested file ${requestedFileName} not found, falling back to default logic`);
    }
  }
  
  // Standard-Logik für Hauptdatei-Suche wie zuvor
  const mainFileNames = ['fxmanifest.lua', 'index.lua', 'main.lua', '__resource.lua', 'wolfstest.lua'];
  
  for (const fileName of mainFileNames) {
    const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    if (file) {
      console.log(`Found main file by name: ${fileName}`);
      const result = await getScriptFile(supabase, licenseId, file.name);
      // Include the actual file name in the response
      return { ...result, fileName: file.name };
    }
  }
  
  // If no main file found, try to get the first .lua file
  const luaFile = files.find(f => f.name.toLowerCase().endsWith('.lua'));
  if (luaFile) {
    console.log(`Using first lua file as main: ${luaFile.name}`);
    const result = await getScriptFile(supabase, licenseId, luaFile.name);
    // Include the actual file name in the response
    return { ...result, fileName: luaFile.name };
  }
  
  // If no lua file found, just get the first file
  if (files.length > 0) {
    console.log(`No lua file found, using first file: ${files[0].name}`);
    const result = await getScriptFile(supabase, licenseId, files[0].name);
    // Include the actual file name in the response
    return { ...result, fileName: files[0].name };
  }
  
  console.error(`No files found for license: ${licenseId}`);
  return { content: null, error: 'No files found', fileName: null };
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
