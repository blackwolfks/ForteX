
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFileAccess } from "./hooks/useFileAccess";
import FileAccessSearch from "./FileAccessSearch";
import FileAccessList from "./FileAccessList";

interface FileAccessProps {
  licenseId: string;
}

const FileAccessManagement = ({ licenseId }: FileAccessProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    files, 
    loading, 
    saving, 
    saveAccessRights, 
    toggleFileVisibility, 
    formatFileSize 
  } = useFileAccess(licenseId);

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dateizugriffsverwaltung</CardTitle>
        <CardDescription>
          Bestimmen Sie, welche Dateien für Käufer sichtbar sein sollen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Standardmäßig sind alle Dateien privat und für Käufer nicht zugänglich. 
              Sie können einzelne Dateien öffentlich machen, damit Käufer sie sehen können.
            </AlertDescription>
          </Alert>

          <FileAccessSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            saving={saving}
            onSave={saveAccessRights}
          />

          {loading ? (
            <div className="text-center py-4">Lade Dateien...</div>
          ) : (
            <FileAccessList 
              files={filteredFiles}
              formatFileSize={formatFileSize}
              toggleFileVisibility={toggleFileVisibility}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileAccessManagement;
