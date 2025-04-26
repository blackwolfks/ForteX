
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PayPalPayment } from './PayPalPayment';
import { ProductCartItem } from '@/services/product/types';

interface PaymentMethodsProps {
  onPaymentSuccess: (details: any) => Promise<void>;
  cartItems: ProductCartItem[];
  paypalLoaded: boolean;
}

export const PaymentMethods = ({ onPaymentSuccess, cartItems, paypalLoaded }: PaymentMethodsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zahlungsmethoden</CardTitle>
        <CardDescription>Wählen Sie Ihre bevorzugte Zahlungsmethode.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <PayPalPayment 
            onPaymentSuccess={onPaymentSuccess}
            cartItems={cartItems}
            paypalLoaded={paypalLoaded}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
      </CardFooter>
    </Card>
  );
};
