import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Product, productService } from "@/services/product-service";
import { supabase } from "@/lib/supabase";
import { paymentService } from "@/services/payment-service";
import { orderService } from "@/services/order-service";

const checkoutFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "Vorname muss mindestens 2 Zeichen lang sein.",
  }),
  lastName: z.string().min(2, {
    message: "Nachname muss mindestens 2 Zeichen lang sein.",
  }),
  email: z.string().email({
    message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  }),
  address: z.string().min(5, {
    message: "Adresse muss mindestens 5 Zeichen lang sein.",
  }),
  city: z.string().min(2, {
    message: "Stadt muss mindestens 2 Zeichen lang sein.",
  }),
  postalCode: z.string().min(5, {
    message: "Postleitzahl muss mindestens 5 Zeichen lang sein.",
  }),
  country: z.string().min(2, {
    message: "Land muss mindestens 2 Zeichen lang sein.",
  }),
  paymentMethod: z.enum(["credit_card", "paypal", "sofort", "bank_transfer"], {
    required_error: "Bitte wählen Sie eine Zahlungsmethode aus.",
  }),
  terms: z.boolean().refine((value) => value === true, {
    message: "Sie müssen die Nutzungsbedingungen akzeptieren.",
  }),
});

const Checkout = () => {
  const [selectedPlan, setSelectedPlan] = useState<Product | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const plan = searchParams.get("plan") || "basic";
    
    const loadPlan = async () => {
      try {
        const product = await productService.getProductById(plan);
        setSelectedPlan(product);
      } catch (error) {
        console.error("Failed to load plan:", error);
        toast({
          title: "Fehler",
          description: "Das ausgewählte Produkt konnte nicht geladen werden.",
          variant: "destructive"
        });
        navigate("/");
      }
    };
    
    loadPlan();
  }, [searchParams, toast, navigate]);
  
  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      paymentMethod: "credit_card",
      terms: false,
    },
  });
  
  const onSubmit = async (values: z.infer<typeof checkoutFormSchema>) => {
    handleCheckout(values);
  };
  
  const handleCheckout = async (values: z.infer<typeof checkoutFormSchema>) => {
    if (!selectedPlan) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie zuerst ein Produkt aus.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      toast({
        title: "Bestellung wird verarbeitet",
        description: "Ihre Bestellung wird bearbeitet. Bitte warten Sie...",
      });
      
      if (values.paymentMethod === "credit_card") {
        const result = await paymentService.processCreditCardPayment({
          amount: selectedPlan.price,
          currency: "eur",
          customerEmail: values.email,
          customerName: `${values.firstName} ${values.lastName}`,
          billingAddress: {
            address: values.address,
            city: values.city,
            postalCode: values.postalCode,
            country: values.country
          },
          cardNumber: "4242424242424242", // Sample card number
          cardExpiry: "12/25",
          cardCvc: "123"
        });
        
        if (!result.success) {
          toast({
            title: "Zahlungsfehler",
            description: result.message || "Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
            variant: "destructive"
          });
          return;
        } else {
          toast({
            title: "Zahlung erfolgreich",
            description: "Ihre Zahlung wurde erfolgreich verarbeitet.",
          });
        }
      } else if (values.paymentMethod === "paypal") {
        const result = await paymentService.processPayPalPayment({
          amount: selectedPlan.price,
          currency: "eur",
          customerEmail: values.email,
          customerName: `${values.firstName} ${values.lastName}`,
          billingAddress: {
            address: values.address,
            city: values.city,
            postalCode: values.postalCode,
            country: values.country
          }
        });
        
        if (!result.success) {
          toast({
            title: "Zahlungsfehler",
            description: result.message || "Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
            variant: "destructive"
          });
          return;
        } else {
          toast({
            title: "Zahlung erfolgreich",
            description: "Ihre Zahlung wurde erfolgreich verarbeitet.",
          });
        }
      } else if (values.paymentMethod === "sofort") {
        const result = await paymentService.processSofortPayment({
          amount: selectedPlan.price,
          currency: "eur",
          customerEmail: values.email,
          customerName: `${values.firstName} ${values.lastName}`,
          billingAddress: {
            address: values.address,
            city: values.city,
            postalCode: values.postalCode,
            country: values.country
          }
        });
        
        if (!result.success) {
          toast({
            title: "Zahlungsfehler",
            description: result.message || "Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
            variant: "destructive"
          });
          return;
        } else {
          toast({
            title: "Zahlung erfolgreich",
            description: "Ihre Zahlung wurde erfolgreich verarbeitet.",
          });
        }
      } else if (values.paymentMethod === "bank_transfer") {
        const result = await paymentService.processBankTransferPayment({
          amount: selectedPlan.price,
          currency: "eur",
          customerEmail: values.email,
          customerName: `${values.firstName} ${values.lastName}`,
          billingAddress: {
            address: values.address,
            city: values.city,
            postalCode: values.postalCode,
            country: values.country
          }
        });
        
        if (!result.success) {
          toast({
            title: "Zahlungsfehler",
            description: result.message || "Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
            variant: "destructive"
          });
          return;
        } else {
          toast({
            title: "Zahlung erfolgreich",
            description: "Ihre Zahlung wurde erfolgreich verarbeitet.",
          });
        }
      }
      
      const order = await orderService.createOrder({
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        currency: "eur",
        paymentMethod: values.paymentMethod,
        planName: selectedPlan.name,
        status: "completed"
      });
      
      toast({
        title: "Bestellung erfolgreich",
        description: `Ihre Bestellung wurde erfolgreich aufgegeben. Bestellnummer: ${order.id}`,
      });
      
      navigate("/profile");
    } catch (error: any) {
      console.error("Checkout failed:", error);
      toast({
        title: "Fehler",
        description: error?.message || "Checkout fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    }
  };
  
  if (!selectedPlan) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold mb-4">Produkt wird geladen...</h2>
          <p className="text-muted-foreground">Bitte warten Sie, während wir das Produkt laden.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bestelldetails</CardTitle>
          <CardDescription>Füllen Sie das Formular aus, um Ihre Bestellung abzuschließen</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input placeholder="Vorname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input placeholder="Nachname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="E-Mail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt</FormLabel>
                      <FormControl>
                        <Input placeholder="Stadt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postleitzahl</FormLabel>
                      <FormControl>
                        <Input placeholder="Postleitzahl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input placeholder="Land" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zahlungsmethode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen Sie eine Zahlungsmethode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit_card">Kreditkarte</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="sofort">Sofort</SelectItem>
                        <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-normal">
                          Ich akzeptiere die <a href="#" className="text-primary underline underline-offset-2">Nutzungsbedingungen</a>
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <Button type="submit" className="w-full">
                  Bestellung abschließen
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;
