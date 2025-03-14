
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const CFXCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<string>("Initialisierung...");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");
        const payload = urlParams.get("payload"); // Encrypted payload with API key
        
        // Update processing state for better user feedback
        setProcessingState("Autorisierungscode wird verarbeitet...");

        // Check for authorization errors
        if (error) {
          throw new Error(`Autorisierungsfehler: ${error}`);
        }
        
        if (!code && !payload) {
          throw new Error("Kein Autorisierungscode oder API-Schlüssel erhalten");
        }

        // Check state parameter for CSRF protection
        const storedState = localStorage.getItem("cfx_auth_state");
        if (state && storedState && state !== storedState) {
          throw new Error("Ungültiger State-Parameter (CSRF-Schutz)");
        }

        // Update processing state
        setProcessingState("Authentifizierung mit CFX...");
        
        // Handle CFX callback with the authorization code
        const userData = await authService.handleCFXCallback(code || payload || "");
        
        // Check if we got user data back
        if (!userData) {
          throw new Error("Keine Benutzerdaten erhalten");
        }
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie wurden erfolgreich mit CFX angemeldet.",
          variant: "default",
        });
        
        // Redirect to API keys page if coming from there, otherwise dashboard
        const returnTo = urlParams.get("return_to") || localStorage.getItem("cfx_return_to");
        localStorage.removeItem("cfx_auth_state");
        localStorage.removeItem("cfx_return_to");
        
        if (returnTo && returnTo === "api-keys") {
          navigate("/cfx-api-keys");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("CFX Auth Fehler:", err);
        setError("Bei der Anmeldung mit CFX ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        setIsLoading(false);
      }
    };
    
    handleCallback();
  }, [location, navigate, toast]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-medium bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-medium text-gray-100">Anmeldefehler</h2>
              <p className="text-gray-400">{error}</p>
              <button 
                onClick={() => navigate('/sign-in')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-10 px-4 py-2"
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
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-medium bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-medium text-gray-100">Anmeldung mit CFX</h2>
            <p className="text-gray-400">{processingState}</p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CFXCallback;
