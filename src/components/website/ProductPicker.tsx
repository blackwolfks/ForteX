
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/product/product-service';
import { Product } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: string[];
  onSelect: (productIds: string[]) => void;
}

export default function ProductPicker({
  open,
  onOpenChange,
  selectedProducts,
  onSelect
}: ProductPickerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedProducts);
  
  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);
  
  useEffect(() => {
    setSelectedIds(selectedProducts);
  }, [selectedProducts]);
  
  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsList = await productService.getProducts();
      setProducts(productsList);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Fehler beim Laden der Produkte");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleProduct = (productId: string) => {
    setSelectedIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const handleConfirm = () => {
    onSelect(selectedIds);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Produkte auswählen</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Keine Produkte gefunden</p>
              <p className="text-sm mt-2">Erstellen Sie zuerst Produkte in der Produktverwaltung</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className={`border rounded-md overflow-hidden transition-colors ${
                    selectedIds.includes(product.id) ? 'border-primary bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start p-4 gap-4">
                    <div className="flex-shrink-0">
                      <Checkbox 
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                        id={`product-${product.id}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-4">
                        {product.image ? (
                          <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-muted-foreground">Kein Bild</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={`product-${product.id}`}
                            className="text-base font-medium block cursor-pointer"
                          >
                            {product.name}
                          </label>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {product.short_description || product.description.substring(0, 100)}
                          </p>
                          <p className="font-semibold mt-2">{product.price} €</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm}>
            {selectedIds.length} Produkte übernehmen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
