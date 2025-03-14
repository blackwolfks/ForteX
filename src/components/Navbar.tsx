import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, UserCircle, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { callRPC } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name?: string } | null>(null);
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        try {
          const { data, error } = await callRPC('get_user_pro_status', {});
          if (error) {
            console.error('Fehler beim Abrufen des Abonnement-Status:', error);
          } else if (data && data.length > 0) {
            setSubscriptionTier(data[0].subscription_tier || 'free');
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Abonnement-Status:', err);
        }
      }
    };
    
    checkAuth();
  }, []);
  
  const renderSubscriptionBadge = () => {
    if (!isAuthenticated) return null;
    
    return (
      <Badge variant={subscriptionTier === 'free' ? "outline" : "default"} className={
        subscriptionTier === 'pro' 
          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
          : subscriptionTier === 'basic' 
            ? "bg-blue-500 text-white" 
            : ""
      }>
        {subscriptionTier.toUpperCase()}
      </Badge>
    );
  };
  
  const handleSignOut = async () => {
    try {
      const result = await authService.signOut();
      if (result.success) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        toast({
          title: "Abgemeldet",
          description: "Sie wurden erfolgreich abgemeldet.",
        });
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Abmelden fehlgeschlagen:", error);
      toast({
        title: "Fehler",
        description: "Abmelden fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <nav className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary">E-Commerce</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            {isDashboard ? (
              <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Zur Startseite
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
                  <Link to="/">Startseite</Link>
                </Button>
                <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
                  <a href="/#features">Features</a>
                </Button>
                <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
                  <a href="/#pricing">Preise</a>
                </Button>
                <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
                  <a href="/#testimonials">Testimonials</a>
                </Button>
              </>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && renderSubscriptionBadge()}
            
            {isAuthenticated ? (
              <>
                {!isDashboard && (
                  <Button asChild variant="outline" className="border-primary/20 hover:border-primary/30">
                    <Link to="/dashboard">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="border-primary/20 hover:border-primary/30">
                  <Link to="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {currentUser?.name || "Mein Konto"}
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut}>
                  Abmelden
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="border-primary/20 hover:border-primary/30">
                  <Link to="/sign-in">Anmelden</Link>
                </Button>
                <Button asChild className="shadow-soft">
                  <Link to="/sign-up">Registrieren</Link>
                </Button>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menü öffnen"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 pb-4 animate-fade-in">
            <div className="flex flex-col space-y-2">
              {isAuthenticated && (
                <div className="py-2 flex justify-center">
                  {renderSubscriptionBadge()}
                </div>
              )}
              
              {isDashboard ? (
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Zur Startseite
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/">Startseite</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <a href="/#features">Features</a>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <a href="/#pricing">Preise</a>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <a href="/#testimonials">Testimonials</a>
                  </Button>
                </>
              )}
              
              {isAuthenticated ? (
                <>
                  {!isDashboard && (
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/profile">Mein Konto</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                    Abmelden
                  </Button>
                </>
              ) : (
                <div className="flex space-x-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/sign-in">Anmelden</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/sign-up">Registrieren</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
