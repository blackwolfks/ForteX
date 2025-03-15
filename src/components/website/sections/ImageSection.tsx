import { useState } from 'react';
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from 'lucide-react';
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
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageError(false);
    
    console.log("Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Accept more image formats with more flexible checking
    const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    // Check file type more broadly
    if (!file.type.startsWith('image/')) {
      toast.error("Nur Bildformate sind erlaubt.");
      return;
    }
    
    // More flexible MIME type checking
    if (!acceptedFormats.includes(file.type.toLowerCase())) {
      toast.error("Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.");
      console.error("File type not accepted:", file.type);
      return;
    }
    
    // Prüfen der Dateigröße
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return;
    }
    
    setUploading(true);
    try {
      console.log("Starting image upload for file:", file.name, "type:", file.type);
      const imageUrl = await onUpload(file);
      
      if (imageUrl) {
        console.log("Upload successful, setting new image URL:", imageUrl);
        onUpdate({ imageUrl });
        toast.success("Bild erfolgreich hochgeladen");
      } else {
        console.error("Upload failed - no URL returned");
        toast.error("Fehler beim Hochladen des Bildes");
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
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
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt={altText} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      console.error("Image failed to load:", imageUrl);
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
                  accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
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
                    {imageUrl.split('/').pop()}
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
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400" />
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
