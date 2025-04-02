
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { callRPC, supabase } from "@/integrations/supabase/client";
import { checkStorageBucket } from "@/lib/supabase";

export interface FileItem {
  name: string;
  id?: string;
  size?: number;
  isPublic: boolean;
  fullPath?: string;
}

export function useFileAccess(licenseId: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!licenseId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching file list for license ${licenseId}`);
      
      // Ensure the bucket exists
      const bucketExists = await checkStorageBucket('script');
      if (!bucketExists) {
        console.error("Storage bucket does not exist");
        setFiles([]);
        setLoading(false);
        return;
      }

      // Load files from storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('script')
        .list(licenseId, { 
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (storageError) {
        console.error("Error listing files from storage:", storageError);
        if (storageError.message.includes("bucket") && storageError.message.includes("not found")) {
          // No files yet, not necessarily an error to show to user
          console.log("No storage bucket or no files yet");
          setFiles([]);
          setLoading(false);
          return;
        } else {
          toast.error("Fehler beim Laden der Dateien aus dem Speicher");
        }
      }
      
      // Get file access permissions
      const { data: accessData, error: accessError } = await callRPC('get_file_access_for_license', {
        p_license_id: licenseId,
      });
      
      if (accessError) {
        console.error("Error fetching file access permissions:", accessError);
        toast.error("Fehler beim Laden der Dateizugriffsrechte");
      }
      
      // Combine storage files with access permissions
      const filesList: FileItem[] = (storageFiles || []).map(file => {
        const accessEntry = accessData?.find((access: any) => 
          access.file_path === file.name
        );
        
        return {
          name: file.name,
          id: file.id,
          size: file.metadata?.size,
          isPublic: accessEntry ? accessEntry.is_public : false,
          fullPath: `${licenseId}/${file.name}` // Add the fullPath property here
        };
      });
      
      setFiles(filesList);
    } catch (error) {
      console.error("Exception in fetchFiles:", error);
      toast.error("Fehler beim Laden der Dateien");
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const toggleFileVisibility = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles[index] = {
        ...newFiles[index],
        isPublic: !newFiles[index].isPublic
      };
      return newFiles;
    });
  };

  const saveFileAccess = async () => {
    if (!licenseId || files.length === 0) return;
    
    setSaving(true);
    try {
      console.log(`Saving file access rights for ${files.length} files`);
      
      const updatePromises = files.map(file => 
        callRPC('update_file_access', {
          p_license_id: licenseId,
          p_file_path: file.name,
          p_is_public: file.isPublic
        })
      );
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error("Errors updating file access:", errors);
        toast.error(`Fehler beim Speichern von ${errors.length} Dateizugriffsrechten`);
      } else {
        toast.success("Dateizugriffsrechte erfolgreich gespeichert");
      }
    } catch (error) {
      console.error("Error saving file access:", error);
      toast.error("Fehler beim Speichern der Dateizugriffsrechte");
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "n/a";
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
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
