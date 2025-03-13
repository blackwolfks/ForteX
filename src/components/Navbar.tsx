
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, UserCircle } from "lucide-react";
import { useState } from "react";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  
  const handleSignOut = async () => {
    await authService.signOut();
    toast({
      title: "Abgemeldet",
      description: "Sie wurden erfolgreich abgemeldet.",
    });
    window.location.href = "/";
  };
  
  return (
    <nav className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary">E-Commerce</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
              <Link to="/">Startseite</Link>
            </Button>
            <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
              <Link to="/#features">Features</Link>
            </Button>
            <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
              <Link to="/#pricing">Preise</Link>
            </Button>
            <Button asChild variant="ghost" className="nav-link hover:bg-secondary">
              <Link to="/#testimonials">Testimonials</Link>
            </Button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" className="border-primary/20 hover:border-primary/30">
                  <Link to="/dashboard">
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
              <Button asChild variant="ghost" className="justify-start">
                <Link to="/">Startseite</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link to="/#features">Features</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link to="/#pricing">Preise</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link to="/#testimonials">Testimonials</Link>
              </Button>
              
              {isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/dashboard">Mein Konto</Link>
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
