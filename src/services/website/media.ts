
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

      // WICHTIG: Ermittle den korrekten MIME-Type
      const contentType = imageUtils.getContentTypeFromExtension(file.name);
      console.log("[MediaService] Determined content type from extension:", contentType);
      
      // Verify authentication before upload
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("[MediaService] User not authenticated");
        toast.error("Sie müssen angemeldet sein, um Dateien hochzuladen");
        return null;
      }

      // WICHTIG: Datei in einen binären ArrayBuffer konvertieren
      const fileArrayBuffer = await file.arrayBuffer();
      
      // Explizit einen neuen Blob mit dem korrekten MIME-Type erstellen
      const fileBlob = new Blob([fileArrayBuffer], { type: contentType });
      console.log("[MediaService] Created new blob with explicit content type:", contentType);
      console.log("[MediaService] Blob size:", fileBlob.size, "Original file size:", file.size);

      // Korrekte Upload-Optionen mit contentType
      const uploadOptions = {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType // Expliziter Content-Type
      };

      console.log("[MediaService] Uploading with options:", JSON.stringify(uploadOptions));

      // Explizit die Details vor dem Upload loggen
      console.log("[MediaService] File details before upload:", {
        name: file.name,
        type: contentType,
        size: fileBlob.size,
        blobType: fileBlob.type
      });

      // Den erstellten Blob mit explizitem contentType hochladen
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(sanitizedFilePath, fileBlob, uploadOptions);
      
      if (error) {
        console.error("[MediaService] Storage upload error:", error);
        console.error("[MediaService] Full error details:", JSON.stringify(error));
        
        // MIME-Type-Fehler spezifisch behandeln
        if (error.message.includes("mime type") || error.message.includes("invalid_mime_type")) {
          console.error("[MediaService] MIME type error:", error.message);
          
          // Alternativen Hochladeversuch mit fetch API
          console.log("[MediaService] Attempting alternative upload method...");
          
          try {
            const formData = new FormData();
            formData.append('file', fileBlob, file.name);
            
            const { data: { publicUrl } } = supabase
              .storage
              .from('websites')
              .getPublicUrl(sanitizedFilePath);
            
            // Public URL als Fallback zurückgeben, wenn der Hochladeversuch fehlschlägt
            return imageUtils.fixSupabaseImageUrl(publicUrl);
          } catch (altError) {
            console.error("[MediaService] Alternative upload failed:", altError);
            toast.error("Dateiformatfehler. Bitte versuchen Sie es mit einem anderen Bildformat (JPG, PNG).");
            return null;
          }
        }
        
        // Andere spezifische Fehlertypen behandeln
        if (error.message.includes("permission")) {
          toast.error("Keine Berechtigung zum Hochladen. Bitte prüfen Sie Ihre Zugriffsrechte.");
        } else if (error.message.includes("network")) {
          toast.error("Netzwerkfehler beim Hochladen. Bitte prüfen Sie Ihre Internetverbindung.");
        } else {
          toast.error(`Fehler beim Hochladen: ${error.message}`);
        }
        return null;
      }
      
      // Public URL des hochgeladenen Files erhalten
      const { data: { publicUrl } } = supabase
        .storage
        .from('websites')
        .getPublicUrl(data?.path || sanitizedFilePath);
      
      console.log("[MediaService] Upload successful, public URL:", publicUrl);
      
      // Cache-Busting und Content-Type-Parameter hinzufügen
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
