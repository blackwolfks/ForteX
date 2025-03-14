
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { callRPC } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { websiteService } from '@/services/website-service';
import { ColorPicker } from "@/components/ui/color-picker";

interface WebsiteSettingsPanelProps {
  websiteId: string;
}

export default function WebsiteSettingsPanel({ websiteId }: WebsiteSettingsPanelProps) {
  const [settings, setSettings] = useState({
    fonts: {
      headings: 'Inter',
      body: 'Inter'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#ffffff',
      text: '#1f2937'
    },
    layout: 'fluid',
    customDomain: '',
    analytics: {
      enabled: false,
      googleAnalyticsId: ''
    }
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
        
        // Lade Website-Daten und Einstellungen
        const websiteData = await websiteService.getWebsiteById(websiteId);
        if (websiteData?.settings) {
          setSettings({
            ...settings,
            ...websiteData.settings,
            customDomain: '',
            analytics: {
              enabled: false,
              googleAnalyticsId: ''
            }
          });
        }
        
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Fehler beim Laden der Website-Einstellungen");
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
        toast.success("Website-Einstellungen erfolgreich gespeichert");
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Website-Einstellungen");
      setSaving(false);
    }
  };
  
  // Check if feature is available based on subscription tier
  const isFeatureAvailable = (feature: 'design' | 'custom_domain' | 'analytics'): boolean => {
    if (subscriptionTier === 'pro') return true;
    if (subscriptionTier === 'basic' && (feature === 'design' || feature === 'custom_domain')) return true;
    if (feature === 'design') return true; // Basic design features available to all
    return false;
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Design-Einstellungen (verfügbar für alle, aber mit Einschränkungen) */}
      <Card>
        <CardHeader>
          <CardTitle>Design-Einstellungen</CardTitle>
          <CardDescription>Passen Sie das Erscheinungsbild Ihrer Website an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schriftarten */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Schriftarten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headingFont">Überschriften</Label>
                <Select 
                  value={settings.fonts.headings} 
                  onValueChange={(value) => setSettings({
                    ...settings, 
                    fonts: {...settings.fonts, headings: value}
                  })}
                >
                  <SelectTrigger id="headingFont">
                    <SelectValue placeholder="Schriftart wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Raleway">Raleway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bodyFont">Fließtext</Label>
                <Select 
                  value={settings.fonts.body} 
                  onValueChange={(value) => setSettings({
                    ...settings, 
                    fonts: {...settings.fonts, body: value}
                  })}
                >
                  <SelectTrigger id="bodyFont">
                    <SelectValue placeholder="Schriftart wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Raleway">Raleway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Farben */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Farben</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primärfarbe</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: settings.colors.primary }}
                  />
                  <Input 
                    id="primaryColor" 
                    value={settings.colors.primary} 
                    onChange={(e) => setSettings({
                      ...settings, 
                      colors: {...settings.colors, primary: e.target.value}
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: settings.colors.secondary }}
                  />
                  <Input 
                    id="secondaryColor" 
                    value={settings.colors.secondary} 
                    onChange={(e) => setSettings({
                      ...settings, 
                      colors: {...settings.colors, secondary: e.target.value}
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: settings.colors.background }}
                  />
                  <Input 
                    id="backgroundColor" 
                    value={settings.colors.background} 
                    onChange={(e) => setSettings({
                      ...settings, 
                      colors: {...settings.colors, background: e.target.value}
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="textColor">Textfarbe</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: settings.colors.text }}
                  />
                  <Input 
                    id="textColor" 
                    value={settings.colors.text} 
                    onChange={(e) => setSettings({
                      ...settings, 
                      colors: {...settings.colors, text: e.target.value}
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Layout */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Layout</h3>
            <div className="space-y-2">
              <Label htmlFor="layout">Layout-Typ</Label>
              <Select 
                value={settings.layout} 
                onValueChange={(value) => setSettings({
                  ...settings, 
                  layout: value as 'fluid' | 'fixed'
                })}
              >
                <SelectTrigger id="layout">
                  <SelectValue placeholder="Layout wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fluid">Fluid (Volle Breite)</SelectItem>
                  <SelectItem value="fixed">Fixiert (Zentriert)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Benutzerdefinierte Domain (verfügbar für Basic und Pro) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Benutzerdefinierte Domain</CardTitle>
            <CardDescription>Verbinden Sie Ihre eigene Domain mit dieser Website</CardDescription>
          </div>
          {!isFeatureAvailable('custom_domain') && (
            <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
              Verfügbar ab Basic-Plan
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isFeatureAvailable('custom_domain') ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customDomain">Domain</Label>
                <Input 
                  id="customDomain" 
                  value={settings.customDomain} 
                  onChange={(e) => setSettings({...settings, customDomain: e.target.value})}
                  placeholder="meine-domain.de"
                />
                <p className="text-xs text-muted-foreground">
                  Geben Sie Ihre Domain ohne http:// oder https:// ein, z.B. meine-domain.de
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-sm mb-2">DNS-Einstellungen:</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm text-muted-foreground"><strong>CNAME-Eintrag:</strong> Erstellen Sie einen CNAME-Eintrag, der auf app.beispiel.de zeigt.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-md text-center">
              <p className="mb-4">Führen Sie ein Upgrade auf den Basic- oder Pro-Plan durch, um benutzerdefinierte Domains zu nutzen.</p>
              <Button asChild>
                <Link to="/profile">Upgrade durchführen</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Analytics (nur für Pro verfügbar) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Verbinden Sie Ihre Website mit Analyse-Tools</CardDescription>
          </div>
          {!isFeatureAvailable('analytics') && (
            <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
              Nur im Pro-Plan verfügbar
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isFeatureAvailable('analytics') ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-analytics"
                  checked={settings.analytics.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings, 
                    analytics: {...settings.analytics, enabled: checked}
                  })}
                />
                <Label htmlFor="enable-analytics">Google Analytics aktivieren</Label>
              </div>
              
              {settings.analytics.enabled && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input 
                    id="googleAnalyticsId" 
                    value={settings.analytics.googleAnalyticsId} 
                    onChange={(e) => setSettings({
                      ...settings, 
                      analytics: {...settings.analytics, googleAnalyticsId: e.target.value}
                    })}
                    placeholder="G-XXXXXXXXXX oder UA-XXXXXXXX-X"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-md text-center">
              <p className="mb-4">Führen Sie ein Upgrade auf den Pro-Plan durch, um Analytics-Funktionen zu nutzen.</p>
              <Button asChild>
                <Link to="/profile">Upgrade durchführen</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Speichern-Button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="bg-turquoise-500 hover:bg-turquoise-600 text-white"
        >
          {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
}
