
import { WebsiteSection } from '@/services/website-service';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { productService } from '@/services/product/product-service';
import { Product } from '@/lib/supabase';
import ProductPicker from '../ProductPicker';

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
    productIds = [],
    layout = 'grid',
    showPrice = true,
    showDescription = true
  } = section.content;
  
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (productIds.length > 0) {
      loadProductDetails();
    }
  }, [productIds]);
  
  const loadProductDetails = async () => {
    if (productIds.length === 0) return;
    
    setLoading(true);
    try {
      const allProducts = await productService.getProducts();
      const filteredProducts = allProducts.filter(product => 
        productIds.includes(product.id)
      );
      
      // Sort products to match the order in productIds
      const sortedProducts = productIds.map(id => 
        filteredProducts.find(product => product.id === id)
      ).filter(Boolean) as Product[];
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error loading product details:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectProducts = (selectedProductIds: string[]) => {
    onUpdate({ productIds: selectedProductIds });
  };
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Label>Produktdarstellung</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setProductPickerOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Produkte auswählen
            </Button>
            
            <ProductPicker
              open={productPickerOpen}
              onOpenChange={setProductPickerOpen}
              selectedProducts={productIds}
              onSelect={handleSelectProducts}
            />
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
          
          {productIds.length > 0 && (
            <div className="border rounded-md p-4">
              <Label className="mb-2 block">Ausgewählte Produkte ({productIds.length})</Label>
              {loading ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-2 border-b pb-2">
                      {product.image && (
                        <div className="w-8 h-8 bg-muted rounded overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      )}
                      <span>{product.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {productIds.length === 0 && (
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
            {products.map((product) => (
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
                  {showDescription && (product.short_description || product.description) && (
                    <p className="text-muted-foreground mt-2 line-clamp-2">
                      {product.short_description || product.description}
                    </p>
                  )}
                  {showPrice && (
                    <p className="mt-3 font-bold">{product.price} €</p>
                  )}
                  <Button className="mt-4 w-full">Zum Produkt</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            {loading ? (
              <div className="py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Produkte werden geladen...</p>
              </div>
            ) : productIds.length > 0 ? (
              <p>Produkte konnten nicht geladen werden.</p>
            ) : (
              <p>Keine Produkte ausgewählt.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
