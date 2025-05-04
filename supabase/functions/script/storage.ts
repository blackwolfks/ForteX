
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function getScriptFiles(licenseId: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  
  try {
    // First get a list of all files in the license folder
    const { data: fileList, error: listError } = await supabase
      .storage
      .from('script')
      .list(`${licenseId}`);
      
    if (listError) {
      console.error(`Error listing files for license ${licenseId}:`, listError);
      throw new Error(`Could not list files: ${listError.message}`);
    }
    
    if (!fileList || fileList.length === 0) {
      console.log(`No files found for license ${licenseId}`);
      return files;
    }
    
    // Process each file
    for (const file of fileList) {
      if (file.name.endsWith('.lua')) {
        console.log(`Processing file: ${licenseId}/${file.name}`);
        
        const { data, error } = await supabase
          .storage
          .from('script')
          .download(`${licenseId}/${file.name}`);
          
        if (error) {
          console.error(`Error downloading file ${file.name}:`, error);
          continue;
        }
        
        if (!data) {
          console.error(`No data returned for file ${file.name}`);
          continue;
        }
        
        const content = await data.text();
        files[file.name] = content;
        console.log(`File '${file.name}' successfully loaded`);
        
        // Log file loading
        try {
          await fetch(`${supabaseUrl}/functions/v1/log`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
              "apikey": serviceRoleKey,
            },
            body: JSON.stringify({
              license_id: licenseId,
              level: "info",
              message: `File loaded successfully: ${file.name}`,
              source: "storage",
              details: `Size: ${content.length} bytes`,
              file_name: file.name
            })
          });
        } catch (logError) {
          console.error("Error writing log to database:", logError);
        }
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error fetching script files:`, error);
    throw error;
  }
}
