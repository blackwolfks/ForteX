
import { useState, useEffect } from 'react';
import { websiteService, Website } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Globe, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function WebsiteList() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWebsiteOpen, setNewWebsiteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);
  const [newWebsite, setNewWebsite] = useState({
    name: '',
    url: '',
    template: 'business'
  });
  
  const navigate = useNavigate();
  
  const loadWebsites = async () => {
    setLoading(true);
    try {
      const data = await websiteService.getUserWebsites();
      setWebsites(data);
    } catch (error) {
      console.error('Error loading websites:', error);
      toast.error('Fehler beim Laden der Websites');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadWebsites();
  }, []);
  
  const handleCreateWebsite = async () => {
    if (!newWebsite.name || !newWebsite.url || !newWebsite.template) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }
    
    try {
      const websiteId = await websiteService.createWebsite(
        newWebsite.name,
        newWebsite.url,
        newWebsite.template
      );
      
      if (websiteId) {
        setNewWebsiteOpen(false);
        setNewWebsite({
          name: '',
          url: '',
          template: 'business'
        });
        await loadWebsites();
        navigate(`/dashboard/website-editor/${websiteId}`);
      }
    } catch (error) {
      console.error('Error creating website:', error);
      toast.error('Fehler beim Erstellen der Website');
    }
  };
  
  const confirmDelete = async () => {
    if (!websiteToDelete) return;
    
    try {
      const success = await websiteService.deleteWebsite(websiteToDelete.id);
      if (success) {
        setDeleteDialogOpen(false);
        setWebsiteToDelete(null);
        loadWebsites();
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error('Fehler beim Löschen der Website');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'veröffentlicht':
        return 'bg-green-500';
      case 'entwurf':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meine Websites</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Websites</p>
        </div>
        <Dialog open={newWebsiteOpen} onOpenChange={setNewWebsiteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Website
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Website erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie die Details für Ihre neue Website ein.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Website-Name</Label>
                <Input 
                  id="name" 
                  placeholder="Meine Website" 
                  value={newWebsite.name}
                  onChange={(e) => setNewWebsite({...newWebsite, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input 
                  id="url" 
                  placeholder="meine-website" 
                  value={newWebsite.url}
                  onChange={(e) => setNewWebsite({...newWebsite, url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template">Vorlage</Label>
                <select 
                  id="template"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newWebsite.template}
                  onChange={(e) => setNewWebsite({...newWebsite, template: e.target.value})}
                >
                  {websiteService.getTemplates().map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewWebsiteOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreateWebsite}>Erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="w-full h-40" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="justify-between p-6 pt-0">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-9" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map(website => (
            <Card key={website.id} className="overflow-hidden">
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{website.name}</CardTitle>
                    <CardDescription>{website.url}</CardDescription>
                  </div>
                  <Badge 
                    className={`${getStatusColor(website.status)} text-white`}
                  >
                    {website.status === 'veröffentlicht' ? 'Live' : 'Entwurf'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-3 pb-3">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Zuletzt bearbeitet: {formatDate(website.last_saved)}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-3 flex justify-between">
                <Button
                  variant="default"
                  onClick={() => navigate(`/dashboard/website-editor/${website.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
                <div className="flex gap-2">
                  {website.status === 'veröffentlicht' && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/${website.url}`, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setWebsiteToDelete(website);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            Sie haben noch keine Websites erstellt. Klicken Sie auf "Neue Website", um zu beginnen.
          </AlertDescription>
        </Alert>
      )}
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Website löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie "{websiteToDelete?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={confirmDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
