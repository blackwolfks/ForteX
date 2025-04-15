
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileIcon, Trash2, Eye, Download, RefreshCw, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { uploadFile } from '@/services/file-uploader';
import type { FileObject } from '@supabase/storage-js';

type FileItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
};

type FileBrowserProps = {
  bucketId: string;
  folderPath?: string;
  onSelect?: (file: FileItem) => void;
};

export default function FileBrowser({ bucketId, folderPath = '', onSelect }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Dateien laden
  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .list(folderPath, {
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        toast.error(`Fehler beim Laden der Dateien: ${error.message}`);
        return;
      }

      // Transform FileObjects to FileItems with the required structure
      const transformedFiles: FileItem[] = (data || [])
        .filter((item: FileObject) => !item.id.endsWith('/'))
        .map((item: FileObject) => ({
          id: item.id,
          name: item.name,
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          last_accessed_at: item.last_accessed_at || '',
          metadata: {
            size: (item.metadata as any)?.size || 0,
            mimetype: (item.metadata as any)?.mimetype || 'application/octet-stream'
          }
        }));

      setFiles(transformedFiles);
    } catch (error) {
      console.error('Fehler beim Laden der Dateien:', error);
      toast.error('Fehler beim Laden der Dateien');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [bucketId, folderPath]);

  // Datei-Inhalt laden
  const viewFileContent = async (file: FileItem) => {
    setSelectedFile(file);
    setFileContentLoading(true);
    setFileContent(null);

    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .download(`${folderPath ? folderPath + '/' : ''}${file.name}`);

      if (error) {
        toast.error(`Fehler beim Laden der Datei: ${error.message}`);
        return;
      }

      // Dateiinhalt als Text lesen
      const content = await data.text();
      setFileContent(content);
    } catch (error) {
      console.error('Fehler beim Laden des Dateiinhalts:', error);
      toast.error('Fehler beim Laden des Dateiinhalts');
    } finally {
      setFileContentLoading(false);
    }
  };

  // Datei löschen
  const deleteFile = async (file: FileItem) => {
    if (!confirm(`Sind Sie sicher, dass Sie die Datei "${file.name}" löschen möchten?`)) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(bucketId)
        .remove([`${folderPath ? folderPath + '/' : ''}${file.name}`]);

      if (error) {
        toast.error(`Fehler beim Löschen der Datei: ${error.message}`);
        return;
      }

      toast.success(`Datei "${file.name}" erfolgreich gelöscht`);
      
      // Liste aktualisieren und ausgewählte Datei zurücksetzen wenn nötig
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
        setFileContent(null);
      }
      
      loadFiles();
    } catch (error) {
      console.error('Fehler beim Löschen der Datei:', error);
      toast.error('Fehler beim Löschen der Datei');
    }
  };

  // Datei herunterladen
  const downloadFile = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .download(`${folderPath ? folderPath + '/' : ''}${file.name}`);

      if (error) {
        toast.error(`Fehler beim Herunterladen der Datei: ${error.message}`);
        return;
      }

      // Blob URL erstellen und Download starten
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim Herunterladen der Datei:', error);
      toast.error('Fehler beim Herunterladen der Datei');
    }
  };

  // Neue Datei hochladen
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileToUpload(file);
  };

  const uploadSelectedFile = async () => {
    if (!fileToUpload) {
      toast.error("Keine Datei ausgewählt");
      return;
    }

    setUploading(true);
    try {
      // Vollständigen Pfad erstellen
      const filePath = `${folderPath ? folderPath + '/' : ''}${fileToUpload.name}`;
      
      const result = await uploadFile(bucketId, filePath, fileToUpload);
      
      if (result.error) {
        toast.error(`Fehler beim Hochladen: ${result.error.message}`);
        return;
      }
      
      toast.success(`Datei "${fileToUpload.name}" erfolgreich hochgeladen`);
      setFileToUpload(null);
      
      // Dateiliste aktualisieren
      loadFiles();
      
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      toast.error('Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
  };

  // Formatierung der Dateigröße
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dateibrowser: {bucketId}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Hochladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Datei hochladen</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Datei auswählen</label>
                  <input 
                    type="file" 
                    className="w-full" 
                    onChange={handleFileUpload}
                  />
                </div>
                
                {fileToUpload && (
                  <div className="text-sm">
                    <strong>Ausgewählte Datei:</strong> {fileToUpload.name} ({formatFileSize(fileToUpload.size)})
                  </div>
                )}
                
                <Button 
                  onClick={uploadSelectedFile} 
                  disabled={!fileToUpload || uploading}
                >
                  {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Dateien</TabsTrigger>
              {selectedFile && <TabsTrigger value="view">Dateiinhalt</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="list">
              {files.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  Keine Dateien gefunden.
                </div>
              ) : (
                <div className="divide-y">
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => viewFileContent(file)}>
                        <FileIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.metadata?.size || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            viewFileContent(file);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="view">
              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteFile(selectedFile)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {fileContentLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="border rounded-md bg-muted p-4 overflow-auto max-h-[500px]">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{fileContent}</pre>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
