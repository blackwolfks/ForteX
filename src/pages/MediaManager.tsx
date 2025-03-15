import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mediaService } from '@/services/website/media';
import { imageUtils } from '@/lib/image-utils';
import { toast } from 'sonner';
import { Upload, Copy, Trash2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

export default function MediaManager() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{name: string, url: string, type: string}>>([]);
  const [activeTab, setActiveTab] = useState('images');
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Bitte melden Sie sich an, um den Medien-Manager zu nutzen");
        navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
        return false;
      }
      return true;
    };
    
    const loadMedia = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;
      
      setLoading(true);
      
      try {
        const bucketExists = await mediaService.ensureBucketExists('websites');
        
        if (!bucketExists) {
          toast.error("Fehler: Storage-Bucket konnte nicht erstellt werden", {
            duration: 6000
          });
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .storage
          .from('websites')
          .list();
          
        if (error) {
          console.error('Error loading media files:', error);
          toast.error('Fehler beim Laden der Mediendateien');
          setLoading(false);
          return;
        }
        
        const mediaWithUrls = await Promise.all(
          data.filter(item => !item.id.endsWith('/')).map(async (item) => {
            const { data: urlData } = await supabase
              .storage
              .from('websites')
              .getPublicUrl(item.name);
              
            const isImage = imageUtils.isImageFileName(item.name);
            
            return {
              name: item.name,
              url: imageUtils.fixSupabaseImageUrl(urlData.publicUrl),
              type: isImage ? 'image' : 'document'
            };
          })
        );
        
        setMediaFiles(mediaWithUrls);
      } catch (error) {
        console.error('Error in media loading:', error);
        toast.error('Fehler beim Laden der Mediendateien');
      } finally {
        setLoading(false);
      }
    };
    
    loadMedia();
  }, [navigate]);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const bucketExists = await mediaService.ensureBucketExists('websites');
      
      if (!bucketExists) {
        toast.error("Fehler: Storage-Bucket existiert nicht oder konnte nicht erstellt werden");
        setUploading(false);
        return;
      }
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await mediaService.uploadMedia(file);
        
        if (result) {
          toast.success(`${file.name} erfolgreich hochgeladen`);
          
          setMediaFiles(prev => [
            ...prev, 
            { 
              name: file.name, 
              url: result,
              type: imageUtils.isImageFileName(file.name) ? 'image' : 'document'
            }
          ]);
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen der Datei(en)');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  
  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase
        .storage
        .from('websites')
        .remove([fileName]);
        
      if (error) {
        console.error('Error deleting file:', error);
        toast.error(`Fehler beim Löschen von ${fileName}`);
        return;
      }
      
      setMediaFiles(prev => prev.filter(file => file.name !== fileName));
      toast.success(`${fileName} wurde gelöscht`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen der Datei');
    }
  };
  
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('URL in die Zwischenablage kopiert');
    });
  };
  
  const filteredMedia = mediaFiles.filter(file => {
    if (activeTab === 'images') return file.type === 'image';
    if (activeTab === 'documents') return file.type === 'document';
    return true;
  });

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">Medien-Manager</h1>
        </div>
        
        <div>
          <Input
            type="file"
            id="fileUpload"
            className="hidden"
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <Button 
            onClick={() => document.getElementById('fileUpload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Wird hochgeladen...' : 'Dateien hochladen'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="images">Bilder</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="all">Alle Dateien</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Bilder</h2>
          <Separator className="mb-4" />
          {renderMediaGrid(filteredMedia, copyToClipboard, handleDelete, loading)}
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Dokumente</h2>
          <Separator className="mb-4" />
          {renderMediaGrid(filteredMedia, copyToClipboard, handleDelete, loading)}
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <h2 className="text-xl font-semibold mb-4">Alle Dateien</h2>
          <Separator className="mb-4" />
          {renderMediaGrid(filteredMedia, copyToClipboard, handleDelete, loading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderMediaGrid(
  media: Array<{name: string, url: string, type: string}>,
  copyToClipboard: (url: string) => void,
  handleDelete: (fileName: string) => void,
  loading: boolean
) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (media.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Keine Dateien gefunden</p>
        <p className="text-sm mt-2">Klicken Sie auf "Dateien hochladen", um Ihre ersten Dateien hinzuzufügen</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map((file) => (
        <Card key={file.name} className="overflow-hidden">
          <div className="aspect-video bg-muted relative">
            {file.type === 'image' ? (
              <img 
                src={file.url} 
                alt={file.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", file.url);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-2xl font-bold text-gray-400">.{file.name.split('.').pop()}</div>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <p className="font-medium truncate mb-2" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => copyToClipboard(file.url)}
              >
                <Copy className="h-4 w-4 mr-2" />
                URL kopieren
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDelete(file.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
