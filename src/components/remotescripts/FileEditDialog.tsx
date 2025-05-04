
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "./hooks/useFileAccess";
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
      // Bereinige WebKit-Formgrenzen und andere unerwünschte Teile
      const cleanedContent = cleanWebKitFormBoundaries(content);
      setEditedContent(cleanedContent);
    }
  }, [content]);

  // Funktion zum Bereinigen von WebKit-Formgrenzen
  const cleanWebKitFormBoundaries = (text: string): string => {
    // Entfernt WebKit-Formgrenzen und MIME-Multipart-Teile
    let cleaned = text;
    
    // Entferne alle WebKit-Formgrenzlinien (beginnt mit ------WebKit...)
    cleaned = cleaned.replace(/^------WebKit[^\r\n]*(\r?\n)?/gm, "");
    
    // Entferne Content-Type und Content-Disposition Header
    cleaned = cleaned.replace(/^Content-(Type|Disposition)[^\r\n]*(\r?\n)?/gm, "");
    
    // Entferne leere Zeilen am Anfang des Textes
    cleaned = cleaned.replace(/^\s+/, "");
    
    // Wenn der Text mit MIME-Header beginnt, versuche den eigentlichen Inhalt zu extrahieren
    const contentMatchLua = cleaned.match(/Content-Type: text\/x-lua\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}|$)/i);
    if (contentMatchLua && contentMatchLua[1]) {
      return contentMatchLua[1];
    }
    
    // Alternative Muster für andere Content-Types
    const contentMatchGeneral = cleaned.match(/Content-Type: [^\r\n]*\r?\n\r?\n([\s\S]*?)(?:\r?\n-{4,}|$)/i);
    if (contentMatchGeneral && contentMatchGeneral[1]) {
      return contentMatchGeneral[1];
    }
    
    // Wenn kein spezifisches Muster erkannt wird, entferne doppelte Leerzeilen
    cleaned = cleaned.replace(/\n\s*\n/g, "\n\n");
    
    return cleaned;
  };

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
