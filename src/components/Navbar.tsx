
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">E-Commerce</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <Button asChild variant="ghost">
              <Link to="/">Startseite</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/#features">Features</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/#pricing">Preise</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/#testimonials">Testimonials</Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline">
              <Link to="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
