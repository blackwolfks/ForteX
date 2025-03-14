
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteContent, WebsiteChangeHistory } from "@/types/website.types";

export const contentService = {
  async getWebsiteContent(websiteId: string): Promise<WebsiteContent | null> {
    try {
      if (!websiteId) {
        console.error("Error fetching website content: websiteId is required");
        toast.error("Fehler beim Laden des Website-Inhalts");
        return null;
      }

      console.log("Fetching website content for:", websiteId);
      const { data, error } = await supabase.rpc('get_website_content', { website_id: websiteId });
      
      if (error) {
        console.error("Error from get_website_content RPC:", error);
        throw error;
      }
      
      if (!data?.[0]) {
        console.log("No content found for website:", websiteId);
        return null;
      }
      
      console.log("Website content loaded successfully");
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
      if (!websiteId) {
        console.error("Error saving website content: websiteId is required");
        toast.error("Fehler beim Speichern des Website-Inhalts");
        return false;
      }

      console.log("Saving website content:", websiteId, content);
      
      const { error } = await supabase.rpc('save_website_content', { 
        website_id: websiteId,
        content_data: content
      });
      
      if (error) {
        console.error("Error from save_website_content RPC:", error);
        throw error;
      }
      
      console.log("Website content saved successfully");
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
      if (!websiteId) {
        console.error("Error adding website change history: websiteId is required");
        toast.error("Fehler beim Speichern der Änderungshistorie");
        return null;
      }

      console.log("Adding website change history:", websiteId, contentSnapshot, changedFields);
      
      const { data, error } = await supabase.rpc('add_website_change_history', { 
        website_id: websiteId,
        content_snapshot: contentSnapshot,
        changed_fields: changedFields
      });
      
      if (error) {
        console.error("Error from add_website_change_history RPC:", error);
        throw error;
      }
      
      console.log("Website change history added successfully");
      return data || null;
    } catch (error) {
      console.error("Error adding website change history:", error);
      toast.error("Fehler beim Speichern der Änderungshistorie");
      return null;
    }
  },
  
  async getWebsiteChangeHistory(websiteId: string): Promise<WebsiteChangeHistory[]> {
    try {
      if (!websiteId) {
        console.error("Error fetching website change history: websiteId is required");
        toast.error("Fehler beim Laden der Änderungshistorie");
        return [];
      }

      console.log("Fetching website change history for:", websiteId);
      const { data, error } = await supabase.rpc('get_website_change_history', { website_id: websiteId });
      
      if (error) {
        console.error("Error from get_website_change_history RPC:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No change history found for website:", websiteId);
        return [];
      }
      
      console.log("Website change history loaded successfully");
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
