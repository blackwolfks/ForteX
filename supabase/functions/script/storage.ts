
// Import the required modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ScriptResult {
  content?: any;
  error?: Error | null;
}

// Get all script files for a license
export async function getAllScriptFiles(supabase: any, licenseId: string): Promise<ScriptResult> {
  try {
    console.log(`Fetching files for license ID: ${licenseId}`);

    // First, check if there are any files in storage
    const { data: files, error: listError } = await supabase.storage
      .from("script")
      .list(`${licenseId}`);

    if (listError) {
      console.error("Error listing files:", listError);
      await logStorageError(supabase, licenseId, "error", "Failed to list script files", listError.message);
      return { error: listError };
    }

    if (!files || files.length === 0) {
      console.log("No files found for this license");
      await logStorageAccess(supabase, licenseId, "info", "No files found for this license", "storage");
      return { content: [] };
    }

    console.log(`Found ${files.length} files for license ID ${licenseId}`);

    // Get file access settings to determine which files should be included
    const { data: fileAccessData, error: accessError } = await supabase.rpc("get_file_access_for_license", {
      p_license_id: licenseId,
    });

    if (accessError) {
      console.error("Error getting file access settings:", accessError);
      await logStorageError(supabase, licenseId, "error", "Failed to get file access settings", accessError.message);
    }

    // Create a map of file paths to access settings
    const fileAccessMap = new Map();
    if (fileAccessData && Array.isArray(fileAccessData)) {
      fileAccessData.forEach(access => {
        fileAccessMap.set(access.file_path, access.is_public);
      });
    }

    // Filter files to include only public ones
    const publicFiles = files.filter(file => {
      const filePath = `${licenseId}/${file.name}`;
      const isPublic = fileAccessMap.get(filePath) || false;
      return isPublic;
    });

    if (publicFiles.length === 0) {
      console.log("No public files available for this license");
      await logStorageAccess(supabase, licenseId, "warning", "No public files available", "storage", "All files are set to private");
      return { content: [] };
    }

    // Fetch all public files
    const scriptFiles = [];
    for (const file of publicFiles) {
      const filePath = `${licenseId}/${file.name}`;
      
      // Download file
      const { data, error: downloadError } = await supabase.storage
        .from("script")
        .download(filePath);

      if (downloadError) {
        console.error(`Error downloading file ${file.name}:`, downloadError);
        await logStorageError(supabase, licenseId, "error", `Failed to download file: ${file.name}`, downloadError.message, file.name);
        continue;
      }

      // Convert file to text
      const text = await data.text();
      scriptFiles.push({
        name: file.name,
        content: text,
      });
      
      await logStorageAccess(supabase, licenseId, "info", `File accessed: ${file.name}`, "storage");
    }

    console.log(`Successfully processed ${scriptFiles.length} public files`);
    return { content: scriptFiles };
  } catch (error) {
    console.error("Error in getAllScriptFiles:", error);
    try {
      await logStorageError(
        supabase, 
        licenseId, 
        "error", 
        "General error accessing script files", 
        error instanceof Error ? error.message : String(error)
      );
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Helper function to log storage access
async function logStorageAccess(
  supabase: any, 
  licenseId: string, 
  level: string, 
  message: string, 
  source: string, 
  details: string | null = null
) {
  try {
    await supabase.rpc("add_script_log", {
      p_license_id: licenseId,
      p_level: level,
      p_message: message,
      p_source: source,
      p_details: details
    });
  } catch (error) {
    console.error("Error logging storage access:", error);
  }
}

// Helper function to log storage errors
async function logStorageError(
  supabase: any, 
  licenseId: string, 
  level: string, 
  message: string, 
  details: string | null = null,
  fileName: string | null = null
) {
  try {
    await supabase.rpc("add_script_log", {
      p_license_id: licenseId,
      p_level: level,
      p_message: message,
      p_source: "storage",
      p_details: details,
      p_file_name: fileName
    });
  } catch (error) {
    console.error("Error logging storage error:", error);
  }
}
