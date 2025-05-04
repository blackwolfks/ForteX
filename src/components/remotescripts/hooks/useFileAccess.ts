
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  created_at: string;
  updated_at: string | null;
  path: string;
}

interface UseFileAccessProps {
  bucketName: string;
  path?: string;
  maxRetries?: number;
  retryDelay?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useFileAccess = ({
  bucketName,
  path = '',
  maxRetries = 3,
  retryDelay = 1000,
  autoRefresh = false,
  refreshInterval = 10000
}: UseFileAccessProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(path);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const listFiles = useCallback(async (directoryPath: string = currentPath) => {
    console.log(`Listing files in ${bucketName}/${directoryPath}`);
    setIsLoading(true);
    setError(null);
    
    let attempt = 0;
    let success = false;
    
    while (attempt < maxRetries && !success) {
      try {
        const { data, error } = await supabase.storage.from(bucketName).list(directoryPath, {
          sortBy: { column: 'name', order: 'asc' }
        });
        
        if (error) throw error;
        
        if (data) {
          console.log(`Found ${data.length} files/folders in ${bucketName}/${directoryPath}`);
          const formattedFiles: FileItem[] = data.map((item) => ({
            id: item.id || `${directoryPath}/${item.name}`,
            name: item.name,
            size: item.metadata?.size || 0,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || null,
            path: directoryPath ? `${directoryPath}/${item.name}` : item.name
          }));
          
          setFiles(formattedFiles);
          setCurrentPath(directoryPath);
          success = true;
        }
      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed:`, err);
        attempt++;
        
        if (attempt >= maxRetries) {
          setError(`Fehler beim Laden der Dateien: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
          toast.error(`Fehler beim Laden der Dateien nach ${maxRetries} Versuchen.`);
        } else {
          // Wait before retrying
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
    }
    
    setIsLoading(false);
  }, [bucketName, currentPath, maxRetries, retryDelay]);

  const navigateTo = useCallback((newPath: string) => {
    setCurrentPath(newPath);
    listFiles(newPath);
  }, [listFiles]);

  const navigateUp = useCallback(() => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/');
    
    navigateTo(parentPath);
  }, [currentPath, navigateTo]);

  const downloadFile = useCallback(async (filePath: string): Promise<{ data: Blob | null, error: Error | null }> => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).download(filePath);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { data: null, error: error as Error };
    }
  }, [bucketName]);

  const getFileContent = useCallback(async (file: FileItem): Promise<string | null> => {
    console.log(`Getting content for file: ${file.path}`);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await downloadFile(file.path);
      
      if (error) throw error;
      if (!data) throw new Error('No data received');
      
      // For text files, convert blob to text
      const isTextFile = ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.xml', '.lua', '.sql', '.py'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (isTextFile) {
        const text = await data.text();
        console.log(`File loaded successfully, content length: ${text.length}`);
        setFileContent(text);
        return text;
      } else {
        setError('Dieser Dateityp kann nicht als Text angezeigt werden');
        return null;
      }
    } catch (err) {
      console.error('Error getting file content:', err);
      setError(`Fehler beim Laden der Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      setFileContent(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, downloadFile]);

  const saveFileContent = useCallback(async (file: FileItem, content: string): Promise<boolean> => {
    console.log(`Saving content for file: ${file.path}`);
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert string to blob
      const blob = new Blob([content], { type: 'text/plain' });
      
      // Upload file
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(file.path, blob, { upsert: true });
      
      if (error) throw error;
      
      console.log(`File saved successfully: ${file.path}`);
      return true;
    } catch (err) {
      console.error('Error saving file:', err);
      setError(`Fehler beim Speichern der Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [bucketName]);

  const uploadFile = useCallback(async (file: File, customPath?: string): Promise<boolean> => {
    const uploadPath = customPath ? `${customPath}/${file.name}` : `${currentPath}/${file.name}`;
    console.log(`Uploading file to ${bucketName}/${uploadPath}`);
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(uploadPath, file);

      if (error) throw error;

      // Refresh file list after upload
      await listFiles(currentPath);
      return true;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`Fehler beim Hochladen der Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, currentPath, listFiles]);

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    console.log(`Deleting file: ${bucketName}/${filePath}`);
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      // Refresh file list after deletion
      await listFiles(currentPath);
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(`Fehler beim Löschen der Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, currentPath, listFiles]);

  const createFolder = useCallback(async (folderName: string): Promise<boolean> => {
    const folderPath = currentPath ? `${currentPath}/${folderName}/.keep` : `${folderName}/.keep`;
    console.log(`Creating folder: ${bucketName}/${folderPath}`);
    setIsLoading(true);
    setError(null);

    try {
      // Create empty file to create folder
      const emptyBlob = new Blob([''], { type: 'text/plain' });
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(folderPath, emptyBlob);

      if (error) throw error;

      // Refresh file list after creation
      await listFiles(currentPath);
      return true;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(`Fehler beim Erstellen des Ordners: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, currentPath, listFiles]);

  const editFile = useCallback(async (file: FileItem) => {
    console.log(`Preparing to edit file: ${file.path}`);
    setSelectedFile(file);
    setFileContent(null); // Clear previous content
    setIsEditDialogOpen(true); // Open dialog immediately
    
    // Start loading content after dialog is shown
    try {
      const content = await getFileContent(file);
      if (content === null) {
        console.error("Failed to load file content for editing");
      }
    } catch (err) {
      console.error("Error loading file for editing:", err);
      setError(`Fehler beim Laden der Datei: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    }
  }, [getFileContent]);

  const handleSaveFile = useCallback(async (newContent: string): Promise<boolean> => {
    if (!selectedFile) {
      console.error("No file selected for saving");
      return false;
    }
    
    return await saveFileContent(selectedFile, newContent);
  }, [selectedFile, saveFileContent]);

  // Initial file listing
  useEffect(() => {
    listFiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      listFiles();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, listFiles]);

  return {
    files,
    currentPath,
    isLoading,
    error,
    fileContent,
    selectedFile,
    isEditDialogOpen,
    setIsEditDialogOpen,
    listFiles,
    navigateTo,
    navigateUp,
    downloadFile,
    getFileContent,
    editFile,
    handleSaveFile,
    uploadFile,
    deleteFile,
    createFolder
  };
};
