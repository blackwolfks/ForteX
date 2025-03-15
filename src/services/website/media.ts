
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      // Get file extension from filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const acceptedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      console.log("[MediaService] File extension detected:", fileExtension);
      
      if (!acceptedExtensions.includes(fileExtension)) {
        toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
        console.error("[MediaService] File extension not accepted:", fileExtension);
        return null;
      }

      // Sanitize filename by removing special characters
      const sanitizedFilePath = filePath.replace(/[^a-zA-Z0-9.-_\/]/g, '_');

      console.log("[MediaService] Uploading file:", sanitizedFilePath);

      // Upload the file directly
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(sanitizedFilePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("[MediaService] Storage upload error:", error);
        console.error("[MediaService] Full error details:", JSON.stringify(error));
        
        // More specific error messages based on error type
        if (error.message.includes("JWT")) {
          toast.error("Sitzung abgelaufen. Bitte neu anmelden und erneut versuchen.");
        } else if (error.message.includes("permission")) {
          toast.error("Keine Berechtigung zum Hochladen. Bitte prüfen Sie Ihre Zugriffsrechte.");
        } else if (error.message.includes("network")) {
          toast.error("Netzwerkfehler beim Hochladen. Bitte prüfen Sie Ihre Internetverbindung.");
        } else if (error.message.includes("mime type") || error.message.includes("not supported")) {
          toast.error("Dateityp wird nicht unterstützt. Bitte versuchen Sie ein anderes Bild im JPG, PNG oder WebP Format hochzuladen.");
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
      
      // Test if the URL is accessible by attempting to fetch it
      try {
        const testFetch = await fetch(publicUrl, { method: 'HEAD' });
        if (!testFetch.ok) {
          console.warn("[MediaService] Generated URL might not be accessible:", publicUrl, "Status:", testFetch.status);
        } else {
          console.log("[MediaService] URL verified accessible:", publicUrl);
        }
      } catch (fetchError) {
        console.warn("[MediaService] Could not verify URL accessibility:", fetchError);
      }
      
      return publicUrl || null;
    } catch (error) {
      console.error("[MediaService] Unexpected error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  }
};
