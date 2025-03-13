import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CreditCard, Building, Euro } from "lucide-react";
import { paymentService } from "@/services/payment-service";
import { orderService } from "@/services/order-service";

// Plan details
const planDetails = {
  free: {
    name: "Kostenlos",
    price: 0,
    description: "Grundlegende Website-Funktionen"
  },
  basic: {
    name: "Basic",
    price: 19.99,
    description: "Eigene Domain und erweiterte Anpassungen"
  },
  pro: {
    name: "Pro",
    price: 49.99,
    description: "Voller Zugriff auf alle Website-Builder Funktionen"
  }
};

// Checkout schema
const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name ist erforderlich"),
  email: z.string().email("Gültige E-Mail erforderlich"),
  paymentMethod: z.enum(["credit_card", "paypal", "bank_transfer", "sofort"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  address: z.string().min(5, "Adresse ist erforderlich"),
  city: z.string().min(2, "Stadt ist erforderlich"),
  postalCode: z.string().min(5, "Postleitzahl ist erforderlich"),
  country: z.string().min(2, "Land ist erforderlich"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Sie müssen die Bedingungen akzeptieren"
  })
}).refine(
  (data) => {
    if (data.paymentMethod === "credit_card") {
      return !!data.cardNumber && !!data.cardExpiry && !!data.cardCvc;
    }
    return true;
  },
  {
    message: "Kreditkarteninformationen sind erforderlich",
    path: ["cardNumber"]
  }
);

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get plan from query parameters
  const queryParams = new URLSearchParams(location.search);
  const plan = queryParams.get('plan') || "basic";
  
  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.basic;
  const isAuthenticated = authService.isAuthenticated();
  
  // For free package, redirect directly to dashboard
  useEffect(() => {
    if (plan === "free") {
      // Activate free package and redirect to dashboard
      const activateFreePackage = async () => {
        try {
          await orderService.createOrder({
            planId: "free",
            planName: planDetails.free.name,
            amount: 0,
            currency: "EUR",
            paymentMethod: "none",
            status: "completed"
          });
          
          toast({
            title: "Kostenloses Paket aktiviert",
            description: "Sie können jetzt Ihre kostenlose Website erstellen"
          });
          
          navigate("/dashboard?subscriptionActive=true");
        } catch (err) {
          console.error(err);
          toast({
            title: "Fehler",
            description: "Paket konnte nicht aktiviert werden",
            variant: "destructive"
          });
        }
      };
      
      if (isAuthenticated) {
        activateFreePackage();
      }
    }
  }, [plan, isAuthenticated, navigate, toast]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/sign-in?redirect=/checkout&plan=${plan}`);
    }
  }, [isAuthenticated, navigate, plan]);
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      paymentMethod: "credit_card",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Deutschland",
      acceptTerms: false
    }
  });
  
  const paymentMethod = form.watch("paymentMethod");
  
  const onSubmit = async (values: CheckoutFormValues) => {
    setIsProcessing(true);
    setError(null);
    setPaymentStatus("processing");
    
    try {
      // Process payment based on method
      let paymentResult;
      
      switch (values.paymentMethod) {
        case "credit_card":
          paymentResult = await paymentService.processCreditCardPayment({
            amount: selectedPlan.price,
            currency: "EUR",
            cardNumber: values.cardNumber || "",
            cardExpiry: values.cardExpiry || "",
            cardCvc: values.cardCvc || "",
            customerName: values.fullName,
            customerEmail: values.email,
            billingAddress: {
              address: values.address,
              city: values.city,
              postalCode: values.postalCode,
              country: values.country
            }
          });
          break;
          
        case "paypal":
          paymentResult = await paymentService.processPayPalPayment({
            amount: selectedPlan.price,
            currency: "EUR",
            customerName: values.fullName,
            customerEmail: values.email,
            billingAddress: {
              address: values.address,
              city: values.city,
              postalCode: values.postalCode,
              country: values.country
            }
          });
          break;
          
        case "bank_transfer":
          paymentResult = await paymentService.processBankTransferPayment({
            amount: selectedPlan.price,
            currency: "EUR",
            customerName: values.fullName,
            customerEmail: values.email,
            billingAddress: {
              address: values.address,
              city: values.city,
              postalCode: values.postalCode,
              country: values.country
            }
          });
          break;
          
        case "sofort":
          paymentResult = await paymentService.processSofortPayment({
            amount: selectedPlan.price,
            currency: "EUR",
            customerName: values.fullName,
            customerEmail: values.email,
            billingAddress: {
              address: values.address,
              city: values.city,
              postalCode: values.postalCode,
              country: values.country
            }
          });
          break;
          
        default:
          throw new Error("Ungültige Zahlungsmethode");
      }
      
      if (paymentResult.success) {
        setPaymentStatus("success");
        
        // Create order record
        await orderService.createOrder({
          planId: plan,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          currency: "EUR",
          paymentMethod: values.paymentMethod,
          paymentId: paymentResult.paymentId,
          status: "completed"
        });
        
        // Generate invoice
        const invoiceUrl = await orderService.generateInvoice({
          orderId: paymentResult.paymentId,
          customerName: values.fullName,
          customerEmail: values.email,
          billingAddress: {
            address: values.address,
            city: values.city,
            postalCode: values.postalCode,
            country: values.country
          },
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          currency: "EUR",
          paymentMethod: values.paymentMethod
        });
        
        toast({
          title: "Zahlung erfolgreich",
          description: `Ihr ${selectedPlan.name}-Paket wurde erfolgreich aktiviert.`
        });
        
        navigate(`/dashboard?subscriptionActive=true&plan=${plan}`);
      } else {
        setPaymentStatus("error");
        setError(paymentResult.message || "Bei der Verarbeitung Ihrer Zahlung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
      }
    } catch (err) {
      console.error(err);
      setPaymentStatus("error");
      setError("Bei der Verarbeitung Ihrer Zahlung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-6">Kasse</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Zahlungsinformationen</CardTitle>
                <CardDescription>Geben Sie Ihre Daten zur Abwicklung der Zahlung ein</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Persönliche Informationen</h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vollständiger Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Max Mustermann" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail</FormLabel>
                              <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Rechnungsadresse</h3>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <Input placeholder="Musterstraße 123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stadt</FormLabel>
                              <FormControl>
                                <Input placeholder="Berlin" {...field} />
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
                                <Input placeholder="10115" {...field} />
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
                                <Input placeholder="Deutschland" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Zahlungsmethode</h3>
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="credit_card" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Kreditkarte
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="paypal" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#003087">
                                      <path d="M20.1 5.5h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h.6c.1 0 .3-.1.3-.2l.2-1.5h.5c1.6 0 2.4-.8 2.7-2.3.1-.6 0-1.1-.3-1.4-.4-.8-1-1.3-2.6-1.3zM19.9 8.4c-.1.8-.6 1.3-1.4 1.3h-.5l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7.1.1.1.2.2.4 0-.5 0-.9 0-1.1zm-4.8-2.9h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.2c.1 0 .3-.1.3-.2l.3-1.7h.8c1.6 0 2.5-1 2.7-2.3.2-1.3-.6-2.5-2.9-2.5zm.3 2.5c-.1.8-.7 1.3-1.4 1.3h-.4l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7 0 .1.1.2.1.3 0-.4 0-.8 0-1z" />
                                      <path d="M9.8 5.5H8.4c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.3c.1 0 .3-.1.3-.2l1-6.3c.1-.1-.1-.2-.1-.2zm-2.5 0H6c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.2c.1 0 .3-.1.3-.2l.3-1.7h.8c1.6 0 2.5-1 2.7-2.3.2-1.3-.6-2.5-2.9-2.5zm.3 2.5c-.1.8-.7 1.3-1.4 1.3h-.4l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7.1.1.1.2.1.3 0-.4 0-.8 0-1z" />
                                      <path d="M16.4 5.5h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.3c.1 0 .3-.1.3-.2l1-6.3c0-.1-.1-.2-.2-.2zm-6.7 3.3c-.1-.3-.3-.5-.6-.5h-.2c-.2 0-.4.1-.5.4 0 0-.1.3-.1.4-.4 2.3-1.7 2.4-2.1 2.4h-.3c-.1 0-.1.1-.2.1l-.2 1.3c0 .1.1.2.2.2h.8c.9 0 1.8-.4 2.1-1.5l1-6c.1-.2 0-.4-.1-.6-.1-.1-.2-.2-.3-.2H8c-.1 0-.2.1-.2.2l-.1.4z" />
                                    </svg>
                                    PayPal
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="bank_transfer" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Banküberweisung
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="sofort" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2">
                                    <Euro className="h-4 w-4" />
                                    Sofortüberweisung
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {paymentMethod === "credit_card" && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kartennummer</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234 5678 9012 3456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid gap-4 grid-cols-2">
                            <FormField
                              control={form.control}
                              name="cardExpiry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ablaufdatum</FormLabel>
                                  <FormControl>
                                    <Input placeholder="MM/YY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="cardCvc"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sicherheitscode</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Ich akzeptiere die <a href="#" className="text-primary">AGB</a> und <a href="#" className="text-primary">Datenschutzbestimmungen</a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                      {isProcessing ? 'Zahlung wird verarbeitet...' : 'Zahlung abschließen'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-6">Bestellübersicht</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedPlan.name} Paket</CardTitle>
                <CardDescription>{selectedPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Preis</span>
                    <span>{selectedPlan.price.toFixed(2)}€ / Monat</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>MwSt. (19%)</span>
                    <span>{(selectedPlan.price * 0.19).toFixed(2)}€</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span>Gesamt</span>
                    <span>{(selectedPlan.price * 1.19).toFixed(2)}€</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 text-sm text-gray-500">
                <p>Die Zahlung wird über einen sicheren Server mit 256-Bit-SSL-Verschlüsselung verarbeitet.</p>
              </CardFooter>
            </Card>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Zahlungen werden empfangen via:</h3>
              <div className="flex gap-4">
                <svg className="h-8" viewBox="0 0 24 24" fill="#003087">
                  <path d="M20.1 5.5h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h.6c.1 0 .3-.1.3-.2l.2-1.5h.5c1.6 0 2.4-.8 2.7-2.3.1-.6 0-1.1-.3-1.4-.4-.8-1-1.3-2.6-1.3zM19.9 8.4c-.1.8-.6 1.3-1.4 1.3h-.5l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7.1.1.1.2.2.4 0-.5 0-.9 0-1.1zm-4.8-2.9h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.2c.1 0 .3-.1.3-.2l.3-1.7h.8c1.6 0 2.5-1 2.7-2.3.2-1.3-.6-2.5-2.9-2.5zm.3 2.5c-.1.8-.7 1.3-1.4 1.3h-.4l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7 0 .1.1.2.1.3 0-.4 0-.8 0-1z" />
                  <path d="M9.8 5.5H8.4c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.3c.1 0 .3-.1.3-.2l1-6.3c.1-.1-.1-.2-.1-.2zm-2.5 0H6c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.2c.1 0 .3-.1.3-.2l.3-1.7h.8c1.6 0 2.5-1 2.7-2.3.2-1.3-.6-2.5-2.9-2.5zm.3 2.5c-.1.8-.7 1.3-1.4 1.3h-.4l.2-1.2c0-.1.1-.1.2-.1h.2c.6 0 1 .2 1.1.7.1.1.1.2.1.3 0-.4 0-.8 0-1z" />
                  <path d="M16.4 5.5h-1.3c-.1 0-.3.1-.3.2l-1 6.3c0 .1.1.2.2.2h1.3c.1 0 .3-.1.3-.2l1-6.3c0-.1-.1-.2-.2-.2zm-6.7 3.3c-.1-.3-.3-.5-.6-.5h-.2c-.2 0-.4.1-.5.4 0 0-.1.3-.1.4-.4 2.3-1.7 2.4-2.1 2.4h-.3c-.1 0-.1.1-.2.1l-.2 1.3c0 .1.1.2.2.2h.8c.9 0 1.8-.4 2.1-1.5l1-6c.1-.2 0-.4-.1-.6-.1-.1-.2-.2-.3-.2H8c-.1 0-.2.1-.2.2l-.1.4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
