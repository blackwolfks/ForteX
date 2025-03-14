
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { websiteService } from '@/services/website-service';
import { WebsiteBuilderSettings as SettingsType } from '@/services/website/settings';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, XCircle, Globe, Save } from 'lucide-react';
import { toast } from "sonner";

export default function WebsiteBuilderSettings() {
  const [settings, setSettings] = useState<SettingsType>({
    default_domain: '',
    custom_domains: [],
    seo_settings: {
      default_title: '',
      default_description: '',
      default_keywords: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await websiteService.getSettings();
        if (data) {
          // Transform data to match our component structure
          setSettings({
            id: data.id,
            default_domain: data.default_domain || '',
            custom_domains: data.custom_domains || [],
            seo_settings: data.seo_settings || {
              default_title: '',
              default_description: '',
              default_keywords: ''
            }
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Fehler beim Laden der Einstellungen");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const success = await websiteService.saveSettings(settings);
      if (success) {
        toast.success("Einstellungen erfolgreich gespeichert");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddCustomDomain = () => {
    if (!newDomain) return;
    
    // Basic validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      toast.error("Bitte geben Sie eine gültige Domain ein");
      return;
    }
    
    setSettings({
      ...settings,
      custom_domains: [...(settings.custom_domains || []), { domain: newDomain, verified: false }]
    });
    
    setNewDomain('');
  };
  
  const handleRemoveCustomDomain = (index: number) => {
    const updatedDomains = [...(settings.custom_domains || [])];
    updatedDomains.splice(index, 1);
    
    setSettings({
      ...settings,
      custom_domains: updatedDomains
    });
  };
  
  const handleSEOChange = (field: string, value: string) => {
    setSettings({
      ...settings,
      seo_settings: {
        ...(settings.seo_settings || {}),
        [field]: value
      }
    });
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <p>Einstellungen werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Website-Builder Einstellungen</h2>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="bg-turquoise-500 hover:bg-turquoise-600 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Allgemeine Einstellungen</CardTitle>
          <CardDescription>Konfigurieren Sie die grundlegenden Einstellungen Ihres Website-Builders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_domain">Standard-Domain</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="default_domain" 
                placeholder="beispiel.de" 
                value={settings.default_domain || ''} 
                onChange={(e) => setSettings({...settings, default_domain: e.target.value})}
              />
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Diese Domain wird standardmäßig für alle Ihre neuen Websites verwendet.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Benutzerdefinierte Domains</CardTitle>
          <CardDescription>Verwalten Sie Ihre eigenen Domains für Websites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new_domain">Neue Domain hinzufügen</Label>
              <Input 
                id="new_domain" 
                placeholder="meine-domain.de" 
                value={newDomain} 
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={handleAddCustomDomain}
              className="mb-[2px]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>
          
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-2">Ihre Domains</h3>
            {settings.custom_domains && settings.custom_domains.length > 0 ? (
              <div className="space-y-2">
                {settings.custom_domains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <span>{domain.domain}</span>
                      <Badge variant={domain.verified ? "default" : "secondary"}>
                        {domain.verified ? "Verifiziert" : "Nicht verifiziert"}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveCustomDomain(index)}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sie haben noch keine benutzerdefinierten Domains hinzugefügt.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>SEO-Einstellungen</CardTitle>
          <CardDescription>Konfigurieren Sie die Standard-SEO-Einstellungen für neue Websites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_title">Standard-Titel</Label>
            <Input 
              id="default_title" 
              placeholder="Meine Website" 
              value={settings.seo_settings?.default_title || ''} 
              onChange={(e) => handleSEOChange('default_title', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Dieser Titel wird standardmäßig für alle neuen Websites verwendet.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default_description">Standard-Beschreibung</Label>
            <Textarea 
              id="default_description" 
              placeholder="Eine Beschreibung meiner Website..." 
              value={settings.seo_settings?.default_description || ''} 
              onChange={(e) => handleSEOChange('default_description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default_keywords">Standard-Keywords</Label>
            <Input 
              id="default_keywords" 
              placeholder="keyword1, keyword2, keyword3" 
              value={settings.seo_settings?.default_keywords || ''} 
              onChange={(e) => handleSEOChange('default_keywords', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Geben Sie Keywords durch Kommas getrennt ein.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
