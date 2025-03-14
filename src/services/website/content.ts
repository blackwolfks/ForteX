
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteContent, WebsiteChangeHistory } from "@/types/website.types";

export const contentService = {
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
      console.log("Saving website content:", websiteId, content);
      
      const { error } = await supabase.rpc('save_website_content', { 
        website_id: websiteId,
        content_data: content
      });
      
      if (error) {
        console.error("Error from RPC:", error);
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
      console.log("Adding website change history:", websiteId, contentSnapshot, changedFields);
      
      const { data, error } = await supabase.rpc('add_website_change_history', { 
        website_id: websiteId,
        content_snapshot: contentSnapshot,
        changed_fields: changedFields
      });
      
      if (error) {
        console.error("Error from RPC:", error);
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
  }
};
