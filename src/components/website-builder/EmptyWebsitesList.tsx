
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";

interface EmptyWebsitesListProps {
  onCreateNew: () => void;
}

export function EmptyWebsitesList({ onCreateNew }: EmptyWebsitesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keine Websites gefunden</CardTitle>
        <CardDescription>
          Sie haben noch keine Websites erstellt. Klicken Sie auf "Neue Website", um zu beginnen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onCreateNew}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Neue Website erstellen
        </Button>
      </CardContent>
    </Card>
  );
}
