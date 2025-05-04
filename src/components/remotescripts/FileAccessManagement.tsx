
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFileAccess } from "./hooks/useFileAccess";
import FileAccessSearch from "./FileAccessSearch";
import FileAccessList from "./FileAccessList";
import FileEditDialog from "./FileEditDialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FileAccessProps {
  licenseId: string;
}

const FileAccessManagement = ({ licenseId }: FileAccessProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
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
    setEditDialogOpen
  } = useFileAccess(licenseId);

  // Advanced search functionality
  const [searchResults, setSearchResults] = useState(files);
  
  // Update search results whenever files or searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(files);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = files.filter(file => 
      file.name.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
  }, [files, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dateizugriffsverwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Dateien und bestimmen Sie, welche für Käufer sichtbar sein sollen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Standardmäßig sind alle Dateien privat und für Käufer nicht zugänglich. 
              Sie können einzelne Dateien öffentlich machen, damit Käufer sie sehen können.
              Verwenden Sie die Aktionsschaltflächen zum Herunterladen, Bearbeiten oder Löschen von Dateien.
            </AlertDescription>
          </Alert>

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Dateien durchsuchen..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <FileAccessSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            saving={saving}
            onSave={saveFileAccess}
          />

          {loading ? (
            <div className="text-center py-4">Lade Dateien...</div>
          ) : (
            <FileAccessList 
              files={searchResults}
              formatFileSize={formatFileSize}
              toggleFileVisibility={toggleFileVisibility}
              onDownloadFile={downloadFile}
              onEditFile={editFile}
              onDeleteFile={deleteFile}
            />
          )}
          
          <FileEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            file={currentFile}
            content={fileContent}
            onSave={saveEditedFile}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FileAccessManagement;
