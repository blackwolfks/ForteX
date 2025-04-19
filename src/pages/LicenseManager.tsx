import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Copy, RefreshCw, Check, AlertTriangle, Upload, FileIcon, ArrowLeft } from "lucide-react";
import { callRPC, supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaService } from "@/services/media-service";
import LicenseFileBrowser from "@/components/LicenseFileBrowser";

type License = {
  id: string;
  license_key: string;
  server_key: string;
  script_name: string;
  script_file: string | null;
  server_ip: string | null;
  aktiv: boolean;
  has_file_upload: boolean;
  created_at: string;
};

const LicenseManager = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [scriptName, setScriptName] = useState("");
  const [scriptFile, setScriptFile] = useState("");
  const [serverIp, setServerIp] = useState("");
  const [hasFileUpload, setHasFileUpload] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedServerKey, setCopiedServerKey] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: licenses = [], isLoading, error } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await callRPC('get_user_licenses', {});
      if (error) throw error;
      return data as License[];
    }
  });

  const createLicenseMutation = useMutation({
    mutationFn: async (variables: { script_name: string; script_file?: string; server_ip?: string; has_file_upload: boolean }) => {
      const { data, error } = await callRPC('create_license', {
        p_script_name: variables.script_name,
        p_script_file: variables.script_file || null,
        p_server_ip: variables.server_ip || null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      setIsCreateModalOpen(false);
      setScriptName("");
      setScriptFile("");
      setServerIp("");
      setHasFileUpload(false);
      
      if (data && data.id && hasFileUpload) {
        updateLicenseMutation.mutate({ 
          id: data.id, 
          has_file_upload: hasFileUpload 
        });
      } else {
        toast({
          title: "Lizenz erstellt",
          description: "Die Lizenz wurde erfolgreich erstellt.",
        });
      }
    },
    onError: (error) => {
      console.error("Fehler beim Erstellen der Lizenz:", error);
      toast({
        title: "Fehler beim Erstellen der Lizenz",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const regenerateServerKeyMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const { data, error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_regenerate_server_key: true
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      toast({
        title: "Server-Key regeneriert",
        description: "Der Server-Key wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Regenerieren des Server-Keys",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateLicenseMutation = useMutation({
    mutationFn: async ({ id, aktiv, has_file_upload }: { id: string; aktiv?: boolean; has_file_upload?: boolean }) => {
      const { data, error } = await callRPC('update_license', {
        p_license_id: id,
        p_aktiv: aktiv,
        p_has_file_upload: has_file_upload
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      toast({
        title: "Lizenzstatus aktualisiert",
        description: "Der Lizenzstatus wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Aktualisieren des Lizenzstatus",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ licenseId, file }: { licenseId: string, file: File }) => {
      const bucketName = 'script';
      const filePath = `${licenseId}/${file.name}`;
      
      const bucketExists = await mediaService.ensureBucketExists(bucketName);
      if (!bucketExists) {
        throw new Error(`Bucket '${bucketName}' konnte nicht erstellt oder gefunden werden`);
      }
      
      console.log(`[LicenseManager] Uploading file to ${bucketName}/${filePath}`);
      
      const { url, error } = await mediaService.uploadFile(bucketName, filePath, file);
      if (error) throw error;
      
      const { data: updateData, error: updateError } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_script_file: filePath
      });
      
      if (updateError) throw updateError;
      
      return { url, updateData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      setIsFileUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedLicenseId(null);
      toast({
        title: "Datei hochgeladen",
        description: "Die Skriptdatei wurde erfolgreich hochgeladen.",
      });
    },
    onError: (error) => {
      console.error("Upload error details:", error);
      toast({
        title: "Fehler beim Hochladen der Datei",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateLicense = () => {
    if (!scriptName) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Skriptnamen ein.",
        variant: "destructive",
      });
      return;
    }
    
    createLicenseMutation.mutate({
      script_name: scriptName,
      script_file: scriptFile || undefined,
      server_ip: serverIp || undefined,
      has_file_upload: hasFileUpload
    });
  };

  const handleFileUpload = () => {
    if (!selectedFile || !selectedLicenseId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Datei aus.",
        variant: "destructive",
      });
      return;
    }
    
    uploadFileMutation.mutate({
      licenseId: selectedLicenseId,
      file: selectedFile
    });
  };

  const openFileUploadModal = (licenseId: string) => {
    setSelectedLicenseId(licenseId);
    setIsFileUploadModalOpen(true);
  };

  const copyToClipboard = async (text: string, keyType: 'license' | 'server', id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (keyType === 'license') {
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
      } else {
        setCopiedServerKey(id);
        setTimeout(() => setCopiedServerKey(null), 2000);
      }
      
      toast({
        title: "Kopiert!",
        description: keyType === 'license' ? "Lizenzschlüssel in die Zwischenablage kopiert." : "Server-Key in die Zwischenablage kopiert.",
      });
    } catch (err) {
      toast({
        title: "Fehler beim Kopieren",
        description: "Konnte nicht in die Zwischenablage kopieren.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewFiles = (licenseId: string) => {
    setSelectedLicense(licenseId);
    setShowFileBrowser(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Lizenzmanager</CardTitle>
            <CardDescription>Laden...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Lizenzmanager</CardTitle>
            <CardDescription className="text-red-500">
              Fehler beim Laden der Lizenzen: {(error as Error).message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {!showFileBrowser ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lizenzmanager</CardTitle>
              <CardDescription>Verwalten Sie Ihre Lizenzen und Server-Keys</CardDescription>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Neue Lizenz</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Lizenz erstellen</DialogTitle>
                  <DialogDescription>
                    Geben Sie einen Namen für Ihr Skript ein und optional den Dateipfad und Server-IP.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scriptName">Skriptname</Label>
                    <Input
                      id="scriptName"
                      value={scriptName}
                      onChange={(e) => setScriptName(e.target.value)}
                      placeholder="z.B. Mein Fahrzeug Skript"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scriptFile">Skriptdatei (optional)</Label>
                    <Input
                      id="scriptFile"
                      value={scriptFile}
                      onChange={(e) => setScriptFile(e.target.value)}
                      placeholder="z.B. vehicle_script.lua"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="serverIp">Server-IP (optional)</Label>
                    <Input
                      id="serverIp"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      placeholder="z.B. 127.0.0.1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasFileUpload"
                      checked={hasFileUpload}
                      onChange={(e) => setHasFileUpload(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="hasFileUpload">Datei-Upload erlauben</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleCreateLicense}
                    disabled={createLicenseMutation.isPending}
                  >
                    {createLicenseMutation.isPending ? "Wird erstellt..." : "Lizenz erstellen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isFileUploadModalOpen} onOpenChange={setIsFileUploadModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skriptdatei hochladen</DialogTitle>
                  <DialogDescription>
                    Wählen Sie eine Datei aus, die Sie hochladen möchten.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fileUpload">Datei auswählen</Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsFileUploadModalOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleFileUpload}
                    disabled={uploadFileMutation.isPending || !selectedFile}
                  >
                    {uploadFileMutation.isPending ? "Wird hochgeladen..." : "Hochladen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {licenses.length === 0 ? (
              <div className="text-center py-10">
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Keine Lizenzen gefunden</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sie haben noch keine Lizenzen erstellt. Klicken Sie auf "Neue Lizenz", um zu beginnen.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skriptname</TableHead>
                    <TableHead>Lizenzschlüssel</TableHead>
                    <TableHead>Server-Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.script_name}</div>
                          {license.script_file && (
                            <div className="text-xs text-muted-foreground">{license.script_file}</div>
                          )}
                          {license.server_ip && (
                            <div className="text-xs text-muted-foreground">IP: {license.server_ip}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {license.has_file_upload ? "Datei-Upload: Erlaubt" : "Datei-Upload: Nicht erlaubt"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {license.license_key}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(license.license_key, 'license', license.id)}
                          >
                            {copiedKey === license.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {license.server_key}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(license.server_key, 'server', license.id)}
                          >
                            {copiedServerKey === license.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              license.aktiv ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span>{license.aktiv ? "Aktiv" : "Inaktiv"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(license.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {license.has_file_upload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openFileUploadModal(license.id)}
                            >
                              <Upload className="mr-2 h-3 w-3" />
                              Datei
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => regenerateServerKeyMutation.mutate(license.id)}
                            disabled={regenerateServerKeyMutation.isPending}
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Server-Key
                          </Button>
                          <Button
                            variant={license.aktiv ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => updateLicenseMutation.mutate({ id: license.id, aktiv: !license.aktiv })}
                            disabled={updateLicenseMutation.isPending}
                          >
                            {license.aktiv ? (
                              <>
                                <AlertTriangle className="mr-2 h-3 w-3" />
                                Deaktivieren
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-3 w-3" />
                                Aktivieren
                              </>
                            )}
                          </Button>
                          {license.has_file_upload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewFiles(license.id)}
                            >
                              <FileIcon className="mr-2 h-3 w-3" />
                              Dateien
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFileBrowser(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Lizenzübersicht
            </Button>
          </div>
          
          {selectedLicense && (
            <LicenseFileBrowser licenseId={selectedLicense} />
          )}
        </div>
      )}
    </div>
  );
};

export default LicenseManager;
