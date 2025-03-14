
import { useState, useEffect, useCallback } from 'react';
import { 
  websiteService, 
  WebsiteSection, 
  SectionType,
  Website,
  WebsiteContent
} from '@/services/website-service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export type EditorMode = 'edit' | 'preview' | 'mobile-preview';

export const useWebsiteBuilder = (websiteId?: string) => {
  const [website, setWebsite] = useState<Website | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const loadWebsite = useCallback(async () => {
    if (!websiteId) return;
    
    setLoading(true);
    try {
      const websiteData = await websiteService.getWebsiteById(websiteId);
      if (websiteData) {
        setWebsite(websiteData);
        
        const contentData = await websiteService.getWebsiteContent(websiteId);
        if (contentData && contentData.content.sections) {
          setSections(contentData.content.sections);
        } else {
          // Initialize with default sections based on template
          const defaultSections: WebsiteSection[] = [];
          if (websiteData.template === 'landing') {
            defaultSections.push({
              id: uuidv4(),
              type: 'hero',
              content: {
                title: 'Willkommen auf Ihrer Website',
                subtitle: 'Eine leistungsstarke Plattform für Ihre Online-Präsenz',
                buttonText: 'Mehr erfahren',
                buttonLink: '#',
                imageUrl: '/placeholder.svg'
              },
              order: 0
            });
          }
          setSections(defaultSections);
        }
      }
    } catch (error) {
      console.error('Error loading website:', error);
      toast.error('Fehler beim Laden der Website');
    } finally {
      setLoading(false);
    }
  }, [websiteId]);
  
  useEffect(() => {
    if (websiteId) {
      loadWebsite();
    }
  }, [websiteId, loadWebsite]);
  
  const saveContent = async () => {
    if (!websiteId || !website) return false;
    
    setSaving(true);
    try {
      const content = {
        sections,
        lastEdited: new Date().toISOString(),
      };
      
      const success = await websiteService.saveWebsiteContent(websiteId, content);
      if (success) {
        // Also save to change history
        await websiteService.addWebsiteChangeHistory(
          websiteId,
          content,
          ['sections']
        );
        toast.success('Änderungen gespeichert');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Fehler beim Speichern der Änderungen');
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  const addSection = (type: SectionType) => {
    const newSection: WebsiteSection = {
      id: uuidv4(),
      type,
      content: getDefaultContent(type),
      order: sections.length
    };
    
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };
  
  const updateSectionContent = (id: string, content: Record<string, any>) => {
    setSections(
      sections.map(section => 
        section.id === id 
          ? { ...section, content: { ...section.content, ...content } }
          : section
      )
    );
  };
  
  const reorderSections = (startIndex: number, endIndex: number) => {
    const result = Array.from(sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update order values
    const reordered = result.map((section, index) => ({
      ...section,
      order: index
    }));
    
    setSections(reordered);
  };
  
  const deleteSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
    setSelectedSectionId(null);
    toast.success('Abschnitt gelöscht');
  };
  
  const duplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find(section => section.id === id);
    if (sectionToDuplicate) {
      const newSection: WebsiteSection = {
        ...sectionToDuplicate,
        id: uuidv4(),
        order: sections.length
      };
      
      setSections([...sections, newSection]);
      setSelectedSectionId(newSection.id);
      toast.success('Abschnitt dupliziert');
    }
  };
  
  const publishWebsite = async () => {
    if (!websiteId || !website) return false;
    
    try {
      // First save content
      await saveContent();
      
      // Then update status
      const success = await websiteService.updateWebsiteStatus(websiteId, 'veröffentlicht');
      if (success) {
        setWebsite({
          ...website,
          status: 'veröffentlicht'
        });
        toast.success('Website veröffentlicht');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error publishing website:', error);
      toast.error('Fehler beim Veröffentlichen der Website');
      return false;
    }
  };
  
  return {
    website,
    sections,
    loading,
    saving,
    mode,
    selectedSectionId,
    isDragging,
    setMode,
    setSelectedSectionId,
    setIsDragging,
    loadWebsite,
    saveContent,
    addSection,
    updateSectionContent,
    reorderSections,
    deleteSection,
    duplicateSection,
    publishWebsite
  };
};

// Utility function to get default content for different section types
const getDefaultContent = (type: SectionType): Record<string, any> => {
  switch (type) {
    case 'hero':
      return {
        title: 'Überschrift',
        subtitle: 'Untertitel',
        buttonText: 'Klicken Sie hier',
        buttonLink: '#',
        imageUrl: '/placeholder.svg',
        alignment: 'center'
      };
    case 'text':
      return {
        title: 'Abschnittsüberschrift',
        content: 'Hier kommt Ihr Text. Klicken Sie zum Bearbeiten.',
        alignment: 'left'
      };
    case 'image':
      return {
        imageUrl: '/placeholder.svg',
        caption: 'Bildbeschreibung',
        altText: 'Beschreibender Text'
      };
    case 'gallery':
      return {
        images: [
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 1' },
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 2' },
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 3' }
        ],
        layout: 'grid'
      };
    case 'form':
      return {
        title: 'Kontaktformular',
        fields: [
          { id: uuidv4(), type: 'text', label: 'Name', required: true },
          { id: uuidv4(), type: 'email', label: 'E-Mail', required: true },
          { id: uuidv4(), type: 'textarea', label: 'Nachricht', required: true }
        ],
        buttonText: 'Absenden'
      };
    case 'product':
      return {
        products: [],
        layout: 'grid',
        showPrice: true,
        showDescription: true
      };
    case 'video':
      return {
        videoUrl: '',
        caption: 'Video-Titel',
        autoplay: false,
        controls: true
      };
    case 'testimonial':
      return {
        quotes: [
          { 
            id: uuidv4(), 
            text: 'Ein tolles Produkt!', 
            author: 'Max Mustermann',
            role: 'Kunde',
            avatarUrl: '/placeholder.svg'
          }
        ],
        layout: 'cards'
      };
    case 'cta':
      return {
        title: 'Handlungsaufforderung',
        subtitle: 'Hier können Sie beschreiben, warum der Benutzer handeln sollte.',
        buttonText: 'Jetzt starten',
        buttonLink: '#',
        bgColor: 'bg-primary'
      };
    case 'pricing':
      return {
        title: 'Preismodelle',
        plans: [
          {
            id: uuidv4(),
            name: 'Basic',
            price: '9,99 €',
            period: 'monatlich',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            buttonText: 'Auswählen',
            buttonLink: '#',
            highlighted: false
          },
          {
            id: uuidv4(),
            name: 'Premium',
            price: '19,99 €',
            period: 'monatlich',
            features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
            buttonText: 'Auswählen',
            buttonLink: '#',
            highlighted: true
          }
        ]
      };
    case 'team':
      return {
        title: 'Unser Team',
        members: [
          {
            id: uuidv4(),
            name: 'Max Mustermann',
            role: 'CEO',
            bio: 'Kurze Biografie',
            imageUrl: '/placeholder.svg',
            socialLinks: {
              twitter: '',
              linkedin: '',
              email: ''
            }
          },
          {
            id: uuidv4(),
            name: 'Erika Musterfrau',
            role: 'CTO',
            bio: 'Kurze Biografie',
            imageUrl: '/placeholder.svg',
            socialLinks: {
              twitter: '',
              linkedin: '',
              email: ''
            }
          }
        ],
        layout: 'grid'
      };
    case 'faq':
      return {
        title: 'Häufig gestellte Fragen',
        items: [
          {
            id: uuidv4(),
            question: 'Was ist Frage 1?',
            answer: 'Dies ist die Antwort auf Frage 1.'
          },
          {
            id: uuidv4(),
            question: 'Was ist Frage 2?',
            answer: 'Dies ist die Antwort auf Frage 2.'
          },
          {
            id: uuidv4(),
            question: 'Was ist Frage 3?',
            answer: 'Dies ist die Antwort auf Frage 3.'
          }
        ]
      };
    default:
      return {};
  }
};
