
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import OTPVerification from "@/components/auth/OTPVerification";
import SocialLogin from "@/components/auth/SocialLogin";

const SignIn = () => {
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"email" | "phone" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL and plan from query parameters
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';
  const plan = queryParams.get('plan') || null;

  const handleOTPRequired = (method: "email" | "phone" | null) => {
    setShowOTP(true);
    setOtpMethod(method);
  };

  const handleSuccessfulLogin = () => {
    if (redirectUrl === '/checkout' && plan) {
      navigate(`${redirectUrl}?plan=${plan}`);
    } else {
      navigate(redirectUrl);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-medium animate-fade-in">
        {showOTP ? (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Verifizierung</CardTitle>
              <CardDescription>
                Bitte geben Sie den Code ein, den wir an Ihre {otpMethod === "email" ? "E-Mail-Adresse" : "Telefonnummer"} gesendet haben.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OTPVerification 
                otpMethod={otpMethod} 
                onBack={() => setShowOTP(false)}
                error={error}
                setError={setError}
                onSuccess={handleSuccessfulLogin}
              />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich mit Ihren Zugangsdaten an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm 
                onOTPRequired={handleOTPRequired}
                error={error}
                setError={setError}
                onSuccess={handleSuccessfulLogin}
              />
              <SocialLogin 
                setError={setError} 
                redirectUrl={redirectUrl}
                plan={plan}
              />
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground text-center w-full">
                Noch kein Konto?{" "}
                <Link
                  to={`/sign-up${location.search}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Registrieren
                </Link>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default SignIn;
