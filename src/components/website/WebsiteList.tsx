
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteService } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function WebsiteList() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const data = await websiteService.getUserWebsites();
        setWebsites(data || []);
      } catch (error) {
        console.error('Error fetching websites:', error);
        toast.error('Fehler beim Laden der Websites');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWebsites();
  }, []);
  
  const handleEdit = (websiteId: string) => {
    navigate(`/dashboard/website-editor/${websiteId}`);
  };
  
  const handleDelete = async (websiteId: string) => {
    try {
      await websiteService.deleteWebsite(websiteId);
      setWebsites(websites.filter(website => website.id !== websiteId));
      toast.success('Website erfolgreich gelöscht');
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error('Fehler beim Löschen der Website');
    }
  };
  
  const handleCreateWebsite = () => {
    navigate('/dashboard/create-website');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meine Websites</h2>
        <Button onClick={handleCreateWebsite} className="bg-turquoise-500 hover:bg-turquoise-600">
          <Plus className="mr-2 h-4 w-4" />
          Website erstellen
        </Button>
      </div>
      
      {websites.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Globe className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Keine Websites gefunden</h3>
                <p className="text-muted-foreground">Du hast noch keine Websites erstellt.</p>
              </div>
              <Button onClick={handleCreateWebsite} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Website erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <Card key={website.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {website.thumbnail ? (
                  <img 
                    src={website.thumbnail} 
                    alt={website.name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Globe className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{website.name}</CardTitle>
                <CardDescription>
                  {new URL(window.location.origin).hostname}/{website.url}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Zuletzt bearbeitet: {new Date(website.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="outline" size="sm" onClick={() => handleEdit(website.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(website.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
