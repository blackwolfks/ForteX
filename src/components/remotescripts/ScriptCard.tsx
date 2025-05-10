
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Save, Trash2, Copy, Check, Shield, Server, FileText, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import FileAccessManagement from "./FileAccessManagement";
import { License } from "./types";
import { toast } from "sonner";
import FileUploadDialog from "./FileUploadDialog";

interface ScriptCardProps {
  license: License;
  onUpdateScript: (licenseId: string, scriptName: string, scriptCode: string | null, serverIp: string | null, isActive: boolean) => Promise<boolean>;
  onRegenerateServerKey: (licenseId: string) => Promise<boolean>;
  onDeleteScript: (licenseId: string) => Promise<boolean>;
}

export default function ScriptCard({ 
  license, 
  onUpdateScript, 
  onRegenerateServerKey, 
  onDeleteScript 
}: ScriptCardProps) {
  const [copiedKey, setCopiedKey] = useState<{id: string, type: string} | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const copyToClipboard = (text: string, id: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey({ id, type });
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("In die Zwischenablage kopiert");
  };

  return (
    <>
      <Card key={license.id}>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>{license.script_name}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${license.aktiv ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {license.aktiv ? 'Aktiv' : 'Inaktiv'}
            </span>
          </CardTitle>
          <CardDescription>Erstellt am: {new Date(license.created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                Dateien
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Sicherheit</TabsTrigger>
              <TabsTrigger value="file-access" className="flex-1">
                <Shield className="h-4 w-4 mr-1" />
                Dateizugriff
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              {/* License Key */}
              <div>
                <Label className="text-xs">Lizenzschlüssel</Label>
                <div className="mt-1 p-2 bg-muted rounded break-all text-xs font-mono flex justify-between items-center">
                  <span className="truncate mr-2">{license.license_key}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(license.license_key, license.id, 'license')}
                    title="Kopieren"
                  >
                    {copiedKey?.id === license.id && copiedKey?.type === 'license' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Server Key */}
              <div>
                <Label className="text-xs">Server-Key</Label>
                <div className="mt-1 p-2 bg-muted rounded break-all text-xs font-mono flex justify-between items-center">
                  <span className="truncate mr-2">{license.server_key}</span>
                  <div className="flex">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(license.server_key, license.id, 'server')}
                      title="Kopieren"
                    >
                      {copiedKey?.id === license.id && copiedKey?.type === 'server' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRegenerateServerKey(license.id)}
                      title="Server-Key regenerieren"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Server IP */}
              {license.server_ip && (
                <div>
                  <Label className="text-xs">Server IP-Adresse</Label>
                  <div className="mt-1 p-2 bg-muted rounded break-all text-xs font-mono flex justify-between items-center">
                    <span className="truncate mr-2">{license.server_ip}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(license.server_ip || '', license.id, 'ip')}
                      title="Kopieren"
                    >
                      {copiedKey?.id === license.id && copiedKey?.type === 'ip' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Description - Neu hinzugefügt */}
              {license.description && (
                <div>
                  <Label className="text-xs">Beschreibung</Label>
                  <div className="mt-1 p-3 bg-muted rounded text-sm">
                    {license.description}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end pt-4 space-x-2">
                <Button 
                  variant={license.aktiv ? "destructive" : "outline"} 
                  size="sm"
                  onClick={() => onUpdateScript(license.id, license.script_name, license.script_file, license.server_ip, !license.aktiv)}
                >
                  {license.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDeleteScript(license.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Löschen
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Skript-Dateien</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-1" /> Datei hochladen
                </Button>
              </div>
              <div className="bg-muted p-4 rounded text-center">
                <p className="text-sm">
                  {license.has_file_upload 
                    ? "Verwenden Sie die Datei-Upload-Funktion, um Dateien hochzuladen." 
                    : "Keine Dateien für dieses Script verfügbar."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Die Dateien können über die FiveM-Integration abgerufen werden.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="pt-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={`server-ip-${license.id}`}>Server IP-Adresse</Label>
                </div>
                
                <Input 
                  id={`server-ip-${license.id}`} 
                  defaultValue={license.server_ip || ''} 
                  placeholder="z.B. 123.456.789.0" 
                />
                
                <p className="text-xs text-muted-foreground">
                  Wenn gesetzt, kann das Script nur von dieser IP-Adresse abgerufen werden.
                </p>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`active-${license.id}`}
                    checked={license.aktiv}
                    onCheckedChange={(checked) => 
                      onUpdateScript(license.id, license.script_name, license.script_file, license.server_ip, checked)
                    }
                  />
                  <Label htmlFor={`active-${license.id}`}>Script aktiv</Label>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Die Sicherheit wird durch drei Faktoren gewährleistet:
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Lizenzschlüssel - muss im Script konfiguriert werden</li>
                      <li>Server-Key - wird vom Server für API-Anfragen verwendet</li>
                      <li>IP-Beschränkung - optional, erlaubt Zugriff nur von einer bestimmten IP</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    const ipElement = document.getElementById(`server-ip-${license.id}`) as HTMLInputElement;
                    onUpdateScript(license.id, license.script_name, license.script_file, ipElement.value, license.aktiv);
                  }}
                >
                  <Save className="h-4 w-4 mr-1" /> Einstellungen speichern
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="file-access" className="pt-4 space-y-4">
              <FileAccessManagement licenseId={license.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <FileUploadDialog 
        licenseId={license.id} 
        isOpen={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
      />
    </>
  );
}
