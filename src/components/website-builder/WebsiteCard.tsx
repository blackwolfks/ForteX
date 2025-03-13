
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Edit, Trash, Eye, Globe } from "lucide-react";

interface Website {
  id: string;
  name: string;
  url: string;
  template: string;
  status: string;
  lastEdited: string;
  pages: number;
}

interface WebsiteCardProps {
  website: Website;
  onDelete: () => void;
  onEdit: (id: string) => void;
}

export const WebsiteCard = ({ website, onDelete, onEdit }: WebsiteCardProps) => {
  const formattedDate = formatDistanceToNow(new Date(website.lastEdited), { 
    addSuffix: true,
    locale: de
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-start">
          <span>{website.name}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            website.status === "veröffentlicht" 
              ? "bg-green-100 text-green-800" 
              : "bg-amber-100 text-amber-800"
          }`}>
            {website.status}
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
            <span className="font-medium">{website.url}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vorlage:</span>
            <span>{website.template}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seiten:</span>
            <span>{website.pages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zuletzt bearbeitet:</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" className="w-full mr-1" onClick={() => onEdit(website.id)}>
          <Edit className="h-4 w-4 mr-1" />
          Bearbeiten
        </Button>
        {website.status === "veröffentlicht" ? (
          <Button variant="outline" size="sm" className="w-full ml-1">
            <Eye className="h-4 w-4 mr-1" />
            Ansehen
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full ml-1" onClick={onDelete}>
            <Trash className="h-4 w-4 mr-1" />
            Löschen
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
