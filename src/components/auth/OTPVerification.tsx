
import { useState } from "react";
import { Button } from "@/components/ui/button";
import OTPInput from "@/components/OTPInput";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface OTPVerificationProps {
  otpMethod: "email" | "phone" | null;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  onSuccess?: () => void;
}

const OTPVerification = ({ 
  otpMethod, 
  onBack, 
  error, 
  setError,
  onSuccess 
}: OTPVerificationProps) => {
  const [otp, setOTP] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError("Bitte geben Sie einen gültigen 6-stelligen Code ein.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await authService.verifyOTP(otp, otpMethod || "email");
      toast({
        title: "Erfolgreich verifiziert",
        description: "Sie sind jetzt angemeldet.",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Der eingegebene Code ist ungültig oder abgelaufen. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      await authService.resendOTP(otpMethod || "email");
      toast({
        title: "Code erneut gesendet",
        description: `Wir haben einen neuen Code an Ihre ${
          otpMethod === "email" ? "E-Mail-Adresse" : "Telefonnummer"
        } gesendet.`,
      });
    } catch (err) {
      setError(
        "Fehler beim erneuten Senden des Codes. Bitte versuchen Sie es später noch einmal."
      );
      console.error(err);
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPComplete = (code: string) => {
    setOTP(code);
    if (code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-4">
      <OTPInput
        digits={6}
        onComplete={handleOTPComplete}
      />

      <div className="flex flex-col gap-2 mt-4">
        <Button onClick={handleVerify} disabled={isVerifying || otp.length < 6}>
          {isVerifying ? "Verifiziere..." : "Verifizieren"}
        </Button>
        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isVerifying || isResending}
          >
            Zurück
          </Button>
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResending || isVerifying}
          >
            {isResending ? "Wird gesendet..." : "Code erneut senden"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
