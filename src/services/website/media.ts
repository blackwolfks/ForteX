
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const mediaService = {
  async uploadMedia(file: File, path?: string): Promise<string | null> {
    try {
      const filePath = path 
        ? `${path}/${file.name}` 
        : `${Date.now()}_${file.name}`;
        
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
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
