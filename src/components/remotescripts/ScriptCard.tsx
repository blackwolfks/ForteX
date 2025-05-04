import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { License } from "./types";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ScriptCardProps {
  license: License;
  onUpdateScript: (licenseId: string, scriptName: string, scriptCode: string | null, serverIp: string | null, isActive: boolean, description?: string) => Promise<boolean>;
  onRegenerateServerKey: (licenseId: string) => Promise<boolean>;
  onDeleteScript: (licenseId: string) => Promise<boolean>;
}

const ScriptCard = ({ license, onUpdateScript, onRegenerateServerKey, onDeleteScript }: ScriptCardProps) => {
  const [scriptName, setScriptName] = useState(license.script_name);
  const [scriptCode, setScriptCode] = useState<string | null>(license.script_file);
  const [serverIp, setServerIp] = useState(license.server_ip || "");
  const [isActive, setIsActive] = useState(license.aktiv);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(license.description || "");

  const handleUpdate = async () => {
    const success = await onUpdateScript(license.id, scriptName, scriptCode, serverIp, isActive, description);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleRegenerateKey = async () => {
    const success = await onRegenerateServerKey(license.id);
    if (success) {
      toast.success("Server Key erfolgreich neu generiert!");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Möchten Sie dieses Script wirklich löschen?");
    if (confirmed) {
      const success = await onDeleteScript(license.id);
      if (success) {
        toast.success("Script erfolgreich gelöscht!");
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In die Zwischenablage kopiert!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            {isEditing ? (
              <Input value={scriptName} onChange={(e) => setScriptName(e.target.value)} />
            ) : (
              <h3 className="text-lg font-semibold">{scriptName}</h3>
            )}
          </div>
          <div>
            {isEditing ? (
              <Button variant="outline" size="sm" onClick={handleUpdate}>
                Speichern
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Bearbeiten
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>License Key</Label>
          <div className="flex items-center">
            <Input readOnly value={license.license_key} className="mr-2" />
            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(license.license_key)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Server Key</Label>
          <div className="flex items-center">
            <Input readOnly value={license.server_key} className="mr-2" />
            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(license.server_key)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Server IP (Optional)</Label>
              <Input value={serverIp} onChange={(e) => setServerIp(e.target.value)} />
            </div>
          </>
        ) : (
          license.server_ip && (
            <div className="space-y-2">
              <Label>Server IP</Label>
              <Input readOnly value={license.server_ip} />
            </div>
          )
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`active-${license.id}`}>Aktiv</Label>
          <Switch
            id={`active-${license.id}`}
            checked={isActive}
            onCheckedChange={(checked) => {
              setIsActive(checked);
              onUpdateScript(license.id, scriptName, scriptCode, serverIp, checked, description);
            }}
          />
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={handleRegenerateKey}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Key erneuern
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ScriptCard;
