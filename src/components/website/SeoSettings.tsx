
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { callRPC } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { websiteService } from '@/services/website-service';

interface SeoSettingsProps {
  websiteId: string;
}

export default function SeoSettings({ websiteId }: SeoSettingsProps) {
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    enableSitemap: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get subscription status
        const { data: subscriptionData, error: subscriptionError } = await callRPC('get_user_pro_status', {});
        if (subscriptionError) {
          console.error('Fehler beim Abrufen des Abonnement-Status:', subscriptionError);
        } else if (subscriptionData && subscriptionData.length > 0) {
          setSubscriptionTier(subscriptionData[0].subscription_tier || 'free');
        }
        
        // Lade Website-Daten und SEO-Einstellungen
        const websiteData = await websiteService.getWebsiteById(websiteId);
        if (websiteData?.seo) {
          setSettings({
            title: websiteData.seo.title || '',
            description: websiteData.seo.description || '',
            keywords: Array.isArray(websiteData.seo.keywords) 
              ? websiteData.seo.keywords.join(', ') 
              : websiteData.seo.keywords || '',
            ogImage: websiteData.seo.ogImage || '',
            enableSitemap: true
          });
        }
        
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Fehler beim Laden der SEO-Einstellungen");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [websiteId]);
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simuliere einen API-Aufruf zum Speichern
      setTimeout(() => {
        toast.success("SEO-Einstellungen erfolgreich gespeichert");
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der SEO-Einstellungen");
      setSaving(false);
    }
  };
  
  // Check if feature is available based on subscription tier
  const isFeatureAvailable = (): boolean => {
    return subscriptionTier === 'pro';
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Wenn der Benutzer kein Pro-Abonnement hat, zeigen wir eine entsprechende Meldung an
  if (!isFeatureAvailable()) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SEO-Einstellungen</CardTitle>
          <CardDescription>Optimieren Sie Ihre Website für Suchmaschinen</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-muted p-6 rounded-md text-center">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">Pro Feature</Badge>
            <p className="mb-4">Diese Funktion ist nur im Pro-Paket verfügbar. Führen Sie ein Upgrade durch, um Zugriff auf erweiterte SEO-Einstellungen zu erhalten.</p>
            <Button asChild>
              <Link to="/profile">Upgrade durchführen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>SEO-Einstellungen</CardTitle>
          <CardDescription>Optimieren Sie Ihre Website für Suchmaschinen</CardDescription>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Pro Feature</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Meta-Titel</Label>
          <Input 
            id="title" 
            value={settings.title} 
            onChange={(e) => setSettings({...settings, title: e.target.value})}
            placeholder="Haupttitel Ihrer Website"
          />
          <p className="text-xs text-muted-foreground">
            Der Titel erscheint in den Suchergebnissen und im Browser-Tab
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Meta-Beschreibung</Label>
          <Textarea 
            id="description" 
            value={settings.description} 
            onChange={(e) => setSettings({...settings, description: e.target.value})}
            placeholder="Kurze Beschreibung Ihrer Website"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Die Beschreibung erscheint in den Suchergebnissen unter dem Titel
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input 
            id="keywords" 
            value={settings.keywords} 
            onChange={(e) => setSettings({...settings, keywords: e.target.value})}
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-muted-foreground">
            Durch Kommas getrennte Schlüsselwörter
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ogImage">Open Graph Bild URL</Label>
          <Input 
            id="ogImage" 
            value={settings.ogImage} 
            onChange={(e) => setSettings({...settings, ogImage: e.target.value})}
            placeholder="https://beispiel.de/bild.jpg"
          />
          <p className="text-xs text-muted-foreground">
            Dieses Bild wird angezeigt, wenn Ihre Seite in sozialen Medien geteilt wird
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Switch 
            id="enable-sitemap"
            checked={settings.enableSitemap}
            onCheckedChange={(checked) => setSettings({...settings, enableSitemap: checked})}
          />
          <Label htmlFor="enable-sitemap">XML Sitemap generieren</Label>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
            className="bg-turquoise-500 hover:bg-turquoise-600 text-white"
          >
            {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
