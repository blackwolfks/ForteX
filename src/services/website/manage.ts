
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Website } from "@/types/website.types";

export const websiteManageService = {
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
  }
};
