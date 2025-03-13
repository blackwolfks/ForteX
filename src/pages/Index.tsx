
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary/90 to-primary px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Erstellen Sie Ihren Online-Shop
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Verwalten Sie Produkte, empfangen Sie Zahlungen und analysieren Sie Ihre Verkäufe an einem Ort.
            </p>
            <Button asChild size="lg" className="mr-4">
              <Link to="/dashboard">Dashboard öffnen</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              <Link to="/dashboard">Mehr erfahren</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Alles was Sie brauchen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Produktverwaltung</h3>
              <p className="text-muted-foreground">Erstellen und verwalten Sie Ihre Produkte einfach über das Dashboard.</p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Zahlungsabwicklung</h3>
              <p className="text-muted-foreground">Akzeptieren Sie verschiedene Zahlungsmethoden und behalten Sie den Überblick.</p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Website-Builder</h3>
              <p className="text-muted-foreground">Gestalten Sie Ihre Website mit unserem einfachen Drag-and-Drop-Builder.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-muted py-8">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">© 2023 E-Commerce Platform. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
