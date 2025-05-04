import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { callRPC, supabase, checkStorageBucket } from "@/lib/supabase";

export interface FileItem {
  name: string;
  id?: string;
  size?: number;
  isPublic: boolean;
  fullPath: string;
  metadata?: {
    size: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
  };
  updated_at?: string;
}

export const useFileAccess = (licenseId: string) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("name_asc");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

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
          fullPath: `${licenseId}/${file.name}`
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
  
  const downloadFile = async (file: FileItem) => {
    try {
      console.log(`Downloading file: ${file.fullPath}`);
      
      const { data, error } = await supabase.storage
        .from('script')
        .download(file.fullPath);
        
      if (error) {
        console.error("Error downloading file:", error);
        toast.error(`Fehler beim Herunterladen der Datei: ${error.message}`);
        return;
      }
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Datei "${file.name}" erfolgreich heruntergeladen`);
    } catch (error) {
      console.error("Error in downloadFile:", error);
      toast.error("Fehler beim Herunterladen der Datei");
    }
  };
  
  const cleanFileContent = (content: string): string => {
    // Function to clean WebKit form boundaries from file content
    if (!content) return "";
    
    // Remove WebKit form boundaries and headers
    let cleaned = content;
    
    // Remove WebKit form boundaries and related content
    cleaned = cleaned.replace(/^------WebKit[^\r\n]*(\r?\n)?/gm, "");
    cleaned = cleaned.replace(/^Content-(Type|Disposition)[^\r\n]*(\r?\n)?/gm, "");
    
    // If we see a numeric prefix (like "3600"), remove it more aggressively
    cleaned = cleaned.replace(/^[\s\d]+/, "");  // More aggressive regex to remove numeric prefixes
    cleaned = cleaned.replace(/^3600[\s\r\n]*/, ""); // Specifically target "3600" at the beginning
    
    // Handle the case where there's "[string "3600..."]" in the content
    cleaned = cleaned.replace(/\[string\s+["']3600[^"']*["']\]:\d+:\s*/, "");
    
    // If we still have text/plain or other content type indicators, try to extract just the code
    const contentMatch = cleaned.match(/Content-Type: [^\r\n]*\r?\n\r?\n([\s\S]*?)(?:\r?\n------)/i);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1].trim();
    }
    
    return cleaned.trim();
  };
  
  const fetchFileContent = async (file: FileItem) => {
    try {
      console.log(`Fetching content for file: ${file.fullPath}`);
      
      const { data, error } = await supabase.storage
        .from('script')
        .download(file.fullPath);
        
      if (error) {
        console.error("Error downloading file for editing:", error);
        toast.error(`Fehler beim Laden der Datei: ${error.message}`);
        return null;
      }
      
      // Convert to text
      let content = await data.text();
      
      // Clean the content if it contains WebKit form boundaries or numeric prefixes
      if (content.includes("------WebKit") || content.includes("3600")) {
        console.log("Found WebKit boundaries or numeric prefix, cleaning content");
        content = cleanFileContent(content);
      }
      
      return content;
    } catch (error) {
      console.error("Error in fetchFileContent:", error);
      toast.error("Fehler beim Lesen der Datei");
      return null;
    }
  };
  
  const editFile = async (file: FileItem) => {
    try {
      setCurrentFile(file);
      const content = await fetchFileContent(file);
      if (content !== null) {
        setFileContent(content);
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error("Error preparing file for edit:", error);
      toast.error("Fehler beim Vorbereiten der Datei zum Bearbeiten");
    }
  };
  
  const saveEditedFile = async (newContent: string) => {
    if (!currentFile) return false;
    
    try {
      console.log(`Saving edited file: ${currentFile.fullPath}`);
      
      // Convert string to blob
      const blob = new Blob([newContent], { type: 'text/plain' });
      
      const { error } = await supabase.storage
        .from('script')
        .update(currentFile.fullPath, blob);
        
      if (error) {
        console.error("Error updating file:", error);
        toast.error(`Fehler beim Speichern der Datei: ${error.message}`);
        return false;
      }
      
      toast.success(`Datei "${currentFile.name}" erfolgreich gespeichert`);
      setEditDialogOpen(false);
      fetchFiles(); // Refresh file list
      return true;
    } catch (error) {
      console.error("Error in saveEditedFile:", error);
      toast.error("Fehler beim Speichern der Datei");
      return false;
    }
  };
  
  const deleteFile = async (file: FileItem) => {
    if (!window.confirm(`Möchten Sie die Datei "${file.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      console.log(`Deleting file: ${file.fullPath}`);
      
      const { error } = await supabase.storage
        .from('script')
        .remove([file.fullPath]);
        
      if (error) {
        console.error("Error deleting file:", error);
        toast.error(`Fehler beim Löschen der Datei: ${error.message}`);
        return;
      }
      
      // Also delete file access records
      const { error: accessError } = await callRPC('update_file_access', {
        p_license_id: licenseId,
        p_file_path: file.name,
        p_is_public: false,
        p_delete: true
      });
      
      if (accessError) {
        console.error("Error deleting file access record:", accessError);
      }
      
      toast.success(`Datei "${file.name}" erfolgreich gelöscht`);
      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error("Error in deleteFile:", error);
      toast.error("Fehler beim Löschen der Datei");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "n/a";
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  // Filter and sort files based on searchQuery, sortOrder, and fileTypeFilter
  const getFilteredAndSortedFiles = useCallback(() => {
    // First, filter the files by search query and file type
    let filteredFiles = [...files];
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    // Apply file type filter if not "all"
    if (fileTypeFilter !== "all") {
      filteredFiles = filteredFiles.filter(file => {
        switch (fileTypeFilter) {
          case "lua":
            return file.name.toLowerCase().endsWith(".lua");
          case "js":
            return file.name.toLowerCase().endsWith(".js");
          case "json":
            return file.name.toLowerCase().endsWith(".json");
          case "config":
            return file.name.toLowerCase().includes("config");
          default:
            return true;
        }
      });
    }
    
    // Sort the filtered files with null/undefined checks
    return filteredFiles.sort((a, b) => {
      switch (sortOrder) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "size_asc":
          const sizeA = a.metadata?.size || a.size || 0;
          const sizeB = b.metadata?.size || b.size || 0;
          return sizeA - sizeB;
        case "size_desc":
          const sizeBDesc = b.metadata?.size || b.size || 0;
          const sizeADesc = a.metadata?.size || a.size || 0;
          return sizeBDesc - sizeADesc;
        case "updated_asc":
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateA - dateB;
        case "updated_desc":
          const dateBDesc = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          const dateADesc = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          return dateBDesc - dateADesc;
        default:
          return 0;
      }
    });
  }, [files, searchQuery, sortOrder, fileTypeFilter]);

  return {
    files,
    loading,
    saving,
    editDialogOpen,
    fileContent,
    currentFile,
    saveFileAccess, 
    toggleFileVisibility, 
    downloadFile,
    editFile,
    saveEditedFile,
    deleteFile,
    formatFileSize,
    setEditDialogOpen,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    fileTypeFilter,
    setFileTypeFilter,
    getFilteredAndSortedFiles
  };
};
