
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-md w-full space-y-6">
        <div>
          <h1 className="text-9xl font-extrabold text-blue-600">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Seite nicht gefunden</h2>
          <p className="mt-2 text-base text-gray-500">
            Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <div className="mt-8">
          <Button asChild className="w-full">
            <Link to="/">
              Zurück zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
