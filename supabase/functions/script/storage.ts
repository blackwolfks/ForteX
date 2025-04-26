
import { createErrorResponse } from "./response.ts";
import { corsHeaders } from "./cors.ts";

export async function getScriptFile(supabase: any, licenseId: string) {
  try {
    if (!licenseId) {
      console.error("No license ID provided");
      return { content: null, error: "License ID is required" };
    }

    console.log(`Searching for script in storage folder: ${licenseId}/`);
    
    // List all files in the license folder
    const { data: files, error: listError } = await supabase.storage
      .from('script')
      .list(licenseId);
    
    if (listError) {
      console.error("Error listing files:", listError);
      return { content: null, error: "Error accessing storage" };
    }
    
    if (!files || files.length === 0) {
      console.warn("No files found in folder:", licenseId);
      return { content: null, error: "No files found" };
    }
    
    // Find the first .lua file
    const luaFile = files.find(file => file.name.endsWith('.lua'));
    
    if (!luaFile) {
      console.warn(`No .lua file found in folder ${licenseId}`);
      return { content: null, error: "No .lua file found" };
    }
    
    const downloadPath = `${licenseId}/${luaFile.name}`;
    console.log(`Found file: ${downloadPath}`);
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('script')
      .download(downloadPath);
    
    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      return { content: null, error: "Error downloading file" };
    }
    
    // Convert blob to text
    const content = await fileData.text();
    console.log(`Script file '${luaFile.name}' successfully loaded`);
    
    return { content, error: null };
    
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    return { content: null, error: "Unexpected error getting file" };
  }
}

