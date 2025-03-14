
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GoogleCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Google callback triggered, location:", location);
        
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const accessToken = location.hash ? new URLSearchParams(location.hash.substring(1)).get("access_token") : null;
        
        console.log("URL params:", { 
          code: code ? `${code.substring(0, 10)}...` : "missing", 
          error, 
          accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : "missing",
          hash: location.hash ? `${location.hash.substring(0, 20)}...` : "missing" 
        });
        
        if (error) {
          if (error === "access_denied") {
            throw new Error("Die Anmeldung wurde abgebrochen");
          } else {
            throw new Error(`Google-Fehler: ${error}`);
          }
        }
        
        setDebugInfo(`URL: ${location.pathname}${location.search}${location.hash}`);
        
        // Handle both code and token based flows
        if (code) {
          console.log("Using code flow");
          await authService.handleGoogleCallback(code);
        } else if (accessToken) {
          console.log("Using token flow with access token");
          await authService.handleGoogleTokenCallback(accessToken);
        } else if (location.hash) {
          // Fallback für den Fall, dass der Hash nicht richtig geparst wird
          console.log("Attempting to parse hash directly:", location.hash);
          setDebugInfo(`Full hash: ${location.hash}`);
          
          // Extrahiere Token manuell aus dem Hash
          const tokenMatch = location.hash.match(/access_token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            const manualToken = tokenMatch[1];
            console.log("Manually extracted token:", manualToken.substring(0, 10) + "...");
            await authService.handleGoogleTokenCallback(manualToken);
          } else {
            throw new Error("Konnte keinen Token im Hash finden");
          }
        } else {
          setDebugInfo(`URL search params: ${location.search}, Hash: ${location.hash}`);
          throw new Error("Keine Authentifizierungsdaten erhalten");
        }
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie wurden erfolgreich mit Google angemeldet.",
        });
        
        navigate("/dashboard");
      } catch (err: any) {
        console.error("Google Auth Fehler:", err);
        let errorMessage = "Bei der Anmeldung mit Google ist ein Fehler aufgetreten.";
        
        if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };
    
    handleCallback();
  }, [location, navigate, toast]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-medium">Anmeldefehler</h2>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              {debugInfo && (
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-4 overflow-x-auto">
                  <p className="font-mono">{debugInfo}</p>
                </div>
              )}
              <div className="flex flex-col mb-4 text-sm">
                <p className="mb-2">Mögliche Lösungen:</p>
                <ul className="text-left list-disc pl-5 space-y-1">
                  <li>Prüfen Sie, ob die Google Client-ID korrekt ist: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(0, 10) + "..." : "Nicht gesetzt"}</li>
                  <li>Prüfen Sie, ob die Weiterleitungs-URL (<code>{window.location.origin}/auth/google-callback</code>) in Google Cloud Console konfiguriert ist</li>
                  <li>Vergewissern Sie sich, dass Google als OAuth-Provider in Supabase aktiviert ist</li>
                  <li>Stellen Sie sicher, dass der implizite Flow (Implicit Flow) oder Authorization Code Flow in Ihrer Google-Konfiguration aktiviert ist</li>
                </ul>
                <div className="flex flex-col mt-3">
                  <a 
                    href="https://supabase.com/dashboard/project/fewcmtozntpedrsluawj/auth/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-xs underline mb-1"
                  >
                    Zu Supabase Auth-Einstellungen <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-xs underline"
                  >
                    Zu Google Cloud Credentials <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
              <button 
                onClick={() => navigate('/sign-in')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-medium">Anmeldung mit Google</h2>
            <p className="text-muted-foreground">Sie werden angemeldet, bitte warten...</p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallback;
