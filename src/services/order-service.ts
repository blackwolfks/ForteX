
import { supabase, Order, Invoice } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface OrderDetails {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
}

export interface InvoiceDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

class OrderService {
  // Neue Bestellung erstellen
  async createOrder(orderDetails: OrderDetails): Promise<Order> {
    try {
      // Benutzer-ID aus dem Auth-State abrufen oder einen Fallback verwenden
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

      const newOrder = {
        user_id: userId,
        plan_id: orderDetails.planId,
        plan_name: orderDetails.planName,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        payment_method: orderDetails.paymentMethod,
        payment_id: orderDetails.paymentId,
        status: orderDetails.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Bestellung in die Datenbank einfügen
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) throw error;

      return data as Order;
    } catch (error) {
      console.error('Fehler beim Erstellen der Bestellung:', error);
      
      // Fallback: In localStorage speichern, wenn die DB-Verbindung fehlschlägt
      const orderId = uuidv4();
      const order = {
        id: orderId,
        ...orderDetails,
        user_id: localStorage.getItem("userId") || "guest",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const existingOrders = this.getUserOrdersFromLocalStorage();
      existingOrders.push(order as unknown as Order);
      localStorage.setItem("user_orders", JSON.stringify(existingOrders));
      
      return order as Order;
    }
  }
  
  // Hilfsfunktion zum Laden von Bestellungen aus localStorage
  private getUserOrdersFromLocalStorage(): Order[] {
    const userId = localStorage.getItem("userId") || "guest";
    const ordersJson = localStorage.getItem("user_orders");
    
    if (!ordersJson) {
      return [];
    }
    
    try {
      const allOrders = JSON.parse(ordersJson) as Order[];
      return allOrders.filter(order => order.user_id === userId);
    } catch (err) {
      console.error("Fehler beim Parsen der Bestellungen aus dem localStorage", err);
      return [];
    }
  }
  
  // Benutzerbestellungen abrufen
  async getUserOrders(): Promise<Order[]> {
    try {
      // Benutzer-ID aus dem Auth-State abrufen oder einen Fallback verwenden
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

      // Bestellungen aus der Datenbank abrufen
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as Order[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Bestellungen:', error);
      
      // Fallback: Aus localStorage laden, wenn die DB-Verbindung fehlschlägt
      return this.getUserOrdersFromLocalStorage();
    }
  }
  
  // Bestellung nach ID abrufen
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      // Bestellung aus der Datenbank abrufen
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return data as Order;
    } catch (error) {
      console.error('Fehler beim Abrufen der Bestellung:', error);
      
      // Fallback: Aus localStorage laden
      const orders = this.getUserOrdersFromLocalStorage();
      return orders.find(order => order.id === orderId) || null;
    }
  }
  
  // Bestellstatus aktualisieren
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
    try {
      // Bestellung in der Datenbank aktualisieren
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      return data as Order;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bestellung:', error);
      
      // Fallback: In localStorage aktualisieren
      const orders = this.getUserOrdersFromLocalStorage();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        return null;
      }
      
      orders[orderIndex].status = status;
      orders[orderIndex].updated_at = new Date().toISOString();
      
      localStorage.setItem("user_orders", JSON.stringify(orders));
      
      return orders[orderIndex];
    }
  }
  
  // Rechnung für eine Bestellung generieren
  async generateInvoice(invoiceDetails: InvoiceDetails): Promise<string> {
    try {
      const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const invoiceDate = new Date().toISOString();
      const invoiceUrl = `/invoices/${invoiceNumber}.pdf`;
      
      const newInvoice = {
        order_id: invoiceDetails.orderId,
        customer_name: invoiceDetails.customerName,
        customer_email: invoiceDetails.customerEmail,
        billing_address: invoiceDetails.billingAddress,
        plan_name: invoiceDetails.planName,
        amount: invoiceDetails.amount,
        currency: invoiceDetails.currency,
        payment_method: invoiceDetails.paymentMethod,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        invoice_url: invoiceUrl,
      };
      
      // Rechnung in die Datenbank einfügen
      const { error } = await supabase
        .from('invoices')
        .insert([newInvoice]);
        
      if (error) throw error;
      
      return invoiceUrl;
    } catch (error) {
      console.error('Fehler beim Generieren der Rechnung:', error);
      
      // Fallback: Simulierte Rechnung ohne Speicherung
      const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Update der lokalen Bestellung mit Rechnungsinformationen
      const orders = this.getUserOrdersFromLocalStorage();
      const orderIndex = orders.findIndex(order => order.id === invoiceDetails.orderId);
      
      if (orderIndex !== -1) {
        const invoiceUrl = `/invoices/${invoiceNumber}.pdf`;
        orders[orderIndex].invoice = {
          id: uuidv4(),
          order_id: invoiceDetails.orderId,
          customer_name: invoiceDetails.customerName,
          customer_email: invoiceDetails.customerEmail,
          billing_address: invoiceDetails.billingAddress,
          plan_name: invoiceDetails.planName,
          amount: invoiceDetails.amount,
          currency: invoiceDetails.currency,
          payment_method: invoiceDetails.paymentMethod,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString(),
          invoice_url: invoiceUrl,
        };
        
        localStorage.setItem("user_orders", JSON.stringify(orders));
      }
      
      return `/invoices/${invoiceNumber}.pdf`;
    }
  }
  
  // Aktives Abonnement des Benutzers abrufen
  async getActiveSubscription(): Promise<Order | null> {
    try {
      // Benutzer-ID aus dem Auth-State abrufen oder einen Fallback verwenden
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

      // Abgeschlossene Bestellungen aus der Datenbank abrufen und nach Datum sortieren
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0 ? data[0] as Order : null;
    } catch (error) {
      console.error('Fehler beim Abrufen des aktiven Abonnements:', error);
      
      // Fallback: Aus localStorage laden
      const orders = this.getUserOrdersFromLocalStorage();
      // Filter abgeschlossene Bestellungen und sortiere nach Datum (neueste zuerst)
      const completedOrders = orders
        .filter(order => order.status === "completed")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Gib die neueste abgeschlossene Bestellung als aktives Abonnement zurück
      return completedOrders.length > 0 ? completedOrders[0] : null;
    }
  }
}

export const orderService = new OrderService();
