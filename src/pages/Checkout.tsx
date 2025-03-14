
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authService } from '@/services/auth-service';
import { paymentService } from '@/services/payment-service';
import { orderService } from '@/services/order-service';
import { ProductCartItem } from '@/services/product/types';
import { productService } from '@/services/product';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<ProductCartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const items = await productService.getCartItems();
        setCartItems(items);
        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setTotalAmount(total);
      } catch (error) {
        toast.error('Fehler beim Laden des Warenkorbs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartItems();
    
    // Load PayPal script - using window script tag instead of library function
    const initPayPal = () => {
      try {
        // Create a script element to load PayPal
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'}`;
        script.async = true;
        script.onload = () => {
          console.log('PayPal script loaded successfully');
          setPaypalLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load PayPal script');
          toast.error("Fehler beim Laden von PayPal");
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Failed to load PayPal script:", error);
        toast.error("Fehler beim Laden von PayPal");
      }
    };
    
    initPayPal();
  }, []);

  const handlePaymentSuccess = async (details: any) => {
    try {
      await orderService.createOrder({
        items: cartItems,
        paymentId: details.id,
        status: "completed",
        paymentMethod: "paypal"
      });
      toast.success('Zahlung erfolgreich! Vielen Dank für Ihren Einkauf.');
      navigate('/thank-you');
    } catch (error) {
      toast.error('Fehler beim Verarbeiten der Bestellung');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="checkout-container">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Überprüfen Sie Ihre Bestellung und bezahlen Sie.</CardDescription>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div>Ihr Warenkorb ist leer.</div>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <h4>{item.name}</h4>
                  <p>Preis: {item.price} €</p>
                  <p>Menge: {item.quantity}</p>
                  <Separator />
                </div>
              ))}
              <h3>Gesamtbetrag: {totalAmount} €</h3>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {paypalLoaded && cartItems.length > 0 && (
            <div id="paypal-button-container" className="w-full">
              {/* PayPal buttons will be rendered here by the PayPal JS SDK */}
              <Button 
                onClick={() => {
                  // Simulate PayPal payment for demo purposes
                  toast.info('PayPal Zahlung wird simuliert...');
                  setTimeout(() => {
                    handlePaymentSuccess({ id: 'sim-' + Date.now() });
                  }, 2000);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Mit PayPal bezahlen (Demo)
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Checkout;
