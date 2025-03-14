
import { WebsiteSection } from '@/services/website-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService } from '@/services/product-service';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/lib/supabase';
import { ShoppingBag } from 'lucide-react';

interface ProductSectionProps {
  section: WebsiteSection;
  productCategories: string[];
  onUpdate: (updates: Partial<WebsiteSection>) => void;
}

export function ProductSection({ section, productCategories, onUpdate }: ProductSectionProps) {
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lade Beispielprodukte aus der gewählten Kategorie
  useEffect(() => {
    const loadProducts = async () => {
      if (!section.productCategory) return;
      
      setIsLoading(true);
      try {
        const products = await productService.getProducts();
        const filteredProducts = products.filter(
          product => product.category === section.productCategory
        ).slice(0, 3); // Zeige maximal 3 Vorschauprodukte
        
        setPreviewProducts(filteredProducts);
      } catch (error) {
        console.error('Error loading preview products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [section.productCategory]);
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Überschrift</Label>
        <Input
          id="title"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Unsere Produkte"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="productCategory">Produktkategorie</Label>
        <Select 
          value={section.productCategory || ''} 
          onValueChange={(value) => onUpdate({ productCategory: value })}
        >
          <SelectTrigger id="productCategory">
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {productCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Beschreibungstext (optional)</Label>
        <Input
          id="content"
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Kurzer Beschreibungstext über die Produktkategorie"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="backgroundColor"
              value={section.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-10 p-1 h-10"
            />
            <Input
              value={section.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="columns">Spalten</Label>
          <Select 
            value={String(section.columns || 3)} 
            onValueChange={(value) => onUpdate({ columns: parseInt(value) })}
          >
            <SelectTrigger id="columns">
              <SelectValue placeholder="Spaltenanzahl" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Spalten</SelectItem>
              <SelectItem value="3">3 Spalten</SelectItem>
              <SelectItem value="4">4 Spalten</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/10">
        <h4 className="font-medium mb-3">Produktvorschau</h4>
        
        {isLoading ? (
          <div className="text-center py-4">Produkte werden geladen...</div>
        ) : previewProducts.length > 0 ? (
          <div className={`grid grid-cols-${section.columns || 3} gap-4`}>
            {previewProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="object-cover w-full h-full rounded-md"
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {product.short_description}
                  </div>
                  <div className="mt-2 font-bold">€{product.price.toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {section.productCategory 
              ? `Keine Produkte in der Kategorie "${section.productCategory}" gefunden.` 
              : 'Bitte wählen Sie eine Produktkategorie aus.'}
          </div>
        )}
      </div>
    </div>
  );
}
