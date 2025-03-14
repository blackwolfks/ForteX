
import { useState, useEffect, useCallback } from 'react';
import { 
  websiteService, 
  Website, 
  WebsiteContentData, 
  WebsiteSection,
  CreateWebsiteInput
} from '@/services/website-service';
import { toast } from 'sonner';
import { Product } from '@/lib/supabase';

export function useWebsiteBuilder() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Websites laden
  const loadWebsites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await websiteService.getUserWebsites();
      setWebsites(data);
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Website auswählen und Inhalt laden
  const selectWebsite = useCallback(async (websiteId: string) => {
    setIsLoading(true);
    try {
      const website = await websiteService.getWebsiteById(websiteId);
      if (website) {
        setSelectedWebsite(website);
        
        const content = await websiteService.getWebsiteContent(websiteId);
        if (content) {
          setWebsiteContent(content);
        } else {
          // Wenn keine Inhalte gefunden wurden, setze Standardinhalte
          setWebsiteContent({
            sections: [],
            meta: {
              title: website.name,
              description: '',
              keywords: ''
            },
            layout: {
              header: {
                logoText: website.name,
                navigation: []
              },
              footer: {
                companyName: website.name,
                copyrightText: `© ${new Date().getFullYear()}`,
                links: [],
                socialMedia: []
              }
            },
            productCategories: []
          });
        }
      }
    } catch (error) {
      console.error('Error selecting website:', error);
      toast.error('Fehler beim Laden der Website');
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  }, []);
  
  // Neue Website erstellen
  const createNewWebsite = useCallback(async (data: CreateWebsiteInput) => {
    setIsLoading(true);
    try {
      const websiteId = await websiteService.createWebsite(data);
      if (websiteId) {
        await loadWebsites();
        return websiteId;
      }
      return null;
    } catch (error) {
      console.error('Error creating website:', error);
      toast.error('Fehler beim Erstellen der Website');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadWebsites]);
  
  // Website löschen
  const deleteWebsite = useCallback(async (websiteId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Website löschen möchten?')) {
      setIsLoading(true);
      try {
        const success = await websiteService.deleteWebsite(websiteId);
        if (success) {
          if (selectedWebsite?.id === websiteId) {
            setSelectedWebsite(null);
            setWebsiteContent(null);
          }
          await loadWebsites();
        }
      } catch (error) {
        console.error('Error deleting website:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [loadWebsites, selectedWebsite]);
  
  // Website-Status aktualisieren
  const updateWebsiteStatus = useCallback(async (websiteId: string, status: string) => {
    setIsLoading(true);
    try {
      const success = await websiteService.updateWebsiteStatus(websiteId, status);
      if (success && selectedWebsite && selectedWebsite.id === websiteId) {
        setSelectedWebsite({
          ...selectedWebsite,
          status: status
        });
      }
      await loadWebsites();
      return success;
    } catch (error) {
      console.error('Error updating website status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadWebsites, selectedWebsite]);
  
  // Website-Details aktualisieren
  const updateWebsiteDetails = useCallback(async (websiteId: string, data: Partial<CreateWebsiteInput>) => {
    setIsLoading(true);
    try {
      const success = await websiteService.updateWebsite(websiteId, data);
      if (success) {
        await loadWebsites();
        
        if (selectedWebsite && selectedWebsite.id === websiteId) {
          const updatedWebsite = await websiteService.getWebsiteById(websiteId);
          if (updatedWebsite) {
            setSelectedWebsite(updatedWebsite);
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Error updating website details:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadWebsites, selectedWebsite]);
  
  // Abschnitt zur Website hinzufügen
  const addSection = useCallback((sectionType: string, productCategory?: string) => {
    if (!websiteContent) return;
    
    const newSection: WebsiteSection = {
      id: crypto.randomUUID(),
      type: sectionType,
      title: 'Neuer Abschnitt',
      content: 'Inhalt hier eingeben...',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      alignment: 'left'
    };
    
    if (sectionType === 'products' && productCategory) {
      newSection.productCategory = productCategory;
    }
    
    setWebsiteContent({
      ...websiteContent,
      sections: [...websiteContent.sections, newSection]
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Abschnitt aktualisieren
  const updateSection = useCallback((sectionId: string, updates: Partial<WebsiteSection>) => {
    if (!websiteContent) return;
    
    const updatedSections = websiteContent.sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    );
    
    setWebsiteContent({
      ...websiteContent,
      sections: updatedSections
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Abschnitt löschen
  const removeSection = useCallback((sectionId: string) => {
    if (!websiteContent) return;
    
    const updatedSections = websiteContent.sections.filter(section => section.id !== sectionId);
    
    setWebsiteContent({
      ...websiteContent,
      sections: updatedSections
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Reihenfolge der Abschnitte ändern
  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    if (!websiteContent) return;
    
    const updatedSections = [...websiteContent.sections];
    const [movedSection] = updatedSections.splice(fromIndex, 1);
    updatedSections.splice(toIndex, 0, movedSection);
    
    setWebsiteContent({
      ...websiteContent,
      sections: updatedSections
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Meta-Informationen aktualisieren
  const updateMeta = useCallback((meta: typeof websiteContent.meta) => {
    if (!websiteContent) return;
    
    setWebsiteContent({
      ...websiteContent,
      meta
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Layout-Konfiguration aktualisieren
  const updateLayout = useCallback((layout: typeof websiteContent.layout) => {
    if (!websiteContent) return;
    
    setWebsiteContent({
      ...websiteContent,
      layout
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Produktkategorien aktualisieren
  const updateProductCategories = useCallback((categories: string[]) => {
    if (!websiteContent) return;
    
    setWebsiteContent({
      ...websiteContent,
      productCategories: categories
    });
    
    setIsDirty(true);
  }, [websiteContent]);
  
  // Inhalte speichern
  const saveContent = useCallback(async () => {
    if (!selectedWebsite || !websiteContent) return false;
    
    setIsLoading(true);
    try {
      const changedFields = ['content'];
      await websiteService.addWebsiteChangeHistory(
        selectedWebsite.id,
        websiteContent,
        changedFields
      );
      
      const success = await websiteService.saveWebsiteContent(
        selectedWebsite.id,
        websiteContent
      );
      
      if (success) {
        setIsDirty(false);
      }
      
      return success;
    } catch (error) {
      console.error('Error saving content:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedWebsite, websiteContent]);
  
  // Initialisierung beim ersten Laden
  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);
  
  return {
    websites,
    selectedWebsite,
    websiteContent,
    isLoading,
    isDirty,
    loadWebsites,
    selectWebsite,
    createNewWebsite,
    deleteWebsite,
    updateWebsiteStatus,
    updateWebsiteDetails,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    updateMeta,
    updateLayout,
    updateProductCategories,
    saveContent
  };
}
