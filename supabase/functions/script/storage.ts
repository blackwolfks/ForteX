
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
    const rawText = await fileData.text();
    
    // Clean the text to remove any HTTP headers or boundary markers
    let content = rawText;
    
    // Remove WebKit form boundaries and other HTTP headers if present
    const luaContentMatch = rawText.match(/Content-Type: text\/x-lua\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}WebKit|$)/i);
    if (luaContentMatch && luaContentMatch[1]) {
      content = luaContentMatch[1];
    } else {
      // Try another pattern that might match
      const altMatch = rawText.match(/Content-Type: text\/.*?\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}|$)/i);
      if (altMatch && altMatch[1]) {
        content = altMatch[1];
      } else {
        // If still can't match specific pattern, just try to remove obvious headers
        const lines = rawText.split('\n');
        const contentStartIndex = lines.findIndex(line => line.trim() === '');
        if (contentStartIndex !== -1 && contentStartIndex < lines.length - 1) {
          content = lines.slice(contentStartIndex + 1).join('\n');
        }
      }
    }
    
    console.log(`Script file '${luaFile.name}' successfully loaded`);
    
    return { content, error: null };
    
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    return { content: null, error: "Unexpected error getting file" };
  }
}
