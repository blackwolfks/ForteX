
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
  id: string;
  website_id: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type SectionType = 
  | "hero" 
  | "text" 
  | "image" 
  | "gallery" 
  | "form" 
  | "product" 
  | "video" 
  | "testimonial" 
  | "cta" 
  | "pricing" 
  | "team" 
  | "faq";

export type WebsiteSection = {
  id: string;
  type: SectionType;
  content: Record<string, any>;
  order: number;
};

export type WebsiteTemplate = {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  category: string;
  sections?: WebsiteSection[];
};

export type WebsiteChangeHistory = {
  id: string;
  website_id: string;
  content_snapshot: Record<string, any>;
  changed_fields: string[];
  changed_at: string;
  changed_by: string;
};

const DEFAULT_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "business",
    name: "Business",
    thumbnail: "/placeholder.svg",
    description: "Professionelle Website für Unternehmen",
    category: "business",
  },
  {
    id: "shop",
    name: "Online Shop",
    thumbnail: "/placeholder.svg",
    description: "E-Commerce-Plattform für Produkte",
    category: "shop",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    thumbnail: "/placeholder.svg",
    description: "Präsentieren Sie Ihre Arbeit und Projekte",
    category: "portfolio",
  },
  {
    id: "blog",
    name: "Blog",
    thumbnail: "/placeholder.svg",
    description: "Teilen Sie Ihre Gedanken und Inhalte",
    category: "blog",
  },
  {
    id: "landing",
    name: "Landing Page",
    thumbnail: "/placeholder.svg",
    description: "Einzelne Seite für Marketingkampagnen",
    category: "landing",
  },
];

const DEFAULT_SHOP_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "basic-shop",
    name: "Basic Shop",
    thumbnail: "/placeholder.svg",
    description: "Einfacher Online-Shop",
    category: "shop",
  },
  {
    id: "advanced-shop",
    name: "Advanced Shop",
    thumbnail: "/placeholder.svg",
    description: "Erweiterter Online-Shop mit Funktionen",
    category: "shop",
  },
];

export const websiteService = {
  async getUserWebsites(): Promise<Website[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_websites');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching websites:", error);
      toast.error("Fehler beim Laden der Websites");
      return [];
    }
  },
  
  async getWebsiteById(id: string): Promise<Website | null> {
    try {
      const { data, error } = await supabase.rpc('get_website_by_id', { website_id: id });
      
      if (error) {
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error("Error fetching website:", error);
      toast.error("Fehler beim Laden der Website");
      return null;
    }
  },
  
  async createWebsite(
    name: string, 
    url: string, 
    template: string,
    shop_template: string = "",
    status: string = "entwurf"
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_website', { 
        website_name: name,
        website_url: url,
        website_template: template,
        website_shop_template: shop_template,
        website_status: status
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Website erfolgreich erstellt");
      return data || null;
    } catch (error) {
      console.error("Error creating website:", error);
      toast.error("Fehler beim Erstellen der Website");
      return null;
    }
  },
  
  async updateWebsite(
    id: string,
    name: string, 
    url: string, 
    template: string,
    shop_template: string = "",
    status?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_website', { 
        website_id: id,
        website_name: name,
        website_url: url,
        website_template: template,
        website_shop_template: shop_template,
        website_status: status
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Website erfolgreich aktualisiert");
      return true;
    } catch (error) {
      console.error("Error updating website:", error);
      toast.error("Fehler beim Aktualisieren der Website");
      return false;
    }
  },
  
  async updateWebsiteStatus(id: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_website_status', { 
        website_id: id,
        website_status: status
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Website-Status aktualisiert");
      return true;
    } catch (error) {
      console.error("Error updating website status:", error);
      toast.error("Fehler beim Aktualisieren des Website-Status");
      return false;
    }
  },
  
  async deleteWebsite(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('delete_website', { website_id: id });
      
      if (error) {
        throw error;
      }
      
      toast.success("Website erfolgreich gelöscht");
      return true;
    } catch (error) {
      console.error("Error deleting website:", error);
      toast.error("Fehler beim Löschen der Website");
      return false;
    }
  },
  
  async getWebsiteContent(websiteId: string): Promise<WebsiteContent | null> {
    try {
      const { data, error } = await supabase.rpc('get_website_content', { website_id: websiteId });
      
      if (error) {
        throw error;
      }
      
      if (!data?.[0]) {
        return null;
      }
      
      // Convert Json to Record<string, any>
      return {
        ...data[0],
        content: data[0].content as Record<string, any>
      };
    } catch (error) {
      console.error("Error fetching website content:", error);
      toast.error("Fehler beim Laden des Website-Inhalts");
      return null;
    }
  },
  
  async saveWebsiteContent(websiteId: string, content: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('save_website_content', { 
        website_id: websiteId,
        content_data: content
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Website-Inhalt gespeichert");
      return true;
    } catch (error) {
      console.error("Error saving website content:", error);
      toast.error("Fehler beim Speichern des Website-Inhalts");
      return false;
    }
  },
  
  async addWebsiteChangeHistory(
    websiteId: string, 
    contentSnapshot: Record<string, any>,
    changedFields: string[]
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('add_website_change_history', { 
        website_id: websiteId,
        content_snapshot: contentSnapshot,
        changed_fields: changedFields
      });
      
      if (error) {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error("Error adding website change history:", error);
      toast.error("Fehler beim Speichern der Änderungshistorie");
      return null;
    }
  },
  
  async getWebsiteChangeHistory(websiteId: string): Promise<WebsiteChangeHistory[]> {
    try {
      const { data, error } = await supabase.rpc('get_website_change_history', { website_id: websiteId });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return [];
      }
      
      // Convert Json to Record<string, any>
      return data.map(item => ({
        ...item,
        content_snapshot: item.content_snapshot as Record<string, any>
      }));
    } catch (error) {
      console.error("Error fetching website change history:", error);
      toast.error("Fehler beim Laden der Änderungshistorie");
      return [];
    }
  },
  
  async uploadMedia(file: File, path?: string): Promise<string | null> {
    try {
      const filePath = path 
        ? `${path}/${file.name}` 
        : `${Date.now()}_${file.name}`;
        
      const { data, error } = await supabase
        .storage
        .from('websites')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('websites')
        .getPublicUrl(data.path);
      
      return publicUrl || null;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Fehler beim Hochladen der Datei");
      return null;
    }
  },
  
  getTemplates(): WebsiteTemplate[] {
    return DEFAULT_TEMPLATES;
  },
  
  getShopTemplates(): WebsiteTemplate[] {
    return DEFAULT_SHOP_TEMPLATES;
  },
  
  getTemplate(id: string): WebsiteTemplate | null {
    return DEFAULT_TEMPLATES.find(t => t.id === id) || null;
  }
};
