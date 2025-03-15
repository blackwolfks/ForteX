
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { websiteService } from '@/services/website-service';
import DragDropEditor from '@/components/website/DragDropEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import WebsiteSettingsPanel from '@/components/website/WebsiteSettingsPanel';
import SeoSettings from '@/components/website/SeoSettings';
import { mediaService } from '@/services/website/media';

export default function WebsiteEditor() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Bitte melden Sie sich an, um den Website-Editor zu nutzen");
        navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
        return false;
      }
      return true;
    };

    const checkWebsite = async () => {
      if (!websiteId) {
        setError('Keine Website-ID angegeben');
        setLoading(false);
        return;
      }

      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;
      
      try {
        const website = await websiteService.getWebsiteById(websiteId);
        if (!website) {
          setError('Website nicht gefunden');
        }
      } catch (err) {
        console.error('Error fetching website:', err);
        setError('Fehler beim Laden der Website');
      } finally {
        setLoading(false);
      }
    };
    
    checkWebsite();
  }, [websiteId, navigate]);
  
  const handleMediaUpload = async (file: File): Promise<string | null> => {
    if (!websiteId) {
      toast.error("Keine Website-ID verfügbar");
      return null;
    }
    
    console.log("[WebsiteEditor] Handling media upload for file:", file.name, "type:", file.type, "size:", file.size);
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return null;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    console.log("[WebsiteEditor] File extension:", fileExtension);
    
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG oder WebP Format hochladen.`);
      return null;
    }
    
    try {
      // Standardize folder structure for website media
      const uploadPath = `website-${websiteId.replace(/-/g, '_')}`;
      console.log("[WebsiteEditor] Uploading to path:", uploadPath);
      
      // Add a retry mechanism for uploads
      let attempts = 0;
      const maxAttempts = 2;
      let result = null;
      
      while (attempts < maxAttempts && result === null) {
        if (attempts > 0) {
          console.log(`[WebsiteEditor] Retrying upload (attempt ${attempts + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
        
        result = await mediaService.uploadMedia(file, uploadPath);
        attempts++;
      }
      
      if (result) {
        // If upload was successful, verify that the URL is accessible
        console.log("[WebsiteEditor] Upload successful, URL:", result);
        return result;
      } else {
        console.error("[WebsiteEditor] All upload attempts failed");
        toast.error("Fehler beim Hochladen des Bildes nach mehreren Versuchen.");
        return null;
      }
    } catch (error) {
      console.error("[WebsiteEditor] Error in handleMediaUpload:", error);
      toast.error("Fehler beim Hochladen des Bildes");
      return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !websiteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-4">{error || 'Fehler'}</h1>
        <p className="text-muted-foreground mb-6">Die angeforderte Website konnte nicht geladen werden.</p>
        <Button onClick={() => navigate('/dashboard/website-builder')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-darkgray-700 border-b border-darkgray-600 px-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="pages">Seiten</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="h-[calc(100vh-48px)] p-0">
          <DragDropEditor 
            websiteId={websiteId} 
            onMediaUpload={handleMediaUpload} 
          />
        </TabsContent>
        
        <TabsContent value="pages" className="h-[calc(100vh-48px)] p-4">
          <div className="bg-card rounded-lg p-6 h-full">
            <h2 className="text-2xl font-bold mb-4">Seiten verwalten</h2>
            <p className="text-muted-foreground">
              Diese Funktion wird in Kürze verfügbar sein. Hier können Sie später mehrere Seiten für Ihre Website erstellen und verwalten.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="h-[calc(100vh-48px)] p-4 overflow-y-auto">
          <WebsiteSettingsPanel websiteId={websiteId} />
        </TabsContent>
        
        <TabsContent value="seo" className="h-[calc(100vh-48px)] p-4 overflow-y-auto">
          <SeoSettings websiteId={websiteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
