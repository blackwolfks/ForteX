
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key, Copy, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const availableScopes = [
    { id: "read", name: "Lesen", description: "Zugriff zum Lesen von Daten" },
    { id: "write", name: "Schreiben", description: "Zugriff zum Schreiben von Daten" },
    { id: "server", name: "Server", description: "Zugriff auf Server-bezogene Funktionen" }
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
      // Simulation of API keys fetch
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setApiKeys([
        {
          id: "cfxkey_1",
          name: "Development Key",
          key: "cfx_" + Math.random().toString(36).substring(2, 15),
          scopes: ["read", "write"],
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
      ]);
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
      // Would integrate with the CFX API in a real implementation
      // https://idms.fivem.net/interaction/
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newKey: CFXApiKey = {
        id: "cfxkey_" + Date.now(),
        name: newKeyName,
        key: "cfx_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        scopes: selectedScopes,
        createdAt: new Date().toISOString()
      };
      
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
      // Would integrate with the CFX API in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
                  <Label htmlFor="keyName" className="text-gray-300">Schlüsselname</Label>
                  <Input 
                    id="keyName"
                    placeholder="z.B. Entwicklungsschlüssel" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Berechtigungsumfang</Label>
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
        <CardFooter className="flex flex-col items-start border-t border-gray-700 pt-6">
          <h4 className="font-medium text-gray-200 mb-2">Dokumentation</h4>
          <p className="text-sm text-gray-400 mb-2">
            Weitere Informationen zur Verwendung der CFX API und Authentifizierung finden Sie in unserer Dokumentation.
          </p>
          <a 
            href="https://idms.fivem.net/interaction/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:text-teal-400 inline-flex items-center text-sm"
          >
            CFX API-Dokumentation
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CFXApiKeySpecification;
