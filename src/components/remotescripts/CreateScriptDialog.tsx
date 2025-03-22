
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewScriptFormData } from "./types";

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScript: (scriptData: NewScriptFormData, files: File[]) => Promise<void>;
}

const CreateScriptDialog = ({ open, onOpenChange, onCreateScript }: CreateScriptDialogProps) => {
  const [newScript, setNewScript] = useState<NewScriptFormData>({
    name: "",
    code: "",
    serverIp: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleDirSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("webkitdirectory", "");
      fileInputRef.current.setAttribute("directory", "");
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      await onCreateScript(newScript, selectedFiles);
      // Reset form
      setNewScript({ name: "", code: "", serverIp: "" });
      setSelectedFiles([]);
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
            <Label>Wählen Sie zwischen Code-Upload oder Datei-Upload</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleDirSelect}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Ordner hochladen
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>
              
              <div className="flex items-center">
                <p className="text-sm">oder</p>
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="bg-muted p-2 rounded-md">
                <p className="text-sm font-medium">Ausgewählte Dateien: {selectedFiles.length}</p>
                <ul className="text-xs text-muted-foreground mt-1">
                  {selectedFiles.slice(0, 3).map((file, index) => (
                    <li key={index}>{file.webkitRelativePath || file.name}</li>
                  ))}
                  {selectedFiles.length > 3 && <li>...und {selectedFiles.length - 3} mehr</li>}
                </ul>
              </div>
            )}
            
            <div className="grid gap-2 mt-2">
              <Label htmlFor="script-code">Oder Code direkt eingeben:</Label>
              <Textarea 
                id="script-code" 
                value={newScript.code} 
                onChange={(e) => setNewScript({...newScript, code: e.target.value})} 
                placeholder="// Ihr Script-Code hier..." 
                className="h-40 font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScriptDialog;
