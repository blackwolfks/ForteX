
import { useState, useEffect } from "react";
import { License, NewScriptFormData } from "./types";
import { callRPC, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mediaService } from "@/services/media-service";
import { checkStorageBucket } from "@/lib/supabase";

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

  // Function to pre-create the storage bucket before we need it
  const ensureScriptBucketExists = async () => {
    console.log("Ensuring 'script' bucket exists before creating license");
    const bucketExists = await checkStorageBucket('script');
    if (!bucketExists) {
      console.error("Failed to create or find 'script' bucket");
      toast.error("Fehler beim Erstellen des Storage-Buckets");
      return false;
    }
    return true;
  };

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
      const bucketReady = await ensureScriptBucketExists();
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
      
      for (const file of selectedFiles) {
        let filePath = file.webkitRelativePath || file.name;
        
        console.log(`Uploading file ${filePath} to script/${licenseId}`);
        
        const { error: uploadError } = await supabase.storage
          .from('script')
          .upload(`${licenseId}/${filePath}`, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          uploadErrors++;
        }
      }
      
      if (uploadErrors > 0) {
        toast.error(`${uploadErrors} Dateien konnten nicht hochgeladen werden`);
      } else {
        toast.success(`${selectedFiles.length} Dateien erfolgreich hochgeladen`);
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
