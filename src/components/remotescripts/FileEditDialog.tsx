
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "./types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Editor from '@monaco-editor/react';

interface FileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  content: string | null;
  onSave: (content: string, description?: string) => Promise<boolean>;
}

const FileEditDialog = ({ open, onOpenChange, file, content, onSave }: FileEditDialogProps) => {
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [isZipFile, setIsZipFile] = useState(false);

  useEffect(() => {
    if (open && content !== null) {
      setEditedContent(content);
    }
    
    if (open && file) {
      setEditedDescription(file.description || "");
      setIsZipFile(file.name.toLowerCase().endsWith('.zip'));
    }
  }, [open, content, file]);

  const handleSave = async () => {
    if (!editedContent && !isZipFile) return;
    
    setSaving(true);
    try {
      // For ZIP files, we're only updating the description
      if (isZipFile) {
        await onSave("", editedDescription);
      } else {
        await onSave(editedContent, editedDescription);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!saving) onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isZipFile ? 'Beschreibung bearbeiten' : 'Datei bearbeiten'}
            {file && <span className="ml-2 text-muted-foreground text-sm font-normal">({file.name})</span>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-grow overflow-hidden">
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Beschreibung der Datei..."
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Only show the editor for non-ZIP files */}
          {!isZipFile && (
            <div className="flex-grow min-h-[300px] overflow-hidden border rounded-md">
              <Editor
                height="100%"
                defaultLanguage="lua"
                value={editedContent}
                onChange={(value) => setEditedContent(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditDialog;
