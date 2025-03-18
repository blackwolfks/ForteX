
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Search, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileAccessProps {
  licenseId: string;
}

interface FileItem {
  name: string;
  fullPath: string;
  isPublic: boolean;
  size: number;
  isDirectory?: boolean;
  children?: FileItem[];
}

interface FileAccess {
  id?: string;
  license_id: string;
  file_path: string;
  is_public: boolean;
}

const FileAccessManagement = ({ licenseId }: FileAccessProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Dateien vom Storage abrufen
  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Dateien auflisten
      const { data: storageFiles, error } = await supabase.storage
        .from("script-files")
        .list(licenseId);

      if (error) {
        console.error("Fehler beim Abrufen der Dateien:", error);
        toast.error("Fehler beim Laden der Dateien");
        setLoading(false);
        return;
      }

      // Zugriffsrechte direkt mit RPC-Funktion abrufen
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_file_access_for_license', { 
          p_license_id: licenseId 
        });

      if (accessError) {
        console.error("Fehler beim Abrufen der Zugriffsrechte:", accessError);
        toast.error("Fehler beim Laden der Zugriffsrechte");
      }

      // Dateien mit Zugriffsrechten zusammenführen
      const filesWithAccess = storageFiles
        .filter(file => !file.name.startsWith(".")) // Versteckte Dateien ausblenden
        .map(file => {
          const fullPath = `${licenseId}/${file.name}`;
          // Prüfen ob accessData ein Array ist und den richtigen Wert enthält
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
        });

      setFiles(filesWithAccess);
    } catch (error) {
      console.error("Fehler:", error);
      toast.error("Fehler beim Laden der Dateien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (licenseId) {
      fetchFiles();
    }
  }, [licenseId]);

  // Zugriffsrechte speichern
  const saveAccessRights = async () => {
    setSaving(true);
    try {
      // Für jede Datei die Zugriffsrechte aktualisieren
      for (const file of files) {
        // Verwende die RPC-Funktion zum Speichern der Zugriffsrechte
        const { error } = await supabase
          .rpc('update_file_access', {
            p_license_id: licenseId,
            p_file_path: file.fullPath,
            p_is_public: file.isPublic
          });
          
        if (error) {
          console.error("Fehler beim Speichern der Zugriffsrechte:", error);
          throw error;
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

  // Sichtbarkeit einer Datei umschalten
  const toggleFileVisibility = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles[index].isPublic = !updatedFiles[index].isPublic;
    setFiles(updatedFiles);
  };

  // Dateien filtern basierend auf der Suche
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dateigröße formatieren
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

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

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dateien durchsuchen..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={saveAccessRights} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">Lade Dateien...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-4">Keine Dateien vorhanden</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dateiname</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Öffentlich sichtbar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file, index) => (
                  <TableRow key={file.fullPath}>
                    <TableCell>
                      <div className="font-medium">{file.name}</div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={file.isPublic}
                          onCheckedChange={() => toggleFileVisibility(index)}
                          id={`file-visibility-${index}`}
                        />
                        <Label htmlFor={`file-visibility-${index}`} className="flex items-center">
                          {file.isPublic ? (
                            <>
                              <Eye className="mr-2 h-4 w-4 text-green-500" />
                              <span>Öffentlich</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4 text-red-500" />
                              <span>Privat</span>
                            </>
                          )}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileAccessManagement;
