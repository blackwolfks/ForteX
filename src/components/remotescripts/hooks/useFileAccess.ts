
import { useState, useEffect } from "react";
import { supabase, callRPC } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FileAccess } from "@/lib/supabase";

export interface FileItem {
  name: string;
  fullPath: string;
  isPublic: boolean;
  size: number;
  isDirectory?: boolean;
  children?: FileItem[];
}

export function useFileAccess(licenseId: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch files from Storage
  const fetchFiles = async () => {
    setLoading(true);
    try {
      console.log(`[useFileAccess] Fetching files for license ${licenseId}...`);
      
      // Ensure bucket exists
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error("Error getting buckets:", bucketsError);
          toast.error("Fehler beim Abrufen der Storage-Buckets");
          setLoading(false);
          return;
        }
        
        const scriptBucketExists = buckets.some(bucket => bucket.name === "script");
        
        if (!scriptBucketExists) {
          console.log("[useFileAccess] Script bucket doesn't exist, creating it...");
          const { error: createError } = await supabase.storage.createBucket("script", {
            public: true
          });
          
          if (createError) {
            console.error("Error creating script bucket:", createError);
            toast.error("Fehler beim Erstellen des Script-Buckets");
            setLoading(false);
            return;
          }
        }
      } catch (bucketsError) {
        console.error("Error checking buckets:", bucketsError);
      }
      
      // Check if folder exists, if not create it
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from("script")
          .list(licenseId);
          
        if (folderError) {
          if (folderError.message.includes("The resource was not found")) {
            // Create an empty file to initialize the folder
            const emptyFile = new Blob([""], { type: "text/plain" });
            await supabase.storage
              .from("script")
              .upload(`${licenseId}/.folder_init`, emptyFile);
              
            console.log(`[useFileAccess] Created folder for license ${licenseId}`);
          } else {
            console.error("Error checking folder:", folderError);
          }
        }
      } catch (folderError) {
        console.error("Error creating folder:", folderError);
      }
      
      // List files with explicit public access
      const { data: storageFiles, error } = await supabase.storage
        .from("script")
        .list(licenseId, {
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error("Fehler beim Abrufen der Dateien:", error);
        toast.error("Fehler beim Laden der Dateien");
        setLoading(false);
        return;
      }

      // Get access rights
      let accessData: FileAccess[] = [];
      try {
        const { data: accessResponse, error: accessError } = await callRPC<'get_file_access_for_license'>(
          'get_file_access_for_license', 
          { p_license_id: licenseId }
        );

        if (!accessError && Array.isArray(accessResponse)) {
          accessData = accessResponse;
        } else {
          console.warn("Could not get file access data, will default to private");
        }
      } catch (accessError) {
        console.warn("Error fetching file access data:", accessError);
      }

      // Merge files with access rights
      const filesWithAccess = storageFiles
        ? storageFiles
            .filter(file => !file.name.startsWith(".")) // Hide hidden files
            .map(file => {
              const fullPath = `${licenseId}/${file.name}`;
              let isPublic = false;
              
              if (Array.isArray(accessData)) {
                const accessInfo = accessData.find((a: FileAccess) => a.file_path === fullPath);
                isPublic = accessInfo?.is_public || false;
              }
              
              return {
                name: file.name,
                fullPath: fullPath,
                isPublic: isPublic,
                size: file.metadata?.size || 0,
                isDirectory: file.metadata?.mimetype === 'inode/directory'
              };
            })
        : [];

      setFiles(filesWithAccess);
    } catch (error) {
      console.error("Fehler:", error);
      toast.error("Fehler beim Laden der Dateien");
    } finally {
      setLoading(false);
    }
  };

  // Save access rights
  const saveAccessRights = async () => {
    setSaving(true);
    try {
      for (const file of files) {
        try {
          const { error } = await callRPC<'update_file_access'>(
            'update_file_access', 
            {
              p_license_id: licenseId,
              p_file_path: file.fullPath,
              p_is_public: file.isPublic
            }
          );
              
          if (error) {
            console.error("Fehler beim Speichern der Zugriffsrechte:", error);
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
              toast.error("Die Datenbanktabelle für Dateizugriffe existiert noch nicht");
              break;
            }
            throw error;
          }
        } catch (fileError) {
          console.error(`Error updating access for ${file.fullPath}:`, fileError);
        }
      }

      toast.success("Zugriffsrechte erfolgreich gespeichert");
    } catch (error) {
      console.error("Fehler beim Speichern der Zugriffsrechte:", error);
      toast.error("Fehler beim Speichern der Zugriffsrechte");
    } finally {
      setSaving(false);
    }
  };

  // Toggle file visibility
  const toggleFileVisibility = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles[index].isPublic = !updatedFiles[index].isPublic;
    setFiles(updatedFiles);
  };

  useEffect(() => {
    if (licenseId) {
      fetchFiles();
    }
  }, [licenseId]);

  // Format file size utility
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    files,
    loading,
    saving,
    saveAccessRights,
    toggleFileVisibility,
    formatFileSize
  };
}
