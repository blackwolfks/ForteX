
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
      console.log("Creating license with parameters:", {
        p_script_name: newScript.name,
        p_server_ip: newScript.serverIp || null
      });
      
      // Create the license first with explicit parameter names
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
      
      console.log("License creation response:", data);
      
      if (!data || data.length === 0) {
        console.error("No license data returned from create_license");
        toast.error("Fehler beim Erstellen des Scripts: Keine Daten erhalten");
        return false;
      }
      
      // Extract the license ID properly from the returned data
      // The response format might be an array with the first element containing the data
      const licenseData = Array.isArray(data) ? data[0] : data;
      
      if (!licenseData || !licenseData.id) {
        console.error("Invalid license data structure:", licenseData);
        toast.error("Fehler beim Erstellen des Scripts: Ungültiges Datenformat");
        return false;
      }
      
      // Log the script creation
      try {
        await supabase.rpc('add_script_log', {
          p_license_id: licenseData.id,
          p_level: 'info',
          p_message: `Script "${newScript.name}" wurde erstellt`,
          p_source: 'script-management',
          p_details: `Server IP: ${newScript.serverIp || 'None'}`,
          p_error_code: null
        });
      } catch (logError) {
        console.error("Error logging script creation:", logError);
        // Continue even if logging fails
      }
      
      console.log("License created successfully with ID:", licenseData.id);
      toast.success("Script erfolgreich erstellt");
      
      // Refresh the license list to show the new one
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
      
      // Log the script update
      try {
        await supabase.rpc('add_script_log', {
          p_license_id: licenseId,
          p_level: 'info',
          p_message: `Script "${scriptName}" wurde aktualisiert`,
          p_source: 'script-management',
          p_details: `Aktiv: ${isActive ? 'Ja' : 'Nein'}, Server IP: ${serverIp || 'None'}`,
          p_error_code: null
        });
      } catch (logError) {
        console.error("Error logging script update:", logError);
        // Continue even if logging fails
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
      
      // Log server key regeneration
      try {
        const license = licenses.find(l => l.id === licenseId);
        await supabase.rpc('add_script_log', {
          p_license_id: licenseId,
          p_level: 'warning',
          p_message: `Server-Key wurde regeneriert für Script "${license?.script_name || 'Unbekannt'}"`,
          p_source: 'security',
          p_details: null,
          p_error_code: null
        });
      } catch (logError) {
        console.error("Error logging server key regeneration:", logError);
        // Continue even if logging fails
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
      // Get script name before deletion for logging purposes
      const scriptToDelete = licenses.find(license => license.id === licenseId);
      const scriptName = scriptToDelete?.script_name || 'Unbekannt';
      
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
      
      // Can't log to the specific license anymore since it's deleted,
      // but we could log to a system log or admin log in the future if needed
      
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
