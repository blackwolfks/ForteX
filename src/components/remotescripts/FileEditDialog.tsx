
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "./hooks/useFileAccess";
import Editor from "@monaco-editor/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const [hasErrors, setHasErrors] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  // Reset state when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setEditorReady(false);
      setError(null);
      setHasErrors(false);
    }
  }, [open]);

  // Update editedContent when content changes
  useEffect(() => {
    if (content !== null) {
      setEditedContent(content);
      console.log("Content loaded in dialog:", content.substring(0, 50));
      setError(null);
    } else if (open && file) {
      // If dialog is open, file exists, but content is null
      setError("Konnte Dateiinhalt nicht laden. Bitte versuchen Sie es erneut.");
    }
  }, [content, open, file]);

  const handleSave = async () => {
    if (!editedContent) return;
    
    setSaving(true);
    try {
      console.log("Saving file content:", editedContent.substring(0, 50) + "...");
      const success = await onSave(editedContent);
      console.log("Save result:", success);
      if (success) {
        toast.success("Datei erfolgreich gespeichert");
        onOpenChange(false);
      } else {
        setError("Fehler beim Speichern der Datei");
        toast.error("Fehler beim Speichern der Datei");
      }
    } catch (err) {
      console.error("Error saving file:", err);
      setError(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      toast.error(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
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

  // Handle editor mounting and configuration
  const handleEditorDidMount = (editor: any, monaco: any) => {
    console.log("Editor mounted successfully");
    editorRef.current = editor;
    setEditorReady(true);
    
    // If the language is Lua, set up Lua-specific settings
    if (getLanguage() === "lua") {
      // Simple Lua validation
      const validateLua = () => {
        const content = editor.getValue();
        let hasError = false;
        const markers = [];
        
        // Check for incomplete blocks (missing end statements)
        const startBlocks = (content.match(/\b(function|if|for|while|do)\b/g) || []).length;
        const endBlocks = (content.match(/\bend\b/g) || []).length;
        
        if (startBlocks > endBlocks) {
          markers.push({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: editor.getModel().getLineCount(),
            endColumn: editor.getModel().getLineMaxColumn(editor.getModel().getLineCount()),
            message: `Unvollständiger Block: Es fehlen ${startBlocks - endBlocks} 'end' Statement(s)`,
            severity: monaco.MarkerSeverity.Error
          });
          hasError = true;
        }
        
        // Set markers for all detected errors
        monaco.editor.setModelMarkers(editor.getModel(), 'lua-validator', markers);
        setHasErrors(hasError);
      };

      // Initial validation
      setTimeout(() => validateLua(), 500); // Delay to ensure content is loaded
      
      // Add content change listener
      editor.onDidChangeModelContent(() => {
        validateLua();
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Datei bearbeiten: {file?.name || ""}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 h-[60vh] border rounded-md overflow-hidden">
          {!editorReady && content === null && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              Inhalt wird geladen...
            </div>
          )}
          
          {content !== null && (
            <Editor
              height="100%"
              defaultLanguage={getLanguage()}
              language={getLanguage()}
              value={editedContent}
              onChange={(value) => setEditedContent(value || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontLigatures: true,
                lineNumbers: "on",
                renderLineHighlight: "all",
                guides: { indentation: true },
                formatOnType: true,
                formatOnPaste: true,
                folding: true,
                foldingHighlight: true,
                glyphMargin: true
              }}
              theme="vs-dark"
            />
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || hasErrors || content === null}
            className={hasErrors ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {hasErrors 
              ? "Fehler beheben" 
              : (saving ? "Wird gespeichert..." : "Speichern")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Import toast for notifications
import { toast } from "sonner";

export default FileEditDialog;
