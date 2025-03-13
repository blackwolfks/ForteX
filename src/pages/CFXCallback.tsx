
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-medium">Anmeldefehler</h2>
              <p className="text-muted-foreground">{error}</p>
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
            <h2 className="text-xl font-medium">Anmeldung mit CFX</h2>
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

export default CFXCallback;
