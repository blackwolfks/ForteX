
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth-service";
import OTPInput from "@/components/OTPInput";

interface OTPVerificationProps {
  otpMethod: "email" | "phone" | null;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const OTPVerification = ({ otpMethod, onBack, error, setError }: OTPVerificationProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.verifyOTP(otp, otpMethod || "email");
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
      navigate("/dashboard");
    } catch (err) {
      setError("Ungültiger Code. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <OTPInput digits={6} onComplete={handleVerifyOTP} />
        <Button
          variant="link"
          onClick={() => authService.resendOTP(otpMethod || "email")}
          className="p-0 h-auto text-sm"
          disabled={isLoading}
        >
          Code erneut senden
        </Button>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={onBack}
        disabled={isLoading}
      >
        Zurück zur Anmeldung
      </Button>
    </div>
  );
};

export default OTPVerification;
