
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Mail, AlertCircle, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OTPInput from "@/components/OTPInput";
import { authService } from "@/services/auth-service";

const phoneSchema = z.object({
  phone: z.string().min(8, {
    message: "Bitte geben Sie eine gültige Telefonnummer ein.",
  }),
});

const TwoFactorSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("email");
  const [verificationStep, setVerificationStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState<string | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const setupEmailTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.setupEmailTwoFactor();
      toast({
        title: "Verifizierungscode gesendet",
        description: "Wir haben einen Verifizierungscode an Ihre E-Mail gesendet.",
      });
      setVerificationStep("verify");
    } catch (err) {
      setError("Fehler beim Einrichten der E-Mail-Verifizierung. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupPhoneTwoFactor = async (values: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.setupPhoneTwoFactor(values.phone);
      toast({
        title: "Verifizierungscode gesendet",
        description: "Wir haben einen Verifizierungscode an Ihre Telefonnummer gesendet.",
      });
      setVerificationStep("verify");
    } catch (err) {
      setError("Fehler beim Einrichten der Telefon-Verifizierung. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupAuthenticatorTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.setupAuthenticatorTwoFactor();
      setQrCode(response.qrCode);
      setVerificationStep("verify");
    } catch (err) {
      setError("Fehler beim Einrichten des Authenticators. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactorCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.verifyTwoFactorSetup(code, currentTab as "email" | "phone" | "authenticator");
      toast({
        title: "Erfolgreich eingerichtet",
        description: `Zwei-Faktor-Authentifizierung über ${
          currentTab === "email" ? "E-Mail" : 
          currentTab === "phone" ? "Telefon" : 
          "Authenticator"
        } wurde aktiviert.`,
      });
      navigate("/dashboard/settings");
    } catch (err) {
      setError("Ungültiger Code. Bitte versuchen Sie es erneut.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setVerificationStep("setup");
    setError(null);
    setQrCode(null);
  };

  const renderSetupContent = () => {
    switch (currentTab) {
      case "email":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wir senden einen 6-stelligen Code an Ihre registrierte E-Mail-Adresse, um Ihre Identität zu überprüfen.
            </p>
            <Button 
              onClick={setupEmailTwoFactor}
              disabled={isLoading}
              className="w-full"
            >
              E-Mail-Verifizierung einrichten
            </Button>
          </div>
        );
      case "phone":
        return (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(setupPhoneTwoFactor)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="+49 123 4567890"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                SMS-Verifizierung einrichten
              </Button>
            </form>
          </Form>
        );
      case "authenticator":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verwenden Sie eine Authenticator-App wie Google Authenticator, Microsoft Authenticator oder Authy, um Codes zu generieren.
            </p>
            <Button 
              onClick={setupAuthenticatorTwoFactor}
              disabled={isLoading}
              className="w-full"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Authenticator einrichten
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderVerifyContent = () => {
    return (
      <div className="space-y-4">
        {currentTab === "authenticator" && qrCode && (
          <div className="flex justify-center mb-4">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            <p className="text-sm text-muted-foreground mt-2">
              Scannen Sie diesen QR-Code mit Ihrer Authenticator-App.
            </p>
          </div>
        )}
        
        <p className="text-sm font-medium">Geben Sie den Code ein, den Sie erhalten haben:</p>
        <OTPInput digits={6} onComplete={verifyTwoFactorCode} />
        
        <Button 
          variant="outline"
          onClick={() => setVerificationStep("setup")}
          className="w-full"
        >
          Zurück
        </Button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-medium animate-fade-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Zwei-Faktor-Authentifizierung</CardTitle>
          <CardDescription>
            Erhöhen Sie die Sicherheit Ihres Kontos mit einem zusätzlichen Verifizierungsschritt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {verificationStep === "setup" ? (
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email">E-Mail</TabsTrigger>
                <TabsTrigger value="phone">Telefon</TabsTrigger>
                <TabsTrigger value="authenticator">Authenticator</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="mt-4">
                {renderSetupContent()}
              </TabsContent>
              <TabsContent value="phone" className="mt-4">
                {renderSetupContent()}
              </TabsContent>
              <TabsContent value="authenticator" className="mt-4">
                {renderSetupContent()}
              </TabsContent>
            </Tabs>
          ) : (
            renderVerifyContent()
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/dashboard/settings")}
          >
            Abbrechen
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TwoFactorSetup;
