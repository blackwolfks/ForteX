
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewScriptFormData } from "./types";
import { toast } from "sonner";

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScript: (scriptData: NewScriptFormData, files: File[]) => Promise<void>;
}

const CreateScriptDialog = ({ open, onOpenChange, onCreateScript }: CreateScriptDialogProps) => {
  const [newScript, setNewScript] = useState<NewScriptFormData>({
    name: "",
    serverIp: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return;
    }
    
    try {
      setSubmitting(true);
      // Pass empty files array as files are no longer required
      await onCreateScript(newScript, []);
      // Reset form
      setNewScript({ name: "", serverIp: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !newScript.name}
          >
            {submitting ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScriptDialog;
