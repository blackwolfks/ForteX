
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Search, 
  Key, 
  ShoppingBag,
  Tag
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  category: string;
  isSubscription: boolean;
  subscriptionInterval?: string;
  cfxResourceId?: string;
  cfxImported: boolean;
  image?: string;
  createdAt: string;
};

const ProductsList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Load products from localStorage
  useEffect(() => {
    const loadedProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(loadedProducts);
  }, []);
  
  // Filter products based on search query and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get all unique categories
  const categories = Array.from(new Set(products.map(product => product.category))).filter(Boolean);
  
  // Delete a product
  const handleDelete = (id: string) => {
    if (window.confirm("Möchtest du dieses Produkt wirklich löschen?")) {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      localStorage.setItem("products", JSON.stringify(updatedProducts));
    }
  };
  
  // Function to generate a product key
  const generateKey = (id: string) => {
    // Generate a key in format XXXX-XXXX-XXXX-XXXX
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      if (i < 3) key += '-';
    }
    
    // In a real application, you would save this key to the database
    alert(`Schlüssel für ${id}: ${key}`);
  };
  
  // Format price
  const formatPrice = (price: number, isSubscription: boolean, interval?: string) => {
    const formattedPrice = `${price.toFixed(2)} €`;
    
    if (isSubscription && interval) {
      const intervalMap: Record<string, string> = {
        daily: 'täglich',
        weekly: 'wöchentlich',
        monthly: 'monatlich',
        quarterly: 'vierteljährlich',
        yearly: 'jährlich'
      };
      
      return `${formattedPrice} / ${intervalMap[interval] || interval}`;
    }
    
    return formattedPrice;
  };
  
  // Format category
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      scripts: 'Scripts',
      vehicles: 'Fahrzeuge',
      maps: 'Maps',
      characters: 'Charaktere',
      other: 'Sonstiges'
    };
    
    return categoryMap[category] || category;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Produktübersicht</CardTitle>
        <CardDescription>Verwalte deine vorhandenen Produkte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Produkte durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
              className={!selectedCategory ? "bg-muted" : ""}
            >
              Alle
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-muted" : ""}
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead>CFX</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div>{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.shortDescription}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatPrice(product.price, product.isSubscription, product.subscriptionInterval)}
                  </TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  <TableCell>
                    {product.cfxImported ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        CFX Import
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => alert(`Bearbeiten: ${product.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => generateKey(product.id)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Schlüssel generieren
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Produkte gefunden</h3>
            <p className="text-muted-foreground mt-1">
              {products.length === 0 
                ? "Du hast noch keine Produkte erstellt." 
                : "Keine Produkte entsprechen deinen Filterkriterien."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsList;
