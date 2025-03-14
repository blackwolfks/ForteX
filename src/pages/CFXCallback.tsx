
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const CFXCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        
        if (!code) {
          throw new Error("Kein Autorisierungscode erhalten");
        }
        
        await authService.handleCFXCallback(code);
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie wurden erfolgreich mit CFX angemeldet.",
          variant: "default",
        });
        
        navigate("/dashboard");
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
            <p className="text-gray-400">Sie werden angemeldet, bitte warten...</p>
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
