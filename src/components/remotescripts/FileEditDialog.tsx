
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { FileItem } from "./types";

interface FileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  content: string | null;
  onSave: (content: string) => Promise<boolean>;
}

const FileEditDialog = ({ open, onOpenChange, file, content, onSave }: FileEditDialogProps) => {
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Update the local state when the content prop changes
  useEffect(() => {
    if (content !== null) {
      setEditedContent(content);
    }
  }, [content]);
  
  const handleSave = async () => {
    if (!editedContent) return;
    
    setIsSaving(true);
    try {
      const success = await onSave(editedContent);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving file:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Datei bearbeiten: {file?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <Textarea
            className="w-full h-full font-mono text-sm"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ 
              height: "calc(100% - 4rem)",
              resize: "none",
              fontFamily: "monospace"
            }}
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditDialog;
