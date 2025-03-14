
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/supabase';
import { productService } from '@/services/product-service';

export function WebsitePreview() {
  const { websiteContent, selectedWebsite } = useWebsiteBuilder();
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadProducts = async () => {
      if (!websiteContent) return;
      
      setIsLoading(true);
      try {
        const allProducts = await productService.getProducts();
        
        // Produkte nach Kategorien gruppieren
        const groupedProducts: Record<string, Product[]> = {};
        
        websiteContent.productCategories.forEach(category => {
          groupedProducts[category] = allProducts.filter(
            product => product.category === category
          );
        });
        
        setProducts(groupedProducts);
      } catch (error) {
        console.error('Error loading products for preview:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [websiteContent]);
  
  if (!websiteContent || !selectedWebsite) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Website-Vorschau</h3>
        <Button 
          variant="outline"
          onClick={() => window.open(`https://${selectedWebsite.url}`, '_blank')}
        >
          In neuem Tab öffnen
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        {/* Header-Vorschau */}
        <div className="border-b bg-white p-4">
          <div className="max-w-screen-xl mx-auto flex justify-between items-center">
            <div className="font-bold text-xl">
              {websiteContent.layout.header.logoText}
            </div>
            <div className="flex gap-4">
              {websiteContent.layout.header.navigation.map((item, index) => (
                <a 
                  key={index} 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Inhaltsvorschau */}
        <div className="bg-white min-h-[400px]">
          {websiteContent.sections.map((section, index) => {
            const style = {
              backgroundColor: section.backgroundColor || '#ffffff',
              color: section.textColor || '#000000',
              textAlign: section.alignment || 'left'
            } as React.CSSProperties;
            
            return (
              <div key={index} style={style} className="p-8 border-b">
                <div className="max-w-screen-xl mx-auto">
                  {section.type === 'hero' && (
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-1 space-y-4">
                        {section.title && <h2 className="text-3xl font-bold">{section.title}</h2>}
                        {section.content && <p className="text-lg">{section.content}</p>}
                        {section.buttonText && (
                          <Button>
                            {section.buttonText}
                          </Button>
                        )}
                      </div>
                      {section.imageUrl && (
                        <div className="flex-1">
                          <img 
                            src={section.imageUrl} 
                            alt={section.title || "Hero image"} 
                            className="rounded-lg max-h-[300px] object-cover w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {section.type === 'text' && (
                    <div className="max-w-3xl mx-auto space-y-4">
                      {section.title && <h2 className="text-2xl font-bold">{section.title}</h2>}
                      {section.content && <div className="whitespace-pre-line">{section.content}</div>}
                    </div>
                  )}
                  
                  {section.type === 'image' && (
                    <div className="max-w-3xl mx-auto space-y-4">
                      {section.title && <h2 className="text-2xl font-bold">{section.title}</h2>}
                      {section.imageUrl && (
                        <img 
                          src={section.imageUrl} 
                          alt={section.title || "Section image"} 
                          className="rounded-lg max-h-[400px] object-contain mx-auto"
                        />
                      )}
                      {section.content && <p className="text-sm text-center">{section.content}</p>}
                    </div>
                  )}
                  
                  {section.type === 'products' && section.productCategory && (
                    <div className="space-y-6">
                      {section.title && <h2 className="text-2xl font-bold">{section.title}</h2>}
                      {section.content && <p className="mb-6">{section.content}</p>}
                      
                      {isLoading ? (
                        <div className="text-center py-8">Produkte werden geladen...</div>
                      ) : products[section.productCategory]?.length > 0 ? (
                        <div className={`grid grid-cols-1 md:grid-cols-${section.columns || 3} gap-6`}>
                          {products[section.productCategory].map((product) => (
                            <Card key={product.id} className="overflow-hidden">
                              <div className="aspect-square bg-muted">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    Kein Bild
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="font-bold">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">{product.short_description}</p>
                                <div className="mt-2 font-bold">€{product.price.toFixed(2)}</div>
                                <Button className="w-full mt-3">Zum Produkt</Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground border rounded-md">
                          Keine Produkte in der Kategorie "{section.productCategory}" gefunden
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer-Vorschau */}
        <div className="border-t bg-gray-100 p-8">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">{websiteContent.layout.footer.companyName}</h3>
                <p className="text-sm text-muted-foreground">
                  {websiteContent.layout.footer.copyrightText}
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-4">Links</h3>
                <div className="space-y-2">
                  {websiteContent.layout.footer.links.map((link, index) => (
                    <div key={index}>
                      <a 
                        href="#" 
                        onClick={(e) => e.preventDefault()}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {link.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-4">Folgen Sie uns</h3>
                <div className="space-y-2">
                  {websiteContent.layout.footer.socialMedia.map((social, index) => (
                    <div key={index}>
                      <a 
                        href="#" 
                        onClick={(e) => e.preventDefault()}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {social.platform}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/20">
        <p className="text-sm text-muted-foreground text-center">
          Dies ist nur eine vereinfachte Vorschau. Die tatsächliche Website kann je nach Template und Gerät anders aussehen.
        </p>
      </div>
    </div>
  );
}
