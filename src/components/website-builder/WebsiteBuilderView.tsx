
import { useEffect, useState } from "react";
import { WebsiteCard } from "./WebsiteCard";
import { WebsiteEditor } from "./WebsiteEditor";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { websiteService, Website } from "@/services/website-service";
import { supabase } from "@/integrations/supabase/client";

export function WebsiteBuilderView() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [showNewWebsiteDialog, setShowNewWebsiteDialog] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [newWebsiteTemplate, setNewWebsiteTemplate] = useState("E-Commerce");
  const [isCreating, setIsCreating] = useState(false);

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
      setWebsites(websiteList);
    } catch (error) {
      console.error("Error loading websites:", error);
      toast.error("Fehler beim Laden der Websites");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const handleCreateWebsite = async () => {
    if (!newWebsiteName.trim()) {
      toast.error("Bitte geben Sie einen Namen für die Website ein");
      return;
    }

    setIsCreating(true);
    try {
      // Create initial content based on template
      const initialContent = {
        title: newWebsiteName,
        subtitle: newWebsiteTemplate === "E-Commerce" ? "Entdecken Sie unsere Produkte" : "Meine Arbeiten",
        description: newWebsiteTemplate === "E-Commerce" 
          ? "Hier finden Sie die besten Produkte zu günstigen Preisen."
          : "Hier finden Sie eine Auswahl meiner besten Arbeiten und Projekte.",
        sections: []
      };

      // Create website in database
      const websiteId = await websiteService.createWebsite(
        {
          name: newWebsiteName,
          url: newWebsiteName.toLowerCase().replace(/\s+/g, '-') + ".example.com",
          template: newWebsiteTemplate,
          shop_template: "default"
        },
        initialContent
      );

      if (websiteId) {
        toast.success("Website wurde erstellt");
        setShowNewWebsiteDialog(false);
        setNewWebsiteName("");
        setNewWebsiteTemplate("E-Commerce");
        loadWebsites();
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
        loadWebsites();
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
      return await websiteService.publishWebsite(id, shouldPublish);
    } catch (error) {
      console.error("Error publishing website:", error);
      return false;
    }
  };

  // Show website editor when a website is selected
  if (selectedWebsite) {
    return (
      <WebsiteEditor
        websiteId={selectedWebsite}
        onBack={() => {
          setSelectedWebsite(null);
          loadWebsites(); // Reload websites to get updated data
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website-Builder</h2>
        <Dialog open={showNewWebsiteDialog} onOpenChange={setShowNewWebsiteDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Neue Website
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Website erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie die Grundinformationen für Ihre neue Website ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name der Website</Label>
                <Input 
                  id="name" 
                  placeholder="Meine neue Website" 
                  value={newWebsiteName}
                  onChange={(e) => setNewWebsiteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={newWebsiteTemplate} onValueChange={setNewWebsiteTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-Commerce">Online-Shop</SelectItem>
                    <SelectItem value="Portfolio">Portfolio</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewWebsiteDialog(false)}>Abbrechen</Button>
              <Button onClick={handleCreateWebsite} disabled={isCreating}>
                {isCreating ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Websites werden geladen...</p>
        </div>
      ) : websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <WebsiteCard
              key={website.id}
              id={website.id}
              name={website.name}
              url={website.url || ""}
              template={website.template}
              lastUpdated={website.last_saved || website.created_at || ""}
              status={website.status as "entwurf" | "veröffentlicht"}
              onEdit={() => setSelectedWebsite(website.id)}
              onDelete={() => handleDeleteWebsite(website.id)}
              onPublish={handlePublishWebsite}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keine Websites gefunden</CardTitle>
            <CardDescription>
              Sie haben noch keine Websites erstellt. Klicken Sie auf "Neue Website", um zu beginnen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowNewWebsiteDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Neue Website erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
