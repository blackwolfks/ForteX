
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadResult {
  url: string | null;
  error: Error | null;
}

/**
 * Utility to determine MIME type from file extension
 */
export const getMimeType = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'lua':
      return 'text/plain';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Ensures a bucket exists before uploading
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Ensuring bucket '${bucketName}' exists...`);
    
    // First try with our RPC function (most reliable method)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_public_bucket', {
        bucket_name: bucketName
      });
      
      if (!rpcError) {
        console.log(`Bucket '${bucketName}' successfully created/verified via RPC`);
        return true;
      }
      
      console.warn("RPC bucket creation failed:", rpcError);
    } catch (e) {
      console.warn("Error calling create_public_bucket RPC:", e);
    }
    
    // Direct method as fallback
    try {
      // Try creating the bucket (will do nothing if it already exists)
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['*/*'] // Allow all MIME types to be safe
      });
      
      // Most errors here will be because the bucket already exists
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating bucket '${bucketName}':`, error);
        toast.error(`Fehler beim Erstellen des Buckets: ${error.message}`);
        
        // Even with an error, the bucket might exist but we don't have access
        // Let's continue anyway and see if upload works
      }
    } catch (createError) {
      console.warn("Error creating bucket directly:", createError);
    }
    
    // As final attempt, try to use the storage API to check bucket existence
    try {
      await supabase.storage.from(bucketName).list();
      console.log(`Successfully accessed bucket '${bucketName}'`);
      return true;
    } catch (listError) {
      console.error(`Could not access bucket '${bucketName}':`, listError);
      
      // Failed to create or access the bucket
      return false;
    }
  } catch (error) {
    console.error(`Unexpected error ensuring bucket exists:`, error);
    toast.error('Unerwarteter Fehler beim Bucket-Check');
    return false;
  }
};

/**
 * Uploads a file to the specified bucket and path with multiple retry strategies
 */
export const uploadFile = async (
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    onProgress?.(5);
    
    // First ensure bucket exists
    const bucketExists = await ensureBucketExists(bucketName);
    if (!bucketExists) {
      return { 
        url: null, 
        error: new Error(`Storage bucket '${bucketName}' does not exist and could not be created`) 
      };
    }
    
    onProgress?.(20);
    console.log(`Uploading ${file.name} to ${bucketName}/${filePath} (size: ${file.size} bytes)`);
    
    // Determine the appropriate MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isZipFile = fileExtension === 'zip';
    const defaultMimeType = isZipFile ? 'application/zip' : 'text/plain';
    
    // Try multiple upload strategies
    let uploadSuccess = false;
    let uploadAttempt = 0;
    const maxAttempts = 4;
    let lastError = null;
    
    while (uploadAttempt < maxAttempts) {
      uploadAttempt++;
      console.log(`Upload attempt ${uploadAttempt}/${maxAttempts}`);
      
      onProgress?.(20 + (uploadAttempt * 15));
      
      try {
        // Create fresh ArrayBuffer from file for each attempt
        const fileArrayBuffer = await file.arrayBuffer();
        let uploadOptions: any = {
          cacheControl: '3600',
          upsert: true
        };
        
        let fileBlob: Blob;
        
        // Different strategies for each attempt
        if (uploadAttempt === 1) {
          // First attempt: Use the default MIME type for the file type
          uploadOptions.contentType = defaultMimeType;
          fileBlob = new Blob([fileArrayBuffer], { type: defaultMimeType });
          console.log(`Attempt ${uploadAttempt}: Using ${defaultMimeType} content type`);
        } 
        else if (uploadAttempt === 2) {
          // Second attempt: If it's a zip file, try application/octet-stream, otherwise text/plain
          const mimeType = isZipFile ? 'application/octet-stream' : 'text/plain';
          uploadOptions.contentType = mimeType;
          fileBlob = new Blob([fileArrayBuffer], { type: mimeType });
          console.log(`Attempt ${uploadAttempt}: Using ${mimeType} content type`);
        }
        else if (uploadAttempt === 3) {
          // Third attempt: Use application/octet-stream for both types
          uploadOptions.contentType = 'application/octet-stream';
          fileBlob = new Blob([fileArrayBuffer], { type: 'application/octet-stream' });
          console.log(`Attempt ${uploadAttempt}: Using application/octet-stream content type`);
        }
        else {
          // Fourth attempt: Try with no content type
          delete uploadOptions.contentType;
          fileBlob = new Blob([fileArrayBuffer]);
          console.log(`Attempt ${uploadAttempt}: Using raw blob without type`);
        }
        
        // Create new File object with the strategy
        const uploadFile = new File([fileBlob], file.name, uploadOptions.contentType ? 
          { type: uploadOptions.contentType } : undefined);
        
        // Upload with the current strategy
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, uploadFile, uploadOptions);
          
        if (error) {
          console.error(`Attempt ${uploadAttempt} failed:`, error);
          lastError = error;
          
          // Wait a moment before retrying with a different strategy
          if (uploadAttempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          throw error;
        }
        
        // Success!
        uploadSuccess = true;
        onProgress?.(90);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
          
        console.log(`File upload successful: ${urlData.publicUrl}`);
        return { url: urlData.publicUrl, error: null };
      } catch (attemptError) {
        console.error(`Error in attempt ${uploadAttempt}:`, attemptError);
        lastError = attemptError as Error;
      }
    }
    
    return { 
      url: null, 
      error: lastError || new Error(`All ${maxAttempts} upload attempts failed`) 
    };
  } catch (error) {
    console.error(`Upload error:`, error);
    return { 
      url: null, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};

/**
 * Simplified file upload function with progress tracking
 */
export const uploadFileWithProgress = async (
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    onProgress?.(10);
    
    const result = await uploadFile(bucketName, filePath, file, onProgress);
    
    if (result.error) {
      console.error("Error uploading file:", result.error);
      toast.error("Fehler beim Hochladen der Datei: " + result.error.message);
      return false;
    }
    
    onProgress?.(100);
    toast.success("Datei erfolgreich hochgeladen");
    return true;
  } catch (error) {
    console.error("Unexpected error in uploadFileWithProgress:", error);
    toast.error("Unerwarteter Fehler beim Datei-Upload");
    return false;
  }
};
