
import { useState, useEffect } from 'react';
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface HeroSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
  onUpload: (file: File) => Promise<string | null>;
}

export default function HeroSection({ 
  section, 
  isEditing, 
  onUpdate,
  onUpload
}: HeroSectionProps) {
  const {
    title = 'Überschrift',
    subtitle = 'Untertitel',
    buttonText = 'Klicken Sie hier',
    buttonLink = '#',
    imageUrl = '/placeholder.svg',
    alignment = 'center'
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
        console.log(`[HeroSection] Retrying image load (attempt ${loadingRetries + 1}):`, imageUrl);
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
    
    console.log("[HeroSection] Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Check file size first
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return;
    }
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    console.log("[HeroSection] File extension:", fileExtension);
    
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
      return;
    }
    
    setUploading(true);
    try {
      console.log("[HeroSection] Starting hero image upload for file:", file.name, "type:", file.type);
      const imageUrl = await onUpload(file);
      
      if (imageUrl) {
        console.log("[HeroSection] Upload successful, setting new hero image URL:", imageUrl);
        onUpdate({ imageUrl });
        
        // Pre-cache the image
        const img = new Image();
        img.src = imageUrl;
        
        toast.success("Bild erfolgreich hochgeladen");
      } else {
        console.error("[HeroSection] Upload failed - no URL returned");
        toast.error("Fehler beim Hochladen des Bildes");
      }
    } catch (error) {
      console.error('[HeroSection] Error uploading hero image:', error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };
  
  const handleRetryLoad = () => {
    if (imageUrl && imageUrl !== '/placeholder.svg') {
      console.log("[HeroSection] Manually retrying image load:", imageUrl);
      setImageError(false);
      
      // Force browser to reload the image by appending a cache-busting query parameter
      const cacheBuster = `?cache=${Date.now()}`;
      const urlWithoutCache = imageUrl.split('?')[0]; // Remove any existing query params
      const newUrl = `${urlWithoutCache}${cacheBuster}`;
      
      onUpdate({ imageUrl: newUrl });
      toast.info("Bild wird neu geladen...");
    }
  };
  
  // Function to create CSS background with fallback
  const getBackgroundStyle = () => {
    if (imageError || !imageUrl || imageUrl === '/placeholder.svg') {
      return { backgroundColor: '#333' };
    }
    return { backgroundImage: `url(${imageUrl})` };
  };
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Überschrift</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtitle">Untertitel</Label>
            <Textarea 
              id="subtitle" 
              value={subtitle} 
              onChange={(e) => onUpdate({ subtitle: e.target.value })} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button-Text</Label>
              <Input 
                id="buttonText" 
                value={buttonText} 
                onChange={(e) => onUpdate({ buttonText: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonLink">Button-Link</Label>
              <Input 
                id="buttonLink" 
                value={buttonLink} 
                onChange={(e) => onUpdate({ buttonLink: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alignment">Ausrichtung</Label>
            <Select 
              value={alignment} 
              onValueChange={(value) => onUpdate({ alignment: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ausrichtung wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Links</SelectItem>
                <SelectItem value="center">Zentriert</SelectItem>
                <SelectItem value="right">Rechts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Hintergrundbild</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-muted">
                {imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <AlertCircle className="w-6 h-6 text-gray-400 mb-1" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryLoad}
                      className="text-xs py-0"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Neu laden
                    </Button>
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt="Hero background" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("[HeroSection] Hero image failed to load:", imageUrl);
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
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div 
      className="relative min-h-[400px] flex items-center overflow-hidden bg-cover bg-center"
      style={getBackgroundStyle()}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button 
            variant="outline" 
            onClick={handleRetryLoad}
            className="bg-white/80 z-10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Bild neu laden
          </Button>
        </div>
      )}
      
      <div 
        className={`relative z-10 container mx-auto px-6 py-12 text-white ${
          alignment === 'center' ? 'text-center mx-auto' : 
          alignment === 'right' ? 'ml-auto text-right' : ''
        }`}
        style={{
          maxWidth: alignment === 'center' ? '800px' : undefined,
          width: alignment !== 'center' ? '50%' : undefined
        }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{title}</h1>
        <p className="text-xl mb-8">{subtitle}</p>
        {buttonText && (
          <Button 
            size="lg" 
            asChild
            className="bg-white text-black hover:bg-gray-200"
          >
            <a href={buttonLink}>{buttonText}</a>
          </Button>
        )}
      </div>
    </div>
  );
}
