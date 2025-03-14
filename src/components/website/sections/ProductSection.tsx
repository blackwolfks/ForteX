
import { WebsiteSection } from '@/services/website-service';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from 'lucide-react';

interface ProductSectionProps {
  section: WebsiteSection;
  isEditing: boolean;
  onUpdate: (content: Record<string, any>) => void;
}

export default function ProductSection({ 
  section, 
  isEditing, 
  onUpdate 
}: ProductSectionProps) {
  const {
    products = [],
    layout = 'grid',
    showPrice = true,
    showDescription = true
  } = section.content;
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Label>Produktdarstellung</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // This would typically open a product picker dialog
                alert('Produktauswahl würde hier geöffnet werden');
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Produkte auswählen
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="layout">Layout</Label>
            <Select 
              value={layout} 
              onValueChange={(value) => onUpdate({ layout: value })}
            >
              <SelectTrigger id="layout">
                <SelectValue placeholder="Layout wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Raster</SelectItem>
                <SelectItem value="list">Liste</SelectItem>
                <SelectItem value="carousel">Karussell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showPrice" 
                checked={showPrice} 
                onCheckedChange={(checked) => onUpdate({ showPrice: !!checked })}
              />
              <Label htmlFor="showPrice">Preise anzeigen</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showDescription" 
                checked={showDescription} 
                onCheckedChange={(checked) => onUpdate({ showDescription: !!checked })}
              />
              <Label htmlFor="showDescription">Beschreibungen anzeigen</Label>
            </div>
          </div>
          
          {products.length === 0 && (
            <div className="p-8 border border-dashed rounded-md text-center text-muted-foreground">
              <p>Keine Produkte ausgewählt</p>
              <p className="text-sm mt-2">Klicken Sie auf "Produkte auswählen", um Produkte hinzuzufügen</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // The rendering view of the section
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Unsere Produkte</h2>
        
        {products.length > 0 ? (
          <div className={`
            ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
              layout === 'list' ? 'space-y-6' : 'flex overflow-x-auto gap-6 pb-4'}
          `}>
            {/* Here we would map over product data */}
            {products.map((product: any) => (
              <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-video bg-muted">
                  <img 
                    src={product.image || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  {showDescription && product.description && (
                    <p className="text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                  )}
                  {showPrice && (
                    <p className="mt-3 font-bold">{product.price} €</p>
                  )}
                  <Button className="mt-4 w-full">Zum Produkt</Button>
                </div>
              </div>
            ))}
            
            {/* Display placeholders if no products */}
            {products.length === 0 && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-video bg-muted" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">Beispielprodukt</h3>
                  {showDescription && (
                    <p className="text-muted-foreground mt-2">Produktbeschreibung kommt hier.</p>
                  )}
                  {showPrice && (
                    <p className="mt-3 font-bold">29,99 €</p>
                  )}
                  <Button className="mt-4 w-full">Zum Produkt</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Keine Produkte ausgewählt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
