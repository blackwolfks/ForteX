
import { useState, useEffect } from "react";
import { License, NewScriptFormData } from "./types";
import { callRPC, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mediaService } from "@/services/media-service";

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
      return;
    }

    try {
      console.log("Creating license with the following parameters:", {
        p_script_name: newScript.name,
        p_script_file: newScript.code || null,
        p_server_ip: newScript.serverIp || null,
      });
      
      // Create the license first
      const { data, error } = await callRPC('create_license', {
        p_script_name: newScript.name,
        p_script_file: newScript.code || null,
        p_server_ip: newScript.serverIp || null,
      });
      
      if (error) {
        console.error("Error creating license:", error);
        toast.error("Fehler beim Erstellen des Scripts: " + error.message);
        return;
      }
      
      console.log("License created successfully:", data);
      
      if (selectedFiles.length > 0) {
        const licenseId = data.id;
        
        // Ensure the bucket exists before uploading files
        console.log("Ensuring storage bucket 'script' exists");
        const bucketExists = await mediaService.ensureBucketExists('script');
        if (!bucketExists) {
          console.error("Failed to create or find 'script' bucket");
          toast.error("Fehler beim Erstellen des Storage-Buckets");
          return;
        }
        
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
        
        // Mark this license as having file uploads - Fixed parameter format here
        console.log("Updating license to set has_file_upload = true");
        await callRPC('update_license', {
          p_license_id: licenseId,
          p_has_file_upload: true
        });
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
      const { error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_script_name: scriptName,
        p_script_file: scriptCode,
        p_server_ip: serverIp,
        p_aktiv: isActive,
      });
      
      if (error) {
        toast.error("Fehler beim Aktualisieren des Scripts");
        console.error(error);
        return;
      }
      
      toast.success("Script erfolgreich aktualisiert");
      fetchLicenses();
    } catch (error) {
      console.error("Error updating script:", error);
      toast.error("Fehler beim Aktualisieren des Scripts");
    }
  };

  const handleRegenerateServerKey = async (licenseId: string) => {
    try {
      const { error } = await callRPC('regenerate_server_key', {
        p_license_id: licenseId,
      });
      
      if (error) {
        toast.error("Fehler beim Regenerieren des Server-Keys");
        console.error(error);
        return;
      }
      
      toast.success("Server-Key erfolgreich regeneriert");
      fetchLicenses();
    } catch (error) {
      console.error("Error regenerating server key:", error);
      toast.error("Fehler beim Regenerieren des Server-Keys");
    }
  };

  const handleDeleteScript = async (licenseId: string) => {
    try {
      const { error } = await callRPC('delete_license', {
        p_license_id: licenseId,
      });
      
      if (error) {
        toast.error("Fehler beim Löschen des Scripts");
        console.error(error);
        return;
      }

      await supabase.storage
        .from('script')
        .remove([`${licenseId}`]);
      
      toast.success("Script erfolgreich gelöscht");
      fetchLicenses();
    } catch (error) {
      console.error("Error deleting script:", error);
      toast.error("Fehler beim Löschen des Scripts");
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
