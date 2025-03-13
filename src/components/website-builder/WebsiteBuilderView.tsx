
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WebsiteCard } from "./WebsiteCard";
import { PremiumFeatureOverlay } from "./PremiumFeatureOverlay";
import { WebsiteEditor } from "./WebsiteEditor";

// Beispielwebsites für Demo-Zwecke
const DEMO_WEBSITES = [
  {
    id: "web1",
    name: "Mein Online-Shop",
    url: "mein-shop.example.com",
    template: "E-Commerce",
    status: "veröffentlicht",
    lastEdited: "2023-10-15T14:30:00",
    pages: 5
  },
  {
    id: "web2",
    name: "Portfolio",
    url: "portfolio.example.com",
    template: "Portfolio",
    status: "entwurf",
    lastEdited: "2023-10-12T09:15:00",
    pages: 3
  }
];

// Mock-Funktion, um den Pro-Status eines Benutzers zu überprüfen
const checkProStatus = (): boolean => {
  // Hier würde normalerweise eine API-Anfrage oder ähnliches stattfinden
  return true; // Für Demozwecke auf true gesetzt
};

const WebsiteBuilderView = () => {
  const [websites, setWebsites] = useState(DEMO_WEBSITES);
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [activeTab, setActiveTab] = useState("websites");
  const [selectedTemplate, setSelectedTemplate] = useState("e-commerce");
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const isPro = checkProStatus();

  const handleCreateWebsite = () => {
    if (!newWebsiteName) {
      toast.error("Bitte geben Sie einen Namen für Ihre Website ein");
      return;
    }

    const newWebsite = {
      id: `web${websites.length + 1}`,
      name: newWebsiteName,
      url: `${newWebsiteName.toLowerCase().replace(/\s+/g, "-")}.example.com`,
      template: selectedTemplate === "e-commerce" ? "E-Commerce" : 
               selectedTemplate === "portfolio" ? "Portfolio" : 
               selectedTemplate === "blog" ? "Blog" : "Leer",
      status: "entwurf",
      lastEdited: new Date().toISOString(),
      pages: 1
    };

    setWebsites([...websites, newWebsite]);
    setNewWebsiteName("");
    toast.success("Website wurde erstellt");
    setActiveTab("websites");
  };

  const handleDeleteWebsite = (id: string) => {
    setWebsites(websites.filter(website => website.id !== id));
    toast.success("Website wurde gelöscht");
  };

  const handleEditWebsite = (id: string) => {
    setEditingWebsiteId(id);
  };

  // Wenn der Benutzer kein Pro-Kunde ist, zeigt eine Overlay-Komponente
  if (!isPro) {
    return <PremiumFeatureOverlay feature="Website-Builder" />;
  }

  // Wenn ein Website zur Bearbeitung ausgewählt ist, zeige den Editor an
  if (editingWebsiteId) {
    return (
      <WebsiteEditor 
        websiteId={editingWebsiteId} 
        onBack={() => setEditingWebsiteId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website-Builder</CardTitle>
          <CardDescription>Erstellen und verwalten Sie Ihre Websites</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="websites">Meine Websites</TabsTrigger>
              <TabsTrigger value="create">Neue Website</TabsTrigger>
              <TabsTrigger value="templates">Vorlagen</TabsTrigger>
            </TabsList>

            <TabsContent value="websites" className="space-y-4">
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Sie haben noch keine Websites erstellt</p>
                  <Button onClick={() => setActiveTab("create")}>Erste Website erstellen</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {websites.map((website) => (
                    <WebsiteCard 
                      key={website.id} 
                      website={website} 
                      onDelete={() => handleDeleteWebsite(website.id)} 
                      onEdit={handleEditWebsite}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-name">Name der Website</Label>
                  <Input 
                    id="website-name" 
                    placeholder="Meine neue Website" 
                    value={newWebsiteName}
                    onChange={(e) => setNewWebsiteName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Vorlage auswählen</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer ${selectedTemplate === "e-commerce" ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedTemplate("e-commerce")}
                    >
                      <h3 className="font-medium">E-Commerce</h3>
                      <p className="text-sm text-muted-foreground">Online-Shop mit Produktkatalog</p>
                    </div>
                    <div 
                      className={`border rounded-md p-4 cursor-pointer ${selectedTemplate === "portfolio" ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedTemplate("portfolio")}
                    >
                      <h3 className="font-medium">Portfolio</h3>
                      <p className="text-sm text-muted-foreground">Präsentieren Sie Ihre Arbeiten</p>
                    </div>
                    <div 
                      className={`border rounded-md p-4 cursor-pointer ${selectedTemplate === "blog" ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedTemplate("blog")}
                    >
                      <h3 className="font-medium">Blog</h3>
                      <p className="text-sm text-muted-foreground">Blog-Website mit Artikeln</p>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleCreateWebsite}>Website erstellen</Button>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">E-Commerce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Shop-Vorschau</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Vollständiger Online-Shop mit Produktkatalog, Warenkorb und Checkout.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setSelectedTemplate("e-commerce");
                      setActiveTab("create");
                    }}>
                      Vorlage verwenden
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Portfolio-Vorschau</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Präsentieren Sie Ihre Arbeiten und Projekte mit dieser eleganten Vorlage.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setSelectedTemplate("portfolio");
                      setActiveTab("create");
                    }}>
                      Vorlage verwenden
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Blog</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Blog-Vorschau</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Erstellen Sie eine Blog-Website mit Artikelübersicht und Kategorien.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setSelectedTemplate("blog");
                      setActiveTab("create");
                    }}>
                      Vorlage verwenden
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteBuilderView;
