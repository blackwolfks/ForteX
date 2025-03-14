
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Save, 
  Image, 
  Tag, 
  Euro, 
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import { productService, CreateProductInput } from "@/services/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Produktschema definieren
const productSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  shortDescription: z.string().min(5, "Kurzbeschreibung muss mindestens 5 Zeichen lang sein"),
  price: z.coerce.number().min(0.01, "Preis muss mindestens 0,01 € betragen"),
  category: z.string().min(1, "Bitte wähle eine Kategorie"),
  isSubscription: z.boolean().default(false),
  subscriptionInterval: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductCreator = () => {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: 0,
      category: "",
      isSubscription: false,
      subscriptionInterval: "monthly",
    },
  });
  
  const isSubscription = form.watch("isSubscription");
  
  // Mutation zum Erstellen eines Produkts
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductInput) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produkt erfolgreich erstellt");
      resetForm();
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen des Produkts");
      console.error(error);
    }
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(file.name);
          setPreviewImage(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const resetForm = () => {
    form.reset();
    setSelectedImage(null);
    setPreviewImage(null);
  };
  
  const onSubmit = (data: ProductFormValues) => {
    // Produktdaten mit Bild erstellen
    const productData: CreateProductInput = {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      price: data.price,
      category: data.category,
      isSubscription: data.isSubscription,
      subscriptionInterval: data.subscriptionInterval,
      image: previewImage || undefined,
      cfxImported: false,
    };
    
    createProductMutation.mutate(productData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Produkt erstellen</CardTitle>
        <CardDescription>Füge ein neues Produkt zu deinem Shop hinzu</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Bilder</TabsTrigger>
            <TabsTrigger value="pricing">Preise</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="details" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produktname</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Premium Script" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung</FormLabel>
                      <FormControl>
                        <Input placeholder="Kurze Beschreibung des Produkts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ausführliche Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detaillierte Produktbeschreibung" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle eine Kategorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scripts">Scripts</SelectItem>
                          <SelectItem value="vehicles">Fahrzeuge</SelectItem>
                          <SelectItem value="maps">Maps</SelectItem>
                          <SelectItem value="characters">Charaktere</SelectItem>
                          <SelectItem value="other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="product-image">Hauptbild</Label>
                      <div className="flex items-center gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('product-image')?.click()}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Bild hochladen
                        </Button>
                        {selectedImage && (
                          <span className="text-sm text-muted-foreground">
                            {selectedImage}
                          </span>
                        )}
                      </div>
                      <input
                        id="product-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                    
                    {previewImage && (
                      <div className="mt-4">
                        <Label>Vorschau</Label>
                        <div className="mt-2 border rounded-md overflow-hidden">
                          <img 
                            src={previewImage} 
                            alt="Produktvorschau" 
                            className="max-h-[300px] object-contain mx-auto" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preis (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="19.99" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isSubscription"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Als Abonnement anbieten</FormLabel>
                        <FormDescription>
                          Aktivieren Sie diese Option, wenn dieses Produkt als wiederkehrendes Abonnement verkauft werden soll
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {isSubscription && (
                  <FormField
                    control={form.control}
                    name="subscriptionInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abrechnungsintervall</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wähle ein Intervall" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Täglich</SelectItem>
                            <SelectItem value="weekly">Wöchentlich</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                            <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                            <SelectItem value="yearly">Jährlich</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? (
                    <>Wird gespeichert...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Produkt speichern
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductCreator;
