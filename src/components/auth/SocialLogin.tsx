import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth-service";
import { Loader2 } from "lucide-react";

interface SocialLoginProps {
  setError: (error: string | null) => void;
  redirectUrl: string;
  plan?: string | null;
}

const SocialLogin = ({ setError, redirectUrl, plan }: SocialLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await authService.signInWithGoogle();
    } catch (err) {
      console.error("Google Login Error:", err);
      setIsLoading(false);
      setError("Bei der Anmeldung mit Google ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.");
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setIsLoading(true);
      await authService.signInWithDiscord();
    } catch (err) {
      console.error("Discord Login Error:", err);
      setIsLoading(false);
      setError("Bei der Anmeldung mit Discord ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.");
    }
  };

  const handleCFXLogin = async () => {
    try {
      setIsLoading(true);
      
      const stateToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("cfx_auth_state", stateToken);
      
      if (plan) {
        localStorage.setItem("cfx_return_to", "checkout");
      } else {
        localStorage.setItem("cfx_return_to", redirectUrl.replace("/", ""));
      }
      
      const CFX_CLIENT_ID = import.meta.env.VITE_CFX_CLIENT_ID;
      const CFX_REDIRECT_URI = `${window.location.origin}/auth/cfx-callback`;
      const CFX_SCOPE = "profile email";
      const CFX_INTERACTION_URL = import.meta.env.VITE_CFX_INTERACTION_URL;
      
      const cfxBaseUrl = CFX_INTERACTION_URL.endsWith('/') ? CFX_INTERACTION_URL : `${CFX_INTERACTION_URL}/`;
      const cfxAuthUrl = `${cfxBaseUrl}integration/authorize?client_id=${CFX_CLIENT_ID}&redirect_uri=${encodeURIComponent(CFX_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(CFX_SCOPE)}&state=${stateToken}`;
      
      console.log("Redirecting to CFX auth URL:", cfxAuthUrl);
      
      window.location.href = cfxAuthUrl;
      
    } catch (err) {
      console.error("CFX Login Error:", err);
      setIsLoading(false);
      setError("Bei der Anmeldung mit CFX ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.");
    }
  };

  return (
    <>
      <Separator className="my-4" />
      <div className="text-center text-muted-foreground text-sm">
        Oder melde dich an mit
      </div>
      <div className="grid gap-2">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
          }
          Google
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDiscordLogin}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
          }
          Discord
        </Button>
        <Button 
          variant="outline" 
          onClick={handleCFXLogin}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          }
          CFX
        </Button>
      </div>
    </>
  );
};

export default SocialLogin;
