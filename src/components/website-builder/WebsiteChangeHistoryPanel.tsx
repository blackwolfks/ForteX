
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Clock, FileEdit } from "lucide-react";
import { WebsiteChangeHistory, WebsiteContent } from "@/services/website-service";

interface WebsiteChangeHistoryPanelProps {
  history: WebsiteChangeHistory[];
  isLoading: boolean;
  onRestoreVersion?: (content: WebsiteContent) => void;
}

export function WebsiteChangeHistoryPanel({ 
  history, 
  isLoading,
  onRestoreVersion 
}: WebsiteChangeHistoryPanelProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };

  const getBadgeVariant = (field: string) => {
    if (field.startsWith('content.title')) return "default";
    if (field.startsWith('content.subtitle')) return "secondary";
    if (field.startsWith('content.description')) return "outline";
    if (field.startsWith('content.sections')) return "destructive";
    if (field === 'initial_creation') return "default";
    if (field.startsWith('status_changed')) return "secondary";
    return "outline";
  };

  const getFieldName = (field: string) => {
    if (field === 'initial_creation') return "Erste Erstellung";
    if (field === 'name') return "Website-Name";
    if (field === 'url') return "URL";
    if (field === 'template') return "Template";
    if (field === 'shop_template') return "Shop-Design";
    if (field === 'status') return "Status";
    if (field.startsWith('status_changed_to_veröffentlicht')) return "Veröffentlicht";
    if (field.startsWith('status_changed_to_entwurf')) return "Zurückgezogen";
    if (field === 'content.title') return "Haupttitel";
    if (field === 'content.subtitle') return "Untertitel";
    if (field === 'content.description') return "Beschreibung";
    if (field === 'content.header') return "Header";
    if (field.startsWith('content.sections')) {
      if (field === 'content.sections') return "Abschnitte";
      const match = field.match(/content\.sections\[(\d+)\]/);
      if (match) {
        return `Abschnitt ${parseInt(match[1]) + 1}`;
      }
      return "Abschnitt";
    }
    return field;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Änderungshistorie wird geladen...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Änderungshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keine Änderungen gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Änderungshistorie
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="mb-4 border rounded-md p-3 hover:border-primary transition-colors"
            >
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <div>
                  <div className="font-medium">
                    {formatDateTime(item.changed_at)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-1">
                    {item.changed_fields.slice(0, 3).map((field, idx) => (
                      <Badge key={idx} variant={getBadgeVariant(field)}>
                        {getFieldName(field)}
                      </Badge>
                    ))}
                    {item.changed_fields.length > 3 && (
                      <Badge variant="outline">
                        +{item.changed_fields.length - 3} weitere
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  {expandedItem === item.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {expandedItem === item.id && (
                <div className="mt-3 pt-3 border-t">
                  <div className="mb-2">
                    <div className="text-sm font-medium mb-1">Geänderte Felder:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.changed_fields.map((field, idx) => (
                        <Badge key={idx} variant={getBadgeVariant(field)}>
                          {getFieldName(field)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {onRestoreVersion && (
                    <div className="mt-3 flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center"
                        onClick={() => onRestoreVersion(item.content_snapshot)}
                      >
                        <FileEdit className="h-3 w-3 mr-1" />
                        Wiederherstellen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
