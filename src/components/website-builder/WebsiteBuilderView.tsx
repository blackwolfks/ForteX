
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
import { 
  Plus, 
  Save, 
  Eye, 
  Settings, 
  List,
  Globe,
  FileCheck,
  LayoutDashboard,
  ArrowRight,
  Check
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function WebsiteBuilderView() {
  const {
    websites,
    selectedWebsite,
    websiteContent,
    isLoading,
    isDirty,
    selectWebsite,
    createNewWebsite,
    saveContent,
    publishWebsite
  } = useWebsiteBuilder();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebsiteData, setNewWebsiteData] = useState<CreateWebsiteInput>({
    name: '',
    url: '',
    template: 'standard',
    shop_template: 'standard'
  });
  const [activeTab, setActiveTab] = useState('editor');
  const [isSaveConfirmationVisible, setSaveConfirmationVisible] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [urlFormatError, setUrlFormatError] = useState('');
  
  const handleCreateWebsite = async () => {
    // Validate URL format - lowercase, no spaces, no special characters except hyphens
    const urlRegex = /^[a-z0-9-]+$/;
    if (!urlRegex.test(newWebsiteData.url)) {
      setUrlFormatError('URL darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
      return;
    }
    
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
      setSaveConfirmationVisible(true);
      setTimeout(() => setSaveConfirmationVisible(false), 3000);
    }
  };
  
  const handlePublish = async () => {
    if (selectedWebsite) {
      setIsPublishing(true);
      const success = await publishWebsite(selectedWebsite.id);
      setIsPublishing(false);
      
      if (success) {
        toast.success('Website erfolgreich veröffentlicht!', {
          description: 'Ihre Website ist jetzt online verfügbar.',
          action: {
            label: 'Ansehen',
            onClick: () => window.open(`https://${selectedWebsite.url}`, '_blank')
          }
        });
      }
    }
  };
  
  const handleBackToList = () => {
    selectWebsite(null);
    setActiveTab('editor');
  };
  
  const showWebsiteEditor = selectedWebsite && websiteContent;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-turquoise-500" />
          <h2 className="text-2xl font-bold">Website Builder</h2>
        </div>
        <div className="flex gap-2">
          {showWebsiteEditor && (
            <>
              {selectedWebsite.status === 'published' ? (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`https://${selectedWebsite.url}`, '_blank')}
                  className="border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Live ansehen
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handlePublish}
                  disabled={isPublishing || isLoading}
                  className="border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {isPublishing ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleSave} 
                disabled={!isDirty || isLoading}
                className="border-turquoise-500 text-turquoise-500 hover:bg-turquoise-500/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-turquoise-500 hover:bg-turquoise-600">
                <Plus className="h-4 w-4 mr-2" />
                Neue Website erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="dark-card">
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
                    className="bg-darkgray-700 border-darkgray-500 focus:border-turquoise-500 focus:ring-turquoise-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">URL / Subdomain</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="url"
                      value={newWebsiteData.url}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setNewWebsiteData({ ...newWebsiteData, url: value });
                        setUrlFormatError('');
                      }}
                      placeholder="meine-website"
                      className="bg-darkgray-700 border-darkgray-500 focus:border-turquoise-500 focus:ring-turquoise-500/20"
                    />
                    <span className="text-muted-foreground whitespace-nowrap">.domain.de</span>
                  </div>
                  {urlFormatError && (
                    <p className="text-red-500 text-sm mt-1">{urlFormatError}</p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-darkgray-400 hover:bg-darkgray-500">
                  Abbrechen
                </Button>
                <Button onClick={handleCreateWebsite} disabled={!newWebsiteData.name || !newWebsiteData.url} className="bg-turquoise-500 hover:bg-turquoise-600">
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
        <Card className="overflow-visible dark-card border-darkgray-400">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle>{selectedWebsite.name}</CardTitle>
                  <Badge variant={selectedWebsite.status === 'published' ? 'success' : 'default'}>
                    {selectedWebsite.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                  </Badge>
                </div>
                <CardDescription>
                  <span className="text-turquoise-500">{selectedWebsite.url}</span>
                  • Zuletzt bearbeitet: {new Date(selectedWebsite.last_saved).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToList} className="border-darkgray-400 hover:bg-darkgray-500">
                  <List className="h-4 w-4 mr-2" />
                  Zurück zur Liste
                </Button>
                {isSaveConfirmationVisible && (
                  <Alert className="fixed top-4 right-4 w-auto z-50 flex items-center bg-green-500/20 border-green-500 text-green-300 max-w-sm">
                    <Check className="h-4 w-4" />
                    <div className="ml-3">
                      <AlertTitle>Gespeichert!</AlertTitle>
                      <AlertDescription>
                        Ihre Änderungen wurden erfolgreich gespeichert.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 bg-darkgray-700">
                <TabsTrigger 
                  value="editor" 
                  className="flex gap-2 items-center data-[state=active]:bg-turquoise-500 data-[state=active]:text-darkgray-800"
                >
                  <Save className="h-4 w-4" />
                  <span>Editor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex gap-2 items-center data-[state=active]:bg-turquoise-500 data-[state=active]:text-darkgray-800"
                >
                  <Eye className="h-4 w-4" />
                  <span>Vorschau</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex gap-2 items-center data-[state=active]:bg-turquoise-500 data-[state=active]:text-darkgray-800"
                >
                  <Settings className="h-4 w-4" />
                  <span>Einstellungen</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6 border-t border-darkgray-500 pt-6">
                <TabsContent value="editor" className="mt-0">
                  <WebsiteEditor />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0">
                  <WebsitePreview />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <WebsiteSettings />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t border-darkgray-500 pt-6">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={handleBackToList} className="border-darkgray-400 hover:bg-darkgray-500">
                Zurück zur Liste
              </Button>
              <div className="flex gap-2">
                {isDirty && (
                  <Button onClick={handleSave} disabled={!isDirty || isLoading} className="bg-turquoise-500 hover:bg-turquoise-600">
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </Button>
                )}
                
                {selectedWebsite.status !== 'published' && (
                  <Button 
                    onClick={handlePublish} 
                    disabled={isPublishing || isDirty} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website veröffentlichen
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
