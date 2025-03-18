
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { callRPC } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface License {
  id: string;
  script_name: string;
  script_file: string | null;
  license_key: string;
  server_key: string;
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
  });

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

  const handleCreateScript = async () => {
    if (!newScript.name) {
      toast.error("Bitte geben Sie einen Namen für das Script ein");
      return;
    }

    try {
      const { data, error } = await callRPC('create_license', {
        p_script_name: newScript.name,
        p_script_file: newScript.code || null,
      });
      
      if (error) {
        toast.error("Fehler beim Erstellen des Scripts");
        console.error(error);
        return;
      }
      
      toast.success("Script erfolgreich erstellt");
      setDialogOpen(false);
      setNewScript({ name: "", code: "" });
      fetchLicenses();
    } catch (error) {
      console.error("Error creating script:", error);
      toast.error("Fehler beim Erstellen des Scripts");
    }
  };

  const handleUpdateScript = async (licenseId: string, scriptName: string, scriptCode: string | null, isActive: boolean) => {
    try {
      const { error } = await callRPC('update_license', {
        p_license_id: licenseId,
        p_script_name: scriptName,
        p_script_file: scriptCode,
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Script erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Script für die Remote-Verwaltung.
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
                <Label htmlFor="script-code">Script Code (optional)</Label>
                <Textarea 
                  id="script-code" 
                  value={newScript.code} 
                  onChange={(e) => setNewScript({...newScript, code: e.target.value})} 
                  placeholder="// Ihr Script-Code hier..." 
                  className="h-40"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreateScript}>Erstellen</Button>
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
                  </TabsList>
                  <TabsContent value="details" className="pt-4 space-y-4">
                    <div>
                      <Label className="text-xs">Lizenzschlüssel</Label>
                      <div className="mt-1 p-2 bg-muted rounded break-all text-xs font-mono">{license.license_key}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Server-Key</Label>
                      <div className="mt-1 p-2 bg-muted rounded break-all text-xs font-mono flex justify-between items-center">
                        <span className="truncate">{license.server_key}</span>
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
                    <div className="flex justify-between pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateScript(license.id, license.script_name, license.script_file, !license.aktiv)}
                      >
                        {license.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Löschen
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="code" className="pt-4">
                    <Textarea 
                      defaultValue={license.script_file || ""} 
                      className="font-mono text-sm h-40" 
                      id={`code-${license.id}`}
                    />
                    <div className="flex justify-end mt-4">
                      <Button 
                        size="sm"
                        onClick={() => {
                          const codeElement = document.getElementById(`code-${license.id}`) as HTMLTextAreaElement;
                          handleUpdateScript(license.id, license.script_name, codeElement.value, license.aktiv);
                        }}
                      >
                        <Save className="h-4 w-4 mr-1" /> Speichern
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemoteScriptsView;
