
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/auth-service';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/sign-in' 
}: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await authService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error("Fehler bei der Authentifizierungsprüfung:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Warten, bis der Auth-Status geladen ist

    if (requireAuth && !isAuthenticated) {
      // Benutzer ist nicht angemeldet, aber Authentifizierung erforderlich
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
    } else if (!requireAuth && isAuthenticated) {
      // Benutzer ist angemeldet, aber keine Authentifizierung erforderlich (z.B. Anmeldeseite)
      // Umleitung zur Startseite
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, requireAuth, navigate, redirectTo, location.pathname, isLoading]);

  // Während des Ladevorgangs nichts anzeigen
  if (isLoading) {
    return null;
  }

  // Nur Inhalte anzeigen, wenn die Bedingungen erfüllt sind
  if (requireAuth && !isAuthenticated) {
    return null; // Nichts anzeigen während Weiterleitung
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Nichts anzeigen während Weiterleitung
  }

  return <>{children}</>;
};

export default AuthGuard;
