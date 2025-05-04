
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { callRPC } from "@/lib/supabase";
import { uploadFileWithProgress } from "@/services/file-uploader";
import { toast } from "sonner";
import { logError } from "@/lib/logService";
import { Textarea } from "@/components/ui/textarea";

interface FileUploadDialogProps {
  licenseId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function FileUploadDialog({ 
  licenseId, 
  isOpen, 
  onOpenChange,
  onSuccess
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected file:", file.name, "Type:", file.type);
      
      // Check if it's a .lua or .zip file
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'lua' && fileExtension !== 'zip') {
        setUploadError("Nur .lua oder .zip Dateien sind erlaubt.");
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        const errorMessage = "Die Datei ist zu groß. Die maximale Dateigröße beträgt 10MB.";
        setUploadError(errorMessage);
        await logError(licenseId, errorMessage, {
          source: 'file-upload',
          fileName: selectedFile.name,
          details: `File size: ${selectedFile.size} bytes`
        });
        setUploading(false);
        return;
      }
      
      // Prepare file path including license ID
      const filePath = `${licenseId}/${selectedFile.name}`;
      console.log("Uploading to path:", filePath);
      
      // Determine the MIME type based on file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'zip' ? 'application/zip' : 'text/x-lua';
      
      // Create a blob with the appropriate MIME type
      const fileArrayBuffer = await selectedFile.arrayBuffer();
      const fileBlob = new Blob([fileArrayBuffer], { type: mimeType });
      const modifiedFile = new File([fileBlob], selectedFile.name, { type: mimeType });
      
      // Upload the file - Using 'script' bucket
      const success = await uploadFileWithProgress(
        'script', 
        filePath, 
        modifiedFile, 
        setUploadProgress
      );
      
      if (success) {
        // Update the license to indicate it has file uploads
        await callRPC('update_license', {
          p_license_id: licenseId,
          p_has_file_upload: true
        });
        
        // Set the file access settings with description
        await callRPC('update_file_access', {
          p_license_id: licenseId,
          p_file_path: selectedFile.name,
          p_is_public: fileExtension === 'zip', // ZIP files are always public, LUA files are private by default
          p_description: description
        });
        
        toast.success("Datei erfolgreich hochgeladen");
        onOpenChange(false);
        setSelectedFile(null);
        setDescription("");
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler beim Hochladen";
      setUploadError(errorMessage);
      
      await logError(licenseId, `Error uploading file: ${errorMessage}`, {
        source: 'file-upload',
        fileName: selectedFile.name,
        details: JSON.stringify(error)
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!uploading) {
        onOpenChange(open);
        if (!open) {
          setDescription("");
          setSelectedFile(null);
          setUploadError(null);
        }
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datei hochladen</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Lua-Datei oder ZIP-Datei aus, die Sie für dieses Script hochladen möchten.
            ZIP-Dateien werden für Käufer sichtbar sein, LUA-Dateien sind standardmäßig privat.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Label htmlFor="file-upload">Datei auswählen</Label>
          <Input 
            id="file-upload" 
            type="file" 
            onChange={handleFileChange}
            disabled={uploading}
            accept=".lua,.zip"
          />
          
          {selectedFile && (
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm font-medium">Ausgewählte Datei:</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
              <p className="text-xs text-muted-foreground">
                Typ: {selectedFile.name.endsWith('.zip') ? 'ZIP-Datei' : 'Lua-Datei'}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Beschreibung der Datei..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Fügen Sie eine Beschreibung hinzu, um die Datei zu identifizieren.
            </p>
          </div>
          
          {uploadError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
          
          {uploading && (
            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1">{uploadProgress}%</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <p>Unterstützte Dateitypen: .lua und .zip Dateien</p>
            <p>Maximale Dateigröße: 10MB</p>
            <p className="text-amber-500 font-semibold">Hinweis: ZIP-Dateien sind für Käufer sichtbar, LUA-Dateien sind standardmäßig privat</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              if (!uploading) {
                onOpenChange(false);
                setSelectedFile(null);
                setUploadError(null);
                setDescription("");
              }
            }}
            disabled={uploading}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? `Wird hochgeladen (${uploadProgress}%)` : "Hochladen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
