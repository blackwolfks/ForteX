import { WebsiteTemplate, WebsiteSection, SectionType } from "@/types/website.types";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { Json } from '@/integrations/supabase/types';

// Get template default content function - remains as a utility function
export const getTemplateDefaultContent = (templateId: string) => {
  // This function will be called after we get template data from the database
  // It processes the template content from the database to return correctly typed sections
  return async () => {
    try {
      const { data, error } = await supabase.rpc('get_template_by_id', { template_id: templateId });
      
      if (error) {
        console.error('Error fetching template content:', error);
        return getFallbackContent();
      }
      
      if (data && data.length > 0 && data[0].content) {
        // Check if content has sections property and it's an object
        const contentObj = data[0].content;
        
        // Make sure we have a valid content object
        if (typeof contentObj === 'object' && contentObj !== null && 'sections' in contentObj) {
          const sectionsData = contentObj.sections;
          
          if (Array.isArray(sectionsData)) {
            // Make sure we process the sections to have the correct SectionType
            const typedSections = sectionsData.map(section => {
              // Check if the section is an object with the expected properties
              if (typeof section === 'object' && section !== null && 
                  'type' in section && typeof section.type === 'string') {
                return {
                  ...section,
                  type: section.type as SectionType,
                  id: section.id ? String(section.id) : uuidv4()
                } as WebsiteSection;
              }
              return null;
            }).filter((section): section is WebsiteSection => section !== null);
            
            return {
              sections: typedSections,
              lastEdited: new Date().toISOString()
            };
          }
        }
      }
      
      return getFallbackContent();
    } catch (error) {
      console.error('Failed to fetch template content:', error);
      return getFallbackContent();
    }
  };
};

// Fallback content if database fetch fails
const getFallbackContent = () => {
  const defaultSections: WebsiteSection[] = [
    {
      id: uuidv4(),
      type: 'hero' as SectionType,
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
  
  return {
    sections: defaultSections,
    lastEdited: new Date().toISOString()
  };
};

// Function to ensure thumbnail URLs are absolute
const ensureAbsoluteUrl = (url: string | null | undefined): string => {
  if (!url) return '/placeholder.svg';
  
  // Check if the URL is already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Check if it's a local path in the public folder
  if (url.startsWith('/')) {
    return url;
  }
  
  // Check if it's a path in the lovable-uploads folder
  if (url.includes('lovable-uploads')) {
    return `/public/${url}`;
  }
  
  // Otherwise, assume it's a relative path in the storage bucket
  const { data } = supabase.storage.from('websites').getPublicUrl(url);
  return data.publicUrl || '/placeholder.svg';
};

// Template service with database fetching methods
export const templateService = {
  // Get all templates from database
  async getTemplates(): Promise<WebsiteTemplate[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_templates');
      
      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
      
      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        thumbnail: ensureAbsoluteUrl(template.thumbnail),
        category: template.category,
        proOnly: template.pro_only || false
      })) as WebsiteTemplate[];
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }
  },
  
  // Get all shop templates from database
  async getShopTemplates(): Promise<WebsiteTemplate[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_templates');
      
      if (error) {
        console.error('Error fetching shop templates:', error);
        return [];
      }
      
      return data
        .filter(template => template.category === 'shop')
        .map(template => ({
          id: template.id,
          name: template.name,
          description: template.description || '',
          thumbnail: ensureAbsoluteUrl(template.thumbnail),
          category: template.category,
          proOnly: template.pro_only || false
        })) as WebsiteTemplate[];
    } catch (error) {
      console.error('Failed to fetch shop templates:', error);
      return [];
    }
  },
  
  // Get single template by ID from database
  async getTemplate(id: string): Promise<WebsiteTemplate | null> {
    try {
      const { data, error } = await supabase.rpc('get_template_by_id', { template_id: id });
      
      if (error || !data || data.length === 0) {
        console.error('Error fetching template by ID:', error || 'No template found');
        return null;
      }
      
      const template = data[0];
      return {
        id: template.id,
        name: template.name,
        description: template.description || '',
        thumbnail: ensureAbsoluteUrl(template.thumbnail),
        category: template.category,
        proOnly: template.pro_only || false
      };
    } catch (error) {
      console.error('Failed to fetch template by ID:', error);
      return null;
    }
  },
  
  getTemplateDefaultContent
};
