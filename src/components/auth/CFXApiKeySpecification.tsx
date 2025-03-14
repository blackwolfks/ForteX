
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key, Copy, CheckCircle, AlertCircle, ExternalLink, Shield, Info, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CFXApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
}

const CFXApiKeySpecification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<CFXApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read"]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [showScopeInfo, setShowScopeInfo] = useState(false);
  const { toast } = useToast();

  const availableScopes = [
    { id: "read", name: "Lesen", description: "Zugriff zum Lesen von Daten, einschließlich Benachrichtigungen", icon: <Info className="h-4 w-4" /> },
    { id: "write", name: "Schreiben", description: "Zugriff zum Erstellen und Aktualisieren von Inhalten", icon: <ExternalLink className="h-4 w-4" /> },
    { id: "server", name: "Server", description: "Zugriff auf serverbezogene Funktionen und Verwaltung", icon: <Shield className="h-4 w-4" /> },
    { id: "push", name: "Push", description: "Erlaubt das Senden von Push-Benachrichtigungen", icon: <Bell className="h-4 w-4" /> },
    { id: "one_time_password", name: "Einmalanmeldung", description: "Generiert ein einmaliges Anmeldetoken", icon: <Key className="h-4 w-4" /> }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        fetchUserApiKeys();
      }
    };
    
    checkAuth();
  }, []);

  const fetchUserApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const keys = await authService.getCFXApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setError("API-Schlüssel konnten nicht abgerufen werden. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScopeToggle = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError("Bitte geben Sie einen Namen für den API-Schlüssel ein.");
      return;
    }

    if (selectedScopes.length === 0) {
      setError("Bitte wählen Sie mindestens einen Berechtigungsumfang.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const newKey = await authService.createCFXApiKey(newKeyName, selectedScopes);
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
      setSelectedScopes(["read"]);
      setSuccess(`API-Schlüssel "${newKeyName}" wurde erfolgreich erstellt.`);
      
      toast({
        title: "API-Schlüssel erstellt",
        description: `Der API-Schlüssel "${newKeyName}" wurde erfolgreich erstellt.`,
      });
    } catch (err) {
      console.error("Failed to create API key:", err);
      setError("Der API-Schlüssel konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopyStatus({ ...copyStatus, [id]: true });
      
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [id]: false });
      }, 2000);
      
      toast({
        title: "Kopiert!",
        description: "API-Schlüssel wurde in die Zwischenablage kopiert.",
      });
    });
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie den API-Schlüssel "${name}" widerrufen möchten?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.revokeCFXApiKey(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      
      toast({
        title: "API-Schlüssel widerrufen",
        description: `Der API-Schlüssel "${name}" wurde erfolgreich widerrufen.`,
      });
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      setError("Der API-Schlüssel konnte nicht widerrufen werden. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCFXLogin = async () => {
    try {
      // Add return_to parameter to redirect back to API keys page after auth
      await authService.signInWithCFX("api-keys");
    } catch (err) {
      console.error("CFX Auth Error:", err);
      setError("Die Anmeldung mit CFX ist fehlgeschlagen. Bitte versuchen Sie es später erneut.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-gray-100">CFX API-Schlüssel</CardTitle>
            <CardDescription className="text-gray-400">
              Sie müssen angemeldet sein, um API-Schlüssel zu verwalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCFXLogin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Key className="mr-2 h-4 w-4" />
              Mit CFX anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="keys" className="text-gray-100">Meine API-Schlüssel</TabsTrigger>
          <TabsTrigger value="docs" className="text-gray-100">Dokumentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="keys">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-gray-100">CFX API-Schlüssel</CardTitle>
              <CardDescription className="text-gray-400">
                Erstellen und verwalten Sie API-Schlüssel für den Zugriff auf CFX-Dienste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-teal-900/30 border-teal-800">
                  <CheckCircle className="h-4 w-4 text-teal-500" />
                  <AlertTitle className="text-teal-500">Erfolg</AlertTitle>
                  <AlertDescription className="text-gray-300">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-100 mb-2">Neuen API-Schlüssel erstellen</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName" className="text-gray-300">Anwendungsname</Label>
                      <Input 
                        id="keyName"
                        placeholder="z.B. Discourse Notifier" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Berechtigungsumfang</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 h-8">
                              <Info className="h-4 w-4 mr-1" />
                              Hilfe
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 text-gray-100">
                            <DialogHeader>
                              <DialogTitle>Über Berechtigungsumfänge</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Berechtigungsbereiche steuern, was eine Anwendung mit Ihrem CFX-Konto tun kann.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {availableScopes.map(scope => (
                                <div key={scope.id} className="flex items-start">
                                  <div className="mr-3">
                                    {scope.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-200">{scope.name}</h4>
                                    <p className="text-sm text-gray-400">{scope.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-2">
                        {availableScopes.map(scope => (
                          <div key={scope.id} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id={`scope-${scope.id}`}
                                type="checkbox"
                                checked={selectedScopes.includes(scope.id)}
                                onChange={() => handleScopeToggle(scope.id)}
                                disabled={isLoading}
                                className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-teal-600 focus:ring-teal-600"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={`scope-${scope.id}`} className="font-medium text-gray-300">
                                {scope.name}
                              </label>
                              <p className="text-gray-400">{scope.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleCreateApiKey} 
                      disabled={isLoading || !newKeyName.trim() || selectedScopes.length === 0}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                      API-Schlüssel erstellen
                    </Button>
                  </div>
                </div>
                
                <div className="pt-6">
                  <h3 className="text-lg font-medium text-gray-100 mb-4">Ihre API-Schlüssel</h3>
                  
                  {isLoading && apiKeys.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <Key className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Sie haben noch keine API-Schlüssel erstellt.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map(key => (
                        <Card key={key.id} className="bg-gray-900 border-gray-700">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-medium text-gray-200">{key.name}</h4>
                                <p className="text-sm text-gray-400">
                                  Erstellt: {new Date(key.createdAt).toLocaleDateString('de-DE')}
                                  {key.lastUsed && ` • Zuletzt verwendet: ${new Date(key.lastUsed).toLocaleDateString('de-DE')}`}
                                </p>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRevokeKey(key.id, key.name)}
                                disabled={isLoading}
                              >
                                Widerrufen
                              </Button>
                            </div>
                            
                            <div className="bg-gray-800 p-3 rounded-md flex justify-between items-center mb-3">
                              <code className="text-sm text-teal-400 font-mono">{key.key}</code>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCopyKey(key.key, key.id)}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-white"
                              >
                                {copyStatus[key.id] ? 
                                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                  <Copy className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {key.scopes.map(scope => {
                                const scopeInfo = availableScopes.find(s => s.id === scope);
                                return (
                                  <span 
                                    key={scope} 
                                    className="inline-flex items-center rounded-full bg-teal-900/30 px-2.5 py-0.5 text-xs font-medium text-teal-400"
                                  >
                                    {scopeInfo?.name || scope}
                                  </span>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="docs">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-gray-100">API-Schlüssel Dokumentation</CardTitle>
              <CardDescription className="text-gray-400">
                Informationen zur Verwendung von CFX-API-Schlüsseln in Ihren Anwendungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <h3>CFX-API-Schlüsselspezifikation</h3>
                <p>CFX enthält ein System zur Generierung von API-Schlüsseln pro Benutzer, sofern ein spezifisches Protokoll befolgt wird. Diese Funktion ermöglicht Anwendungen den Zugriff auf CFX-Instanzen ohne administrative Eingriffe.</p>
                
                <h4>Allgemeine Beschreibung</h4>
                <p>Auf hohem Niveau funktioniert es wie folgt:</p>
                <ol>
                  <li>Der Client (Desktop-App, Browser-Plugin, mobile App) generiert ein privates/öffentliches Schlüsselpaar</li>
                  <li>Der Client leitet zu einer Route in CFX weiter und gibt seinen öffentlichen Schlüssel mit</li>
                  <li>CFX erhält vom Benutzer die Genehmigung zur Verwendung der App</li>
                  <li>CFX generiert einen Benutzer-API-Schlüssel</li>
                  <li>CFX leitet mit einer verschlüsselten Nutzlast, die den API-Schlüssel des Benutzers enthält, zur Rückgabe-URL zurück</li>
                </ol>
                
                <h4>API-Schlüsselgenerierung</h4>
                <p>Die API-Schlüsselgenerierung erfordert nur eine einzige GET-Anfrage:</p>
                <pre className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                  <code className="text-sm">https://idms.fivem.net/interaction/user-api-key/new</code>
                </pre>
                
                <p>Parameter:</p>
                <ul>
                  <li><strong>auth_redirect</strong>: URL, zu der mit dem generierten Token zurückgeleitet werden soll</li>
                  <li><strong>application_name</strong>: Name der anfragenden Anwendung</li>
                  <li><strong>client_id</strong>: Eindeutige Kennung für den Client</li>
                  <li><strong>scopes</strong>: Komma-getrennte Liste der für den Schlüssel zulässigen Zugriffsbereiche</li>
                  <li><strong>public_key</strong>: Der öffentliche Teil des vom Client generierten Schlüsselpaares</li>
                </ul>
                
                <h4>Verwenden der API</h4>
                <p>Um die API zu verwenden, muss der Client folgende Header angeben:</p>
                <ul>
                  <li><strong>User-Api-Key</strong> (erforderlich): Der generierte Schlüssel</li>
                  <li><strong>User-Api-Client-Id</strong> (optional): Die Client-ID zur Aktualisierung in der Datenbank</li>
                </ul>
                
                <h4>Widerrufen von API-Schlüsseln</h4>
                <p>Um einen API-Schlüssel zu widerrufen, senden Sie eine POST-Anfrage mit dem User-Api-Key Header an:</p>
                <pre className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                  <code className="text-sm">https://idms.fivem.net/interaction/user-api-key/revoke</code>
                </pre>
                
                <h4>Beispiel-Code</h4>
                <p>Hier ein einfaches Beispiel zur Generierung eines API-Schlüssels mit JavaScript:</p>
                <pre className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                  <code className="text-sm text-gray-300">
{`// Generieren eines Schlüsselpaars
const keyPair = await window.crypto.subtle.generateKey(
  {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["encrypt", "decrypt"]
);

// Exportieren des öffentlichen Schlüssels
const publicKeyBuffer = await window.crypto.subtle.exportKey(
  "spki",
  keyPair.publicKey
);

// Codieren des öffentlichen Schlüssels für die URL
const publicKeyBase64 = btoa(
  String.fromCharCode(...new Uint8Array(publicKeyBuffer))
);

// Umleiten zur API-Schlüsselgenerierung
const redirectUrl = \`https://idms.fivem.net/interaction/user-api-key/new?
  auth_redirect=\${encodeURIComponent("https://meine-app.com/callback")}
  &application_name=\${encodeURIComponent("Meine CFX App")}
  &client_id=\${encodeURIComponent("my-unique-client-id")}
  &scopes=\${encodeURIComponent("read,write")}
  &public_key=\${encodeURIComponent(publicKeyBase64)}\`;

window.location.href = redirectUrl;`}
                  </code>
                </pre>
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 pt-6">
              <a 
                href="https://idms.fivem.net/interaction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-500 hover:text-teal-400 inline-flex items-center"
              >
                Vollständige CFX API-Dokumentation
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CFXApiKeySpecification;
