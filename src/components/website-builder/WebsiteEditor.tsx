import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WebsiteContent, WebsiteSection } from "@/services/website-service";
import { useWebsiteBuilder } from "@/hooks/useWebsiteBuilder";
import { WebsiteChangeHistoryPanel } from "./WebsiteChangeHistoryPanel";
import { WebsiteSectionEditor } from "./WebsiteSectionEditor";
import { WebsitePreview } from "./WebsitePreview";
import { ArrowLeft, Save, Eye, EyeOff, Trash2, Plus, AlertTriangle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface WebsiteEditorProps {
  websiteId: string;
  onBack: () => void;
}

export const WebsiteEditor = ({ websiteId, onBack }: WebsiteEditorProps) => {
  const navigate = useNavigate();
  const { handleSaveWebsiteContent } = useWebsiteBuilder();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<WebsiteContent>({
    title: "",
    subtitle: "",
    description: "",
    sections: []
  });
  const [originalContent, setOriginalContent] = useState<WebsiteContent | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Track specific changes for more granular control
  const [titleChanged, setTitleChanged] = useState(false);
  const [subtitleChanged, setSubtitleChanged] = useState(false);
  const [descriptionChanged, setDescriptionChanged] = useState(false);
  const [sectionsChanged, setSectionsChanged] = useState(false);
  
  const { changeHistory, isLoadingHistory, loadChangeHistory } = useWebsiteBuilder();

  useEffect(() => {
    const loadWebsiteContent = async () => {
      setIsLoading(true);
      try {
        const { data } = await fetch(`/api/websites/${websiteId}`).then(res => res.json());
        if (data) {
          setContent(data.content);
          setOriginalContent(JSON.parse(JSON.stringify(data.content)));
          setLastSaved(data.last_saved || null);
        } else {
          toast.error("Fehler beim Laden der Website-Inhalte");
        }
      } catch (error) {
        console.error("Error loading website content:", error);
        toast.error("Fehler beim Laden der Website-Inhalte");
      } finally {
        setIsLoading(false);
      }
    };

    if (websiteId) {
      loadWebsiteContent();
      loadChangeHistory(websiteId);
    }
  }, [websiteId, loadChangeHistory]);

  // Check for changes
  useEffect(() => {
    if (!originalContent) return;
    
    const hasContentChanges = 
      titleChanged || 
      subtitleChanged || 
      descriptionChanged || 
      sectionsChanged;
    
    setHasChanges(hasContentChanges);
  }, [
    originalContent,
    titleChanged,
    subtitleChanged,
    descriptionChanged,
    sectionsChanged
  ]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({ ...prev, title: e.target.value }));
    setTitleChanged(e.target.value !== originalContent?.title);
  };

  // Handle subtitle change
  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({ ...prev, subtitle: e.target.value }));
    setSubtitleChanged(e.target.value !== originalContent?.subtitle);
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(prev => ({ ...prev, description: e.target.value }));
    setDescriptionChanged(e.target.value !== originalContent?.description);
  };

  // Add a new section
  const handleAddSection = () => {
    const newSection: WebsiteSection = {
      id: uuidv4(),
      title: "Neuer Abschnitt",
      description: "Beschreibung des neuen Abschnitts"
    };
    
    setContent(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    setSectionsChanged(true);
  };

  // Update a section
  const handleUpdateSection = (updatedSection: WebsiteSection) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    }));
    
    setSectionsChanged(true);
  };

  // Delete a section
  const handleDeleteSection = (sectionId: string) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    setSectionsChanged(true);
  };

  // Restore a previous version
  const handleRestoreVersion = (versionContent: WebsiteContent) => {
    if (hasChanges) {
      if (!confirm("Es gibt ungespeicherte Änderungen. Möchten Sie wirklich eine ältere Version wiederherstellen?")) {
        return;
      }
    }
    
    setContent(versionContent);
    setTitleChanged(versionContent.title !== originalContent?.title);
    setSubtitleChanged(versionContent.subtitle !== originalContent?.subtitle);
    setDescriptionChanged(versionContent.description !== originalContent?.description);
    setSectionsChanged(true);
    
    toast.info("Ältere Version wurde wiederhergestellt. Speichern Sie, um die Änderungen zu übernehmen.");
  };

  const handleSaveContentOnly = async () => {
    try {
      if (!websiteId) {
        toast.error("Keine Website-ID vorhanden");
        return;
      }
      
      console.log("Saving content changes only...");
      console.log("Content being saved:", content);
      
      const success = await handleSaveWebsiteContent(websiteId, content);
      
      if (success) {
        setOriginalContent({...content});
        setSectionsChanged(false);
        setTitleChanged(false);
        setSubtitleChanged(false);
        setDescriptionChanged(false);
        
        if (hasChanges) {
          setHasChanges(false);
        }
        
        setLastSaved(new Date().toISOString());
        
        console.log("Content changes saved successfully");
        toast.success("Inhalte wurden gespeichert");
      } else {
        toast.error("Fehler beim Speichern der Inhalte");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Fehler beim Speichern der Inhalte");
    }
  };

  const handleSaveFull = async () => {
    try {
      await handleSaveContentOnly();
      
      // Additional logic for full save if needed
      console.log("Full save completed");
    } catch (error) {
      console.error("Error during full save:", error);
      toast.error("Fehler beim Speichern aller Änderungen");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Lade Website-Inhalte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="flex items-center text-amber-500 mr-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm">Ungespeicherte Änderungen</span>
            </div>
          )}
          
          {lastSaved && (
            <div className="text-sm text-muted-foreground mr-2">
              Zuletzt gespeichert: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Vorschau ausblenden
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Vorschau anzeigen
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSaveContentOnly}
            disabled={!hasChanges}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex gap-4">
        {/* Editor panel */}
        <div className={`flex-1 ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Inhalte</TabsTrigger>
              <TabsTrigger value="history">Änderungshistorie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Haupttitel
                      </label>
                      <Input 
                        value={content.title} 
                        onChange={handleTitleChange}
                        placeholder="Haupttitel der Website"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Untertitel
                      </label>
                      <Input 
                        value={content.subtitle} 
                        onChange={handleSubtitleChange}
                        placeholder="Untertitel oder Slogan"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Beschreibung
                      </label>
                      <Textarea 
                        value={content.description} 
                        onChange={handleDescriptionChange}
                        placeholder="Kurze Beschreibung der Website"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Abschnitte</h3>
                <Button 
                  onClick={handleAddSection}
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Abschnitt hinzufügen
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-4">
                  {content.sections.length === 0 ? (
                    <div className="text-center p-8 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Keine Abschnitte vorhanden. Fügen Sie einen neuen Abschnitt hinzu.
                      </p>
                    </div>
                  ) : (
                    content.sections.map((section) => (
                      <WebsiteSectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={handleUpdateSection}
                        onDelete={handleDeleteSection}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <WebsiteChangeHistoryPanel 
                history={changeHistory}
                isLoading={isLoadingHistory}
                onRestoreVersion={handleRestoreVersion}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Preview panel */}
        {showPreview && (
          <div className="w-1/2 border-l pl-4">
            <h3 className="text-lg font-medium mb-4">Vorschau</h3>
            <div className="border rounded-md overflow-hidden">
              <WebsitePreview content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
