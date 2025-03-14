
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
      
      // Fix the type conversion issue: ensure custom_domains is properly parsed as an array
      if (data?.[0]) {
        return {
          id: data[0].id,
          default_domain: data[0].default_domain || '',
          // Parse JSON if it's a string, or use the value directly if it's already an array
          custom_domains: typeof data[0].custom_domains === 'string' 
            ? JSON.parse(data[0].custom_domains) 
            : (data[0].custom_domains || []),
          // Same for seo_settings, ensure it's an object
          seo_settings: typeof data[0].seo_settings === 'string'
            ? JSON.parse(data[0].seo_settings)
            : (data[0].seo_settings || {})
        };
      }
      
      return null;
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
