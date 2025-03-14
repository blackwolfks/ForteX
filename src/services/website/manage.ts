
import { supabase, callRPC } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Website } from "@/types/website.types";

export const websiteManageService = {
  async getUserWebsites(): Promise<Website[]> {
    try {
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um Ihre Websites zu sehen");
        return [];
      }
      
      const { data, error } = await callRPC('get_user_websites', {});
      
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
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um Website-Details zu laden");
        return null;
      }
      
      const { data, error } = await callRPC('get_website_by_id', { website_id: id });
      
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
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um eine Website zu erstellen");
        return null;
      }
      
      const { data, error } = await callRPC('create_website', { 
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
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um die Website zu aktualisieren");
        return false;
      }
      
      const { error } = await callRPC('update_website', { 
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
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um den Website-Status zu ändern");
        return false;
      }
      
      const { error } = await callRPC('update_website_status', { 
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
      // Prüfen, ob der Benutzer angemeldet ist
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("User is not authenticated");
        toast.error("Bitte melden Sie sich an, um die Website zu löschen");
        return false;
      }
      
      const { error } = await callRPC('delete_website', { website_id: id });
      
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
