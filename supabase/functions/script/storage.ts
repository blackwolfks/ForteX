
// Import necessary modules
import { join } from "https://deno.land/std@0.131.0/path/mod.ts";

// Interface for script file content
interface ScriptFile {
  name: string;
  content: string;
  isPublic?: boolean;
}

// Interface for script retrieval result
interface ScriptResult {
  content?: ScriptFile[];
  error?: Error;
}

// Get all script files for a license
export async function getAllScriptFiles(supabase: any, licenseId: string): Promise<ScriptResult> {
  try {
    console.log(`Fetching script files for license ID: ${licenseId}`);
    
    // Get file access settings
    const { data: accessSettings, error: accessError } = await supabase.rpc("get_file_access_for_license", {
      p_license_id: licenseId
    });
    
    if (accessError) {
      console.error("Error fetching file access settings:", accessError);
      
      // Log error
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "error",
          p_message: "Failed to fetch file access settings",
          p_source: "storage",
          p_details: accessError.message,
          p_error_code: accessError.code || null
        });
      } catch (logError) {
        console.error("Failed to log file access error:", logError);
      }
      
      return { error: new Error("Failed to fetch file access settings") };
    }
    
    console.log(`Found ${accessSettings?.length || 0} file access settings`);
    
    // Create a map of file paths to their access settings
    const accessMap = new Map();
    if (accessSettings && accessSettings.length > 0) {
      for (const setting of accessSettings) {
        accessMap.set(setting.file_path, setting.is_public);
      }
    }
    
    // Get the list of files from storage
    const folderPrefix = licenseId;
    const { data: files, error: listError } = await supabase.storage
      .from('remot-script')
      .list(folderPrefix);
    
    if (listError) {
      console.error("Error listing files:", listError);
      
      // Log error
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "error",
          p_message: "Failed to list script files",
          p_source: "storage",
          p_details: listError.message,
          p_error_code: listError.code || null
        });
      } catch (logError) {
        console.error("Failed to log file listing error:", logError);
      }
      
      return { error: listError };
    }
    
    if (!files || files.length === 0) {
      console.warn("No files found for license", licenseId);
      
      // Log warning
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "warning",
          p_message: "No script files found",
          p_source: "storage",
          p_details: "The license has no associated script files"
        });
      } catch (logError) {
        console.error("Failed to log no files warning:", logError);
      }
      
      return { content: [] };
    }
    
    console.log(`Found ${files.length} files in storage`);
    
    // Filter only files (not folders)
    const fileNames = files.filter(file => !file.id.endsWith('/')).map(file => file.name);
    
    // Download and process each file
    const scriptFiles: ScriptFile[] = [];
    
    for (const fileName of fileNames) {
      try {
        const filePath = join(folderPrefix, fileName);
        const { data, error: downloadError } = await supabase.storage
          .from('remot-script')
          .download(filePath);
        
        if (downloadError) {
          console.error(`Error downloading file ${fileName}:`, downloadError);
          continue;
        }
        
        // Convert blob to text
        const content = await data.text();
        const isPublic = accessMap.get(fileName) || false;
        
        scriptFiles.push({
          name: fileName,
          content,
          isPublic
        });
        
        console.log(`Successfully processed file: ${fileName}`);
      } catch (fileError) {
        console.error(`Error processing file ${fileName}:`, fileError);
        
        // Log file error
        try {
          await supabase.rpc("add_script_log", {
            p_license_id: licenseId,
            p_level: "error",
            p_message: `Failed to process file: ${fileName}`,
            p_source: "storage",
            p_details: fileError instanceof Error ? fileError.message : String(fileError),
            p_file_name: fileName
          });
        } catch (logError) {
          console.error("Failed to log file processing error:", logError);
        }
      }
    }
    
    // Log success
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "info",
        p_message: "Script files retrieved successfully",
        p_source: "storage",
        p_details: `Retrieved ${scriptFiles.length} files`
      });
    } catch (logError) {
      console.error("Failed to log successful file retrieval:", logError);
    }
    
    return { content: scriptFiles };
  } catch (error) {
    console.error("Error in getAllScriptFiles:", error);
    
    // Log the unexpected error
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "error",
        p_message: "Unexpected error retrieving script files",
        p_source: "storage",
        p_details: error instanceof Error ? error.message : String(error)
      });
    } catch (logError) {
      console.error("Failed to log unexpected error:", logError);
    }
    
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
