
// Function to get all script files for a license
export async function getAllScriptFiles(supabase: any, licenseId: string): Promise<{ content?: Record<string, string>, error?: string }> {
  try {
    console.log(`Fetching script files for license ID: ${licenseId}`);
    
    const { data, error } = await supabase.storage
      .from("script")
      .list(licenseId);
    
    if (error) {
      console.error("Error fetching script file list:", error);
      return { error: `Failed to list script files: ${error.message}` };
    }
    
    if (!data || data.length === 0) {
      console.warn("No script files found for license");
      return { content: {} };
    }
    
    const content: Record<string, string> = {};
    
    // Process each file
    for (const fileInfo of data) {
      if (fileInfo.name.endsWith(".lua")) {
        console.log(`Processing file: ${licenseId}/${fileInfo.name}`);
        
        const { data: fileData, error: fileError } = await supabase.storage
          .from("script")
          .download(`${licenseId}/${fileInfo.name}`);
          
        if (fileError) {
          console.error(`Error downloading file ${fileInfo.name}:`, fileError);
          continue;
        }
        
        if (!fileData) {
          console.warn(`No content for file ${fileInfo.name}`);
          continue;
        }
        
        // Clean the content if necessary
        let text = await fileData.text();
        
        // Clean WebKit form boundaries if present
        if (text.includes("------WebKit")) {
          console.log(`Cleaning WebKit boundaries from ${fileInfo.name}`);
          text = cleanFileContent(text);
        }
        
        content[fileInfo.name] = text;
        
        console.log(`File '${fileInfo.name}' successfully loaded`);
      }
    }
    
    return { content };
    
  } catch (error) {
    console.error("Error fetching script files:", error);
    return { error: `Failed to fetch script files: ${(error as Error).message}` };
  }
}

// Helper function to clean WebKit form boundaries from file content
function cleanFileContent(content: string): string {
  if (!content) return "";
  
  // Remove WebKit form boundaries and headers
  let cleaned = content;
  
  // Remove WebKit form boundaries and related content
  cleaned = cleaned.replace(/^------WebKit[^\r\n]*(\r?\n)?/gm, "");
  cleaned = cleaned.replace(/^Content-(Type|Disposition)[^\r\n]*(\r?\n)?/gm, "");
  
  // If we see a numeric prefix (like "3600"), remove it
  cleaned = cleaned.replace(/^\d+\s*/, "");
  
  // If we still have text/plain or other content type indicators, try to extract just the code
  const contentMatch = cleaned.match(/Content-Type: [^\r\n]*\r?\n\r?\n([\s\S]*?)(?:\r?\n------)/i);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }
  
  return cleaned.trim();
}
