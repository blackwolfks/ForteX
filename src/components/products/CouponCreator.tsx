
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ticket, Save, Copy, Trash2 } from "lucide-react";

// Define the coupon schema
const couponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Code muss im Format XXXX-XXXX-XXXX-XXXX sein"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(0.01, "Wert muss größer als 0 sein"),
  maxUses: z.coerce.number().int().min(1, "Muss mindestens 1 Nutzung sein"),
  expiresAt: z.string().optional(),
  isUnlimited: z.boolean().default(false),
  applicableProducts: z.enum(["all", "specific"]),
});

type CouponFormValues = z.infer<typeof couponSchema>;

type Coupon = CouponFormValues & {
  id: string;
  createdAt: string;
  usedCount: number;
};

const CouponCreator = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    return JSON.parse(localStorage.getItem("coupons") || "[]");
  });
  
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 10,
      maxUses: 100,
      expiresAt: "",
      isUnlimited: false,
      applicableProducts: "all",
    },
  });
  
  const isUnlimited = form.watch("isUnlimited");
  const discountType = form.watch("type");
  
  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += "-";
    }
    
    form.setValue("code", code);
  };
  
  const onSubmit = (data: CouponFormValues) => {
    // Create new coupon
    const newCoupon: Coupon = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      usedCount: 0,
    };
    
    // Update state and save to localStorage
    const updatedCoupons = [...coupons, newCoupon];
    setCoupons(updatedCoupons);
    localStorage.setItem("coupons", JSON.stringify(updatedCoupons));
    
    // Reset form
    form.reset();
    
    // Show success message
    alert("Gutschein erfolgreich erstellt!");
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Möchtest du diesen Gutschein wirklich löschen?")) {
      const updatedCoupons = coupons.filter(coupon => coupon.id !== id);
      setCoupons(updatedCoupons);
      localStorage.setItem("coupons", JSON.stringify(updatedCoupons));
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code ${code} in die Zwischenablage kopiert!`);
  };
  
  const formatDiscountValue = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `${value.toFixed(2)} €`;
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Kein Ablaufdatum";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gutschein erstellen</CardTitle>
          <CardDescription>Erstelle Gutscheincodes für deinen Shop</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gutscheincode</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={generateCouponCode}
                          >
                            Generieren
                          </Button>
                        </div>
                        <FormDescription>
                          Der Code muss im Format XXXX-XXXX-XXXX-XXXX sein
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rabatttyp</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Rabatttyp wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Prozentual (%)</SelectItem>
                              <SelectItem value="fixed">Fester Betrag (€)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rabattwert</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step={discountType === "percentage" ? "1" : "0.01"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {discountType === "percentage" 
                              ? "Prozentualer Rabatt (z.B. 10 für 10%)" 
                              : "Fester Rabattbetrag in €"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="isUnlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Unbegrenzte Nutzungen</FormLabel>
                          <FormDescription>
                            Dieser Gutschein kann unbegrenzt oft verwendet werden
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
                  
                  {!isUnlimited && (
                    <FormField
                      control={form.control}
                      name="maxUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximale Nutzungen</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              step="1" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ablaufdatum (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Leer lassen für unbegrenzten Zeitraum
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="applicableProducts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anwendbar auf</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Anwendbarkeit wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">Alle Produkte</SelectItem>
                            <SelectItem value="specific">Spezifische Produkte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Gutschein speichern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {coupons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vorhandene Gutscheine</CardTitle>
            <CardDescription>Liste aller erstellten Gutscheincodes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Rabatt</TableHead>
                  <TableHead>Nutzungen</TableHead>
                  <TableHead>Ablaufdatum</TableHead>
                  <TableHead>Anwendbar auf</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono">{coupon.code}</TableCell>
                    <TableCell>{formatDiscountValue(coupon.type, coupon.value)}</TableCell>
                    <TableCell>
                      {coupon.isUnlimited 
                        ? "Unbegrenzt" 
                        : `${coupon.usedCount} / ${coupon.maxUses}`}
                    </TableCell>
                    <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell>
                      {coupon.applicableProducts === "all" 
                        ? "Alle Produkte" 
                        : "Spezifische Produkte"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CouponCreator;
