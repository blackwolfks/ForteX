
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orderService } from "@/services/order-service";
import type { Order, Invoice } from "@/services/order-service";
import { authService } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, User, Receipt, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Order | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load user's orders
    const loadOrders = async () => {
      try {
        const userOrders = await orderService.getUserOrders();
        setOrders(userOrders);
        
        // Get active subscription
        const subscription = await orderService.getActiveSubscription();
        setActiveSubscription(subscription);
      } catch (error) {
        console.error("Failed to load orders:", error);
        toast({
          title: "Fehler",
          description: "Bestellungen konnten nicht geladen werden.",
          variant: "destructive"
        });
      }
    };
    
    loadOrders();
  }, [toast]);
  
  const handleDownloadInvoice = (order: Order) => {
    if (!order.invoice?.invoice_url) {
      toast({
        title: "Rechnung nicht verfügbar",
        description: "Für diese Bestellung ist keine Rechnung verfügbar.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would download the invoice PDF
    toast({
      title: "Rechnung wird heruntergeladen",
      description: `Rechnung Nr. ${order.invoice.invoice_number} wird heruntergeladen.`
    });
  };
  
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "credit_card": return "Kreditkarte";
      case "paypal": return "PayPal";
      case "bank_transfer": return "Banküberweisung";
      case "sofort": return "Sofortüberweisung";
      case "none": return "Kostenlos";
      default: return method;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleLogout = () => {
    authService.signOut();
    navigate("/");
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Mein Profil</h1>
      
      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="orders">Bestellungen</TabsTrigger>
          <TabsTrigger value="account">Konto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktuelles Abonnement</CardTitle>
              <CardDescription>Ihr aktueller Abonnementstatus und Paketverwaltung</CardDescription>
            </CardHeader>
            <CardContent>
              {activeSubscription ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h3 className="text-lg font-medium">{activeSubscription.plan_name} Paket</h3>
                    <p className="text-muted-foreground">Aktiviert am {formatDate(activeSubscription.created_at)}</p>
                    
                    <div className="mt-4 grid gap-2">
                      <div className="flex justify-between">
                        <span>Preis</span>
                        <span>{activeSubscription.amount.toFixed(2)}€ / Monat</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zahlungsmethode</span>
                        <span>{getPaymentMethodName(activeSubscription.payment_method)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                          Aktiv
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {activeSubscription.plan_id !== "pro" && (
                    <div className="rounded-md border p-4">
                      <h4 className="text-sm font-medium">Upgrade auf ein höheres Paket</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Erweitern Sie Ihre Möglichkeiten mit unserem Pro-Paket.
                      </p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => navigate("/checkout?plan=pro")}
                      >
                        Upgrade auf Pro
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Kein aktives Abonnement</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sie haben derzeit kein aktives Abonnement.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate("/checkout?plan=basic")}
                  >
                    Paket auswählen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bestellungen & Rechnungen</CardTitle>
              <CardDescription>Übersicht über Ihre Bestellungen und Zahlungen</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-md p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{order.plan_name} Paket</h4>
                          <p className="text-sm text-muted-foreground">
                            Bestellung am {formatDate(order.created_at)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : order.status === "pending" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-red-100 text-red-800"
                        }`}>
                          {order.status === "completed" ? "Abgeschlossen" : 
                           order.status === "pending" ? "Ausstehend" : 
                           order.status === "cancelled" ? "Storniert" : "Erstattet"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Bestellnummer:</span>
                          <span className="ml-2 font-mono">{order.id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Betrag:</span>
                          <span className="ml-2">{order.amount.toFixed(2)}€</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Zahlungsmethode:</span>
                          <span className="ml-2">{getPaymentMethodName(order.payment_method)}</span>
                        </div>
                        {order.invoice?.invoice_number && (
                          <div>
                            <span className="text-muted-foreground">Rechnungsnummer:</span>
                            <span className="ml-2">{order.invoice.invoice_number}</span>
                          </div>
                        )}
                      </div>
                      
                      {order.invoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleDownloadInvoice(order)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Rechnung herunterladen
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Keine Bestellungen</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sie haben noch keine Bestellungen getätigt.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate("/checkout?plan=basic")}
                  >
                    Jetzt bestellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontoeinstellungen</CardTitle>
              <CardDescription>Verwalten Sie Ihre Kontoeinstellungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Persönliche Informationen</h3>
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie Ihre persönlichen Informationen und Kontodaten.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => toast({
                  title: "Coming soon",
                  description: "Diese Funktion wird in Kürze verfügbar sein.",
                })}
              >
                <User className="mr-2 h-4 w-4" />
                Profil bearbeiten
              </Button>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Konto löschen</h4>
                <p className="text-sm text-muted-foreground">
                  Löschen Sie Ihr Konto und alle zugehörigen Daten.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleLogout}>Abmelden</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => toast({
                    title: "Coming soon",
                    description: "Diese Funktion wird in Kürze verfügbar sein.",
                  })}
                >
                  Konto löschen
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
