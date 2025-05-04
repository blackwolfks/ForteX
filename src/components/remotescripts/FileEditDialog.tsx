
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "./types";
import Editor from "@monaco-editor/react";

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
      // Use the raw content directly without cleaning
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

  // Determine the language for the editor based on file extension
  const getLanguage = () => {
    if (!file?.name) return "plaintext";
    
    if (file.name.endsWith(".lua")) return "lua";
    if (file.name.endsWith(".js")) return "javascript";
    if (file.name.endsWith(".ts")) return "typescript";
    if (file.name.endsWith(".json")) return "json";
    if (file.name.endsWith(".html")) return "html";
    if (file.name.endsWith(".css")) return "css";
    if (file.name.endsWith(".md")) return "markdown";
    if (file.name.endsWith(".xml")) return "xml";
    if (file.name.endsWith(".sql")) return "sql";
    if (file.name.endsWith(".py")) return "python";
    
    return "plaintext";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Datei bearbeiten: {file?.name || ""}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 h-[60vh] border rounded-md overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage={getLanguage()}
            language={getLanguage()}
            value={editedContent}
            onChange={(value) => setEditedContent(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false
            }}
            theme="vs-dark"
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
