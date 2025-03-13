import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Eye, Layout, Type, Image, List } from "lucide-react";
import { toast } from "sonner";

interface WebsiteEditorProps {
  websiteId: string;
  onBack: () => void;
}

// Mock function to get website data
const getWebsiteById = (id: string) => {
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
    content: {
      title: id === "web1" ? "Willkommen in meinem Shop" : "Mein Portfolio",
      subtitle: id === "web1" ? "Entdecken Sie unsere Produkte" : "Meine Arbeiten",
      description: id === "web1" 
        ? "Hier finden Sie die besten Produkte zu günstigen Preisen."
        : "Hier finden Sie eine Auswahl meiner besten Arbeiten und Projekte."
    }
  };
};

export const WebsiteEditor = ({ websiteId, onBack }: WebsiteEditorProps) => {
  const websiteData = getWebsiteById(websiteId);
  const [activeTab, setActiveTab] = useState("edit");
  const [content, setContent] = useState(websiteData.content);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState(websiteData.name);
  const [websiteUrl, setWebsiteUrl] = useState(websiteData.url);
  
  // Save website data to localStorage
  const saveWebsiteData = () => {
    const dataToSave = {
      ...websiteData,
      name: websiteName,
      url: websiteUrl,
      content: content,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`website_${websiteId}`, JSON.stringify(dataToSave));
    toast.success("Änderungen wurden gespeichert");
  };
  
  const handleSave = () => {
    saveWebsiteData();
  };
  
  const handlePreview = () => {
    setActiveTab("preview");
  };

  // Auto-save every 30 seconds if changes are made
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveWebsiteData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [content, websiteName, websiteUrl]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
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
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Speichern
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
                      <Label>Titel</Label>
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
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
                    <p className="text-xl text-muted-foreground">{content.subtitle}</p>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-lg">{content.description}</p>
                  </div>
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
                  <Label>Letzter Speichervorgang</Label>
                  <Input 
                    value={websiteData.lastSaved ? new Date(websiteData.lastSaved).toLocaleString() : "Noch nicht gespeichert"} 
                    readOnly 
                  />
                </div>
                <Button onClick={handleSave}>Einstellungen speichern</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
