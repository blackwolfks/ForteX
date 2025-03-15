
import { useState, useEffect } from 'react';
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImageSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
  onUpload: (file: File) => Promise<string | null>;
}

export default function ImageSection({ 
  section, 
  isEditing, 
  onUpdate,
  onUpload
}: ImageSectionProps) {
  const {
    imageUrl = '/placeholder.svg',
    caption = 'Bildbeschreibung',
    altText = 'Beschreibender Text'
  } = section.content;
  
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingRetries, setLoadingRetries] = useState(0);
  
  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);
  
  // Attempt to reload the image if it fails initially
  useEffect(() => {
    if (imageError && loadingRetries < 2 && imageUrl && imageUrl !== '/placeholder.svg') {
      const timer = setTimeout(() => {
        console.log(`[ImageSection] Retrying image load (attempt ${loadingRetries + 1}):`, imageUrl);
        setImageError(false);
        setLoadingRetries(prev => prev + 1);
      }, 2000); // Wait 2 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [imageError, imageUrl, loadingRetries]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageError(false);
    setLoadingRetries(0);
    
    console.log("[ImageSection] Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Check file size first
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return;
    }
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    console.log("[ImageSection] File extension:", fileExtension);
    
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
      return;
    }
    
    setUploading(true);
    try {
      console.log("[ImageSection] Starting image upload for file:", file.name, "type:", file.type);
      const imageUrl = await onUpload(file);
      
      if (imageUrl) {
        console.log("[ImageSection] Upload successful, setting new image URL:", imageUrl);
        onUpdate({ imageUrl });
        
        // Pre-cache the image
        const img = new Image();
        img.src = imageUrl;
        
        toast.success("Bild erfolgreich hochgeladen");
      } else {
        console.error("[ImageSection] Upload failed - no URL returned");
        toast.error("Fehler beim Hochladen des Bildes");
      }
    } catch (error) {
      console.error('[ImageSection] Error uploading image:', error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };
  
  const handleRetryLoad = () => {
    if (imageUrl && imageUrl !== '/placeholder.svg') {
      console.log("[ImageSection] Manually retrying image load:", imageUrl);
      setImageError(false);
      
      // Force browser to reload the image by appending a cache-busting query parameter
      const cacheBuster = `?cache=${Date.now()}`;
      const urlWithoutCache = imageUrl.split('?')[0]; // Remove any existing query params
      const newUrl = `${urlWithoutCache}${cacheBuster}`;
      
      onUpdate({ imageUrl: newUrl });
      toast.info("Bild wird neu geladen...");
    }
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
                <Input
                  id="imageUpload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button 
                  variant="outline" 
                  disabled={uploading}
                  onClick={() => document.getElementById('imageUpload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
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
