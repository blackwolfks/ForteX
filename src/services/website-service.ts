
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
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('last_saved', { ascending: false });
      
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
      // Get website data
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', id)
        .single();
      
      if (websiteError) {
        console.error("Error fetching website:", websiteError);
        throw websiteError;
      }

      // Get content data
      const { data: contentData, error: contentError } = await supabase
        .from('website_content')
        .select('content')
        .eq('website_id', id)
        .maybeSingle();
      
      if (contentError) {
        console.error("Error fetching website content:", contentError);
        throw contentError;
      }

      const defaultContent: WebsiteContent = {
        title: websiteData.name || "Neue Website",
        subtitle: "Subtitle",
        description: "Beschreibung",
        sections: []
      };
      
      return {
        website: websiteData as Website,
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
      // Create website
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .insert([websiteData])
        .select()
        .single();
      
      if (websiteError) {
        console.error("Error creating website:", websiteError);
        throw websiteError;
      }

      // Create content
      const { error: contentError } = await supabase
        .from('website_content')
        .insert([{
          website_id: website.id,
          content: content
        }]);
      
      if (contentError) {
        console.error("Error creating website content:", contentError);
        throw contentError;
      }
      
      return website.id;
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
        .from('websites')
        .update({
          ...websiteData,
          last_saved: new Date().toISOString()
        })
        .eq('id', id);
      
      if (websiteError) {
        console.error("Error updating website:", websiteError);
        throw websiteError;
      }

      // Check if content exists
      const { data: existingContent, error: checkError } = await supabase
        .from('website_content')
        .select('id')
        .eq('website_id', id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing content:", checkError);
        throw checkError;
      }

      let contentError;
      if (existingContent) {
        // Update content
        const { error } = await supabase
          .from('website_content')
          .update({ content })
          .eq('website_id', id);
        contentError = error;
      } else {
        // Insert content
        const { error } = await supabase
          .from('website_content')
          .insert([{
            website_id: id,
            content
          }]);
        contentError = error;
      }
      
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
        .from('websites')
        .delete()
        .eq('id', id);
      
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
