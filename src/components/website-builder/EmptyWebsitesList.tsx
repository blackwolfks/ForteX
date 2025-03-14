
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, Layout } from "lucide-react";

interface EmptyWebsitesListProps {
  onCreateNew: () => void;
}

export function EmptyWebsitesList({ onCreateNew }: EmptyWebsitesListProps) {
  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardHeader className="text-center">
        <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-2">
          <Layout className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Keine Websites gefunden</CardTitle>
        <CardDescription>
          Sie haben noch keine Websites erstellt. Klicken Sie auf "Neue Website", um zu beginnen.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <Button onClick={onCreateNew} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Neue Website erstellen
        </Button>
      </CardContent>
    </Card>
  );
}
