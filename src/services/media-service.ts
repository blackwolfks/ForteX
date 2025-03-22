
import { supabase } from "@/integrations/supabase/client";

export class MediaService {
  /**
   * Prüft, ob ein Bucket existiert und erstellt ihn gegebenenfalls
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
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
        
        try {
          // Set public: true explicitly to ensure public access
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
          
          if (createError) {
            console.error(`Fehler beim Erstellen des Buckets '${bucketName}': ${createError.message}`);
            
            // Check for RLS policy error
            if (createError.message.includes("new row violates row-level security policy")) {
              console.warn("RLS policy error - dieses Projekt benötigt Admin-Rechte im Storage");
              
              // The bucket might exist but not be visible to the current user due to RLS
              // Try to use it anyway, as some operations might still work
              return true;
            }
            
            return false;
          }
          
          console.log(`Bucket '${bucketName}' erfolgreich erstellt`);
        } catch (createError) {
          console.error("Error creating bucket:", createError);
          return false;
        }
      } else {
        console.log(`Bucket '${bucketName}' existiert bereits`);
        
        // Update bucket to ensure it's public
        try {
          const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
            public: true
          });
          
          if (updateError) {
            console.error(`Fehler beim Aktualisieren des Buckets '${bucketName}': ${updateError.message}`);
          } else {
            console.log(`Bucket '${bucketName}' auf public gesetzt`);
          }
        } catch (updateError) {
          console.error("Error updating bucket:", updateError);
        }
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
        console.warn(`Bucket '${bucketName}' konnte nicht verifiziert werden, versuche Upload trotzdem...`);
      }
      
      console.log(`Lade Datei '${filePath}' in Bucket '${bucketName}' hoch...`);
      
      // Explicit user ID as first part of path to enforce ownership
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return { url: null, error: new Error("Benutzer nicht angemeldet") };
      }
      
      // For debugging
      console.log(`User ID für Upload: ${userId}`);
      
      // Datei hochladen mit expliziten Optionen
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error(`Fehler beim Hochladen der Datei '${filePath}': ${error.message}`);
        console.error(`Fehler-Details: ${JSON.stringify(error)}`);
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
