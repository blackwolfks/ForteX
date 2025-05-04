
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFileAccess } from "./hooks/useFileAccess";
import FileAccessSearch from "./FileAccessSearch";
import FileAccessList from "./FileAccessList";
import FileEditDialog from "./FileEditDialog";
import { Badge } from "@/components/ui/badge";
import { FileItem } from "./types";

interface FileAccessProps {
  licenseId: string;
}

const FileAccessManagement = ({ licenseId }: FileAccessProps) => {
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
    setEditDialogOpen,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    fileTypeFilter,
    setFileTypeFilter,
    getFilteredAndSortedFiles
  } = useFileAccess(licenseId);
  
  // Get filtered and sorted files
  const searchResults = getFilteredAndSortedFiles();

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
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            fileTypeFilter={fileTypeFilter}
            setFileTypeFilter={setFileTypeFilter}
          />

          {loading ? (
            <div className="text-center py-4">Lade Dateien...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? "Datei gefunden" : "Dateien gefunden"}
                </div>
                {(searchQuery || fileTypeFilter !== "all") && (
                  <div className="flex gap-2">
                    {searchQuery && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Suche: {searchQuery}
                        <button className="ml-1 text-xs" onClick={() => setSearchQuery("")}>×</button>
                      </Badge>
                    )}
                    {fileTypeFilter !== "all" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Filter: {fileTypeFilter}
                        <button className="ml-1 text-xs" onClick={() => setFileTypeFilter("all")}>×</button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <FileAccessList 
                files={searchResults}
                formatFileSize={formatFileSize}
                toggleFileVisibility={toggleFileVisibility}
                onDownloadFile={downloadFile}
                onEditFile={editFile}
                onDeleteFile={deleteFile}
              />
            </div>
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
