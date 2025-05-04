
import { createErrorResponse } from "./response.ts";
import { corsHeaders } from "./cors.ts";

// Forward declaration for the logToSystem function
// This is defined in handlers.ts but we need to declare it here to use it
async function logToSystem(
  supabase: any,
  licenseId: string | null,
  level: 'info' | 'warning' | 'error' | 'debug',
  message: string,
  source: string,
  details?: string,
  errorCode?: string,
  clientIp?: string,
  fileName?: string
): Promise<boolean> {
  try {
    if (!licenseId) {
      console.warn("Cannot log: Missing license ID");
      return false;
    }
    
    console.log(`Logging to system: [${level}] ${message}`);
    
    const logUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/log";
    
    const response = await fetch(logUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        license_id: licenseId,
        level,
        message,
        source,
        details,
        error_code: errorCode,
        client_ip: clientIp,
        file_name: fileName
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from logging service: ${response.status} ${errorText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception while logging to system:", error);
    return false;
  }
}

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
      await logToSystem(
        supabase,
        licenseId,
        'error',
        'Error accessing storage',
        'storage',
        JSON.stringify(listError),
        'E3001'
      );
      return { content: null, error: "Error accessing storage" };
    }
    
    if (!files || files.length === 0) {
      console.warn("No files found in folder:", licenseId);
      await logToSystem(
        supabase,
        licenseId,
        'warning',
        'No files found in storage',
        'storage',
        `No files found in folder ${licenseId}`,
        'W3001'
      );
      return { content: null, error: "No files found" };
    }
    
    // Find the first .lua file
    const luaFile = files.find(file => file.name.endsWith('.lua'));
    
    if (!luaFile) {
      console.warn(`No .lua file found in folder ${licenseId}`);
      await logToSystem(
        supabase,
        licenseId,
        'warning',
        'No .lua file found',
        'storage',
        `No .lua file found in folder ${licenseId}`,
        'W3002'
      );
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
      await logToSystem(
        supabase,
        licenseId,
        'error',
        'Error downloading file',
        'storage',
        JSON.stringify(downloadError),
        'E3002',
        null,
        luaFile.name
      );
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
    await logToSystem(
      supabase,
      licenseId,
      'info',
      `Script file loaded successfully`,
      'storage',
      `File: ${luaFile.name}`,
      null,
      null,
      luaFile.name
    );
    
    return { content, error: null };
    
  } catch (error) {
    console.error(`Exception in getScriptFile: ${error}`);
    await logToSystem(
      supabase,
      licenseId,
      'error',
      'Unexpected error getting file',
      'storage',
      String(error),
      'E3099'
    );
    return { content: null, error: "Unexpected error getting file" };
  }
}

export async function getAllScriptFiles(supabase: any, licenseId: string) {
  try {
    if (!licenseId) {
      console.error("No license ID provided");
      return { content: null, error: "License ID is required" };
    }

    console.log(`Fetching script files for license ID: ${licenseId}`);
    
    // First we need to check which files are publicly accessible
    try {
      const { data: fileAccess, error: accessError } = await supabase
        .from('script_file_access')
        .select('*')
        .eq('license_id', licenseId);
        
      if (accessError) {
        console.error("Error fetching file access settings:", accessError);
        await logToSystem(
          supabase,
          licenseId,
          'error',
          'Failed to fetch file access settings',
          'storage',
          JSON.stringify(accessError),
          'E3003'
        );
        return { content: null, error: "Failed to fetch file access settings" };
      }
      
      // List all files in the license folder
      const { data: files, error: listError } = await supabase.storage
        .from('script')
        .list(licenseId);
      
      if (listError) {
        console.error("Error listing files:", listError);
        await logToSystem(
          supabase,
          licenseId,
          'error',
          'Error listing files in storage',
          'storage',
          JSON.stringify(listError),
          'E3004'
        );
        return { content: null, error: "Error accessing storage" };
      }
      
      if (!files || files.length === 0) {
        console.warn("No files found in folder:", licenseId);
        await logToSystem(
          supabase,
          licenseId,
          'warning',
          'No files found in storage folder',
          'storage',
          `No files found in folder ${licenseId}`,
          'W3003'
        );
        return { content: null, error: "No files found" };
      }
      
      // Find both .lua and .json files
      const validFiles = files.filter(file => 
        file.name.endsWith('.lua') || file.name.endsWith('.json')
      );
      
      if (validFiles.length === 0) {
        console.warn(`No .lua or .json files found in folder ${licenseId}`);
        await logToSystem(
          supabase,
          licenseId,
          'warning',
          'No .lua or .json files found',
          'storage',
          `No .lua or .json files found in folder ${licenseId}`,
          'W3004'
        );
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
          await logToSystem(
            supabase,
            licenseId,
            'error',
            `Error downloading file: ${file.name}`,
            'storage',
            JSON.stringify(downloadError),
            'E3005',
            null,
            file.name
          );
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
            await logToSystem(
              supabase,
              licenseId,
              'warning',
              `Invalid JSON format in file: ${file.name}`,
              'storage',
              String(e),
              'W3005',
              null,
              file.name
            );
            // We still include the file even if it's invalid JSON
            // so that proper error messages can be shown on the client
          }
        }
        
        scripts[file.name] = content;
        console.log(`File '${file.name}' successfully loaded`);
        await logToSystem(
          supabase,
          licenseId,
          'info',
          `File loaded successfully: ${file.name}`,
          'storage',
          `Size: ${content.length} bytes`,
          null,
          null,
          file.name
        );
      }
      
      return { content: scripts, error: null };
    } catch (accessError) {
      console.error(`Error fetching file access settings: ${accessError}`);
      await logToSystem(
        supabase,
        licenseId,
        'error',
        'Failed to fetch file access settings',
        'storage',
        String(accessError),
        'E3006'
      );
      return { content: null, error: "Failed to fetch file access settings" };
    }
    
  } catch (error) {
    console.error(`Exception in getAllScriptFiles: ${error}`);
    await logToSystem(
      supabase,
      licenseId,
      'error',
      'Unexpected error getting files',
      'storage',
      String(error),
      'E3099'
    );
    return { content: null, error: "Unexpected error getting files" };
  }
}
