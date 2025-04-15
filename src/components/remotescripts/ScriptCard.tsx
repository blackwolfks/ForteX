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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ScriptCardProps {
  license: License;
  onUpdateScript: (licenseId: string, scriptName: string, scriptCode: string | null, serverIp: string | null, isActive: boolean) => Promise<boolean>;
  onRegenerateServerKey: (licenseId: string) => Promise<boolean>;
  onDeleteScript: (licenseId: string) => Promise<boolean>;
}

const ScriptCard = ({ license, onUpdateScript, onRegenerateServerKey, onDeleteScript }: ScriptCardProps) => {
  const [copiedKey, setCopiedKey] = useState<{id: string, type: string} | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const copyToClipboard = (text: string, id: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey({ id, type });
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("In die Zwischenablage kopiert");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("Selected file:", e.target.files[0].name);
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // First ensure bucket exists
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_public_bucket', {
          bucket_name: 'script'
        });
        
        if (rpcError) {
          console.warn("RPC bucket creation failed:", rpcError);
        } else {
          console.log("Bucket verified via RPC");
        }
      } catch (e) {
        console.warn("RPC bucket check failed:", e);
      }
      
      setUploadProgress(30);
      
      // Attempt upload with binary content type first
      const filePath = `${license.id}/${selectedFile.name}`;
      console.log(`Uploading ${selectedFile.name} as binary to ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('script')
        .upload(filePath, selectedFile, {
          contentType: 'application/octet-stream',
          cacheControl: '3600',
          upsert: true
        });
        
      setUploadProgress(70);
      
      if (uploadError) {
        console.error("Binary upload failed:", uploadError);
        
        // Retry without content type specification
        console.log("Retrying upload without content type...");
        const { error: retryError } = await supabase.storage
          .from('script')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (retryError) {
          console.error("Retry upload also failed:", retryError);
          throw new Error(`Fehler beim Hochladen: ${retryError.message}`);
        }
      }
      
      setUploadProgress(100);
      
      // Update the license to set has_file_upload = true if not already set
      if (!license.has_file_upload) {
        console.log("Setting has_file_upload = true for license");
        await callRPC('update_license', {
          p_license_id: license.id,
          p_has_file_upload: true
        });
      }
      
      toast.success("Datei erfolgreich hochgeladen");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
                      onClick={() => onRegenerateServerKey(license.id)}
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

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Datei hochladen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Datei aus, die Sie für das Script "{license.script_name}" hochladen möchten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="file-upload">Datei auswählen</Label>
            <Input 
              id="file-upload" 
              type="file" 
              onChange={handleFileChange}
            />
            {selectedFile && (
              <div className="bg-muted p-2 rounded-md">
                <p className="text-sm font-medium">Ausgewählte Datei:</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
            
            {uploading && (
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-xs text-center mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleUploadFile}
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Wird hochgeladen..." : "Hochladen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScriptCard;
