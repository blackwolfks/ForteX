
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ProductCartItem } from '@/services/product/types';

interface PayPalPaymentProps {
  onPaymentSuccess: (details: any) => Promise<void>;
  cartItems: ProductCartItem[];
  paypalLoaded: boolean;
}

export const PayPalPayment = ({ onPaymentSuccess, cartItems, paypalLoaded }: PayPalPaymentProps) => {
  if (!paypalLoaded || cartItems.length === 0) return null;

  return (
    <div id="paypal-button-container" className="w-full">
      <Button 
        onClick={() => {
          toast.info('PayPal Zahlung wird simuliert...');
          setTimeout(() => {
            onPaymentSuccess({ id: 'sim-' + Date.now() });
          }, 2000);
        }}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        Mit PayPal bezahlen (Demo)
      </Button>
    </div>
  );
};
