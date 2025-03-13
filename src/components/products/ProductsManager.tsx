
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCreator from "./ProductCreator";
import ProductsList from "./ProductsList";
import CouponCreator from "./CouponCreator";
import { ShoppingBag, Tag, Ticket } from "lucide-react";

const ProductsManager = () => {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Produktübersicht</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Neues Produkt</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span>Gutscheincodes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ProductsList />
        </TabsContent>
        
        <TabsContent value="create">
          <ProductCreator />
        </TabsContent>
        
        <TabsContent value="coupons">
          <CouponCreator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsManager;
