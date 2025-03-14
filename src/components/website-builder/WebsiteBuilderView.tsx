
import { useState, useEffect } from 'react';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebsiteList } from './WebsiteList';
import { WebsiteEditor } from './WebsiteEditor';
import { WebsiteSettings } from './WebsiteSettings';
import { WebsitePreview } from './WebsitePreview';
import { CreateWebsiteInput } from '@/services/website-service';
import { Plus, Save, Eye, Settings, List } from 'lucide-react';

export function WebsiteBuilderView() {
  const {
    websites,
    selectedWebsite,
    websiteContent,
    isLoading,
    isDirty,
    selectWebsite,
    createNewWebsite,
    saveContent
  } = useWebsiteBuilder();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebsiteData, setNewWebsiteData] = useState<CreateWebsiteInput>({
    name: '',
    url: '',
    template: 'standard',
    shop_template: 'standard'
  });
  const [activeTab, setActiveTab] = useState('editor');
  
  const handleCreateWebsite = async () => {
    const websiteId = await createNewWebsite(newWebsiteData);
    if (websiteId) {
      setIsCreateDialogOpen(false);
      await selectWebsite(websiteId);
      setActiveTab('editor');
      setNewWebsiteData({
        name: '',
        url: '',
        template: 'standard',
        shop_template: 'standard'
      });
    }
  };
  
  const handleSave = async () => {
    if (isDirty) {
      await saveContent();
    }
  };
  
  const handleBackToList = () => {
    // Instead of passing an empty string, we'll set selectedWebsite to null
    // in the useWebsiteBuilder hook by passing null
    selectWebsite(null);
    setActiveTab('editor');
  };
  
  const showWebsiteEditor = selectedWebsite && websiteContent;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website Builder</h2>
        <div className="flex gap-2">
          {showWebsiteEditor && (
            <>
              <Button 
                variant="outline" 
                onClick={handleSave} 
                disabled={!isDirty || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Website erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Website erstellen</DialogTitle>
                <DialogDescription>
                  Geben Sie die grundlegenden Informationen für Ihre neue Website ein.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Website Name</Label>
                  <Input
                    id="name"
                    value={newWebsiteData.name}
                    onChange={(e) => setNewWebsiteData({ ...newWebsiteData, name: e.target.value })}
                    placeholder="Meine Website"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">URL / Subdomain</Label>
                  <Input
                    id="url"
                    value={newWebsiteData.url}
                    onChange={(e) => setNewWebsiteData({ ...newWebsiteData, url: e.target.value })}
                    placeholder="meine-website"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateWebsite} disabled={!newWebsiteData.name || !newWebsiteData.url}>
                  Website erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!showWebsiteEditor ? (
        <WebsiteList websites={websites} onSelect={selectWebsite} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedWebsite.name}</CardTitle>
                <CardDescription>
                  {selectedWebsite.status === 'published' ? 'Veröffentlicht' : 'Entwurf'} 
                  • Zuletzt bearbeitet: {new Date(selectedWebsite.last_saved).toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleBackToList}>
                <List className="h-4 w-4 mr-2" />
                Zurück zur Liste
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="editor" className="flex gap-2 items-center">
                  <Save className="h-4 w-4" />
                  <span>Editor</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex gap-2 items-center">
                  <Eye className="h-4 w-4" />
                  <span>Vorschau</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex gap-2 items-center">
                  <Settings className="h-4 w-4" />
                  <span>Einstellungen</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor">
                <WebsiteEditor />
              </TabsContent>
              
              <TabsContent value="preview">
                <WebsitePreview />
              </TabsContent>
              
              <TabsContent value="settings">
                <WebsiteSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={handleBackToList}>
                Zurück zur Liste
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Änderungen speichern
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
