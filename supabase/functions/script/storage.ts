
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

    // Log the start of file fetching
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "info",
        p_message: "Starting file retrieval",
        p_source: "storage",
        p_details: `Fetching files for license: ${licenseId}`
      });
    } catch (logError) {
      console.error("Error logging file fetch start:", logError);
    }

    // First, check if there are any files in storage
    const { data: files, error: listError } = await supabase.storage
      .from("script")
      .list(`${licenseId}`);

    if (listError) {
      console.error("Error listing files:", listError);
      
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
        console.error("Error logging file list error:", logError);
      }
      
      return { error: listError };
    }

    if (!files || files.length === 0) {
      console.log("No files found for this license");
      
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "info",
          p_message: "No files found for this license",
          p_source: "storage",
          p_details: "The storage bucket is empty for this license"
        });
      } catch (logError) {
        console.error("Failed to log no files found:", logError);
      }
      
      return { content: [] };
    }

    console.log(`Found ${files.length} files for license ID ${licenseId}`);

    // Get file access settings to determine which files should be included
    const { data: fileAccessData, error: accessError } = await supabase.rpc("get_file_access_for_license", {
      p_license_id: licenseId,
    });

    if (accessError) {
      console.error("Error getting file access settings:", accessError);
      
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "error",
          p_message: "Failed to get file access settings",
          p_source: "storage",
          p_details: accessError.message,
          p_error_code: accessError.code || null
        });
      } catch (logError) {
        console.error("Failed to log access error:", logError);
      }
    }

    // Create a map of file paths to access settings
    const fileAccessMap = new Map();
    if (fileAccessData && Array.isArray(fileAccessData)) {
      fileAccessData.forEach(access => {
        fileAccessMap.set(access.file_path, access.is_public);
      });
      
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "debug",
          p_message: "File access settings loaded",
          p_source: "storage",
          p_details: `Loaded ${fileAccessData.length} access entries`
        });
      } catch (logError) {
        console.error("Failed to log access settings load:", logError);
      }
    }

    // Filter files to include only public ones
    const publicFiles = files.filter(file => {
      const filePath = `${licenseId}/${file.name}`;
      const isPublic = fileAccessMap.get(filePath) || false;
      return isPublic;
    });

    if (publicFiles.length === 0) {
      console.log("No public files available for this license");
      
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "warning",
          p_message: "No public files available",
          p_source: "storage",
          p_details: `Found ${files.length} files, but none are set to public`
        });
      } catch (logError) {
        console.error("Failed to log no public files:", logError);
      }
      
      return { content: [] };
    }

    // Log about public files found
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "info",
        p_message: "Public files found",
        p_source: "storage",
        p_details: `Found ${publicFiles.length} public files out of ${files.length} total files`
      });
    } catch (logError) {
      console.error("Failed to log public files found:", logError);
    }

    // Fetch all public files
    const scriptFiles = [];
    for (const file of publicFiles) {
      const filePath = `${licenseId}/${file.name}`;
      
      // Log file download attempt
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "debug",
          p_message: `Downloading file: ${file.name}`,
          p_source: "storage",
          p_file_name: file.name
        });
      } catch (logError) {
        console.error("Failed to log file download attempt:", logError);
      }
      
      // Download file
      const { data, error: downloadError } = await supabase.storage
        .from("script")
        .download(filePath);

      if (downloadError) {
        console.error(`Error downloading file ${file.name}:`, downloadError);
        
        try {
          await supabase.rpc("add_script_log", {
            p_license_id: licenseId,
            p_level: "error",
            p_message: `Failed to download file: ${file.name}`,
            p_source: "storage",
            p_details: downloadError.message,
            p_error_code: downloadError.code || null,
            p_file_name: file.name
          });
        } catch (logError) {
          console.error("Failed to log download error:", logError);
        }
        
        continue;
      }

      // Convert file to text
      const text = await data.text();
      scriptFiles.push({
        name: file.name,
        content: text,
      });
      
      try {
        await supabase.rpc("add_script_log", {
          p_license_id: licenseId,
          p_level: "info",
          p_message: `File accessed: ${file.name}`,
          p_source: "storage",
          p_file_name: file.name
        });
      } catch (logError) {
        console.error("Failed to log file access:", logError);
      }
    }

    // Log overall success
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "info",
        p_message: "Files successfully retrieved",
        p_source: "storage",
        p_details: `Retrieved ${scriptFiles.length} files successfully`
      });
    } catch (logError) {
      console.error("Failed to log retrieval success:", logError);
    }
    
    console.log(`Successfully processed ${scriptFiles.length} public files`);
    return { content: scriptFiles };
  } catch (error) {
    console.error("Error in getAllScriptFiles:", error);
    
    try {
      await supabase.rpc("add_script_log", {
        p_license_id: licenseId,
        p_level: "error",
        p_message: "General error accessing script files",
        p_source: "storage",
        p_details: error instanceof Error ? error.message : String(error)
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
