
import { WebsiteSection } from '@/services/website-service';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TextSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
}

export default function TextSection({ 
  section, 
  isEditing, 
  onUpdate 
}: TextSectionProps) {
  const {
    title = 'Abschnittsüberschrift',
    content = 'Hier kommt Ihr Text. Klicken Sie zum Bearbeiten.',
    alignment = 'left'
  } = section.content;
  
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
            <Label htmlFor="content">Inhalt</Label>
            <Textarea 
              id="content" 
              value={content}
              rows={6}
              onChange={(e) => onUpdate({ content: e.target.value })} 
            />
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
        </CardContent>
      </Card>
    );
  }
  
  // The rendering view of the section
  return (
    <div className="container mx-auto px-6 py-12">
      <div 
        className={`max-w-3xl mx-auto ${
          alignment === 'center' ? 'text-center' : 
          alignment === 'right' ? 'text-right ml-auto' : ''
        }`}
      >
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <div className="prose max-w-none">
          {content.split('\n').map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
