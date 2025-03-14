
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

// Template defintions
const TEMPLATES: Record<string, {
  sections: WebsiteSection[];
  header: {
    logoText: string;
    navigation: { label: string; link: string }[];
  };
  footer: {
    companyName: string;
    copyrightText: string;
    links: { label: string; link: string }[];
    socialMedia: { platform: string; link: string }[];
  };
}> = {
  'business-standard': {
    sections: [
      {
        id: crypto.randomUUID(),
        type: 'hero',
        title: 'Willkommen auf unserer Webseite',
        content: 'Wir bieten professionelle Dienstleistungen für Ihr Unternehmen.',
        imageUrl: '/placeholder.svg',
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        alignment: 'left' as 'left' | 'center' | 'right',
        buttonText: 'Mehr erfahren',
        buttonLink: '#services'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Über uns',
        content: 'Unser Unternehmen wurde gegründet, um erstklassige Dienstleistungen anzubieten. Wir haben uns auf die Bereitstellung hochwertiger Lösungen spezialisiert.',
        backgroundColor: '#ffffff',
        textColor: '#212529',
        alignment: 'center' as 'left' | 'center' | 'right'
      },
      {
        id: crypto.randomUUID(),
        type: 'image',
        title: 'Unser Team',
        content: 'Ein engagiertes Team von Experten steht Ihnen zur Verfügung.',
        imageUrl: '/placeholder.svg',
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        alignment: 'center' as 'left' | 'center' | 'right'
      }
    ],
    header: {
      logoText: 'Mein Unternehmen',
      navigation: [
        { label: 'Home', link: '/' },
        { label: 'Dienstleistungen', link: '/services' },
        { label: 'Über uns', link: '/about' },
        { label: 'Kontakt', link: '/contact' }
      ]
    },
    footer: {
      companyName: 'Mein Unternehmen GmbH',
      copyrightText: `© ${new Date().getFullYear()} Alle Rechte vorbehalten`,
      links: [
        { label: 'Impressum', link: '/impressum' },
        { label: 'Datenschutz', link: '/datenschutz' },
        { label: 'AGB', link: '/agb' }
      ],
      socialMedia: [
        { platform: 'Facebook', link: '#' },
        { platform: 'Twitter', link: '#' },
        { platform: 'LinkedIn', link: '#' }
      ]
    }
  },
  'shop-modern': {
    sections: [
      {
        id: crypto.randomUUID(),
        type: 'hero',
        title: 'Entdecken Sie unsere Produkte',
        content: 'Qualität und Stil zu einem fairen Preis.',
        imageUrl: '/placeholder.svg',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        alignment: 'center' as 'left' | 'center' | 'right',
        buttonText: 'Jetzt einkaufen',
        buttonLink: '#products'
      },
      {
        id: crypto.randomUUID(),
        type: 'products',
        title: 'Beliebte Produkte',
        content: 'Unsere meistverkauften Artikel.',
        productCategory: 'vehicles',
        columns: 3,
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        alignment: 'center' as 'left' | 'center' | 'right'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Warum bei uns einkaufen?',
        content: 'Wir bieten erstklassige Produkte, schnellen Versand und exzellenten Kundenservice.',
        backgroundColor: '#ffffff',
        textColor: '#212529',
        alignment: 'center' as 'left' | 'center' | 'right'
      }
    ],
    header: {
      logoText: 'Mein Shop',
      navigation: [
        { label: 'Home', link: '/' },
        { label: 'Produkte', link: '/products' },
        { label: 'Kategorien', link: '/categories' },
        { label: 'Warenkorb', link: '/cart' }
      ]
    },
    footer: {
      companyName: 'Mein Shop',
      copyrightText: `© ${new Date().getFullYear()} Alle Rechte vorbehalten`,
      links: [
        { label: 'Versand', link: '/shipping' },
        { label: 'Rückgabe', link: '/returns' },
        { label: 'FAQ', link: '/faq' }
      ],
      socialMedia: [
        { platform: 'Instagram', link: '#' },
        { platform: 'Facebook', link: '#' },
        { platform: 'Pinterest', link: '#' }
      ]
    }
  },
  'portfolio-creative': {
    sections: [
      {
        id: crypto.randomUUID(),
        type: 'hero',
        title: 'Kreative Lösungen für Ihr Unternehmen',
        content: 'Design, Entwicklung und Beratung aus einer Hand.',
        imageUrl: '/placeholder.svg',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        alignment: 'center' as 'left' | 'center' | 'right',
        buttonText: 'Meine Arbeiten',
        buttonLink: '#works'
      },
      {
        id: crypto.randomUUID(),
        type: 'image',
        title: 'Ausgewählte Projekte',
        content: 'Sehen Sie einige unserer besten Arbeiten.',
        imageUrl: '/placeholder.svg',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        alignment: 'center' as 'left' | 'center' | 'right'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Über mich',
        content: 'Ich bin ein Designer und Entwickler mit über 10 Jahren Erfahrung in der Branche.',
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        alignment: 'left' as 'left' | 'center' | 'right'
      }
    ],
    header: {
      logoText: 'Mein Portfolio',
      navigation: [
        { label: 'Home', link: '/' },
        { label: 'Projekte', link: '/projects' },
        { label: 'Über mich', link: '/about' },
        { label: 'Kontakt', link: '/contact' }
      ]
    },
    footer: {
      companyName: 'Max Mustermann',
      copyrightText: `© ${new Date().getFullYear()} Alle Rechte vorbehalten`,
      links: [
        { label: 'GitHub', link: '#' },
        { label: 'Dribbble', link: '#' },
        { label: 'Behance', link: '#' }
      ],
      socialMedia: [
        { platform: 'Instagram', link: '#' },
        { platform: 'LinkedIn', link: '#' },
        { platform: 'Twitter', link: '#' }
      ]
    }
  }
};

export function useWebsiteBuilder() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Websites laden
  const loadWebsites = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await websiteService.getUserWebsites();
      setWebsites(data);
    } catch (error) {
      console.error('Error loading websites:', error);
      setLoadError('Fehler beim Laden der Websites');
      toast.error('Fehler beim Laden der Websites');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Website auswählen und Inhalt laden
  const selectWebsite = useCallback(async (websiteId: string | null) => {
    // If websiteId is null, clear the selected website and content
    if (websiteId === null) {
      setSelectedWebsite(null);
      setWebsiteContent(null);
      setIsDirty(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    try {
      const website = await websiteService.getWebsiteById(websiteId);
      if (website) {
        setSelectedWebsite(website);
        
        const content = await websiteService.getWebsiteContent(websiteId);
        if (content) {
          setWebsiteContent(content);
        } else {
          // Wenn keine Inhalte gefunden wurden, setze Standardinhalte
          const defaultContent: WebsiteContentData = {
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
          };
          
          setWebsiteContent(defaultContent);
          
          // Optional: Speichere diese Standardinhalte auch direkt in der Datenbank
          await websiteService.saveWebsiteContent(websiteId, defaultContent);
          toast.info('Es wurden keine Inhalte gefunden. Es wurden Standardinhalte erstellt.');
        }
      } else {
        setLoadError('Website nicht gefunden');
        toast.error('Website konnte nicht geladen werden');
      }
    } catch (error) {
      console.error('Error selecting website:', error);
      setLoadError('Fehler beim Laden der Website');
      toast.error('Fehler beim Laden der Website');
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  }, []);
  
  // Template anwenden
  const applyTemplate = useCallback((templateId: string) => {
    if (!websiteContent) {
      // Wenn kein websiteContent existiert, erstelle einen mit dem Template
      if (selectedWebsite) {
        const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
        if (template) {
          const newContent: WebsiteContentData = {
            sections: [...template.sections],
            meta: {
              title: selectedWebsite.name,
              description: '',
              keywords: ''
            },
            layout: {
              header: template.header,
              footer: template.footer
            },
            productCategories: ['scripts', 'vehicles', 'maps', 'characters', 'other'],
          };
          
          setWebsiteContent(newContent);
          setIsDirty(true);
          
          // Speichere die Inhalte direkt
          if (selectedWebsite.id) {
            websiteService.saveWebsiteContent(selectedWebsite.id, newContent)
              .then(() => {
                toast.success('Template erfolgreich angewendet und gespeichert');
                setIsDirty(false);
              })
              .catch(() => {
                toast.error('Fehler beim Speichern des Templates');
              });
          }
        }
      }
      return;
    }
    
    if (!TEMPLATES[templateId as keyof typeof TEMPLATES]) return;
    
    const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
    
    setWebsiteContent({
      ...websiteContent,
      sections: [...template.sections],
      layout: {
        header: template.header,
        footer: template.footer
      }
    });
    
    setIsDirty(true);
    toast.success('Template erfolgreich angewendet');
  }, [websiteContent, selectedWebsite]);
  
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
        toast.success('Änderungen erfolgreich gespeichert');
      } else {
        toast.error('Fehler beim Speichern der Änderungen');
      }
      
      return success;
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Fehler beim Speichern der Änderungen');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedWebsite, websiteContent]);
  
  // Website veröffentlichen
  const publishWebsite = useCallback(async (websiteId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await websiteService.publishWebsite(websiteId);
      if (success && selectedWebsite && selectedWebsite.id === websiteId) {
        setSelectedWebsite({
          ...selectedWebsite,
          status: 'published'
        });
      }
      return success;
    } catch (error) {
      console.error('Error publishing website:', error);
      toast.error('Fehler beim Veröffentlichen der Website');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedWebsite]);
  
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
    loadError,
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
    saveContent,
    applyTemplate,
    publishWebsite
  };
}
