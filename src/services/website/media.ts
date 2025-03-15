
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const mediaService = {
  async uploadMedia(file: File, path?: string): Promise<string | null> {
    try {
      const filePath = path 
        ? `${path}/${file.name}` 
        : `${Date.now()}_${file.name}`;
      
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
        return null;
      }

      // Add proper content type header based on file type
      const options = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type // Set the correct MIME type
      };
        
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(filePath, file, options);
      
      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('websites')
        .getPublicUrl(data.path);
      
      return publicUrl || null;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  }
};
