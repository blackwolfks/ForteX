
import { useState, useEffect } from "react";
import { callRPC, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkStorageBucket } from "@/lib/supabase";

export interface FileItem {
  name: string;
  fullPath: string;
  size: number;
  isPublic: boolean;
}

export function useFileAccess(licenseId: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});

  // Get all files in the storage for this license
  const fetchFiles = async () => {
    setLoading(true);
    try {
      console.log(`Fetching files for license ${licenseId}`);
      
      // First, check if the storage bucket exists
      const bucketExists = await checkStorageBucket();
      if (!bucketExists) {
        console.error("Storage bucket does not exist or could not be created");
        toast.error("Fehler beim Zugriff auf den Speicher");
        setLoading(false);
        return;
      }
      
      // Get the access settings
      const { data: accessData, error: accessError } = await callRPC('get_file_access_for_license', {
        p_license_id: licenseId
      });
      
      if (accessError) {
        console.error("Error fetching file access:", accessError);
        toast.error("Fehler beim Laden der Datei-Zugriffsrechte");
        setLoading(false);
        return;
      }
      
      console.log("File access data:", accessData);
      
      // Create a map for quick lookup
      const newAccessMap: Record<string, boolean> = {};
      if (accessData) {
        accessData.forEach((item: any) => {
          newAccessMap[item.file_path] = item.is_public;
        });
      }
      setAccessMap(newAccessMap);
      
      // Then, get the files from storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('script')
        .list(licenseId, {
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (storageError) {
        console.error("Error fetching storage files:", storageError);
        toast.error("Fehler beim Laden der Dateien");
        setLoading(false);
        return;
      }
      
      console.log("Storage files:", storageData);
      
      if (!storageData) {
        setFiles([]);
        setLoading(false);
        return;
      }
      
      // Convert to our file item format
      const fileItems: FileItem[] = storageData
        .filter(item => !item.id.endsWith('/')) // Filter out folders
        .map(item => ({
          name: item.name,
          fullPath: `${licenseId}/${item.name}`,
          size: item.metadata?.size || 0,
          isPublic: newAccessMap[`${licenseId}/${item.name}`] || false
        }));
        
      setFiles(fileItems);
    } catch (error) {
      console.error("Error in fetchFiles:", error);
      toast.error("Fehler beim Laden der Dateien");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (licenseId) {
      fetchFiles();
    }
  }, [licenseId]);

  // Toggle file public/private status
  const toggleFileVisibility = (index: number) => {
    const newFiles = [...files];
    newFiles[index].isPublic = !newFiles[index].isPublic;
    setFiles(newFiles);
  };

  // Save all file access settings
  const saveFileAccess = async () => {
    setSaving(true);
    try {
      console.log("Saving file access settings for files:", files);
      
      let errorCount = 0;
      
      for (const file of files) {
        console.log(`Updating access for ${file.fullPath}: isPublic=${file.isPublic}`);
        
        try {
          const { error } = await callRPC('update_file_access', {
            p_license_id: licenseId,
            p_file_path: file.fullPath,
            p_is_public: file.isPublic
          });
          
          if (error) {
            console.error(`Error updating file access for ${file.fullPath}:`, error);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error in saveFileAccess for ${file.fullPath}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} Datei-Zugriffsrechte konnten nicht gespeichert werden`);
      } else {
        toast.success("Datei-Zugriffsrechte erfolgreich gespeichert");
      }
      
      // Refresh the file list
      await fetchFiles();
    } catch (error) {
      console.error("Error saving file access:", error);
      toast.error("Fehler beim Speichern der Datei-Zugriffsrechte");
    } finally {
      setSaving(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    files,
    loading,
    saving,
    toggleFileVisibility,
    saveFileAccess,
    formatFileSize
  };
}
