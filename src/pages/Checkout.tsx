
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
import { loadPayPalScript, PayPalButtons } from "@paypal/paypal-js";
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
    
    // Load PayPal script
    const initPayPal = async () => {
      try {
        await loadPayPalScript({ "client-id": "test" });
        setPaypalLoaded(true);
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
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: totalAmount.toString(),
                    },
                  }],
                });
              }}
              onApprove={async (data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture();
                  handlePaymentSuccess(details);
                }
              }}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Checkout;
