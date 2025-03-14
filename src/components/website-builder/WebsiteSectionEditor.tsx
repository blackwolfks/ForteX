
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { WebsiteSection } from "@/services/website-service";

interface WebsiteSectionEditorProps {
  section: WebsiteSection;
  onUpdate: (section: WebsiteSection) => void;
  onDelete: (sectionId: string) => void;
}

export const WebsiteSectionEditor = ({ 
  section, 
  onUpdate, 
  onDelete 
}: WebsiteSectionEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...section,
      title: e.target.value
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...section,
      description: e.target.value
    });
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            <h4 className="font-medium truncate">
              {section.title || "Unbenannter Abschnitt"}
            </h4>
          </div>
          
          <Button 
            onClick={() => onDelete(section.id)} 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Titel
              </label>
              <Input
                value={section.title || ""}
                onChange={handleTitleChange}
                placeholder="Titel des Abschnitts"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                Beschreibung
              </label>
              <Textarea
                value={section.description || ""}
                onChange={handleDescriptionChange}
                placeholder="Beschreibung des Abschnitts"
                rows={3}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
