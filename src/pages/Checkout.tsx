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
import { PayPalScriptProvider, PayPalButtons } from '@paypal/paypal-js';
import { ProductCartItem } from '@/services/product/types';
import { productService } from '@/services/product';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<ProductCartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handlePaymentSuccess = async (details: any) => {
    try {
      await orderService.createOrder({
        items: cartItems,
        paymentId: details.id,
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
          <PayPalScriptProvider options={{ "client-id": "test" }}>
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
                const details = await actions.order.capture();
                handlePaymentSuccess(details);
              }}
            />
          </PayPalScriptProvider>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Checkout;
