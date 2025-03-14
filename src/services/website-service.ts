
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Website = {
  id: string;
  name: string;
  url: string;
  template: string;
  shop_template: string;
  status: string;
  user_id: string;
  created_at: string;
  last_saved: string;
};

export type WebsiteContent = {
  id?: string;
  website_id: string;
  content: WebsiteContentData;
  created_at?: string;
  updated_at?: string;
};

export type WebsiteContentData = {
  sections: WebsiteSection[];
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  layout: {
    header: HeaderConfig;
    footer: FooterConfig;
  };
  productCategories: string[];
  mediaFiles?: MediaFile[];
  forms?: FormConfig[];
  styles?: WebsiteStyles;
};

export type WebsiteStyles = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCSS?: string;
};

export type MediaFile = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  uploadedAt: string;
};

export type FormConfig = {
  id: string;
  name: string;
  fields: FormField[];
  submitButtonText: string;
  successMessage: string;
  emailNotification?: string;
};

export type FormField = {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
};

export type HeaderConfig = {
  logoText: string;
  logoImage?: string;
  navigation: { label: string; link: string }[];
};

export type FooterConfig = {
  companyName: string;
  copyrightText: string;
  links: { label: string; link: string }[];
  socialMedia: { platform: string; link: string }[];
};

export type WebsiteSection = {
  id: string;
  type: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  productCategory?: string;
  buttonText?: string;
  buttonLink?: string;
  columns?: number;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  // New properties for advanced sections
  mediaGallery?: string[]; // Array of media URLs
  formId?: string; // Reference to a form configuration
  customHTML?: string; // For advanced users to add custom HTML
  animation?: 'fade' | 'slide' | 'zoom' | 'none';
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
};

export type CreateWebsiteInput = {
  name: string;
  url: string;
  template: string;
  shop_template: string;
  status?: string;
};

export const websiteService = {
  // Websites verwalten
  getUserWebsites: async (): Promise<Website[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_websites');
      
      if (error) {
        console.error('Error fetching websites:', error);
        toast.error('Fehler beim Laden der Websites');
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserWebsites:', error);
      toast.error('Fehler beim Laden der Websites');
      return [];
    }
  },
  
  getWebsiteById: async (websiteId: string): Promise<Website | null> => {
    try {
      const { data, error } = await supabase.rpc('get_website_by_id', {
        website_id: websiteId
      });
      
      if (error) {
        console.error('Error fetching website:', error);
        toast.error('Fehler beim Laden der Website');
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getWebsiteById:', error);
      toast.error('Fehler beim Laden der Website');
      return null;
    }
  },
  
  createWebsite: async (input: CreateWebsiteInput): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('create_website', {
        website_name: input.name,
        website_url: input.url,
        website_template: input.template,
        website_shop_template: input.shop_template,
        website_status: input.status || 'entwurf'
      });
      
      if (error) {
        console.error('Error creating website:', error);
        toast.error('Fehler beim Erstellen der Website');
        return null;
      }
      
      // Nach der Erstellung eine Standard-Inhaltsstruktur hinzufügen
      if (data) {
        const defaultContent: WebsiteContentData = {
          sections: [
            {
              id: crypto.randomUUID(),
              type: 'hero',
              title: 'Willkommen auf meiner Website',
              content: 'Das ist der Startbereich meiner neuen Website.',
              imageUrl: '/placeholder.svg',
              buttonText: 'Mehr erfahren',
              buttonLink: '#',
              backgroundColor: '#ffffff',
              textColor: '#000000',
              alignment: 'center'
            }
          ],
          meta: {
            title: input.name,
            description: 'Eine neue Website erstellt mit dem Website Builder',
            keywords: 'website, shop, produkte'
          },
          layout: {
            header: {
              logoText: input.name,
              navigation: [
                { label: 'Home', link: '/' },
                { label: 'Produkte', link: '/produkte' },
                { label: 'Über uns', link: '/about' },
                { label: 'Kontakt', link: '/kontakt' }
              ]
            },
            footer: {
              companyName: input.name,
              copyrightText: `© ${new Date().getFullYear()} ${input.name}. Alle Rechte vorbehalten.`,
              links: [
                { label: 'Impressum', link: '/impressum' },
                { label: 'Datenschutz', link: '/datenschutz' },
                { label: 'AGB', link: '/agb' }
              ],
              socialMedia: [
                { platform: 'Facebook', link: '#' },
                { platform: 'Instagram', link: '#' },
                { platform: 'Twitter', link: '#' }
              ]
            }
          },
          productCategories: ['scripts', 'vehicles', 'maps', 'characters', 'other'],
          mediaFiles: [],
          forms: [
            {
              id: crypto.randomUUID(),
              name: 'Kontaktformular',
              fields: [
                {
                  id: crypto.randomUUID(),
                  type: 'text',
                  label: 'Name',
                  placeholder: 'Ihr Name',
                  required: true
                },
                {
                  id: crypto.randomUUID(),
                  type: 'email',
                  label: 'E-Mail',
                  placeholder: 'Ihre E-Mail Adresse',
                  required: true
                },
                {
                  id: crypto.randomUUID(),
                  type: 'textarea',
                  label: 'Nachricht',
                  placeholder: 'Ihre Nachricht an uns',
                  required: true
                }
              ],
              submitButtonText: 'Absenden',
              successMessage: 'Vielen Dank für Ihre Nachricht. Wir werden uns in Kürze bei Ihnen melden.'
            }
          ],
          styles: {
            primaryColor: '#3498db',
            secondaryColor: '#2ecc71',
            fontFamily: 'Arial, sans-serif'
          }
        };
        
        await websiteService.saveWebsiteContent(data, defaultContent);
        toast.success('Website erfolgreich erstellt');
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error in createWebsite:', error);
      toast.error('Fehler beim Erstellen der Website');
      return null;
    }
  },
  
  updateWebsite: async (websiteId: string, input: Partial<CreateWebsiteInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_website', {
        website_id: websiteId,
        website_name: input.name,
        website_url: input.url,
        website_template: input.template,
        website_shop_template: input.shop_template,
        website_status: input.status
      });
      
      if (error) {
        console.error('Error updating website:', error);
        toast.error('Fehler beim Aktualisieren der Website');
        return false;
      }
      
      toast.success('Website erfolgreich aktualisiert');
      return true;
    } catch (error) {
      console.error('Error in updateWebsite:', error);
      toast.error('Fehler beim Aktualisieren der Website');
      return false;
    }
  },
  
  deleteWebsite: async (websiteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('delete_website', {
        website_id: websiteId
      });
      
      if (error) {
        console.error('Error deleting website:', error);
        toast.error('Fehler beim Löschen der Website');
        return false;
      }
      
      toast.success('Website erfolgreich gelöscht');
      return true;
    } catch (error) {
      console.error('Error in deleteWebsite:', error);
      toast.error('Fehler beim Löschen der Website');
      return false;
    }
  },
  
  updateWebsiteStatus: async (websiteId: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_website_status', {
        website_id: websiteId,
        website_status: status
      });
      
      if (error) {
        console.error('Error updating website status:', error);
        toast.error('Fehler beim Aktualisieren des Website-Status');
        return false;
      }
      
      toast.success('Website-Status erfolgreich aktualisiert');
      return true;
    } catch (error) {
      console.error('Error in updateWebsiteStatus:', error);
      toast.error('Fehler beim Aktualisieren des Website-Status');
      return false;
    }
  },
  
  // Website-Inhalte verwalten
  getWebsiteContent: async (websiteId: string): Promise<WebsiteContentData | null> => {
    try {
      const { data, error } = await supabase.rpc('get_website_content', {
        website_id: websiteId
      });
      
      if (error) {
        console.error('Error fetching website content:', error);
        toast.error('Fehler beim Laden der Website-Inhalte');
        return null;
      }
      
      if (data && data.length > 0) {
        return data[0].content as WebsiteContentData;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getWebsiteContent:', error);
      toast.error('Fehler beim Laden der Website-Inhalte');
      return null;
    }
  },
  
  saveWebsiteContent: async (websiteId: string, content: WebsiteContentData): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('save_website_content', {
        website_id: websiteId,
        content_data: content
      });
      
      if (error) {
        console.error('Error saving website content:', error);
        toast.error('Fehler beim Speichern der Website-Inhalte');
        return false;
      }
      
      toast.success('Website-Inhalte erfolgreich gespeichert');
      return true;
    } catch (error) {
      console.error('Error in saveWebsiteContent:', error);
      toast.error('Fehler beim Speichern der Website-Inhalte');
      return false;
    }
  },
  
  // Website-Änderungsverlauf 
  addWebsiteChangeHistory: async (
    websiteId: string, 
    contentSnapshot: WebsiteContentData, 
    changedFields: string[]
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('add_website_change_history', {
        website_id: websiteId,
        content_snapshot: contentSnapshot,
        changed_fields: changedFields
      });
      
      if (error) {
        console.error('Error adding website change history:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in addWebsiteChangeHistory:', error);
      return null;
    }
  },
  
  getWebsiteChangeHistory: async (websiteId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase.rpc('get_website_change_history', {
        website_id: websiteId
      });
      
      if (error) {
        console.error('Error fetching website change history:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getWebsiteChangeHistory:', error);
      return [];
    }
  },
  
  // Neue Methoden für erweiterte Funktionen
  uploadMedia: async (websiteId: string, file: File): Promise<MediaFile | null> => {
    try {
      // Hier würde normalerweise der Upload zur Supabase Storage erfolgen
      // Für dieses Beispiel simulieren wir den Upload
      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file), // In production this would be the Supabase storage URL
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      // Update website content to include this media file
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content) {
        const mediaFiles = content.mediaFiles || [];
        mediaFiles.push(mediaFile);
        content.mediaFiles = mediaFiles;
        await websiteService.saveWebsiteContent(websiteId, content);
      }
      
      return mediaFile;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Fehler beim Hochladen der Mediendatei');
      return null;
    }
  },
  
  deleteMedia: async (websiteId: string, mediaId: string): Promise<boolean> => {
    try {
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content && content.mediaFiles) {
        content.mediaFiles = content.mediaFiles.filter(media => media.id !== mediaId);
        await websiteService.saveWebsiteContent(websiteId, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Fehler beim Löschen der Mediendatei');
      return false;
    }
  },
  
  updateWebsiteStyles: async (websiteId: string, styles: WebsiteStyles): Promise<boolean> => {
    try {
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content) {
        content.styles = styles;
        await websiteService.saveWebsiteContent(websiteId, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating website styles:', error);
      toast.error('Fehler beim Aktualisieren der Website-Stile');
      return false;
    }
  },
  
  addForm: async (websiteId: string, form: FormConfig): Promise<string | null> => {
    try {
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content) {
        const forms = content.forms || [];
        const newForm = {
          ...form,
          id: crypto.randomUUID()
        };
        forms.push(newForm);
        content.forms = forms;
        await websiteService.saveWebsiteContent(websiteId, content);
        return newForm.id;
      }
      return null;
    } catch (error) {
      console.error('Error adding form:', error);
      toast.error('Fehler beim Hinzufügen des Formulars');
      return null;
    }
  },
  
  updateForm: async (websiteId: string, form: FormConfig): Promise<boolean> => {
    try {
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content && content.forms) {
        content.forms = content.forms.map(f => f.id === form.id ? form : f);
        await websiteService.saveWebsiteContent(websiteId, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Fehler beim Aktualisieren des Formulars');
      return false;
    }
  },
  
  deleteForm: async (websiteId: string, formId: string): Promise<boolean> => {
    try {
      const content = await websiteService.getWebsiteContent(websiteId);
      if (content && content.forms) {
        content.forms = content.forms.filter(form => form.id !== formId);
        await websiteService.saveWebsiteContent(websiteId, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Fehler beim Löschen des Formulars');
      return false;
    }
  },
  
  publishWebsite: async (websiteId: string): Promise<boolean> => {
    try {
      // Here would be the logic to publish the website to a hosting server
      // For now, we'll just update the status to 'published'
      return await websiteService.updateWebsiteStatus(websiteId, 'published');
    } catch (error) {
      console.error('Error publishing website:', error);
      toast.error('Fehler beim Veröffentlichen der Website');
      return false;
    }
  },
  
  generateWebsitePreviewUrl: (websiteId: string): string => {
    // This would normally generate a URL for the published website preview
    return `/website-preview/${websiteId}`;
  }
};
