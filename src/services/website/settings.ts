
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WebsiteBuilderSettings {
  id?: string;
  default_domain?: string;
  custom_domains?: any[];
  seo_settings?: Record<string, any>;
}

export const settingsService = {
  async getSettings(): Promise<WebsiteBuilderSettings | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_website_builder_settings');
      
      if (error) {
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error("Error fetching website builder settings:", error);
      return null;
    }
  },
  
  async saveSettings(settings: WebsiteBuilderSettings): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('save_website_builder_settings', {
          p_default_domain: settings.default_domain,
          p_custom_domains: settings.custom_domains ? JSON.stringify(settings.custom_domains) : null,
          p_seo_settings: settings.seo_settings ? JSON.stringify(settings.seo_settings) : null
        });
      
      if (error) {
        throw error;
      }
      
      toast.success("Einstellungen gespeichert");
      return true;
    } catch (error) {
      console.error("Error saving website builder settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
      return false;
    }
  }
};
