
import { supabase } from "@/integrations/supabase/client";

export class MediaService {
  /**
   * Prüft, ob ein Bucket existiert und erstellt ihn gegebenenfalls
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("Nicht authentifiziert. Bitte melden Sie sich an, um den Storage zu nutzen.");
        return false;
      }
      
      console.log(`Prüfe Storage-Bucket '${bucketName}'...`);
      
      // Bucket-Liste abrufen
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`Fehler beim Abrufen der Buckets: ${listError.message}`);
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
  
  /**
   * Lädt eine Datei in einen Supabase Storage Bucket hoch
   */
  async uploadFile(bucketName: string, filePath: string, file: File): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Prüfen, ob der Bucket existiert
      const bucketExists = await this.ensureBucketExists(bucketName);
      if (!bucketExists) {
        return { url: null, error: new Error(`Bucket '${bucketName}' existiert nicht und konnte nicht erstellt werden`) };
      }
      
      console.log(`Lade Datei '${filePath}' in Bucket '${bucketName}' hoch...`);
      
      // Datei hochladen
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error(`Fehler beim Hochladen der Datei '${filePath}': ${error.message}`);
        return { url: null, error };
      }
      
      // Öffentliche URL abrufen
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
        
      console.log(`Datei '${filePath}' erfolgreich hochgeladen, URL: ${urlData.publicUrl}`);
      
      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error(`Unerwarteter Fehler beim Hochladen der Datei: ${error}`);
      return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

export const mediaService = new MediaService();
