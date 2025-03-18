
import { supabase } from "@/integrations/supabase/client";

export class MediaService {
  /**
   * Prüft, ob ein Bucket existiert und erstellt ihn gegebenenfalls
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      // Prüfen, ob der Bucket bereits existiert
      const { data: buckets, error: getBucketError } = await supabase.storage.listBuckets();
      
      if (getBucketError) {
        console.error(`Fehler beim Abrufen der Buckets: ${getBucketError.message}`);
        return false;
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      // Wenn der Bucket nicht existiert, erstellen
      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' existiert nicht, wird erstellt...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        
        if (createError) {
          console.error(`Fehler beim Erstellen des Buckets '${bucketName}': ${createError.message}`);
          return false;
        }
        
        console.log(`Bucket '${bucketName}' erfolgreich erstellt`);
      } else {
        console.log(`Bucket '${bucketName}' existiert bereits`);
      }
      
      return true;
    } catch (error) {
      console.error(`Unerwarteter Fehler beim Prüfen/Erstellen des Buckets: ${error}`);
      return false;
    }
  }
}

export const mediaService = new MediaService();
