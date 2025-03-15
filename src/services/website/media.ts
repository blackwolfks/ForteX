
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

      // Get proper content type based on file extension - this is critical
      // Always prioritize the file.type from the browser if available and valid
      let contentType = '';
      if (file.type && file.type.startsWith('image/')) {
        contentType = file.type;
      } else {
        contentType = imageUtils.getContentTypeFromExtension(file.name);
      }
      
      console.log("[MediaService] Using content type:", contentType);
      
      // Verify authentication before upload
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("[MediaService] User not authenticated");
        toast.error("Sie müssen angemeldet sein, um Dateien hochzuladen");
        return null;
      }

      // WICHTIG: Hier erzeugen wir einen neuen Blob mit dem korrekten MIME-Type
      // Dies verhindert das Problem mit application/json
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileArrayBuffer], { type: contentType });
      console.log("[MediaService] Created new blob with explicit content type:", contentType);

      // Use the correct content type in the upload options
      const uploadOptions = {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType // Explizit den Content-Type setzen
      };

      console.log("[MediaService] Uploading with options:", uploadOptions);

      // Explicitly log the details to confirm
      console.log("[MediaService] File details before upload:", {
        name: file.name,
        type: contentType,
        size: fileBlob.size
      });

      // Upload the blob with explicit contentType
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(sanitizedFilePath, fileBlob, uploadOptions);
      
      if (error) {
        console.error("[MediaService] Storage upload error:", error);
        console.error("[MediaService] Full error details:", JSON.stringify(error));
        
        // Handle specific authentication errors
        if (error.message.includes("JWT") || error.message.includes("token") || error.message.includes("auth")) {
          console.error("[MediaService] Authentication error:", error.message);
          toast.error("Authentifizierungsfehler. Bitte neu anmelden und erneut versuchen.");
          return null;
        }
        
        // Handle MIME type errors specifically
        if (error.message.includes("mime type") || error.message.includes("invalid_mime_type")) {
          console.error("[MediaService] MIME type error:", error.message);
          toast.error("Dateiformatfehler. Bitte versuchen Sie es mit einem anderen Bildformat (JPG, PNG).");
          return null;
        }
        
        // Handle other specific error types
        if (error.message.includes("permission")) {
          toast.error("Keine Berechtigung zum Hochladen. Bitte prüfen Sie Ihre Zugriffsrechte.");
        } else if (error.message.includes("network")) {
          toast.error("Netzwerkfehler beim Hochladen. Bitte prüfen Sie Ihre Internetverbindung.");
        } else {
          toast.error(`Fehler beim Hochladen: ${error.message}`);
        }
        return null;
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('websites')
        .getPublicUrl(data?.path || sanitizedFilePath);
      
      console.log("[MediaService] Upload successful, public URL:", publicUrl);
      
      // Add cache-busting and content-type parameters
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
