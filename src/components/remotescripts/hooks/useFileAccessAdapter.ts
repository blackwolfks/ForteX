
import { useState } from 'react';
import { useFileAccess, FileItem } from './useFileAccess';
import { toast } from 'sonner';

export const useFileAccessAdapter = (licenseId: string) => {
  const [saving, setSaving] = useState(false);
  
  const {
    files,
    isLoading: loading,
    error,
    fileContent,
    selectedFile: currentFile,
    isEditDialogOpen: editDialogOpen,
    setIsEditDialogOpen: setEditDialogOpen,
    uploadFile,
    deleteFile,
    editFile,
    handleSaveFile,
    getFileContent,
    downloadFile
  } = useFileAccess({
    bucketName: 'script',
    path: licenseId
  });

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to save edited file content
  const saveEditedFile = async (content: string): Promise<boolean> => {
    return handleSaveFile(content);
  };

  // Function to toggle file visibility
  const toggleFileVisibility = async (index: number) => {
    setSaving(true);
    try {
      const file = files[index];
      const updatedFile = { ...file, isPublic: !file.isPublic };
      
      // Here you would implement the actual visibility toggle logic
      // For now just showing a toast
      toast.success(`Datei ${file.isPublic ? 'privat' : 'öffentlich'} gesetzt`);
      
      // In a real implementation, you would update the file on the server
      console.log('Toggling visibility for file:', file.fullPath, 'to:', !file.isPublic);
      
    } catch (err) {
      console.error('Error toggling file visibility:', err);
      toast.error('Fehler beim Ändern der Sichtbarkeit');
    } finally {
      setSaving(false);
    }
  };

  // Placeholder function for saving file access
  const saveFileAccess = async () => {
    setSaving(true);
    try {
      // Placeholder for actual save logic
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Änderungen gespeichert');
      return true;
    } catch (err) {
      console.error('Error saving file access:', err);
      toast.error('Fehler beim Speichern');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    files,
    loading,
    saving,
    error,
    fileContent,
    currentFile,
    editDialogOpen,
    saveFileAccess,
    toggleFileVisibility,
    downloadFile: (file: FileItem) => downloadFile(file.path || ''),
    editFile,
    saveEditedFile,
    deleteFile: (file: FileItem) => deleteFile(file.path || ''),
    formatFileSize,
    setEditDialogOpen
  };
};
