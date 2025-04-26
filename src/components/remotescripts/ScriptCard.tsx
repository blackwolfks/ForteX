
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCcw, Trash2, Upload, FileText, Info, Check, X } from "lucide-react";
import { License } from "./types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import FileUploadDialog from "./FileUploadDialog";

interface ScriptCardProps {
  license: License;
  onUpdateScript: (licenseId: string, scriptName: string, serverIp: string | null, isActive: boolean) => Promise<boolean>;
  onRegenerateServerKey: (licenseId: string) => Promise<boolean>;
  onDeleteScript: (licenseId: string) => Promise<boolean>;
}

const ScriptCard = ({ license, onUpdateScript, onRegenerateServerKey, onDeleteScript }: ScriptCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
  const [editScriptName, setEditScriptName] = useState(license.script_name);
  const [editServerIp, setEditServerIp] = useState(license.server_ip || "");
  const [isActive, setIsActive] = useState(license.aktiv);
  const [copiedKey, setCopiedKey] = useState<"license" | "server" | null>(null);

  const handleOpenEditDialog = () => {
    setEditScriptName(license.script_name);
    setEditServerIp(license.server_ip || "");
    setIsActive(license.aktiv);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdits = async () => {
    const success = await onUpdateScript(license.id, editScriptName, editServerIp || null, isActive);
    if (success) {
      setIsEditDialogOpen(false);
    }
  };

  const handleRegenerateServerKey = async () => {
    await onRegenerateServerKey(license.id);
  };

  const handleDelete = async () => {
    const success = await onDeleteScript(license.id);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string, type: "license" | "server") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    toast.success(`${type === "license" ? "Lizenzschlüssel" : "Server-Key"} in die Zwischenablage kopiert`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">{license.script_name}</CardTitle>
              <CardDescription>Erstellt am {formatDate(license.created_at)}</CardDescription>
            </div>
            <Badge variant={license.aktiv ? "default" : "destructive"}>
              {license.aktiv ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Lizenzschlüssel:</Label>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(license.license_key, "license")}
              >
                {copiedKey === "license" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <code className="relative flex items-center w-full rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
              {license.license_key}
            </code>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Server-Key:</Label>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(license.server_key, "server")}
              >
                {copiedKey === "server" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <code className="relative flex items-center w-full rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
              {license.server_key}
            </code>
          </div>
          
          {license.server_ip && (
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Server IP-Beschränkung:</Label>
              <div className="flex items-center mt-1">
                <Info className="h-3 w-3 mr-2 text-muted-foreground" />
                <span className="text-xs">{license.server_ip}</span>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-3">
          <div className="flex justify-between w-full gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleOpenEditDialog}
            >
              <FileText className="h-3 w-3 mr-2" />
              Bearbeiten
            </Button>
            
            {license.has_file_upload && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setIsFileUploadDialogOpen(true)}
              >
                <Upload className="h-3 w-3 mr-2" />
                Dateien
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleRegenerateServerKey}
            >
              <RefreshCcw className="h-3 w-3 mr-2" />
              Key neu
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Löschen
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Script Bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Details für dieses Script.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="script-name">Script Name</Label>
              <Input 
                id="script-name" 
                value={editScriptName} 
                onChange={(e) => setEditScriptName(e.target.value)} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="server-ip">Server IP-Adresse (Optional)</Label>
              <Input 
                id="server-ip" 
                value={editServerIp} 
                onChange={(e) => setEditServerIp(e.target.value)} 
                placeholder="z.B. 123.456.789.0" 
              />
              <p className="text-xs text-muted-foreground">
                Wenn gesetzt, kann das Script nur von dieser IP-Adresse abgerufen werden.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is-active">Script aktiv</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveEdits}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Script löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie dieses Script löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-4 pb-2">
            <p className="font-medium">{license.script_name}</p>
            <p className="text-sm text-muted-foreground">Lizenzschlüssel: {license.license_key}</p>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* File Upload Dialog */}
      <FileUploadDialog
        licenseId={license.id}
        isOpen={isFileUploadDialogOpen}
        onOpenChange={setIsFileUploadDialogOpen}
      />
    </>
  );
};

export default ScriptCard;
