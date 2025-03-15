
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { imageUtils } from "@/lib/image-utils";

export const mediaService = {
  async uploadMedia(file: File, path?: string): Promise<string | null> {
    try {
      // Create a more optimized file path with timestamp
      const timestamp = new Date().getTime();
      const filePath = path 
        ? `${path}/${timestamp}_${file.name}` 
        : `${timestamp}_${file.name}`;
      
      console.log("[MediaService] Upload starting for file:", file.name);
      console.log("[MediaService] File details - Type:", file.type, "Size:", file.size);
      
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
        return null;
      }

      // Validate file extension and type
      if (!imageUtils.isAcceptedImageFormat(file.name)) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
        return null;
      }

      // Sanitize filename by removing special characters
      const sanitizedFilePath = filePath.replace(/[^a-zA-Z0-9.-_\/]/g, '_');
      console.log("[MediaService] Uploading file to path:", sanitizedFilePath);

      // Explicitly determine the correct MIME type from the file extension
      const contentType = imageUtils.getContentTypeFromExtension(file.name);
      console.log("[MediaService] Using content type:", contentType);
      
      // Verify authentication before upload
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("[MediaService] User not authenticated");
        toast.error("Sie müssen angemeldet sein, um Dateien hochzuladen");
        return null;
      }

      // Convert file to ArrayBuffer and create a new Blob with the correct MIME type
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileArrayBuffer], { type: contentType });
      console.log("[MediaService] Created new blob with explicit MIME type:", contentType);

      // Upload options with explicit content type
      const uploadOptions = {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType
      };

      // Log upload details for debugging
      console.log("[MediaService] Upload details:", {
        bucket: 'websites',
        path: sanitizedFilePath,
        contentType: contentType,
        size: fileBlob.size
      });

      // Upload the file with explicit content type
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(sanitizedFilePath, fileBlob, uploadOptions);
      
      if (error) {
        console.error("[MediaService] Storage upload error:", error);
        console.error("[MediaService] Full error details:", JSON.stringify(error));
        
        // Handle MIME type errors specifically
        if (error.message && error.message.includes("mime type")) {
          console.error("[MediaService] MIME type error:", error.message);
          
          // Try an alternative approach with a different MIME type
          console.log("[MediaService] Trying alternative upload with application/octet-stream");
          const fallbackContentType = "application/octet-stream";
          const fallbackBlob = new Blob([fileArrayBuffer], { type: fallbackContentType });
          
          const fallbackOptions = {
            cacheControl: '3600',
            upsert: true,
            contentType: fallbackContentType
          };
          
          const fallbackResult = await supabase
            .storage
            .from('websites')
            .upload(sanitizedFilePath, fallbackBlob, fallbackOptions);
            
          if (fallbackResult.error) {
            console.error("[MediaService] Fallback upload also failed:", fallbackResult.error);
            toast.error("Fehler beim Hochladen. Bitte versuchen Sie es mit einem anderen Bildformat.");
            return null;
          }
          
          // Get the public URL if fallback was successful
          const { data: { publicUrl } } = supabase
            .storage
            .from('websites')
            .getPublicUrl(fallbackResult.data?.path || sanitizedFilePath);
          
          console.log("[MediaService] Fallback upload successful, public URL:", publicUrl);
          
          // Add cache-busting and content type parameters
          const fixedUrl = imageUtils.fixSupabaseImageUrl(publicUrl);
          return fixedUrl;
        }
        
        toast.error(`Fehler beim Hochladen: ${error.message}`);
        return null;
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('websites')
        .getPublicUrl(data?.path || sanitizedFilePath);
      
      console.log("[MediaService] Upload successful, public URL:", publicUrl);
      
      // Add cache-busting and content type parameters
      const fixedUrl = imageUtils.fixSupabaseImageUrl(publicUrl);
      console.log("[MediaService] Fixed URL with content type:", fixedUrl);
      
      return fixedUrl;
    } catch (error) {
      console.error("[MediaService] Unexpected error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  }
};
