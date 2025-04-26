
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { orderService } from '@/services/order-service';
import { productService } from '@/services/product';
import { ProductCartItem } from '@/services/product/types';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';

const Checkout = () => {
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
    const initPayPal = () => {
      try {
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <OrderSummary 
        cartItems={cartItems}
        totalAmount={totalAmount}
        isLoading={isLoading}
      />
      <PaymentMethods 
        onPaymentSuccess={handlePaymentSuccess}
        cartItems={cartItems}
        paypalLoaded={paypalLoaded}
      />
    </div>
  );
};

export default Checkout;
