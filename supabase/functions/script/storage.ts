
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

// Unified getScriptFile function that handles multiple input scenarios
export async function getScriptFile(supabase: any, licenseIdOrData: string | any, filePath?: string) {
  // Case 1: When called with a license data object (from older code)
  if (typeof licenseIdOrData === 'object' && licenseIdOrData !== null) {
    const licenseData = licenseIdOrData;
    const folderPath = `${licenseData.id}/`;
    
    console.log(`Searching storage folder: ${folderPath}`);
    
    // List all files in the folder
    const { data: files, error } = await supabase.storage.from('script').list(folderPath);
    
    if (error) {
      console.error("Error listing files:", error);
      return null;
    }
    
    if (!files || files.length === 0) {
      console.warn("No files found in folder:", folderPath);
      return null;
    }
    
    // Search for the first .lua file
    const luaFile = files.find(file => file.name.endsWith('.lua'));
    
    if (!luaFile) {
      console.warn(`No .lua file found in folder ${folderPath}`);
      return null;
    }
    
    const downloadPath = `${folderPath}${luaFile.name}`;
    console.log(`Found file: ${downloadPath}`);
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage.from('script').download(downloadPath);
    
    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError);
      return null;
    }
    
    // Return file content as text
    const scriptContent = await fileData.text();
    
    console.log(`Script file '${luaFile.name}' successfully loaded.`);
    
    return scriptContent;
  }
  
  // Case 2: When called with licenseId and filePath (from newer code)
  else if (typeof licenseIdOrData === 'string' && filePath) {
    const licenseId = licenseIdOrData;
    try {
      console.log(`Getting file: ${licenseId}/${filePath}`);
      
      // Normalize the file path
      const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const fullPath = `${licenseId}/${normalizedFilePath}`;
      
      // Check if the file exists
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
      
      // Download the file
      const { data, error } = await supabase.storage
        .from('script')
        .download(fullPath);
      
      if (error) {
        console.error(`Error downloading file: ${error.message}`);
        return { content: null, error: `Failed to download file: ${error.message}`, fileName: normalizedFilePath };
      }
      
      // Extract the actual filename from the path
      const actualFileName = normalizedFilePath.split('/').pop() || normalizedFilePath;
      
      // Convert blob to text
      const content = await data.text();
      console.log(`Successfully downloaded file: ${fullPath}, filename: ${actualFileName}`);
      return { content, error: null, fileName: actualFileName };
    } catch (error) {
      console.error(`Exception in getScriptFile: ${error}`);
      return { content: null, error: `Unexpected error getting file`, fileName: filePath };
    }
  }
  
  // Case 3: Direct file path (legacy support)
  else if (typeof licenseIdOrData === 'string' && !filePath) {
    try {
      console.log(`Getting file with direct path: ${licenseIdOrData}`);
      const normalizedFilePath = licenseIdOrData.startsWith('/') ? licenseIdOrData.substring(1) : licenseIdOrData;
      
      const { data, error } = await supabase.storage
        .from('script')
        .download(normalizedFilePath);
      
      if (error) {
        console.error(`Error downloading file: ${error.message}`);
        return null;
      }
      
      const content = await data.text();
      console.log(`Successfully downloaded file: ${normalizedFilePath}`);
      return content;
    } catch (error) {
      console.error(`Exception in getScriptFile (direct path): ${error}`);
      return null;
    }
  }
  
  console.error("Invalid parameters provided to getScriptFile");
  return null;
}
