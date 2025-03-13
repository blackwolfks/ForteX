
import { ReactNode, useEffect } from 'react';
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
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      // Benutzer ist nicht angemeldet, aber Authentifizierung erforderlich
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
    } else if (!requireAuth && isAuthenticated) {
      // Benutzer ist angemeldet, aber keine Authentifizierung erforderlich (z.B. Anmeldeseite)
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, requireAuth, navigate, redirectTo, location.pathname]);

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
