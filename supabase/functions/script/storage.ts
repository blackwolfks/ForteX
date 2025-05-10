
// Function to get all script files for a license
export async function getAllScriptFiles(supabase: any, licenseId: string): Promise<{ content?: Record<string, string>, error?: string, zipFiles?: string[] }> {
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
    const zipFiles: string[] = [];
    
    // Process each file
    for (const fileInfo of data) {
      if (fileInfo.name.endsWith(".lua")) {
        console.log(`Processing Lua file: ${licenseId}/${fileInfo.name}`);
        
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
        
        // Clean the content
        let text = await fileData.text();
        
        // Always clean Lua files to remove any potential prefixes or boundaries
        console.log(`Cleaning content for file: ${fileInfo.name}`);
        text = cleanFileContent(text);
        
        content[fileInfo.name] = text;
        
        console.log(`File '${fileInfo.name}' successfully loaded`);
      } else if (fileInfo.name.endsWith(".zip")) {
        // Track ZIP files for information purposes
        console.log(`Found ZIP file: ${licenseId}/${fileInfo.name}`);
        zipFiles.push(fileInfo.name);
      }
    }
    
    return { content, zipFiles };
    
  } catch (error) {
    console.error("Error fetching script files:", error);
    return { error: `Failed to fetch script files: ${(error as Error).message}` };
  }
}

// Enhanced helper function to clean content from file
function cleanFileContent(content: string): string {
  if (!content) return "";
  
  console.log("Original content first 50 chars:", content.substring(0, 50));
  
  // Remove WebKit form boundaries and headers
  let cleaned = content;
  
  // Remove WebKit form boundaries and related content
  cleaned = cleaned.replace(/^------WebKit[^\r\n]*(\r?\n)?/gm, "");
  cleaned = cleaned.replace(/^Content-(Type|Disposition)[^\r\n]*(\r?\n)?/gm, "");
  
  // Handle numeric prefixes like "3600" that appear in FiveM Lua files
  // First, check if the content starts with a number
  if (/^\s*\d+/.test(cleaned)) {
    console.log("Found numeric prefix, removing it");
    cleaned = cleaned.replace(/^\s*\d+\s*/m, ""); // Remove leading numbers with whitespace
  }
  
  // Specifically target "3600" at the beginning of the file or lines
  if (cleaned.includes("3600")) {
    console.log("Found '3600' in content, cleaning specifically");
    cleaned = cleaned.replace(/^3600[\s\r\n]*/m, ""); // Remove "3600" at beginning
    cleaned = cleaned.replace(/\n3600[\s\r\n]*/g, "\n"); // Remove "3600" at line starts
  }
  
  // Handle FiveM Lua error formats like [string "3600..."] that might be added
  cleaned = cleaned.replace(/\[string\s+["']3600[^"']*["']\]:\d+:\s*/g, "");
  
  // Try to extract content from multipart form data if present
  const contentMatch = cleaned.match(/Content-Type: [^\r\n]*\r?\n\r?\n([\s\S]*?)(?:\r?\n------)/i);
  if (contentMatch && contentMatch[1]) {
    console.log("Extracted content from multipart form");
    cleaned = contentMatch[1].trim();
  }
  
  console.log("Cleaned content first 50 chars:", cleaned.substring(0, 50));
  
  return cleaned.trim();
}
