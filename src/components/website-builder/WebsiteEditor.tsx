import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Layout, Type, Image, List, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { TextConfigSection } from "./TextConfigSection";

interface WebsiteEditorProps {
  websiteId: string;
  onBack: () => void;
}

// Available webshop templates
const WEBSHOP_TEMPLATES = {
  default: {
    header: "Online Shop",
    hero: {
      title: "Willkommen in unserem Shop",
      subtitle: "Entdecken Sie unsere Produkte",
      description: "Hochwertiges Gaming-Zubehör für Ihren Server"
    },
    sections: [
      {
        id: "featured",
        title: "Beliebte Produkte",
        description: "Unsere meistverkauften Produkte"
      },
      {
        id: "new",
        title: "Neue Produkte",
        description: "Entdecken Sie unsere neuesten Angebote"
      }
    ]
  },
  premium: {
    header: "Premium Game Shop",
    hero: {
      title: "Exklusive Inhalte für Ihr Spielerlebnis",
      subtitle: "Premium-Vorteile für echte Gamer",
      description: "Heben Sie sich von anderen Spielern ab mit exklusiven Inhalten und Vorteilen"
    },
    sections: [
      {
        id: "vip",
        title: "VIP Pakete",
        description: "Exklusive Vorteile für VIP-Mitglieder"
      },
      {
        id: "bundle",
        title: "Sparpakete",
        description: "Kombinierte Angebote zum Vorteilspreis"
      }
    ]
  },
  minimal: {
    header: "Game Store",
    hero: {
      title: "Einfach. Schnell. Günstig.",
      subtitle: "Direkt loslegen",
      description: "Der unkomplizierte Weg zu mehr Spielspaß"
    },
    sections: [
      {
        id: "essential",
        title: "Essentials",
        description: "Das Wichtigste für Ihren Start"
      },
      {
        id: "deals",
        title: "Angebote der Woche",
        description: "Limitierte Sonderangebote"
      }
    ]
  }
};

// Function to get website data with better error handling
const getWebsiteById = (id: string) => {
  try {
    // First check if we have saved data in localStorage
    const savedData = localStorage.getItem(`website_${id}`);
    if (savedData) {
      return JSON.parse(savedData);
    }
    
    // Otherwise return the default data
    return {
      id,
      name: id === "web1" ? "Mein Online-Shop" : "Portfolio",
      url: id === "web1" ? "mein-shop.example.com" : "portfolio.example.com",
      template: id === "web1" ? "E-Commerce" : "Portfolio",
      shopTemplate: "default",
      content: {
        title: id === "web1" ? "Willkommen in meinem Shop" : "Mein Portfolio",
        subtitle: id === "web1" ? "Entdecken Sie unsere Produkte" : "Meine Arbeiten",
        description: id === "web1" 
          ? "Hier finden Sie die besten Produkte zu günstigen Preisen."
          : "Hier finden Sie eine Auswahl meiner besten Arbeiten und Projekte.",
        sections: []
      }
    };
  } catch (error) {
    console.error("Error loading website data:", error);
    return {
      id,
      name: "Neue Website",
      url: "example.com",
      template: "E-Commerce",
      shopTemplate: "default",
      content: {
        title: "Neue Website",
        subtitle: "Subtitle",
        description: "Beschreibung",
        sections: []
      }
    };
  }
};

export const WebsiteEditor = ({ websiteId, onBack }: WebsiteEditorProps) => {
  const websiteData = getWebsiteById(websiteId);
  const [activeTab, setActiveTab] = useState("edit");
  const [content, setContent] = useState(websiteData.content);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState(websiteData.name);
  const [websiteUrl, setWebsiteUrl] = useState(websiteData.url);
  const [shopTemplate, setShopTemplate] = useState(websiteData.shopTemplate || "default");
  const [editingTextSection, setEditingTextSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Improved save function with error handling
  const saveWebsiteData = () => {
    try {
      const dataToSave = {
        ...websiteData,
        name: websiteName,
        url: websiteUrl,
        content: content,
        shopTemplate: shopTemplate,
        lastSaved: new Date().toISOString()
      };
      
      // Stringify with proper error handling
      const dataString = JSON.stringify(dataToSave);
      localStorage.setItem(`website_${websiteId}`, dataString);
      
      setHasChanges(false);
      console.log("Website data saved successfully:", dataToSave);
      toast.success("Änderungen wurden gespeichert");
      return true;
    } catch (error) {
      console.error("Error saving website data:", error);
      toast.error("Fehler beim Speichern der Änderungen");
      return false;
    }
  };
  
  const handleSave = () => {
    saveWebsiteData();
  };
  
  const handlePreview = () => {
    // Save before preview to ensure latest changes are reflected
    if (hasChanges) {
      const saved = saveWebsiteData();
      if (saved) {
        setActiveTab("preview");
      }
    } else {
      setActiveTab("preview");
    }
  };

  // Apply template to content
  const applyTemplate = (templateName: string) => {
    const template = WEBSHOP_TEMPLATES[templateName as keyof typeof WEBSHOP_TEMPLATES];
    if (!template) return;
    
    setContent({
      title: template.hero.title,
      subtitle: template.hero.subtitle,
      description: template.hero.description,
      sections: template.sections,
      header: template.header
    });
    
    setHasChanges(true);
    toast.success("Template wurde angewendet");
  };

  // Track changes to content and other website properties
  useEffect(() => {
    setHasChanges(true);
  }, [content, websiteName, websiteUrl]);

  // Apply template when it changes
  useEffect(() => {
    applyTemplate(shopTemplate);
  }, [shopTemplate]);

  // Improved auto-save functionality
  useEffect(() => {
    if (!hasChanges) return;
    
    // Save immediately after 5 seconds of inactivity
    const saveTimeout = setTimeout(() => {
      console.log("Auto-saving website changes after inactivity...");
      saveWebsiteData();
    }, 5000);
    
    // Auto-save every 30 seconds if changes are made
    const autoSaveInterval = setInterval(() => {
      if (hasChanges) {
        console.log("Auto-saving website changes...");
        saveWebsiteData();
      }
    }, 30000);
    
    // Prompt user before leaving page with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
        return ""; // This message is not actually shown in modern browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(saveTimeout);
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, content, websiteName, websiteUrl, shopTemplate]);

  // Save on tab change
  useEffect(() => {
    if (hasChanges && activeTab !== "edit") {
      saveWebsiteData();
    }
  }, [activeTab]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Save before navigating back if there are changes
              if (hasChanges) {
                saveWebsiteData();
              }
              onBack();
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
          <h2 className="text-xl font-bold">{websiteName} bearbeiten</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" />
            Vorschau
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-1" />
            {hasChanges ? "Speichern" : "Gespeichert"}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Elemente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setSelectedElement("header")}
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Header
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setSelectedElement("text")}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setSelectedElement("image")}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Bild
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setSelectedElement("list")}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Liste
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setSelectedElement("products")}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Produkte
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Shop-Vorlagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Wähle eine Vorlage</Label>
                      <Select value={shopTemplate} onValueChange={setShopTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vorlage auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Standard Shop</SelectItem>
                          <SelectItem value="premium">Premium Shop</SelectItem>
                          <SelectItem value="minimal">Minimaler Shop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => applyTemplate(shopTemplate)}
                    >
                      Vorlage anwenden
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="min-h-[500px]">
                <CardContent className="p-4">
                  <div className="border rounded-md p-4 min-h-[500px] bg-white">
                    <div className="text-center border-b pb-4 mb-4">
                      <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                      <p className="text-lg text-muted-foreground">{content.subtitle}</p>
                    </div>
                    <div className="prose max-w-none">
                      <p>{content.description}</p>
                    </div>
                    
                    {content.sections && content.sections.map((section: any, index: number) => (
                      <div key={section.id} className="mt-6 border-t pt-4">
                        <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                        <p className="text-muted-foreground mb-4">{section.description}</p>
                        <div 
                          className="cursor-pointer text-sm text-blue-500 underline"
                          onClick={() => setEditingTextSection(`section_${index}`)}
                        >
                          Bearbeiten
                        </div>
                        {editingTextSection === `section_${index}` && (
                          <div className="mt-2 p-3 border rounded-md bg-slate-50">
                            <div className="space-y-2 mb-2">
                              <Label>Titel</Label>
                              <Input 
                                value={section.title} 
                                onChange={(e) => {
                                  const newSections = [...content.sections];
                                  newSections[index] = { ...section, title: e.target.value };
                                  setContent({ ...content, sections: newSections });
                                }}
                              />
                            </div>
                            <div className="space-y-2 mb-2">
                              <Label>Beschreibung</Label>
                              <Textarea 
                                value={section.description}
                                onChange={(e) => {
                                  const newSections = [...content.sections];
                                  newSections[index] = { ...section, description: e.target.value };
                                  setContent({ ...content, sections: newSections });
                                }}
                              />
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingTextSection(null)}
                            >
                              Fertig
                            </Button>
                          </div>
                        )}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border rounded-md p-4 text-center">
                            <div className="bg-slate-100 aspect-square rounded-md mb-2 flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium">Produkt Placeholder</h3>
                            <p className="text-sm text-muted-foreground">€19.99</p>
                          </div>
                          <div className="border rounded-md p-4 text-center">
                            <div className="bg-slate-100 aspect-square rounded-md mb-2 flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium">Produkt Placeholder</h3>
                            <p className="text-sm text-muted-foreground">€29.99</p>
                          </div>
                          <div className="border rounded-md p-4 text-center">
                            <div className="bg-slate-100 aspect-square rounded-md mb-2 flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium">Produkt Placeholder</h3>
                            <p className="text-sm text-muted-foreground">€39.99</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedElement === "header" && (
                      <div className="mt-4 p-2 border border-dashed border-blue-400 bg-blue-50">
                        <p className="text-sm text-blue-500">Header-Element hinzufügen (klicken zum Bearbeiten)</p>
                      </div>
                    )}
                    {selectedElement === "text" && (
                      <div className="mt-4 p-2 border border-dashed border-blue-400 bg-blue-50">
                        <p className="text-sm text-blue-500">Text-Element hinzufügen (klicken zum Bearbeiten)</p>
                      </div>
                    )}
                    {selectedElement === "image" && (
                      <div className="mt-4 p-2 border border-dashed border-blue-400 bg-blue-50">
                        <p className="text-sm text-blue-500">Bild-Element hinzufügen (klicken zum Bearbeiten)</p>
                      </div>
                    )}
                    {selectedElement === "list" && (
                      <div className="mt-4 p-2 border border-dashed border-blue-400 bg-blue-50">
                        <p className="text-sm text-blue-500">Listen-Element hinzufügen (klicken zum Bearbeiten)</p>
                      </div>
                    )}
                    {selectedElement === "products" && (
                      <div className="mt-4 p-2 border border-dashed border-blue-400 bg-blue-50">
                        <p className="text-sm text-blue-500">Produkt-Bereich hinzufügen (klicken zum Bearbeiten)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Eigenschaften</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Haupttitel</Label>
                      <Input 
                        value={content.title} 
                        onChange={(e) => setContent({ ...content, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Untertitel</Label>
                      <Input 
                        value={content.subtitle} 
                        onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beschreibung</Label>
                      <Textarea 
                        value={content.description}
                        onChange={(e) => setContent({ ...content, description: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleSave}
                        disabled={!hasChanges}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {hasChanges ? "Änderungen speichern" : "Gespeichert"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-white p-8">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-xl font-bold text-center mb-6">{content.header || "Online Shop"}</h3>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
                    <p className="text-xl text-muted-foreground">{content.subtitle}</p>
                  </div>
                  <div className="prose max-w-none mb-12">
                    <p className="text-lg">{content.description}</p>
                  </div>
                  
                  {content.sections && content.sections.map((section: any) => (
                    <div key={section.id} className="mb-12">
                      <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                      <p className="text-lg text-muted-foreground mb-6">{section.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border rounded-lg p-4 flex flex-col">
                          <div className="bg-slate-100 aspect-video rounded-md mb-4"></div>
                          <h3 className="text-lg font-medium mb-1">Produkt Platzhalter 1</h3>
                          <p className="text-sm text-muted-foreground mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                          <div className="mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">€19.99</span>
                              <Button size="sm">Kaufen</Button>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 flex flex-col">
                          <div className="bg-slate-100 aspect-video rounded-md mb-4"></div>
                          <h3 className="text-lg font-medium mb-1">Produkt Platzhalter 2</h3>
                          <p className="text-sm text-muted-foreground mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                          <div className="mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">€29.99</span>
                              <Button size="sm">Kaufen</Button>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 flex flex-col">
                          <div className="bg-slate-100 aspect-video rounded-md mb-4"></div>
                          <h3 className="text-lg font-medium mb-1">Produkt Platzhalter 3</h3>
                          <p className="text-sm text-muted-foreground mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                          <div className="mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">€39.99</span>
                              <Button size="sm">Kaufen</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Website-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Website-Name</Label>
                  <Input 
                    value={websiteName} 
                    onChange={(e) => setWebsiteName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input 
                    value={websiteUrl} 
                    onChange={(e) => setWebsiteUrl(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Input defaultValue={websiteData.template} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Shop-Design</Label>
                  <Select value={shopTemplate} onValueChange={setShopTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vorlage auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard Shop</SelectItem>
                      <SelectItem value="premium">Premium Shop</SelectItem>
                      <SelectItem value="minimal">Minimaler Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Letzter Speichervorgang</Label>
                  <Input 
                    value={websiteData.lastSaved ? new Date(websiteData.lastSaved).toLocaleString() : "Noch nicht gespeichert"} 
                    readOnly 
                  />
                </div>
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  {hasChanges ? "Einstellungen speichern" : "Einstellungen gespeichert"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
