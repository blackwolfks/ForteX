
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

export async function getAllScriptFiles(supabase: any, licenseId: string) {
  try {
    if (!licenseId) {
      console.error("No license ID provided");
      return { content: null, error: "License ID is required" };
    }

    console.log(`Searching for scripts in storage folder: ${licenseId}/`);
    
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
    
    // Find both .lua and .json files
    const validFiles = files.filter(file => 
      file.name.endsWith('.lua') || file.name.endsWith('.json')
    );
    
    if (validFiles.length === 0) {
      console.warn(`No .lua or .json files found in folder ${licenseId}`);
      return { content: null, error: "No .lua or .json files found" };
    }
    
    const scripts: Record<string, string> = {};
    
    // Download each valid file
    for (const file of validFiles) {
      const downloadPath = `${licenseId}/${file.name}`;
      console.log(`Processing file: ${downloadPath}`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('script')
        .download(downloadPath);
      
      if (downloadError) {
        console.error(`Error downloading file ${file.name}:`, downloadError);
        continue;
      }
      
      // Convert blob to text and clean it
      const rawText = await fileData.text();
      
      // Clean the text depending on file type
      let content = rawText;
      
      if (file.name.endsWith('.lua')) {
        // Remove WebKit form boundaries and other HTTP headers if present for Lua files
        const luaContentMatch = rawText.match(/Content-Type: text\/x-lua\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}WebKit|$)/i);
        if (luaContentMatch && luaContentMatch[1]) {
          content = luaContentMatch[1];
        } else {
          // Try another pattern that might match
          const altMatch = rawText.match(/Content-Type: text\/.*?\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}|$)/i);
          if (altMatch && altMatch[1]) {
            content = altMatch[1];
          }
        }
      } else if (file.name.endsWith('.json')) {
        try {
          // Just to validate JSON format, we parse it and don't modify the content
          JSON.parse(content);
          console.log(`JSON file '${file.name}' validated successfully`);
        } catch (e) {
          console.error(`Invalid JSON format in file ${file.name}:`, e);
          console.error(`JSON content preview: ${content.substring(0, 100)}...`);
          // We still include the file even if it's invalid JSON
          // so that proper error messages can be shown on the client
        }
      }
      
      scripts[file.name] = content;
      console.log(`File '${file.name}' successfully loaded`);
    }
    
    return { content: scripts, error: null };
    
  } catch (error) {
    console.error(`Exception in getAllScriptFiles: ${error}`);
    return { content: null, error: "Unexpected error getting files" };
  }
}
