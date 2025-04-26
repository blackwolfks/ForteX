import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewScriptFormData } from "./types";
import { toast } from "sonner";

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScript: (scriptData: NewScriptFormData, files: File[]) => Promise<boolean>;
}

const CreateScriptDialog = ({ open, onOpenChange, onCreateScript }: CreateScriptDialogProps) => {
  const [newScript, setNewScript] = useState<NewScriptFormData>({
    name: "",
    serverIp: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      console.log(`Selected ${filesArray.length} files:`, filesArray.map(f => f.name));
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDirSelect = () => {
    if (fileInputRef.current) {
      try {
        fileInputRef.current.setAttribute("webkitdirectory", "");
        fileInputRef.current.setAttribute("directory", "");
        fileInputRef.current.click();
      } catch (error) {
        console.error("Error setting directory attribute:", error);
        toast.error("Browser unterstützt keine Ordnerauswahl. Bitte wählen Sie einzelne Dateien aus.");
      }
    }
  };

  const handleSingleFileSelect = () => {
    if (singleFileInputRef.current) {
      singleFileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Datei aus");
      return;
    }
    
    try {
      setUploading(true);
      await onCreateScript(newScript, selectedFiles);
      // Reset form
      setNewScript({ name: "", serverIp: "" });
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Script erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Script für die Remote-Verwaltung.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="script-name">Script Name</Label>
            <Input 
              id="script-name" 
              value={newScript.name} 
              onChange={(e) => setNewScript({...newScript, name: e.target.value})} 
              placeholder="Mein Script" 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="server-ip">Server IP-Adresse (Optional)</Label>
            <Input 
              id="server-ip" 
              value={newScript.serverIp} 
              onChange={(e) => setNewScript({...newScript, serverIp: e.target.value})} 
              placeholder="z.B. 123.456.789.0" 
            />
            <p className="text-xs text-muted-foreground">
              Wenn gesetzt, kann das Script nur von dieser IP-Adresse abgerufen werden.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Dateien hochladen</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleDirSelect}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ordner hochladen
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSingleFileSelect}
              >
                <File className="h-4 w-4 mr-2" />
                Datei hochladen
              </Button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
                multiple
              />
              
              <input 
                type="file" 
                ref={singleFileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
                multiple
              />
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="bg-muted p-2 rounded-md mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Ausgewählte Dateien: {selectedFiles.length}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedFiles([])}
                    className="h-8 px-2 text-xs"
                  >
                    Alle entfernen
                  </Button>
                </div>
                <ul className="text-xs text-muted-foreground mt-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <span className="truncate">
                        {file.webkitRelativePath || file.name} 
                        <span className="text-muted-foreground ml-1">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading || !newScript.name || selectedFiles.length === 0}
          >
            {uploading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScriptDialog;
