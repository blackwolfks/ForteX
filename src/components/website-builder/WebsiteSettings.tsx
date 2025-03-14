import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InfoIcon, Plus, Save, Trash } from 'lucide-react';
import { useState } from 'react';

export function WebsiteSettings() {
  const { 
    selectedWebsite, 
    websiteContent,
    updateWebsiteDetails,
    updateMeta,
    updateLayout,
    updateProductCategories
  } = useWebsiteBuilder();
  
  const [newCategory, setNewCategory] = useState('');
  const [newNavItem, setNewNavItem] = useState({ label: '', link: '' });
  const [newFooterLink, setNewFooterLink] = useState({ label: '', link: '' });
  const [newSocialMedia, setNewSocialMedia] = useState({ platform: '', link: '' });
  
  if (!selectedWebsite || !websiteContent) {
    return <div className="text-center py-8">Keine Einstellungen verfügbar</div>;
  }
  
  const { meta, layout, productCategories } = websiteContent;
  
  const handleAddCategory = () => {
    if (!newCategory || productCategories.includes(newCategory)) return;
    
    updateProductCategories([...productCategories, newCategory]);
    setNewCategory('');
  };
  
  const handleRemoveCategory = (category: string) => {
    updateProductCategories(productCategories.filter(c => c !== category));
  };
  
  const handleAddNavItem = () => {
    if (!newNavItem.label || !newNavItem.link) return;
    
    const updatedLayout = {
      ...layout,
      header: {
        ...layout.header,
        navigation: [...layout.header.navigation, newNavItem]
      }
    };
    
    updateLayout(updatedLayout);
    setNewNavItem({ label: '', link: '' });
  };
  
  const handleRemoveNavItem = (index: number) => {
    const updatedNavigation = [...layout.header.navigation];
    updatedNavigation.splice(index, 1);
    
    const updatedLayout = {
      ...layout,
      header: {
        ...layout.header,
        navigation: updatedNavigation
      }
    };
    
    updateLayout(updatedLayout);
  };
  
  const handleAddFooterLink = () => {
    if (!newFooterLink.label || !newFooterLink.link) return;
    
    const updatedLayout = {
      ...layout,
      footer: {
        ...layout.footer,
        links: [...layout.footer.links, newFooterLink]
      }
    };
    
    updateLayout(updatedLayout);
    setNewFooterLink({ label: '', link: '' });
  };
  
  const handleRemoveFooterLink = (index: number) => {
    const updatedLinks = [...layout.footer.links];
    updatedLinks.splice(index, 1);
    
    const updatedLayout = {
      ...layout,
      footer: {
        ...layout.footer,
        links: updatedLinks
      }
    };
    
    updateLayout(updatedLayout);
  };
  
  const handleAddSocialMedia = () => {
    if (!newSocialMedia.platform || !newSocialMedia.link) return;
    
    const updatedLayout = {
      ...layout,
      footer: {
        ...layout.footer,
        socialMedia: [...layout.footer.socialMedia, newSocialMedia]
      }
    };
    
    updateLayout(updatedLayout);
    setNewSocialMedia({ platform: '', link: '' });
  };
  
  const handleRemoveSocialMedia = (index: number) => {
    const updatedSocialMedia = [...layout.footer.socialMedia];
    updatedSocialMedia.splice(index, 1);
    
    const updatedLayout = {
      ...layout,
      footer: {
        ...layout.footer,
        socialMedia: updatedSocialMedia
      }
    };
    
    updateLayout(updatedLayout);
  };
  
  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4">
        <TabsTrigger value="general">Allgemein</TabsTrigger>
        <TabsTrigger value="meta">Meta-Informationen</TabsTrigger>
        <TabsTrigger value="header">Header</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
        <TabsTrigger value="products">Produkte</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Allgemeine Einstellungen</CardTitle>
            <CardDescription>Grundlegende Einstellungen für Ihre Website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Website-Name</Label>
              <Input
                id="name"
                value={selectedWebsite.name}
                onChange={(e) => updateWebsiteDetails(selectedWebsite.id, { name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL / Subdomain</Label>
              <Input
                id="url"
                value={selectedWebsite.url}
                onChange={(e) => updateWebsiteDetails(selectedWebsite.id, { url: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Input
                id="template"
                value={selectedWebsite.template}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Das Template kann derzeit nicht geändert werden.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="meta">
        <Card>
          <CardHeader>
            <CardTitle>Meta-Informationen</CardTitle>
            <CardDescription>SEO-Einstellungen für Ihre Website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta-title">Seitentitel</Label>
              <Input
                id="meta-title"
                value={meta.title}
                onChange={(e) => updateMeta({ ...meta, title: e.target.value })}
                placeholder="Seitentitel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meta-description">Beschreibung</Label>
              <Textarea
                id="meta-description"
                value={meta.description}
                onChange={(e) => updateMeta({ ...meta, description: e.target.value })}
                placeholder="Kurze Beschreibung Ihrer Website"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meta-keywords">Keywords</Label>
              <Input
                id="meta-keywords"
                value={meta.keywords}
                onChange={(e) => updateMeta({ ...meta, keywords: e.target.value })}
                placeholder="Schlüsselwörter, durch Kommas getrennt"
              />
              <p className="text-xs text-muted-foreground">
                Geben Sie Keywords ein, getrennt durch Kommas (z.B. shop, produkte, gaming).
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="header">
        <Card>
          <CardHeader>
            <CardTitle>Header-Einstellungen</CardTitle>
            <CardDescription>Konfigurieren Sie den Kopfbereich Ihrer Website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo-text">Logo-Text</Label>
              <Input
                id="logo-text"
                value={layout.header.logoText}
                onChange={(e) => updateLayout({
                  ...layout,
                  header: {
                    ...layout.header,
                    logoText: e.target.value
                  }
                })}
                placeholder="Ihr Unternehmensname"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo-image">Logo-Bild URL (optional)</Label>
              <Input
                id="logo-image"
                value={layout.header.logoImage || ''}
                onChange={(e) => updateLayout({
                  ...layout,
                  header: {
                    ...layout.header,
                    logoImage: e.target.value
                  }
                })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Navigation</Label>
                <div className="text-xs text-muted-foreground">
                  Navigationslinks im Header
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                {layout.header.navigation.length === 0 ? (
                  <div className="text-center text-muted-foreground py-2">
                    Keine Navigationslinks vorhanden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {layout.header.navigation.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <span className="font-medium">{item.label}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.link})</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveNavItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Linktext"
                    value={newNavItem.label}
                    onChange={(e) => setNewNavItem({ ...newNavItem, label: e.target.value })}
                  />
                  <Input
                    placeholder="URL"
                    value={newNavItem.link}
                    onChange={(e) => setNewNavItem({ ...newNavItem, link: e.target.value })}
                  />
                  <Button 
                    onClick={handleAddNavItem}
                    disabled={!newNavItem.label || !newNavItem.link}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="footer">
        <Card>
          <CardHeader>
            <CardTitle>Footer-Einstellungen</CardTitle>
            <CardDescription>Konfigurieren Sie den Fußbereich Ihrer Website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Unternehmensname</Label>
              <Input
                id="company-name"
                value={layout.footer.companyName}
                onChange={(e) => updateLayout({
                  ...layout,
                  footer: {
                    ...layout.footer,
                    companyName: e.target.value
                  }
                })}
                placeholder="Ihr Unternehmen GmbH"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="copyright">Copyright-Text</Label>
              <Input
                id="copyright"
                value={layout.footer.copyrightText}
                onChange={(e) => updateLayout({
                  ...layout,
                  footer: {
                    ...layout.footer,
                    copyrightText: e.target.value
                  }
                })}
                placeholder="© 2023 Ihr Unternehmen. Alle Rechte vorbehalten."
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Footer-Links</Label>
                <div className="text-xs text-muted-foreground">
                  Links im Footer (z.B. Impressum, Datenschutz)
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                {layout.footer.links.length === 0 ? (
                  <div className="text-center text-muted-foreground py-2">
                    Keine Footer-Links vorhanden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {layout.footer.links.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <span className="font-medium">{item.label}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.link})</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveFooterLink(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Linktext"
                    value={newFooterLink.label}
                    onChange={(e) => setNewFooterLink({ ...newFooterLink, label: e.target.value })}
                  />
                  <Input
                    placeholder="URL"
                    value={newFooterLink.link}
                    onChange={(e) => setNewFooterLink({ ...newFooterLink, link: e.target.value })}
                  />
                  <Button 
                    onClick={handleAddFooterLink}
                    disabled={!newFooterLink.label || !newFooterLink.link}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Social Media</Label>
                <div className="text-xs text-muted-foreground">
                  Social-Media-Links im Footer
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                {layout.footer.socialMedia.length === 0 ? (
                  <div className="text-center text-muted-foreground py-2">
                    Keine Social-Media-Links vorhanden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {layout.footer.socialMedia.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <span className="font-medium">{item.platform}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.link})</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveSocialMedia(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Plattform"
                    value={newSocialMedia.platform}
                    onChange={(e) => setNewSocialMedia({ ...newSocialMedia, platform: e.target.value })}
                  />
                  <Input
                    placeholder="URL"
                    value={newSocialMedia.link}
                    onChange={(e) => setNewSocialMedia({ ...newSocialMedia, link: e.target.value })}
                  />
                  <Button 
                    onClick={handleAddSocialMedia}
                    disabled={!newSocialMedia.platform || !newSocialMedia.link}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="products">
        <Card>
          <CardHeader>
            <CardTitle>Produkteinstellungen</CardTitle>
            <CardDescription>Konfigurieren Sie die Produktdarstellung auf Ihrer Website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Produktkategorien</Label>
                <div className="text-xs text-muted-foreground">
                  Verfügbare Kategorien für Produktabschnitte
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                {productCategories.length === 0 ? (
                  <div className="text-center text-muted-foreground py-2">
                    Keine Produktkategorien definiert
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {productCategories.map((category) => (
                      <div 
                        key={category} 
                        className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <span>{category}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0" 
                          onClick={() => handleRemoveCategory(category)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Neue Kategorie"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button 
                    onClick={handleAddCategory}
                    disabled={!newCategory || productCategories.includes(newCategory)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-md border">
                <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Produktkategorien entsprechen den Kategorien, die Sie bei der Erstellung von 
                  Produkten definieren. Stellen Sie sicher, dass die Kategoriennamen exakt 
                  übereinstimmen, damit Produkte korrekt gefiltert werden können.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
