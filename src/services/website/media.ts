
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
      
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
        return null;
      }

      // Check file type - only allow images
      if (!file.type.startsWith('image/')) {
        toast.error("Nur Bildformate sind erlaubt.");
        return null;
      }

      // Sanitize filename by removing special characters
      const sanitizedFilePath = filePath.replace(/[^a-zA-Z0-9.-_\/]/g, '_');

      console.log("Uploading file:", sanitizedFilePath, "with type:", file.type);

      // Add proper content type header based on file type
      const options = {
        cacheControl: '3600',
        upsert: true, // Changed to true to overwrite existing files with same name
        contentType: file.type // Set the correct MIME type
      };
        
      // Upload to the websites bucket with JSON parsing for better error handling
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(sanitizedFilePath, file, options);
      
      if (error) {
        console.error("Storage upload error:", error);
        
        // More specific error messages based on error type
        if (error.message.includes("JWT")) {
          toast.error("Sitzung abgelaufen. Bitte neu anmelden und erneut versuchen.");
        } else if (error.message.includes("permission")) {
          toast.error("Keine Berechtigung zum Hochladen. Bitte prüfen Sie Ihre Zugriffsrechte.");
        } else if (error.message.includes("network")) {
          toast.error("Netzwerkfehler beim Hochladen. Bitte prüfen Sie Ihre Internetverbindung.");
        } else if (error.message.includes("mime type") || error.message.includes("not supported")) {
          toast.error("Dateityp wird nicht unterstützt. Bitte nur Bilder im JPG, PNG oder WebP Format hochladen.");
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
      
      console.log("Upload successful, public URL:", publicUrl);
      return publicUrl || null;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  }
};
