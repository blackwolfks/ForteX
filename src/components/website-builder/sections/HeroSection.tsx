
import { WebsiteSection } from '@/services/website-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeroSectionProps {
  section: WebsiteSection;
  onUpdate: (updates: Partial<WebsiteSection>) => void;
}

export function HeroSection({ section, onUpdate }: HeroSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Titel des Hero-Bereichs"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Inhalt</Label>
        <Textarea
          id="content"
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Beschreibungstext"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Bild-URL</Label>
        <Input
          id="imageUrl"
          value={section.imageUrl || ''}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          placeholder="URL des Hintergrundbilds"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buttonText">Button-Text</Label>
          <Input
            id="buttonText"
            value={section.buttonText || ''}
            onChange={(e) => onUpdate({ buttonText: e.target.value })}
            placeholder="Klick mich"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="buttonLink">Button-Link</Label>
          <Input
            id="buttonLink"
            value={section.buttonLink || ''}
            onChange={(e) => onUpdate({ buttonLink: e.target.value })}
            placeholder="/produkte"
          />
        </div>
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
        
        <div className="space-y-2">
          <Label htmlFor="textColor">Textfarbe</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="textColor"
              value={section.textColor || '#000000'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-10 p-1 h-10"
            />
            <Input
              value={section.textColor || '#000000'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="alignment">Ausrichtung</Label>
        <Select 
          value={section.alignment || 'left'} 
          onValueChange={(value) => onUpdate({ alignment: value as 'left' | 'center' | 'right' })}
        >
          <SelectTrigger id="alignment">
            <SelectValue placeholder="Ausrichtung wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Links</SelectItem>
            <SelectItem value="center">Mittig</SelectItem>
            <SelectItem value="right">Rechts</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
