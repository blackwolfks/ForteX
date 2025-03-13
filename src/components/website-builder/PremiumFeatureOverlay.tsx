
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";

interface PremiumFeatureOverlayProps {
  feature: string;
}

export const PremiumFeatureOverlay = ({ feature }: PremiumFeatureOverlayProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-amber-400">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle className="text-xl">Pro-Funktion: {feature}</CardTitle>
          <CardDescription>
            Diese Funktion ist nur für Pro-Benutzer verfügbar
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm">Upgrade auf Pro und erhalten Sie Zugriff auf:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2 justify-center">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                Website-Builder mit anpassbaren Vorlagen
              </li>
              <li className="flex items-center gap-2 justify-center">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                Unbegrenzte Websites mit eigenen Domains
              </li>
              <li className="flex items-center gap-2 justify-center">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                SEO-Optimierungstools
              </li>
              <li className="flex items-center gap-2 justify-center">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                Premium-Support und regelmäßige Updates
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 w-full">
              Upgrade auf Pro
            </Button>
            <p className="text-xs text-muted-foreground">
              Schon ab 19,99 € pro Monat
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
