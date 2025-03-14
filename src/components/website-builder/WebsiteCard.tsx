
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Edit, Trash, Eye, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface WebsiteCardProps {
  id: string;
  name: string;
  url: string;
  template: string;
  lastUpdated: string;
  status?: "entwurf" | "veröffentlicht";
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: (id: string, shouldPublish: boolean) => Promise<boolean>;
}

export const WebsiteCard = ({ 
  id, 
  name, 
  url, 
  template, 
  lastUpdated, 
  status = "entwurf", 
  onEdit, 
  onDelete,
  onPublish 
}: WebsiteCardProps) => {
  const formattedDate = formatDistanceToNow(new Date(lastUpdated), { 
    addSuffix: true,
    locale: de
  });

  // Use proper type definition to prevent errors
  const isPublished = status === "veröffentlicht";

  const handlePublishToggle = async (checked: boolean) => {
    if (!onPublish) return;
    
    try {
      const newStatus = checked ? "veröffentlicht" : "entwurf";
      const success = await onPublish(id, checked);
      
      if (success) {
        toast.success(`Website wurde ${newStatus === "veröffentlicht" ? "veröffentlicht" : "zurückgezogen"}`);
      } else {
        toast.error(`Fehler beim ${newStatus === "veröffentlicht" ? "Veröffentlichen" : "Zurückziehen"} der Website`);
      }
    } catch (error) {
      console.error("Fehler beim Umschalten des Veröffentlichungsstatus:", error);
      toast.error("Es ist ein Fehler aufgetreten");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-start">
          <span>{name}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isPublished 
              ? "bg-green-100 text-green-800" 
              : "bg-amber-100 text-amber-800"
          }`}>
            {status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md mb-3 flex items-center justify-center">
          <Globe className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">URL:</span>
            <span className="font-medium">{url}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vorlage:</span>
            <span>{template}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zuletzt bearbeitet:</span>
            <span>{formattedDate}</span>
          </div>
          {onPublish && (
            <div className="flex justify-between items-center mt-3 pt-2 border-t">
              <span className="text-muted-foreground">Veröffentlichen:</span>
              <Switch 
                checked={isPublished}
                onCheckedChange={handlePublishToggle}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" className="w-full mr-1" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Bearbeiten
        </Button>
        <Button variant="outline" size="sm" className="w-full ml-1" onClick={onDelete}>
          <Trash className="h-4 w-4 mr-1" />
          Löschen
        </Button>
      </CardFooter>
    </Card>
  );
};
