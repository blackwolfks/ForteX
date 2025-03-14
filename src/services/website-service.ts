
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Website = {
  id: string;
  name: string;
  url: string;
  template: string;
  shop_template: string;
  last_saved?: string;
  created_at?: string;
  user_id?: string;
};

export type WebsiteContent = {
  title: string;
  subtitle: string;
  description: string;
  header?: string;
  sections: WebsiteSection[];
};

export type WebsiteSection = {
  id: string;
  title: string;
  description: string;
};

export const websiteService = {
  /**
   * Fetches all websites for the current user
   */
  async getUserWebsites(): Promise<Website[]> {
    try {
      // We need to use a direct SQL query since the 'websites' table isn't in the TypeScript types yet
      const { data, error } = await supabase
        .rpc('get_user_websites');
      
      if (error) {
        console.error("Error fetching websites:", error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Failed to fetch websites:", error);
      toast.error("Fehler beim Laden der Websites");
      return [];
    }
  },

  /**
   * Fetches a single website by ID with its content
   */
  async getWebsiteById(id: string): Promise<{website: Website, content: WebsiteContent} | null> {
    try {
      // Get website data using RPC
      const { data: websiteData, error: websiteError } = await supabase
        .rpc('get_website_by_id', { website_id: id });
      
      if (websiteError) {
        console.error("Error fetching website:", websiteError);
        throw websiteError;
      }

      if (!websiteData || websiteData.length === 0) {
        throw new Error("Website not found");
      }

      // Get content data
      const { data: contentData, error: contentError } = await supabase
        .rpc('get_website_content', { website_id: id });
      
      if (contentError) {
        console.error("Error fetching website content:", contentError);
        throw contentError;
      }

      const defaultContent: WebsiteContent = {
        title: websiteData[0].name || "Neue Website",
        subtitle: "Subtitle",
        description: "Beschreibung",
        sections: []
      };
      
      return {
        website: websiteData[0] as Website,
        content: (contentData?.content as WebsiteContent) || defaultContent
      };
    } catch (error) {
      console.error("Failed to fetch website by ID:", error);
      toast.error("Fehler beim Laden der Website-Daten");
      return null;
    }
  },

  /**
   * Creates a new website
   */
  async createWebsite(websiteData: Omit<Website, 'id' | 'user_id' | 'created_at'>, content: WebsiteContent): Promise<string | null> {
    try {
      // Create website through RPC
      const { data: websiteId, error: websiteError } = await supabase
        .rpc('create_website', { 
          website_name: websiteData.name,
          website_url: websiteData.url,
          website_template: websiteData.template,
          website_shop_template: websiteData.shop_template
        });
      
      if (websiteError) {
        console.error("Error creating website:", websiteError);
        throw websiteError;
      }

      if (!websiteId) {
        throw new Error("Failed to create website, no ID returned");
      }

      // Create content
      const { error: contentError } = await supabase
        .rpc('save_website_content', {
          website_id: websiteId,
          content_data: content
        });
      
      if (contentError) {
        console.error("Error creating website content:", contentError);
        throw contentError;
      }
      
      return websiteId;
    } catch (error) {
      console.error("Failed to create website:", error);
      toast.error("Fehler beim Erstellen der Website");
      return null;
    }
  },

  /**
   * Updates an existing website
   */
  async updateWebsite(id: string, websiteData: Partial<Website>, content: WebsiteContent): Promise<boolean> {
    try {
      // Update website
      const { error: websiteError } = await supabase
        .rpc('update_website', {
          website_id: id,
          website_name: websiteData.name,
          website_url: websiteData.url,
          website_template: websiteData.template,
          website_shop_template: websiteData.shop_template
        });
      
      if (websiteError) {
        console.error("Error updating website:", websiteError);
        throw websiteError;
      }

      // Update content
      const { error: contentError } = await supabase
        .rpc('save_website_content', {
          website_id: id,
          content_data: content
        });
      
      if (contentError) {
        console.error("Error updating website content:", contentError);
        throw contentError;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to update website:", error);
      toast.error("Fehler beim Speichern der Website-Daten");
      return false;
    }
  },

  /**
   * Deletes a website
   */
  async deleteWebsite(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('delete_website', { website_id: id });
      
      if (error) {
        console.error("Error deleting website:", error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete website:", error);
      toast.error("Fehler beim Löschen der Website");
      return false;
    }
  }
};
