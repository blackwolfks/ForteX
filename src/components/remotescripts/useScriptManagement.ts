import { useState, useEffect, useCallback } from "react";
import { License, NewScriptFormData } from "./types";
import { callRPC, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ensureBucketExists } from "@/services/file-uploader";

export function useScriptManagement() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleCreateScript = async (newScript: NewScriptFormData, selectedFiles: File[]) => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return false;
    }

    try {
      // Create the license first with explicit parameter names in the correct order
      const { data, error } = await callRPC('create_license', {
        p_script_name: newScript.name,
        p_script_file: null,
        p_server_ip: newScript.serverIp || null
      });
      
      if (error) {
        console.error("Error creating license:", error);
        toast.error("Fehler beim Erstellen des Scripts: " + error.message);
        return false;
      }
      
      if (!data || !data.id) {
        console.error("No license data returned from create_license");
        toast.error("Fehler beim Erstellen des Scripts: Keine Lizenz-ID erhalten");
        return false;
      }
      
      toast.success("Script erfolgreich erstellt");
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
        const { data, error: listError } = await supabase.storage
          .from('script')
          .list(`${licenseId}`);
          
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
