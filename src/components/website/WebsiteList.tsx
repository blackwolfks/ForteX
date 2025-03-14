
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteService, Website } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit3, Trash2, Globe, EyeOff } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WebsiteList() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchWebsites = async () => {
      setLoading(true);
      const data = await websiteService.getUserWebsites();
      setWebsites(data);
      setLoading(false);
    };
    
    fetchWebsites();
  }, []);
  
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const success = await websiteService.deleteWebsite(id);
      if (success) {
        setWebsites(websites.filter(website => website.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meine Websites</h2>
        <Button onClick={() => navigate('/dashboard/create-website')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Neue Website erstellen
        </Button>
      </div>
      
      {websites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Du hast noch keine Websites erstellt</p>
            <Button onClick={() => navigate('/dashboard/create-website')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Erste Website erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <Card key={website.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/placeholder.svg"
                    alt={website.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  {website.status === 'veröffentlicht' ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      Live
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Entwurf
                    </span>
                  )}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{website.name}</CardTitle>
                <CardDescription className="truncate">{website.url}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Letzte Bearbeitung: {new Date(website.last_saved).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate(`/dashboard/website-editor/${website.id}`)}
                >
                  <Edit3 className="h-4 w-4 mr-1" /> Bearbeiten
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bist du sicher, dass du die Website "{website.name}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(website.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {deletingId === website.id ? 'Löschen...' : 'Löschen'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
