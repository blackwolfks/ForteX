
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { License, NewScriptFormData } from "./types";
import { generateRandomString } from "@/lib/utils";

export const useScriptManagement = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("server_licenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setLicenses(data || []);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast.error("Fehler beim Laden der Lizenzen");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScript = async (scriptData: NewScriptFormData, files: File[]) => {
    try {
      // Create a server key
      const serverKey = generateRandomString(32);
      const licenseKey = generateRandomString(16);

      // Insert the script data into Supabase
      const { data, error } = await supabase.from("server_licenses").insert({
        script_name: scriptData.name,
        server_ip: scriptData.serverIp || null,
        server_key: serverKey,
        license_key: licenseKey,
        description: scriptData.description || null,
        has_file_upload: files.length > 0,
        game_server: scriptData.game_server, // Neue Felder
        category: scriptData.category      // Neue Felder
      }).select();

      if (error) throw error;

      const newLicense = data[0];
      
      // Handle file uploads if there are any
      if (files.length > 0 && newLicense) {
        for (const file of files) {
          const filePath = `scripts/${newLicense.id}/${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from("script")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            throw uploadError;
          }

          // Create file access record
          const { error: accessError } = await supabase
            .from("script_file_access")
            .insert({
              license_id: newLicense.id,
              file_path: filePath,
              is_public: false
            });

          if (accessError) {
            console.error("Error creating file access record:", accessError);
          }
        }
      }

      // Add the new license to the state
      setLicenses(prev => [newLicense, ...prev]);

      toast.success("Script erfolgreich erstellt");
      return true;
    } catch (error) {
      console.error("Error creating script:", error);
      toast.error("Fehler beim Erstellen des Scripts");
      return false;
    }
  };

  const handleUpdateScript = async (id: string, updates: { name?: string; description?: string; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from("server_licenses")
        .update({
          script_name: updates.name,
          description: updates.description,
          aktiv: updates.is_active
        })
        .eq("id", id);

      if (error) throw error;

      // Update the license in state
      setLicenses(prev =>
        prev.map(license =>
          license.id === id
            ? {
                ...license,
                script_name: updates.name || license.script_name,
                description: updates.description !== undefined ? updates.description : license.description,
                aktiv: updates.is_active !== undefined ? updates.is_active : license.aktiv
              }
            : license
        )
      );

      toast.success("Script erfolgreich aktualisiert");
      return true;
    } catch (error) {
      console.error("Error updating script:", error);
      toast.error("Fehler beim Aktualisieren des Scripts");
      return false;
    }
  };

  const handleRegenerateServerKey = async (id: string) => {
    try {
      const newServerKey = generateRandomString(32);

      const { error } = await supabase
        .from("server_licenses")
        .update({
          server_key: newServerKey
        })
        .eq("id", id);

      if (error) throw error;

      // Update the server key in state
      setLicenses(prev =>
        prev.map(license =>
          license.id === id
            ? {
                ...license,
                server_key: newServerKey
              }
            : license
        )
      );

      toast.success("Server-Key erfolgreich regeneriert");
      return true;
    } catch (error) {
      console.error("Error regenerating server key:", error);
      toast.error("Fehler beim Regenerieren des Server-Keys");
      return false;
    }
  };

  const handleDeleteScript = async (id: string) => {
    try {
      // First, delete all file access records
      const { error: accessError } = await supabase
        .from("script_file_access")
        .delete()
        .eq("license_id", id);

      if (accessError) {
        console.error("Error deleting file access records:", accessError);
      }

      // Delete the script
      const { error } = await supabase
        .from("server_licenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove the license from state
      setLicenses(prev => prev.filter(license => license.id !== id));

      toast.success("Script erfolgreich gelöscht");
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
    handleDeleteScript
  };
};
