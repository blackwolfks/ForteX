import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Save, Trash2, Upload, Server, Copy, Check, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { callRPC, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import FileAccessManagement from "./FileAccessManagement";
import { mediaService } from "@/services/media-service";

interface License {
  id: string;
  script_name: string;
  script_file: string | null;
  license_key: string;
  server_key: string;
  server_ip: string | null;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
}

const RemoteScriptsView = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newScript, setNewScript] = useState({
    name: "",
    code: "",
    serverIp: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<{id: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await callRPC('get_user_licenses', {});
      
      if (error) {
        toast.error("Fehler beim Laden der Scripts");
        console.error(error);
        return;
      }
      
      setLicenses(data || []);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast.error("Fehler beim Laden der Scripts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleCreateScript = async () => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return;
    }

    try {
      setUploading(true);
      
      console.log("Erstelle Lizenz mit folgenden Parametern:", {
        p_script_name: newScript.name,
        p_script_file: newScript.code || null,
        p_server_ip: newScript.serverIp || null,
      });
      
      const { data, error } = await callRPC('create_license', {
        p_script_name: newScript.name,
        p_script_file: newScript.code || null,
        p_server_ip: newScript.serverIp || null,
      });
      
      if (error) {
        console.error("Fehler beim Erstellen des Scripts:", error);
        toast.error("Fehler beim Erstellen des Scripts: " + error.message);
        return;
      }
      
      if (selectedFiles.length > 0) {
        const licenseId = data.id;
        
        const bucketExists = await mediaService.ensureBucketExists('script-files');
        if (!bucketExists) {
          console.error("Fehler: Bucket 'script-files' konnte nicht erstellt werden");
          toast.error("Fehler beim Erstellen des Storage-Buckets");
        }
        
        for (const file of selectedFiles) {
          let filePath = file.webkitRelativePath || file.name;
          
          console.log(`[RemoteScriptsView] Uploading file ${filePath} to script-files/${licenseId}`);
          
          const { error: uploadError } = await supabase.storage
            .from('script-files')
            .upload(`${licenseId}/${filePath}`, file);
            
          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            console.error("Full error details:", JSON.stringify(uploadError));
            toast.error(`Fehler beim Hochladen der Datei ${file.name}`);
          }
        }
        
        await callRPC('update_license', {
          p_license_id: licenseId,
          p_has_file_upload: true,
        });
      }
      
      toast.success("Script erfolgreich erstellt");
      setDialogOpen(false);
      setNewScript({ name: "", code: "", serverIp: "" });
      setSelectedFiles([]);
      fetchLicenses();
    } catch (error) {
      console.error("Error creating script:", error);
      toast.error("Fehler beim Erstellen des Scripts");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateScript = async (licenseId: string, scriptName: string, scriptCode: string | null, serverIp: string | null, isActive: boolean) => {
    try {
      const { error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_script_name: scriptName,
        p_script_file: scriptCode,
        p_server_ip: serverIp,
        p_aktiv: isActive,
      });
      
      if (error) {
        toast.error("Fehler beim Aktualisieren des Scripts");
        console.error(error);
        return;
      }
      
      toast.success("Script erfolgreich aktualisiert");
      fetchLicenses();
    } catch (error) {
      console.error("Error updating script:", error);
      toast.error("Fehler beim Aktualisieren des Scripts");
    }
  };

  const handleRegenerateServerKey = async (licenseId: string) => {
    try {
      const { error } = await callRPC('regenerate_server_key', {
        p_license_id: licenseId,
      });
      
      if (error) {
        toast.error("Fehler beim Regenerieren des Server-Keys");
        console.error(error);
        return;
      }
      
      toast.success("Server-Key erfolgreich regeneriert");
      fetchLicenses();
    } catch (error) {
      console.error("Error regenerating server key:", error);
      toast.error("Fehler beim Regenerieren des Server-Keys");
    }
  };

  const handleDeleteScript = async (licenseId: string) => {
    try {
      const { error } = await callRPC('delete_license', {
        p_license_id: licenseId,
      });
      
      if (error) {
        toast.error("Fehler beim Löschen des Scripts");
        console.error(error);
        return;
      }

      await supabase.storage
        .from('script-files')
        .remove([`${licenseId}`]);
      
      toast.success("Script erfolgreich gelöscht");
      fetchLicenses();
    } catch (error) {
      console.error("Error deleting script:", error);
      toast.error("Fehler beim Löschen des Scripts");
    }
  };

  const copyToClipboard = (text: string, id: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey({ id, type });
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("In die Zwischenablage kopiert");
  };

  const handleDirSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("webkitdirectory", "");
      fileInputRef.current.setAttribute("directory", "");
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Remote Scripts</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-turquoise-500 hover:bg-turquoise-600">
              <Plus className="mr-2 h-4 w-4" />
              Neues Script erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neues Script erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Script f��r die Remote-Verwaltung.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="script-name">Script Name</Label>
                <Input 
                  id="script-name" 
                  value={newScript.name} 
                  onChange={(e) => setNewScript({...newScript, name: e.target.value})} 
                  placeholder="Mein Script" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="server-ip">Server IP-Adresse (Optional)</Label>
                <Input 
                  id="server-ip" 
                  value={newScript.serverIp} 
                  onChange={(e) => setNewScript({...newScript, serverIp: e.target.value})} 
                  placeholder="z.B. 123.456.789.0" 
                />
                <p className="text-xs text-muted-foreground">
                  Wenn gesetzt, kann das Script nur von dieser IP-Adresse abgerufen werden.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Wählen Sie zwischen Code-Upload oder Datei-Upload</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleDirSelect}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ordner hochladen
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <p className="text-sm">oder</p>
                  </div>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-sm font-medium">Ausgewählte Dateien: {selectedFiles.length}</p>
                    <ul className="text-xs text-muted-foreground mt-1">
                      {selectedFiles.slice(0, 3).map((file, index) => (
                        <li key={index}>{file.webkitRelativePath || file.name}</li>
                      ))}
                      {selectedFiles.length > 3 && <li>...und {selectedFiles.length - 3} mehr</li>}
                    </ul>
                  </div>
                )}
                
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="script-code">Oder Code direkt eingeben:</Label>
                  <Textarea 
                    id="script-code" 
                    value={newScript.code} 
                    onChange={(e) => setNewScript({...newScript, code: e.target.value})} 
                    placeholder="// Ihr Script-Code hier..." 
                    className="h-40 font-mono"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreateScript} disabled={uploading}>
                {uploading ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Lade Scripts...</div>
      ) : licenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Keine Scripts vorhanden. Erstellen Sie ein neues Script, um zu beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {licenses.map((license) => (
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
                    <TabsTrigger value="code" className="flex-1">Code</TabsTrigger>
                    <TabsTrigger value="security" className="flex-1">Sicherheit</TabsTrigger>
                    <TabsTrigger value="file-access" className="flex-1">
                      <Shield className="h-4 w-4 mr-1" />
                      Dateizugriff
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="pt-4 space-y-4">
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
                            onClick={() => handleRegenerateServerKey(license.id)}
                            title="Server-Key regenerieren"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
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
                    
                    <div className="flex justify-end pt-4 space-x-2">
                      <Button 
                        variant={license.aktiv ? "destructive" : "outline"} 
                        size="sm"
                        onClick={() => handleUpdateScript(license.id, license.script_name, license.script_file, license.server_ip, !license.aktiv)}
                      >
                        {license.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteScript(license.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Löschen
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="pt-4">
                    {license.script_file ? (
                      <Textarea 
                        defaultValue={license.script_file} 
                        className="font-mono text-sm h-40" 
                        id={`code-${license.id}`}
                      />
                    ) : (
                      <div className="bg-muted p-4 rounded text-center">
                        <p>Script-Dateien wurden hochgeladen.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Sie können die Dateien über die FiveM-Integration abrufen.
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      {license.script_file && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            const codeElement = document.getElementById(`code-${license.id}`) as HTMLTextAreaElement;
                            handleUpdateScript(license.id, license.script_name, codeElement.value, license.server_ip, license.aktiv);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" /> Speichern
                        </Button>
                      )}
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
                            handleUpdateScript(license.id, license.script_name, license.script_file, license.server_ip, checked)
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
                          handleUpdateScript(license.id, license.script_name, license.script_file, ipElement.value, license.aktiv);
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
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>FiveM Integration Guide</CardTitle>
          <CardDescription>Eine Anleitung zur Integration Ihrer Scripts in FiveM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Um Ihre Scripts in FiveM zu integrieren, folgen Sie dieser Anleitung:</p>
            
            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <pre>{`-- Beispiel config.lua
CONFIG = {}
CONFIG.LicenseKey = "XXXX-XXXX-XXXX-XXXX" -- Ihr Lizenzschlüssel
CONFIG.ServerKey = "XXXXXXXXXXXX" -- Ihr Server-Key
CONFIG.ServerUrl = "${window.location.origin}/api/script" -- API-URL

-- Beispiel für den Abruf eines Scripts
function LoadRemoteScript()
    PerformHttpRequest(CONFIG.ServerUrl, function(err, scriptData, headers)
        if err ~= 200 then
            print("Fehler beim Abrufen des Scripts: " .. tostring(err))
            return
        end
        
        -- Script ausführen
        local func, err = load(scriptData)
        if func then
            func()
        else
            print("Fehler beim Laden des Scripts: " .. tostring(err))
        end
    end, "GET", "", {
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey
    })
end

-- Script beim Start laden
Citizen.CreateThread(LoadRemoteScript)
`}</pre>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Ersetzen Sie die Platzhalter mit Ihren eigenen Werten aus der Lizenzverwaltung.
              Diese Methode ermöglicht es Ihnen, Ihre Scripts sicher zu verteilen und sie bei Bedarf remote zu aktualisieren.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemoteScriptsView;

