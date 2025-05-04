
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFileAccessAdapter } from "./hooks/useFileAccessAdapter";
import FileAccessSearch from "./FileAccessSearch";
import FileAccessList from "./FileAccessList";
import FileEditDialog from "./FileEditDialog";

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
  } = useFileAccessAdapter(licenseId);

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              files={filteredFiles}
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
