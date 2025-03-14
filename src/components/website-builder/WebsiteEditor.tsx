
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Layout, Type, Image, List, ShoppingCart, History } from "lucide-react";
import { toast } from "sonner";
import { TextConfigSection } from "./TextConfigSection";
import { websiteService, WebsiteContent, WebsiteSection, WebsiteChangeHistory } from "@/services/website-service";
import { useNavigate } from "react-router-dom";
import { WebsiteChangeHistoryPanel } from "./WebsiteChangeHistoryPanel";
import { useWebsiteBuilder } from "@/hooks/useWebsiteBuilder";

interface WebsiteEditorProps {
  websiteId: string;
  onBack: () => void;
}

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

export const WebsiteEditor = ({ websiteId, onBack }: WebsiteEditorProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewSaving, setIsPreviewSaving] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [content, setContent] = useState<WebsiteContent>({
    title: "",
    subtitle: "",
    description: "",
    sections: []
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteTemplate, setWebsiteTemplate] = useState("");
  const [shopTemplate, setShopTemplate] = useState("default");
  const [editingTextSection, setEditingTextSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<WebsiteContent | null>(null);
  const [originalWebsite, setOriginalWebsite] = useState<any>(null);
  const [changeHistory, setChangeHistory] = useState<WebsiteChangeHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { handleSaveWebsiteContent } = useWebsiteBuilder();
  
  useEffect(() => {
    const loadWebsiteData = async () => {
      setIsLoading(true);
      try {
        const result = await websiteService.getWebsiteById(websiteId);
        
        if (result) {
          const { website, content } = result;
          setOriginalWebsite(website);
          setOriginalContent(content);
          
          setWebsiteName(website.name);
          setWebsiteUrl(website.url || "");
          setWebsiteTemplate(website.template);
          setShopTemplate(website.shop_template || "default");
          setContent(content);
          setLastSaved(website.last_saved || null);
          setIsInitialized(true);
          
          await loadChangeHistory();
        } else {
          toast.error("Website konnte nicht geladen werden");
          onBack();
        }
      } catch (error) {
        console.error("Error loading website:", error);
        toast.error("Fehler beim Laden der Website");
      } finally {
        setIsLoading(false);
      }
    };

    loadWebsiteData();
  }, [websiteId, onBack]);
  
  const loadChangeHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await websiteService.getWebsiteChangeHistory(websiteId);
      console.log("Loaded change history:", history);
      setChangeHistory(history);
    } catch (error) {
      console.error("Error loading change history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const saveContentChanges = async () => {
    if (!websiteId || isSavingContent) return false;
    
    setIsSavingContent(true);
    try {
      console.log("Saving content changes only...");
      console.log("Content being saved:", content);
      
      const success = await handleSaveWebsiteContent(websiteId, content);
      
      if (success) {
        setOriginalContent({...content});
        
        // Only reset content-related changes
        const websiteChanged = websiteService.compareWebsiteChanges(
          originalWebsite,
          {
            name: websiteName,
            url: websiteUrl,
            template: websiteTemplate,
            shop_template: shopTemplate
          },
          originalContent,
          content
        ).websiteChanged;
        
        // Only mark as no changes if there are no website metadata changes
        if (!websiteChanged) {
          setHasChanges(false);
        }
        
        setLastSaved(new Date().toISOString());
        
        await loadChangeHistory();
        
        console.log("Content changes saved successfully");
        toast.success("Inhalte wurden gespeichert");
        return true;
      } else {
        console.error("Error saving content changes");
        toast.error("Fehler beim Speichern der Inhalte");
        return false;
      }
    } catch (error) {
      console.error("Error saving content changes:", error);
      toast.error("Fehler beim Speichern der Inhalte");
      return false;
    } finally {
      setIsSavingContent(false);
    }
  };
  
  const saveWebsiteData = async (isFromPreview = false) => {
    if (!websiteId || (isFromPreview ? isPreviewSaving : isSaving)) return false;
    
    if (isFromPreview) {
      setIsPreviewSaving(true);
    } else {
      setIsSaving(true);
    }
    
    try {
      console.log("Saving full website data...");
      console.log("Content being saved:", content);
      
      const updatedWebsiteData = {
        name: websiteName,
        url: websiteUrl,
        template: websiteTemplate,
        shop_template: shopTemplate
      };
      
      const success = await handleSaveWebsiteContent(websiteId, content);
      
      if (success) {
        setOriginalWebsite({...originalWebsite, ...updatedWebsiteData});
        setOriginalContent({...content});
        
        setHasChanges(false);
        setLastSaved(new Date().toISOString());
        
        await loadChangeHistory();
        
        console.log("Full website data saved successfully");
        toast.success("Änderungen wurden gespeichert");
        return true;
      } else {
        console.error("Error saving website data");
        toast.error("Fehler beim Speichern der Änderungen");
        return false;
      }
    } catch (error) {
      console.error("Error saving website data:", error);
      toast.error("Fehler beim Speichern der Änderungen");
      return false;
    } finally {
      if (isFromPreview) {
        setIsPreviewSaving(false);
      } else {
        setIsSaving(false);
      }
    }
  };
  
  const handleSave = async () => {
    await saveWebsiteData(false);
  };
  
  const handleSaveContent = async () => {
    await saveContentChanges();
  };
  
  const handlePreview = () => {
    // Just switch tabs without saving
    setActiveTab("preview");
  };

  const applyTemplate = (templateName: string) => {
    const template = WEBSHOP_TEMPLATES[templateName as keyof typeof WEBSHOP_TEMPLATES];
    if (!template) return;
    
    setContent({
      title: template.hero.title,
      subtitle: template.hero.subtitle,
      description: template.hero.description,
      sections: template.sections as WebsiteSection[],
      header: template.header
    });
    
    setHasChanges(true);
    toast.success("Template wurde angewendet");
  };

  const handleRestoreVersion = (versionContent: WebsiteContent) => {
    if (window.confirm("Sind Sie sicher, dass Sie diese Version wiederherstellen möchten? Alle ungespeicherten Änderungen gehen verloren.")) {
      setContent(versionContent);
      setHasChanges(true);
      toast.success("Version wurde wiederhergestellt");
    }
  };

  useEffect(() => {
    if (!isInitialized || !originalContent || !originalWebsite) return;
    
    const websiteChanges = websiteService.compareWebsiteChanges(
      originalWebsite,
      {
        name: websiteName,
        url: websiteUrl,
        template: websiteTemplate,
        shop_template: shopTemplate
      },
      originalContent,
      content
    );
    
    setHasChanges(websiteChanges.websiteChanged || websiteChanges.contentChanged);
  }, [content, websiteName, websiteUrl, shopTemplate, websiteTemplate, isInitialized, originalContent, originalWebsite]);

  useEffect(() => {
    if (isInitialized && shopTemplate !== originalWebsite?.shop_template) {
      applyTemplate(shopTemplate);
    }
  }, [shopTemplate, isInitialized]);

  useEffect(() => {
    if (!hasChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
        return ""; // This message is not actually shown in modern browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p>Website wird geladen...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (hasChanges) {
                if (window.confirm("Es gibt ungespeicherte Änderungen. Möchten Sie speichern bevor Sie zurückkehren?")) {
                  saveWebsiteData().then(() => onBack());
                } else {
                  onBack();
                }
              } else {
                onBack();
              }
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
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Wird gespeichert..." : hasChanges ? "Speichern" : "Gespeichert"}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" />
            Änderungshistorie
          </TabsTrigger>
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
                    
                    {content.sections && content.sections.map((section: WebsiteSection, index: number) => (
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
                        onClick={handleSaveContent}
                        disabled={!hasChanges || isSavingContent}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSavingContent ? "Wird gespeichert..." : "Inhalte speichern"}
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
                  
                  {content.sections && content.sections.map((section: WebsiteSection) => (
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
                  <Input defaultValue={websiteTemplate} readOnly />
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
                    value={lastSaved ? new Date(lastSaved).toLocaleString() : "Noch nicht gespeichert"} 
                    readOnly 
                  />
                </div>
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? "Wird gespeichert..." : hasChanges ? "Einstellungen speichern" : "Einstellungen gespeichert"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="grid grid-cols-1 gap-4">
            <WebsiteChangeHistoryPanel 
              history={changeHistory} 
              isLoading={isLoadingHistory}
              onRestoreVersion={handleRestoreVersion}
            />
            
            <div className="my-4 p-4 border rounded-md bg-slate-50 text-sm text-muted-foreground">
              <p>In der Änderungshistorie sehen Sie alle Änderungen, die an dieser Website vorgenommen wurden. Jede Änderung wird mit einem Zeitstempel und den geänderten Feldern gespeichert.</p>
              <p className="mt-2">Sie können eine frühere Version wiederherstellen, indem Sie auf "Wiederherstellen" klicken.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
