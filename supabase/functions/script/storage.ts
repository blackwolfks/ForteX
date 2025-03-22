
// Get specific file from storage - Updated to be more flexible with paths
export async function getScriptFile(supabase: any, licenseId: string, filePath: string): Promise<{ content: string | null, error: string | null }> {
  try {
    console.log(`Attempting to download file for license ${licenseId}, requested file: ${filePath}`);
    
    // Check if script bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return { content: null, error: "Storage error: Could not list buckets" };
    }
    
    const scriptBucketExists = buckets.some((bucket: any) => bucket.name === "script");
    
    if (!scriptBucketExists) {
      console.error("Script bucket does not exist");
      return { content: null, error: "Storage error: Script bucket does not exist" };
    }
    
    // First try with license ID path structure
    let fileData;
    let fileError;
    
    // First attempt: Try with license folder structure {licenseId}/{filePath}
    console.log(`First attempt: Trying path ${licenseId}/${filePath}`);
    const licensePathResult = await supabase.storage
      .from("script")
      .download(`${licenseId}/${filePath}`, {
        transform: { public: true }
      });
    
    fileData = licensePathResult.data;
    fileError = licensePathResult.error;
    
    // Second attempt: If not found, try direct filename
    if (fileError) {
      console.log(`First attempt failed: ${fileError.message}`);
      console.log(`Second attempt: Trying direct path ${filePath}`);
      
      const directPathResult = await supabase.storage
        .from("script")
        .download(filePath, {
          transform: { public: true }
        });
      
      fileData = directPathResult.data;
      fileError = directPathResult.error;
    }
    
    if (fileError) {
      console.error(`All file download attempts failed for license ${licenseId}, file ${filePath}:`, fileError);
      return { content: null, error: `File '${filePath}' not found: ${fileError.message}` };
    }
    
    console.log(`Successfully downloaded file for license ${licenseId}, file ${filePath}`);
    const scriptContent = await fileData.text();
    return { content: scriptContent, error: null };
  } catch (downloadError) {
    console.error(`Exception in getScriptFile for license ${licenseId}, file ${filePath}:`, downloadError);
    return { content: null, error: `Could not download file '${filePath}': ${downloadError.message}` };
  }
}

// List available files from storage - Updated to be more flexible with paths
export async function listScriptFiles(supabase: any, licenseId: string): Promise<{ files: any[] | null, error: string | null }> {
  try {
    console.log(`Listing files in bucket 'script' for license ${licenseId}`);
    
    // Check if script bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return { files: null, error: "Storage error: Could not list buckets" };
    }
    
    const scriptBucketExists = buckets.some((bucket: any) => bucket.name === "script");
    
    if (!scriptBucketExists) {
      console.error("Script bucket does not exist");
      return { files: null, error: "Storage error: Script bucket does not exist. Please create it in the Supabase dashboard." };
    }
    
    // First try license folder
    const { data: licenseFiles, error: licenseListError } = await supabase.storage
      .from("script")
      .list(licenseId);
    
    // If license folder exists and has files, use those
    if (!licenseListError && licenseFiles && licenseFiles.length > 0) {
      console.log(`Found ${licenseFiles.length} files in folder ${licenseId}`);
      return { files: licenseFiles, error: null };
    }
    
    // If license folder doesn't exist or is empty, list root files
    console.log(`No files found in license folder ${licenseId}, checking root folder`);
    const { data: rootFiles, error: rootListError } = await supabase.storage
      .from("script")
      .list();
    
    if (rootListError) {
      console.error(`Error listing files at root:`, rootListError);
      return { 
        files: null, 
        error: `Unable to list files: ${rootListError.message}` 
      };
    }
    
    if (!rootFiles || rootFiles.length === 0) {
      console.log(`No files found in root folder either`);
      return { 
        files: null, 
        error: "No files found. Please upload files via web interface." 
      };
    }
    
    console.log(`Found ${rootFiles.length} files at root level:`, 
      rootFiles.map((f: any) => f.name).join(", "));
    
    return { files: rootFiles, error: null };
  } catch (error) {
    console.error(`Exception in listScriptFiles for license ${licenseId}:`, error);
    return { files: null, error: `Could not access script storage: ${error.message}` };
  }
}

// Get and return main script file
export async function getMainScriptFile(supabase: any, licenseId: string, files: any[]): Promise<{ content: string | null, error: string | null }> {
  // Look for main.lua or first Lua file
  let mainFile = files.find(f => f.name === "main.lua") || files.find(f => f.name.endsWith('.lua')) || files[0];
  
  if (!mainFile) {
    return { content: null, error: "No suitable script file found. Please upload a .lua file." };
  }
  
  console.log(`Using ${mainFile.name} as main script file`);
  return await getScriptFile(supabase, licenseId, mainFile.name);
}

// Generate a sample Lua script when no files are available
export function generateSampleScript(licenseData: any): string {
  return `-- ForteX Auto-Generated Script
-- This is a sample script that was automatically generated
-- because no script files were found for this license.

print("^2==============================================^0")
print("^2ForteX Script Loader - Demo Script^0")
print("^2==============================================^0")
print("^3License Info:^0")
print("^3Script Name: ^0${licenseData.script_name || 'Unknown'}")
print("^3License Key: ^0${licenseData.license_key}")
print("^3==============================================^0")
print("^2This is a demo script. Please upload your script files^0")
print("^2through the web interface to replace this message.^0")
print("^2==============================================^0")

-- Register a simple command to demonstrate that the script works
RegisterCommand('fortex_demo', function(source, args, rawCommand)
    print("^2ForteX Demo Command Executed!^0")
    if source > 0 then -- Player
        TriggerClientEvent('chat:addMessage', source, {
            args = {"^2ForteX Demo", "Script is working correctly!"}
        })
    else -- Console
        print("^2ForteX Demo: Script is working correctly!^0")
    end
end, false)

print("^3Demo command 'fortex_demo' has been registered.^0");
`;
}
