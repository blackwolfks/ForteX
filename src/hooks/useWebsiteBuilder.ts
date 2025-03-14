
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { websiteService, Website, WebsiteChangeHistory } from "@/services/website-service";

export function useWebsiteBuilder() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [showNewWebsiteDialog, setShowNewWebsiteDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<number | null>(null);
  const [changeHistory, setChangeHistory] = useState<WebsiteChangeHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Bitte melden Sie sich an, um diese Funktion zu nutzen");
        navigate("/sign-in");
      }
    };

    checkAuth();
  }, [navigate]);

  // Load websites
  const loadWebsites = async () => {
    setIsLoading(true);
    try {
      const websiteList = await websiteService.getUserWebsites();
      console.log("Loaded websites:", websiteList);
      setWebsites(websiteList);
      setLastChangeTimestamp(Date.now());
    } catch (error) {
      console.error("Error loading websites:", error);
      toast.error("Fehler beim Laden der Websites");
    } finally {
      setIsLoading(false);
    }
  };

  // Load change history for a specific website
  const loadChangeHistory = async (websiteId: string) => {
    if (!websiteId) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await websiteService.getWebsiteChangeHistory(websiteId);
      console.log("Loaded change history:", history);
      setChangeHistory(history);
    } catch (error) {
      console.error("Error loading change history:", error);
      toast.error("Fehler beim Laden der Änderungshistorie");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  // Load change history when selected website changes
  useEffect(() => {
    if (selectedWebsite) {
      loadChangeHistory(selectedWebsite);
    } else {
      setChangeHistory([]);
    }
  }, [selectedWebsite]);

  const handleCreateWebsite = async (name: string, template: string) => {
    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen für die Website ein");
      return;
    }

    setIsCreating(true);
    try {
      console.log("Creating website:", name, template);
      
      // Create initial content based on template
      const initialContent = {
        title: name,
        subtitle: template === "E-Commerce" ? "Entdecken Sie unsere Produkte" : "Meine Arbeiten",
        description: template === "E-Commerce" 
          ? "Hier finden Sie die besten Produkte zu günstigen Preisen."
          : "Hier finden Sie eine Auswahl meiner besten Arbeiten und Projekte.",
        sections: []
      };

      // Create website in database
      const websiteId = await websiteService.createWebsite(
        {
          name: name,
          url: name.toLowerCase().replace(/\s+/g, '-') + ".example.com",
          template: template,
          shop_template: "default"
        },
        initialContent
      );

      if (websiteId) {
        toast.success("Website wurde erstellt");
        setShowNewWebsiteDialog(false);
        
        // Immediately load websites after creation
        await loadWebsites();
        setSelectedWebsite(websiteId);
      } else {
        toast.error("Fehler beim Erstellen der Website");
      }
    } catch (error) {
      console.error("Error creating website:", error);
      toast.error("Fehler beim Erstellen der Website");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    try {
      const success = await websiteService.deleteWebsite(id);
      if (success) {
        toast.success("Website wurde gelöscht");
        await loadWebsites();
        if (selectedWebsite === id) {
          setSelectedWebsite(null);
        }
      } else {
        toast.error("Fehler beim Löschen der Website");
      }
    } catch (error) {
      console.error("Error deleting website:", error);
      toast.error("Fehler beim Löschen der Website");
    }
  };

  const handlePublishWebsite = async (id: string, shouldPublish: boolean) => {
    try {
      const success = await websiteService.publishWebsite(id, shouldPublish);
      if (success) {
        const action = shouldPublish ? "veröffentlicht" : "zurückgezogen";
        toast.success(`Website wurde ${action}`);
        await loadWebsites();
        
        // Refresh change history
        if (selectedWebsite === id) {
          await loadChangeHistory(id);
        }
        
        return true;
      } else {
        const action = shouldPublish ? "Veröffentlichen" : "Zurückziehen";
        toast.error(`Fehler beim ${action} der Website`);
        return false;
      }
    } catch (error) {
      console.error("Error publishing website:", error);
      return false;
    }
  };

  return {
    websites,
    isLoading,
    selectedWebsite,
    setSelectedWebsite,
    showNewWebsiteDialog,
    setShowNewWebsiteDialog,
    isCreating,
    handleCreateWebsite,
    handleDeleteWebsite,
    handlePublishWebsite,
    loadWebsites,
    lastChangeTimestamp,
    changeHistory,
    isLoadingHistory,
    loadChangeHistory
  };
}
