import { useState, useEffect, useCallback } from 'react';
import { 
  websiteService, 
  WebsiteSection, 
  SectionType,
  Website
} from '@/services/website-service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultContent } from '@/utils/sectionDefaults';
import { useUndoRedo } from './useUndoRedo';
import { templateService } from '@/services/website/templates';
import { mediaService } from '@/services/website/media';

export type EditorMode = 'edit' | 'preview' | 'mobile-preview';

export const useWebsiteBuilder = (websiteId?: string) => {
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { 
    state: sections, 
    update: setSections, 
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo<WebsiteSection[]>([]);
  
  const loadWebsite = useCallback(async () => {
    if (!websiteId) return;
    
    setLoading(true);
    try {
      const websiteData = await websiteService.getWebsiteById(websiteId);
      if (websiteData) {
        setWebsite(websiteData);
        
        const contentData = await websiteService.getWebsiteContent(websiteId);
        if (contentData && contentData.content.sections && contentData.content.sections.length > 0) {
          const typedSections = contentData.content.sections.map(section => ({
            ...section,
            type: section.type as SectionType
          })) as WebsiteSection[];
          
          setSections(typedSections);
        } else {
          try {
            const getContentFn = templateService.getTemplateDefaultContent(websiteData.template);
            const templateContent = await getContentFn();
            
            if (templateContent && templateContent.sections && templateContent.sections.length > 0) {
              const templateSections = templateContent.sections.map(section => ({
                ...section,
                type: section.type as SectionType
              })) as WebsiteSection[];
              
              setSections(templateSections);
              await websiteService.saveWebsiteContent(websiteId, {
                sections: templateSections,
                lastEdited: new Date().toISOString()
              });
            } else {
              const defaultSections: WebsiteSection[] = [
                {
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
                }
              ];
              setSections(defaultSections);
            }
          } catch (error) {
            console.error('Error loading template content:', error);
            const fallbackSections: WebsiteSection[] = [
              {
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
              }
            ];
            setSections(fallbackSections);
          }
        }
      }
    } catch (error) {
      console.error('Error loading website:', error);
      toast.error('Fehler beim Laden der Website');
    } finally {
      setLoading(false);
    }
  }, [websiteId, setSections]);
  
  useEffect(() => {
    if (websiteId) {
      loadWebsite();
    }
  }, [websiteId, loadWebsite]);
  
  const saveContent = async () => {
    if (!websiteId || !website) {
      console.error('Cannot save: websiteId or website is missing', { websiteId, website });
      return false;
    }
    
    setSaving(true);
    try {
      console.log('Saving sections:', sections);
      
      const content = {
        sections,
        lastEdited: new Date().toISOString(),
      };
      
      const success = await websiteService.saveWebsiteContent(websiteId, content);
      if (success) {
        await websiteService.addWebsiteChangeHistory(
          websiteId,
          content,
          ['sections']
        );
        toast.success('Änderungen gespeichert');
        return true;
      }
      
      console.error('Save was not successful');
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
  
  const updateSectionSettings = (id: string, settings: Record<string, any>) => {
    setSections(
      sections.map(section => 
        section.id === id 
          ? { 
              ...section, 
              settings: { 
                ...(section.settings || {}), 
                ...settings 
              } 
            }
          : section
      )
    );
  };
  
  const reorderSections = (startIndex: number, endIndex: number) => {
    const result = Array.from(sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
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
      await saveContent();
      
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
  
  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!websiteId) {
      toast.error("Fehler: Keine Website-ID gefunden");
      return null;
    }
    
    try {
      return await mediaService.uploadMedia(file, `website-${websiteId}`);
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
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
    canUndo,
    canRedo,
    setMode,
    setSelectedSectionId,
    setIsDragging,
    loadWebsite,
    saveContent,
    addSection,
    updateSectionContent,
    updateSectionSettings,
    reorderSections,
    deleteSection,
    duplicateSection,
    publishWebsite,
    uploadMedia,
    undo,
    redo
  };
};
