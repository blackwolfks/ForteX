
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Website } from '@/services/website-service';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Eye, Pencil, Trash, Globe, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface WebsiteListProps {
  websites: Website[];
  onSelect: (id: string) => void;
}

export function WebsiteList({ websites, onSelect }: WebsiteListProps) {
  const { deleteWebsite, updateWebsiteStatus } = useWebsiteBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredWebsites = websites.filter(website => 
    website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.url.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handlePublish = async (websiteId: string) => {
    await updateWebsiteStatus(websiteId, 'published');
  };
  
  const handleUnpublish = async (websiteId: string) => {
    await updateWebsiteStatus(websiteId, 'entwurf');
  };
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(`https://${url}`);
    toast.success('URL wurde in die Zwischenablage kopiert');
  };
  
  const handleEditWebsite = (websiteId: string) => {
    console.log('Selecting website with ID:', websiteId);
    onSelect(websiteId);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Website suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {filteredWebsites.length === 0 ? (
        <div className="text-center p-12 border rounded-md bg-muted/20">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Keine Websites gefunden</h3>
          <p className="text-muted-foreground mb-4">
            {websites.length === 0 
              ? 'Sie haben noch keine Websites erstellt.' 
              : 'Keine Ergebnisse für diese Suche gefunden.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWebsites.map((website) => (
            <Card key={website.id} className="overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center border-b relative">
                <Globe className="h-16 w-16 text-muted-foreground/50" />
                <div className="absolute top-2 right-2">
                  <span className={`
                    text-xs px-2 py-1 rounded-full 
                    ${website.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'}
                  `}>
                    {website.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle>{website.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <span className="truncate">{website.url}</span>
                  <button 
                    onClick={() => handleCopyUrl(website.url)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Zuletzt bearbeitet: {new Date(website.last_saved).toLocaleDateString()}
                </p>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => window.open(`https://${website.url}`, '_blank')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ansehen
                </Button>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditWebsite(website.id)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Website löschen</DialogTitle>
                        <DialogDescription>
                          Sind Sie sicher, dass Sie die Website "{website.name}" löschen möchten?
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Abbrechen</Button>
                        <Button 
                          variant="destructive"
                          onClick={() => deleteWebsite(website.id)}
                        >
                          Website löschen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {website.status === 'published' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUnpublish(website.id)}
                    >
                      Zurück zu Entwurf
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePublish(website.id)}
                    >
                      Veröffentlichen
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
