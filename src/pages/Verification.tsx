
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/auth-service";

const Verification = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && isResending) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsResending(false);
      setCountdown(60);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isResending]);
  
  const handleResendEmail = async () => {
    if (isResending) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      await authService.resendVerificationEmail();
      toast({
        title: "E-Mail gesendet",
        description: "Eine neue Bestätigungs-E-Mail wurde gesendet.",
      });
    } catch (err) {
      setError("Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.");
      setIsResending(false);
      setCountdown(60);
    }
  };
  
  const handleContinue = () => {
    navigate("/sign-in");
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-medium animate-fade-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">E-Mail bestätigen</CardTitle>
          <CardDescription>
            Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte überprüfen Sie Ihren Posteingang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center justify-center p-4">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Wenn Sie keine E-Mail erhalten haben, überprüfen Sie bitte Ihren Spam-Ordner oder lassen Sie sich eine neue E-Mail senden.
            </p>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending 
              ? `Erneut senden (${countdown}s)` 
              : "Bestätigungs-E-Mail erneut senden"}
          </Button>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleContinue}>
            Weiter zur Anmeldung
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Verification;
