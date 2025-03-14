
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
          productCategories: ['scripts', 'vehicles', 'maps', 'characters', 'other']
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
  }
};
