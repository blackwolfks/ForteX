
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected file:", file.name, "Type:", file.type);
      
      // Überprüfe, ob es sich um eine .lua-Datei handelt
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'lua') {
        setUploadError("Nur .lua-Dateien sind erlaubt.");
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
      
      // Convert to array buffer and create a text blob with explicit text/x-lua MIME type
      const fileArrayBuffer = await selectedFile.arrayBuffer();
      const fileBlob = new Blob([fileArrayBuffer], { type: 'text/x-lua' });
      const modifiedFile = new File([fileBlob], selectedFile.name, { type: 'text/x-lua' });
      
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
        
        toast.success("Datei erfolgreich hochgeladen");
        onOpenChange(false);
        setSelectedFile(null);
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
      if (!uploading) onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datei hochladen</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Lua-Datei aus, die Sie für dieses Script hochladen möchten.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Label htmlFor="file-upload">Datei auswählen</Label>
          <Input 
            id="file-upload" 
            type="file" 
            onChange={handleFileChange}
            disabled={uploading}
            accept=".lua"
          />
          
          {selectedFile && (
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm font-medium">Ausgewählte Datei:</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
              <p className="text-xs text-muted-foreground">
                Typ: Lua-Datei
              </p>
            </div>
          )}
          
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
            <p>Unterstützte Dateitypen: nur .lua Dateien</p>
            <p>Maximale Dateigröße: 10MB</p>
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
