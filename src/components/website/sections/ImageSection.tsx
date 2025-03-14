
import { useState } from 'react';
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';

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
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const imageUrl = await onUpload(file);
      if (imageUrl) {
        onUpdate({ imageUrl });
      }
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
                <img 
                  src={imageUrl} 
                  alt={altText} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
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
  
  // The rendering view of the section
  return (
    <div className="container mx-auto px-6 py-12">
      <figure className="max-w-4xl mx-auto">
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full h-auto rounded-lg shadow-md" 
        />
        {caption && (
          <figcaption className="text-center text-sm mt-4 text-gray-600">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
