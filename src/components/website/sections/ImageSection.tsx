
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, FileImage } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface ImageSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
}

export default function ImageSection({ 
  section, 
  isEditing, 
  onUpdate
}: ImageSectionProps) {
  const {
    imageUrl = '/placeholder.svg',
    caption = 'Bildbeschreibung',
    altText = 'Beschreibender Text'
  } = section.content;
  
  const [imageError, setImageError] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{name: string, url: string}>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleRetryLoad = () => {
    setImageError(false);
  };
  
  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
        setLoading(false);
        return;
      }
      
      const websitesBucketExists = buckets?.some(bucket => bucket.name === 'websites');
      
      if (!websitesBucketExists) {
        console.error('Websites bucket does not exist');
        setLoading(false);
        return;
      }
      
      // List files from the bucket
      const { data, error } = await supabase
        .storage
        .from('websites')
        .list();
        
      if (error) {
        console.error('Error loading media files:', error);
        setLoading(false);
        return;
      }
      
      // Filter for image files and get their public URLs
      const imageFiles = data
        .filter(item => !item.id.endsWith('/') && 
                       (item.name.endsWith('.jpg') || 
                        item.name.endsWith('.jpeg') || 
                        item.name.endsWith('.png') || 
                        item.name.endsWith('.gif') || 
                        item.name.endsWith('.webp')))
        .map(item => {
          const { data: urlData } = supabase
            .storage
            .from('websites')
            .getPublicUrl(item.name);
            
          return {
            name: item.name,
            url: urlData.publicUrl
          };
        });
      
      setMediaFiles(imageFiles);
    } catch (error) {
      console.error('Error loading media files:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (mediaDialogOpen) {
      loadMediaFiles();
    }
  }, [mediaDialogOpen]);
  
  const handleSelectImage = (url: string) => {
    onUpdate({ imageUrl: url });
    setMediaDialogOpen(false);
  };
  
  const handleNavigateToMedia = () => {
    navigate('/dashboard/media');
    setMediaDialogOpen(false);
  };
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Bild</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-muted">
                {imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryLoad}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Neu laden
                    </Button>
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt={altText} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      console.error("[ImageSection] Image failed to load:", imageUrl);
                      setImageError(true);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )}
              </div>
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setMediaDialogOpen(true)}
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  Bild auswählen
                </Button>
                {imageUrl && imageUrl !== '/placeholder.svg' && (
                  <p className="text-xs mt-2 text-muted-foreground break-all max-w-[200px]">
                    {imageUrl.split('/').pop()?.split('?')[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="caption">Bildbeschreibung</Label>
            <Input 
              id="caption" 
              value={caption} 
              onChange={(e) => onUpdate({ caption: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="altText">Alt-Text (für Barrierefreiheit)</Label>
            <Textarea 
              id="altText" 
              value={altText} 
              onChange={(e) => onUpdate({ altText: e.target.value })} 
            />
          </div>
          
          <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Bild auswählen</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Wählen Sie ein Bild aus Ihrer Medienbibliothek
                </p>
                <Button onClick={handleNavigateToMedia}>
                  <FileImage className="h-4 w-4 mr-2" />
                  Medienverwaltung öffnen
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : mediaFiles.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Keine Bilder gefunden</p>
                    <p className="text-sm mt-2">Fügen Sie Bilder über die Medienverwaltung hinzu</p>
                    <Button onClick={handleNavigateToMedia} variant="outline" className="mt-4">
                      Zur Medienverwaltung
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaFiles.map((file) => (
                      <div 
                        key={file.name}
                        className="cursor-pointer border rounded-md overflow-hidden hover:border-primary transition-colors"
                        onClick={() => handleSelectImage(file.url)}
                      >
                        <div className="aspect-video bg-muted">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-sm truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-12">
      <figure className="max-w-4xl mx-auto">
        {imageError ? (
          <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
            <Button 
              variant="outline" 
              onClick={handleRetryLoad}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Bild neu laden
            </Button>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={altText} 
            className="w-full h-auto rounded-lg shadow-md" 
            onError={(e) => {
              console.error("Image failed to load in preview:", imageUrl);
              setImageError(true);
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        )}
        {caption && (
          <figcaption className="text-center text-sm mt-4 text-gray-600">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
