
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileItem } from "./hooks/useFileAccess";

interface FileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  content: string | null;
  onSave: (content: string) => Promise<boolean>;
}

const FileEditDialog = ({ open, onOpenChange, file, content, onSave }: FileEditDialogProps) => {
  const [editedContent, setEditedContent] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content !== null) {
      setEditedContent(content);
    }
  }, [content]);

  const handleSave = async () => {
    if (!editedContent) return;
    
    setSaving(true);
    try {
      const success = await onSave(editedContent);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Datei bearbeiten: {file?.name || ""}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="font-mono min-h-[400px] h-[60vh]"
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditDialog;
