
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductCartItem } from '@/services/product/types';

interface OrderSummaryProps {
  cartItems: ProductCartItem[];
  totalAmount: number;
  isLoading: boolean;
}

export const OrderSummary = ({ cartItems, totalAmount, isLoading }: OrderSummaryProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bestellübersicht</CardTitle>
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
    </Card>
  );
};
