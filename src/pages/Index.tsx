
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckIcon } from "lucide-react";
import { authService } from "@/services/auth-service";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const handlePackageSelect = (plan: string) => {
    if (isAuthenticated) {
      navigate(`/checkout?plan=${plan}`);
    } else {
      navigate(`/sign-in?redirect=/checkout&plan=${plan}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-darkgray-700">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-darkgray-800 to-darkgray-700 px-4 py-24 md:py-32 border-b border-darkgray-600">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Erstellen Sie Ihren Online-Shop
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Verwalten Sie Produkte, empfangen Sie Zahlungen und analysieren Sie Ihre Verkäufe an einem Ort.
            </p>
            <Button asChild size="lg" className="mr-4 bg-turquoise-500 text-white hover:bg-turquoise-600">
              <Link to="/dashboard">Dashboard öffnen</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10">
              <Link to="#pricing">Preise ansehen</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-darkgray-600">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Alles was Sie brauchen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-darkgray-700 rounded-xl p-8 shadow-lg border border-darkgray-500">
              <div className="w-12 h-12 bg-turquoise-500/20 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Produktverwaltung</h3>
              <p className="text-gray-400">Erstellen und verwalten Sie Ihre Produkte einfach über das Dashboard.</p>
            </div>
            
            <div className="bg-darkgray-700 rounded-xl p-8 shadow-lg border border-darkgray-500">
              <div className="w-12 h-12 bg-turquoise-500/20 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Zahlungsabwicklung</h3>
              <p className="text-gray-400">Akzeptieren Sie verschiedene Zahlungsmethoden und behalten Sie den Überblick.</p>
            </div>
            
            <div className="bg-darkgray-700 rounded-xl p-8 shadow-lg border border-darkgray-500">
              <div className="w-12 h-12 bg-turquoise-500/20 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Website-Builder</h3>
              <p className="text-gray-400">Gestalten Sie Ihre Website mit unserem einfachen Drag-and-Drop-Builder.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-darkgray-700">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Preispläne</h2>
          <p className="text-lg text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            Wählen Sie den Plan, der am besten zu Ihren Bedürfnissen passt. Alle Pläne beinhalten Zugang zu unserem Dashboard.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-darkgray-600 rounded-xl shadow-lg border border-darkgray-500 overflow-hidden transition-all hover:shadow-xl">
              <div className="p-8 pb-6">
                <h3 className="text-xl font-bold mb-4 text-white">Kostenlos</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-white">0€</span>
                  <span className="text-gray-400 ml-1">/monat</span>
                </div>
                <Button 
                  className="w-full bg-transparent border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10" 
                  variant="outline"
                  onClick={() => handlePackageSelect("free")}
                >
                  Kostenlos starten
                </Button>
              </div>
              <div className="p-8 pt-4 bg-darkgray-700">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Auswahl von vorgegebenen Website-Templates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Subdomain-Format: websitename.plattform.com</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Grundlegende E-Commerce-Funktionen</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Basic Plan */}
            <div className="bg-darkgray-600 rounded-xl shadow-lg border border-darkgray-500 overflow-hidden transition-all hover:shadow-xl relative">
              <div className="absolute top-0 inset-x-0 bg-turquoise-500 text-white text-center text-sm py-1">
                Beliebt
              </div>
              <div className="p-8 pb-6 pt-10">
                <h3 className="text-xl font-bold mb-4 text-white">Basic</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-white">19,99€</span>
                  <span className="text-gray-400 ml-1">/monat</span>
                </div>
                <Button 
                  className="w-full bg-turquoise-500 hover:bg-turquoise-600"
                  onClick={() => handlePackageSelect("basic")}
                >
                  Jetzt auswählen
                </Button>
              </div>
              <div className="p-8 pt-4 bg-darkgray-700">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Eigene Domain</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Anpassung von Farben und Schriftarten über Dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Erweiterte E-Commerce-Funktionen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Premium Support</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-darkgray-600 rounded-xl shadow-lg border border-darkgray-500 overflow-hidden transition-all hover:shadow-xl">
              <div className="p-8 pb-6">
                <h3 className="text-xl font-bold mb-4 text-white">Pro</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-white">49,99€</span>
                  <span className="text-gray-400 ml-1">/monat</span>
                </div>
                <Button 
                  className="w-full bg-transparent border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10" 
                  variant="outline"
                  onClick={() => handlePackageSelect("pro")}
                >
                  Jetzt auswählen
                </Button>
              </div>
              <div className="p-8 pt-4 bg-darkgray-700">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Eigene Domain</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Voller Zugriff auf einen Website-Builder zum Erstellen eigener Designs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Möglichkeit, eigene Websites zu importieren</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Unbegrenzte Produkte</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-turquoise-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Prioritäts-Support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-darkgray-600">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Was unsere Kunden sagen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-darkgray-700 p-8 rounded-xl shadow-md border border-darkgray-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-darkgray-500 rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-white">Kunde {i}</h4>
                    <p className="text-sm text-gray-400">Unternehmen {i}</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  "Diese Plattform hat unseren Online-Verkauf revolutioniert. Einfach zu bedienen und sehr leistungsstark!"
                </p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className="w-5 h-5 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-darkgray-800 border-t border-darkgray-700">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bereit, Ihren Online-Shop zu starten?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Registrieren Sie sich jetzt und beginnen Sie mit dem Verkauf Ihrer Produkte online.
          </p>
          <Button asChild size="lg" className="bg-turquoise-500 text-white hover:bg-turquoise-600">
            <Link to="/dashboard">Kostenlos starten</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-darkgray-900 text-white py-12 border-t border-darkgray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">E-Commerce</h3>
              <p className="text-gray-400">Ihre All-in-One-Lösung für den Online-Handel.</p>
            </div>
            <div>
              <h4 className="text-base font-medium mb-4">Produkt</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-turquoise-500">Preise</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Testimonials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-medium mb-4">Ressourcen</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Dokumentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Entwickler</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-medium mb-4">Unternehmen</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Über uns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Kontakt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Karriere</a></li>
                <li><a href="#" className="text-gray-400 hover:text-turquoise-500">Datenschutz</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-darkgray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2023 E-Commerce Platform. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
