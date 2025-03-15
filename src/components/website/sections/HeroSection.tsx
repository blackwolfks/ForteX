
import { useState } from 'react';
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { useImageHandler } from '@/hooks/useImageHandler';

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
  
  const {
    uploading,
    imageError,
    setImageError,
    handleImageUpload,
    handleRetryLoad
  } = useImageHandler({
    imageUrl,
    onUpdate,
    onUpload
  });
  
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
