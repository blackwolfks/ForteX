
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Website = {
  id: string;
  name: string;
  url: string;
  template: string;
  shop_template: string;
  status?: "entwurf" | "veröffentlicht";
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

export type WebsiteChanges = {
  websiteChanged: boolean;
  contentChanged: boolean;
  changedFields: string[];
};

export const websiteService = {
  /**
   * Compares a website with its original state to identify changes
   */
  compareWebsiteChanges(
    originalWebsite: Website | null, 
    updatedWebsite: Partial<Website>,
    originalContent: WebsiteContent | null,
    updatedContent: WebsiteContent | null
  ): WebsiteChanges {
    const changes: WebsiteChanges = {
      websiteChanged: false,
      contentChanged: false,
      changedFields: []
    };

    // Check website properties
    if (originalWebsite && updatedWebsite) {
      if (originalWebsite.name !== updatedWebsite.name) {
        changes.websiteChanged = true;
        changes.changedFields.push('name');
      }
      if (originalWebsite.url !== updatedWebsite.url) {
        changes.websiteChanged = true;
        changes.changedFields.push('url');
      }
      if (originalWebsite.template !== updatedWebsite.template) {
        changes.websiteChanged = true;
        changes.changedFields.push('template');
      }
      if (originalWebsite.shop_template !== updatedWebsite.shop_template) {
        changes.websiteChanged = true;
        changes.changedFields.push('shop_template');
      }
      if (originalWebsite.status !== updatedWebsite.status) {
        changes.websiteChanged = true;
        changes.changedFields.push('status');
      }
    }

    // Check content changes
    if (originalContent && updatedContent) {
      if (originalContent.title !== updatedContent.title) {
        changes.contentChanged = true;
        changes.changedFields.push('content.title');
      }
      if (originalContent.subtitle !== updatedContent.subtitle) {
        changes.contentChanged = true;
        changes.changedFields.push('content.subtitle');
      }
      if (originalContent.description !== updatedContent.description) {
        changes.contentChanged = true;
        changes.changedFields.push('content.description');
      }
      if (originalContent.header !== updatedContent.header) {
        changes.contentChanged = true;
        changes.changedFields.push('content.header');
      }
      
      // Check sections
      if (originalContent.sections.length !== updatedContent.sections.length) {
        changes.contentChanged = true;
        changes.changedFields.push('content.sections');
      } else {
        // Compare each section
        for (let i = 0; i < originalContent.sections.length; i++) {
          const originalSection = originalContent.sections[i];
          const updatedSection = updatedContent.sections[i];
          
          if (
            originalSection.title !== updatedSection.title ||
            originalSection.description !== updatedSection.description
          ) {
            changes.contentChanged = true;
            changes.changedFields.push(`content.sections[${i}]`);
          }
        }
      }
    }

    return changes;
  },

  /**
   * Fetches all websites for the current user
   */
  async getUserWebsites(): Promise<Website[]> {
    try {
      console.log("Fetching user websites");
      const { data, error } = await supabase
        .rpc('get_user_websites');
      
      if (error) {
        console.error("Error fetching websites:", error);
        throw error;
      }
      
      console.log("Received websites data:", data);
      return data as Website[] || [];
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
      console.log("Fetching website by ID:", id);
      
      // Get website data using RPC
      const { data: websiteData, error: websiteError } = await supabase
        .rpc('get_website_by_id', { website_id: id });
      
      if (websiteError) {
        console.error("Error fetching website:", websiteError);
        throw websiteError;
      }

      if (!websiteData || websiteData.length === 0) {
        console.error("Website not found");
        toast.error("Website nicht gefunden");
        return null;
      }

      console.log("Received website data:", websiteData[0]);

      // Get content data
      const { data: contentData, error: contentError } = await supabase
        .rpc('get_website_content', { website_id: id });
      
      if (contentError) {
        console.error("Error fetching website content:", contentError);
        throw contentError;
      }

      console.log("Received content data:", contentData);

      const defaultContent: WebsiteContent = {
        title: websiteData[0].name || "Neue Website",
        subtitle: "Subtitle",
        description: "Beschreibung",
        sections: []
      };
      
      // Check if content exists, use default content if not
      const finalContent = 
        (contentData && contentData.length > 0 && contentData[0]?.content) 
          ? contentData[0].content as WebsiteContent 
          : defaultContent;
      
      return {
        website: websiteData[0] as Website,
        content: finalContent
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
      console.log("Creating website with data:", websiteData);
      
      // Create website through RPC
      const { data: websiteId, error: websiteError } = await supabase
        .rpc('create_website', { 
          website_name: websiteData.name,
          website_url: websiteData.url,
          website_template: websiteData.template,
          website_shop_template: websiteData.shop_template,
          website_status: websiteData.status || "entwurf"
        });
      
      if (websiteError) {
        console.error("Error creating website:", websiteError);
        throw websiteError;
      }

      if (!websiteId) {
        console.error("Failed to create website, no ID returned");
        throw new Error("Failed to create website, no ID returned");
      }

      console.log("Website created with ID:", websiteId);
      
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
      
      return websiteId as string;
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
      console.log("Updating website:", id, websiteData);
      
      // Fetch current website data to check for changes
      const currentData = await this.getWebsiteById(id);
      if (!currentData) {
        throw new Error("Website nicht gefunden");
      }
      
      // Compare changes
      const changes = this.compareWebsiteChanges(
        currentData.website,
        websiteData,
        currentData.content,
        content
      );
      
      console.log("Detected changes:", changes);
      
      // Only update if there are changes to avoid unnecessary operations
      if (!changes.websiteChanged && !changes.contentChanged) {
        console.log("No changes detected, skipping update");
        return true;
      }
      
      // Update website if needed
      if (changes.websiteChanged) {
        const { error: websiteError } = await supabase
          .rpc('update_website', {
            website_id: id,
            website_name: websiteData.name,
            website_url: websiteData.url,
            website_template: websiteData.template,
            website_shop_template: websiteData.shop_template,
            website_status: websiteData.status
          });
        
        if (websiteError) {
          console.error("Error updating website:", websiteError);
          throw websiteError;
        }
      }

      // Update content if needed
      if (changes.contentChanged) {
        console.log("Updating website content:", content);
        
        const { error: contentError } = await supabase
          .rpc('save_website_content', {
            website_id: id,
            content_data: content
          });
        
        if (contentError) {
          console.error("Error updating website content:", contentError);
          throw contentError;
        }
      }
      
      console.log("Website and content updated successfully");
      console.log("Changed fields:", changes.changedFields);
      return true;
    } catch (error) {
      console.error("Failed to update website:", error);
      toast.error("Fehler beim Speichern der Website-Daten");
      return false;
    }
  },

  /**
   * Publish or unpublish a website
   */
  async publishWebsite(id: string, shouldPublish: boolean): Promise<boolean> {
    try {
      const status = shouldPublish ? "veröffentlicht" : "entwurf";
      
      const { error } = await supabase
        .rpc('update_website_status', { 
          website_id: id,
          website_status: status
        });
      
      if (error) {
        console.error("Error publishing website:", error);
        throw error;
      }
      
      // Hier würde in einem realen System ein Webhook oder eine andere Funktion 
      // ausgelöst werden, die die Webseite tatsächlich veröffentlicht
      console.log(`Website mit ID ${id} wurde ${shouldPublish ? 'veröffentlicht' : 'zurückgezogen'}`);
      
      return true;
    } catch (error) {
      console.error("Failed to publish website:", error);
      toast.error(`Fehler beim ${shouldPublish ? 'Veröffentlichen' : 'Zurückziehen'} der Website`);
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
