import { useState, useEffect } from "react";
import { License, NewScriptFormData } from "./types";
import { callRPC, supabase, checkStorageBucket } from "@/lib/supabase";
import { toast } from "sonner";

export function useScriptManagement() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      console.log("Fetching licenses from RPC function: get_user_licenses");
      const { data, error } = await callRPC('get_user_licenses', {});
      
      if (error) {
        console.error("Error fetching licenses:", error);
        toast.error("Fehler beim Laden der Scripts");
        return;
      }
      
      console.log("Licenses fetched successfully:", data);
      setLicenses(data || []);
    } catch (error) {
      console.error("Exception in fetchLicenses:", error);
      toast.error("Fehler beim Laden der Scripts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCreateScript = async (newScript: NewScriptFormData, selectedFiles: File[]) => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return false;
    }

    if (selectedFiles.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Datei aus");
      return false;
    }

    try {
      // First ensure bucket exists
      const bucketReady = await checkStorageBucket('script');
      if (!bucketReady) return false;
      
      console.log("Creating license with the following parameters:", {
        p_script_name: newScript.name,
        p_script_file: null, // No direct code input anymore
        p_server_ip: newScript.serverIp || null,
      });
      
      // Create the license first
      const { data, error } = await callRPC('create_license', {
        p_script_name: newScript.name,
        p_script_file: null, // No direct code input anymore
        p_server_ip: newScript.serverIp || null,
      });
      
      if (error) {
        console.error("Error creating license:", error);
        toast.error("Fehler beim Erstellen des Scripts: " + error.message);
        return false;
      }
      
      console.log("License created successfully:", data);
      
      const licenseId = data.id;
      
      console.log(`Uploading ${selectedFiles.length} files to bucket 'script/${licenseId}'`);
      
      let uploadErrors = 0;
      let uploadSuccesses = 0;
      
      // Use Promise.all to upload files in parallel, with a limit
      const batchSize = 5; // Upload 5 files at a time to avoid overwhelming the API
      const fileBatches = [];
      
      // Split files into batches
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        fileBatches.push(selectedFiles.slice(i, i + batchSize));
      }
      
      // Process each batch sequentially
      for (const batch of fileBatches) {
        await Promise.all(batch.map(async (file) => {
          let filePath = file.webkitRelativePath || file.name;
          
          console.log(`Uploading file ${filePath} to script/${licenseId}`);
          
          try {
            // First try with binary content type for all files
            const { error: uploadError } = await supabase.storage
              .from('script')
              .upload(`${licenseId}/${filePath}`, file, {
                contentType: 'application/octet-stream',
                cacheControl: '3600',
                upsert: true
              });
              
            if (uploadError) {
              console.error("Error uploading file:", uploadError);
              
              // Second attempt without explicit content type
              const { error: retryError } = await supabase.storage
                .from('script')
                .upload(`${licenseId}/${filePath}`, file, {
                  cacheControl: '3600',
                  upsert: true
                });
                
              if (retryError) {
                console.error("Second attempt failed:", retryError);
                uploadErrors++;
              } else {
                uploadSuccesses++;
              }
            } else {
              uploadSuccesses++;
            }
          } catch (error) {
            console.error("Exception during upload:", error);
            uploadErrors++;
          }
        }));
      }
      
      if (uploadErrors > 0) {
        toast.error(`${uploadErrors} Dateien konnten nicht hochgeladen werden`);
      }
      
      if (uploadSuccesses > 0) {
        toast.success(`${uploadSuccesses} Dateien erfolgreich hochgeladen`);
      }
      
      // Mark this license as having file uploads - ensure parameter order matches the updated function
      console.log("Updating license to set has_file_upload = true");
      const updateResult = await callRPC('update_license', {
        p_license_id: licenseId,
        p_has_file_upload: true
      });
      
      if (updateResult.error) {
        console.error("Error updating license has_file_upload:", updateResult.error);
      }
      
      toast.success("Script erfolgreich erstellt");
      // Reload licenses to show the new one
      await fetchLicenses();
      return true;
    } catch (error) {
      console.error("Error creating script:", error);
      toast.error("Fehler beim Erstellen des Scripts");
      return false;
    }
  };

  const handleUpdateScript = async (licenseId: string, scriptName: string, scriptCode: string | null, serverIp: string | null, isActive: boolean) => {
    try {
      console.log("Updating script with parameters:", {
        p_license_id: licenseId,
        p_script_name: scriptName,
        p_script_file: scriptCode,
        p_server_ip: serverIp,
        p_aktiv: isActive,
      });
      
      // Using the exact parameter names expected by the updated RPC function
      const { error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_script_name: scriptName,
        p_script_file: scriptCode,
        p_server_ip: serverIp,
        p_aktiv: isActive
      });
      
      if (error) {
        console.error("Error updating script:", error);
        toast.error("Fehler beim Aktualisieren des Scripts: " + error.message);
        return false;
      }
      
      toast.success("Script erfolgreich aktualisiert");
      await fetchLicenses();
      return true;
    } catch (error) {
      console.error("Error updating script:", error);
      toast.error("Fehler beim Aktualisieren des Scripts");
      return false;
    }
  };

  const handleRegenerateServerKey = async (licenseId: string) => {
    try {
      console.log("Regenerating server key with parameter:", {
        p_license_id: licenseId,
        p_regenerate_server_key: true
      });
      
      // Use the updated regenerate_server_key parameter
      const { error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_regenerate_server_key: true
      });
      
      if (error) {
        console.error("Error regenerating server key:", error);
        toast.error("Fehler beim Regenerieren des Server-Keys: " + error.message);
        return false;
      }
      
      toast.success("Server-Key erfolgreich regeneriert");
      await fetchLicenses();
      return true;
    } catch (error) {
      console.error("Error regenerating server key:", error);
      toast.error("Fehler beim Regenerieren des Server-Keys");
      return false;
    }
  };

  const handleDeleteScript = async (licenseId: string) => {
    try {
      console.log("Deleting script with parameter:", {
        p_license_id: licenseId,
      });
      
      const { error } = await callRPC('delete_license', {
        p_license_id: licenseId,
      });
      
      if (error) {
        console.error("Error deleting script:", error);
        toast.error("Fehler beim Löschen des Scripts: " + error.message);
        return false;
      }

      // Also clean up storage
      try {
        console.log(`Removing storage files for license ${licenseId}`);
        const { data, error: listError } = await supabase.storage
          .from('script')
          .list(licenseId);
          
        if (!listError && data && data.length > 0) {
          const filePaths = data.map(file => `${licenseId}/${file.name}`);
          await supabase.storage
            .from('script')
            .remove(filePaths);
        }
      } catch (storageError) {
        console.error("Error removing storage files:", storageError);
        // Continue with success even if storage cleanup fails
      }
      
      toast.success("Script erfolgreich gelöscht");
      await fetchLicenses();
      return true;
    } catch (error) {
      console.error("Error deleting script:", error);
      toast.error("Fehler beim Löschen des Scripts");
      return false;
    }
  };

  return {
    licenses,
    loading,
    handleCreateScript,
    handleUpdateScript,
    handleRegenerateServerKey,
    handleDeleteScript,
  };
}
