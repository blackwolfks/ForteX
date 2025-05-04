
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
  const [hasErrors, setHasErrors] = useState(false);

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
    // Wenn die Sprache Lua ist, können wir spezielle Einstellungen vornehmen
    if (getLanguage() === "lua") {
      // Lua-spezifische Diagnoseeinstellungen
      monaco.languages.registerDiagnosticsAdapter({
        dispose: () => {},
        onModelAdd: (model: any) => {
          const validateModel = () => {
            // Einfache Validierung für Lua-Code
            const content = model.getValue();
            const errors = [];
            
            // Überprüfen auf unvollständige Blöcke (fehlende end-Statements)
            const startBlocks = (content.match(/\b(function|if|for|while|do)\b/g) || []).length;
            const endBlocks = (content.match(/\bend\b/g) || []).length;
            
            if (startBlocks > endBlocks) {
              errors.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: model.getLineCount(),
                endColumn: model.getLineMaxColumn(model.getLineCount()),
                message: `Unvollständiger Block: Es fehlen ${startBlocks - endBlocks} 'end' Statement(s)`,
                severity: monaco.MarkerSeverity.Error
              });
            }

            // Überprüfen auf unbalancierte Klammern
            const openParens = (content.match(/\(/g) || []).length;
            const closeParens = (content.match(/\)/g) || []).length;
            
            if (openParens !== closeParens) {
              errors.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: model.getLineCount(),
                endColumn: model.getLineMaxColumn(model.getLineCount()),
                message: `Unbalancierte Klammern: ${openParens} öffnende vs. ${closeParens} schließende`,
                severity: monaco.MarkerSeverity.Error
              });
            }

            // Set markers for the model
            monaco.editor.setModelMarkers(model, 'lua-validator', errors);
            
            // Update error state for save button
            setHasErrors(errors.length > 0);
          };

          // Initial validation
          validateModel();
          
          // Validate on content change
          model.onDidChangeContent(() => validateModel());
        }
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
        
        <div className="mt-4 h-[60vh] border rounded-md overflow-hidden">
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
              // Removed the invalid properties
              // Using proper guides configuration
              guides: { indentation: true },
              // Aktivieren von Linting-Hinweisen
              formatOnType: true,
              formatOnPaste: true,
              // Verbesserte Fehlermarkierungen
              renderValidationDecorations: "on",
              // Aktivieren der Folding-Funktionalität
              folding: true,
              foldingHighlight: true,
              // Bessere Sichtbarkeit für Fehlerlinien
              glyphMargin: true
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
            disabled={saving || hasErrors}
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

export default FileEditDialog;
