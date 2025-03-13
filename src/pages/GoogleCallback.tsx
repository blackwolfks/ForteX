
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we got a token in the hash fragment (indicates Implicit flow)
        if (location.hash && location.hash.includes('access_token')) {
          console.error("Invalid callback format: Got token in hash fragment, need code parameter");
          throw new Error("OAuth-Konfigurationsfehler: Bei Google ist der falsche OAuth-Typ eingestellt. Bitte auf 'Authorization Code' umstellen statt 'Implicit' oder 'Token'.");
        }
        
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        
        if (error) {
          if (error === "access_denied") {
            throw new Error("Die Anmeldung wurde abgebrochen");
          } else {
            throw new Error(`Google-Fehler: ${error}`);
          }
        }
        
        if (!code) {
          throw new Error("Kein Autorisierungscode erhalten");
        }
        
        await authService.handleGoogleCallback(code);
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie wurden erfolgreich mit Google angemeldet.",
        });
        
        navigate("/dashboard");
      } catch (err: any) {
        console.error("Google Auth Fehler:", err);
        let errorMessage = "Bei der Anmeldung mit Google ist ein Fehler aufgetreten.";
        
        if (err.message.includes("OAuth-Konfigurationsfehler")) {
          errorMessage = err.message;
        } else if (err.message.includes("403")) {
          errorMessage = "Zugriffsfehler (403): Die Google OAuth-Konfiguration ist nicht korrekt. Bitte überprüfen Sie die Client-ID und die Weiterleitungs-URL in der Google Cloud Console.";
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
              <div className="flex flex-col mb-4 text-sm">
                <p className="mb-2">Mögliche Lösungen:</p>
                <ul className="text-left list-disc pl-5 space-y-1">
                  <li>Stellen Sie in der Google Cloud Console unter "OAuth 2.0-Konfiguration" den Rückgabetyp auf "Authorization code" ein, nicht auf "Implicit" oder "Token"</li>
                  <li>Prüfen Sie, ob die Google Client-ID korrekt ist</li>
                  <li>Prüfen Sie, ob die Weiterleitungs-URL (auth/google-callback) in Google Cloud Console konfiguriert ist</li>
                  <li>Vergewissern Sie sich, dass Google als OAuth-Provider in Supabase aktiviert ist</li>
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
