
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Edit, Trash, Eye, Globe } from "lucide-react";

export interface WebsiteCardProps {
  id: string;
  name: string;
  url: string;
  template: string;
  lastUpdated: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const WebsiteCard = ({ id, name, url, template, lastUpdated, onEdit, onDelete }: WebsiteCardProps) => {
  const formattedDate = formatDistanceToNow(new Date(lastUpdated), { 
    addSuffix: true,
    locale: de
  });

  // Define status as a string and use a boolean for comparison
  const status = "entwurf"; // Default status for now, can be updated later
  // We'll use this boolean for comparisons to avoid type errors
  const isPublished = status === "veröffentlicht";

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
