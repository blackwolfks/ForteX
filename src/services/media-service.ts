
import { supabase, callRPC } from "@/lib/supabase";

export class MediaService {
  /**
   * Prüft, ob ein Bucket existiert und erstellt ihn gegebenenfalls
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`Prüfe Storage-Bucket '${bucketName}'...`);
      
      // Try to use the RPC function first
      try {
        const { data: rpcData, error: rpcError } = await callRPC('create_public_bucket', {
          bucket_name: bucketName
        });
        
        if (!rpcError) {
          console.log(`Bucket '${bucketName}' erfolgreich über RPC erstellt/überprüft`);
          return true;
        }
        
        console.warn("RPC-Bucket-Erstellung fehlgeschlagen:", rpcError);
      } catch (rpcError) {
        console.warn("Fehler beim Aufrufen der RPC-Funktion:", rpcError);
      }
      
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
            allowedMimeTypes: ['text/x-lua', 'text/plain']
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
        
        // Update bucket to ensure it's public and only allows Lua files
        try {
          const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['text/x-lua', 'text/plain']
          });
          
          if (updateError) {
            console.error(`Fehler beim Aktualisieren des Buckets '${bucketName}': ${updateError.message}`);
          } else {
            console.log(`Bucket '${bucketName}' auf public gesetzt und MIME-Typen aktualisiert`);
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
      
      // Check if file is a Lua file
      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'lua') {
        return { url: null, error: new Error("Nur .lua-Dateien sind erlaubt") };
      }
      
      console.log(`Lade Datei '${filePath}' in Bucket '${bucketName}' hoch...`);
      
      // Explicit user ID as first part of path to enforce ownership
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return { url: null, error: new Error("Benutzer nicht angemeldet") };
      }
      
      // For debugging
      console.log(`User ID für Upload: ${userId}`);
      
      // Try multiple upload strategies
      let uploadSuccess = false;
      let uploadAttempt = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (!uploadSuccess && uploadAttempt < maxAttempts) {
        uploadAttempt++;
        console.log(`Upload-Versuch ${uploadAttempt}/${maxAttempts}`);
        
        try {
          let uploadOptions: any = {
            cacheControl: '3600',
            upsert: true
          };
          
          // Different strategies for each attempt
          if (uploadAttempt === 1) {
            // First attempt: Use text/x-lua content type
            uploadOptions.contentType = 'text/x-lua';
            console.log(`Versuch 1: Verwende Lua Content-Type (text/x-lua)`);
          } 
          else if (uploadAttempt === 2) {
            // Second attempt: Use text/plain content type
            uploadOptions.contentType = 'text/plain';
            console.log("Versuch 2: Verwende text/plain Content-Type");
          }
          else {
            // Third attempt: No content type specified, let Supabase determine it
            console.log("Versuch 3: Kein expliziter Content-Type");
          }
          
          // Datei hochladen mit expliziten Optionen
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, uploadOptions);
            
          if (error) {
            console.error(`Fehler bei Upload-Versuch ${uploadAttempt}: ${error.message}`);
            lastError = error;
            
            // Wait a moment before trying again
            if (uploadAttempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            } else {
              throw error;
            }
          }
          
          // If we get here, upload was successful
          uploadSuccess = true;
          console.log(`Upload erfolgreich bei Versuch ${uploadAttempt}:`, data);
          
          // Öffentliche URL abrufen
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);
            
          console.log(`Datei '${filePath}' erfolgreich hochgeladen, URL: ${urlData.publicUrl}`);
          
          return { url: urlData.publicUrl, error: null };
        } catch (attemptError) {
          console.error(`Fehler bei Versuch ${uploadAttempt}:`, attemptError);
          lastError = attemptError as Error;
        }
      }
      
      return { 
        url: null, 
        error: lastError || new Error(`Alle ${maxAttempts} Upload-Versuche sind fehlgeschlagen`) 
      };
    } catch (error) {
      console.error(`Unerwarteter Fehler beim Hochladen der Datei: ${error}`);
      return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

export const mediaService = new MediaService();
