
import { WebsiteSection } from '@/services/website-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ImageSectionProps {
  section: WebsiteSection;
  onUpdate: (updates: Partial<WebsiteSection>) => void;
}

export function ImageSection({ section, onUpdate }: ImageSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel (optional)</Label>
        <Input
          id="title"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Bildtitel"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Bild-URL</Label>
        <Input
          id="imageUrl"
          value={section.imageUrl || ''}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          placeholder="URL des Bildes"
        />
      </div>
      
      {section.imageUrl && (
        <div className="border rounded-md p-2 bg-muted/20">
          <img 
            src={section.imageUrl} 
            alt={section.title || "Vorschaubild"} 
            className="max-h-48 object-contain mx-auto"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="content">Bildbeschreibung</Label>
        <Textarea
          id="content"
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Bildbeschreibung oder Bildunterschrift"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="backgroundColor"
              value={section.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-10 p-1 h-10"
            />
            <Input
              value={section.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
