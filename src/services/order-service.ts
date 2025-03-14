import { supabase } from '@/lib/supabase';
import type { Order, Invoice } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { ProductCartItem } from '@/services/product/types';

export type { Order, Invoice };

export interface OrderDetails {
  planId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentId?: string;
  status?: "pending" | "completed" | "cancelled" | "refunded";
  items?: ProductCartItem[];
}

export interface InvoiceDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  planName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

class OrderService {
  async createOrder(orderDetails: OrderDetails): Promise<Order> {
    try {
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

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) throw error;

      return data as Order;
    } catch (error) {
      console.error('Fehler beim Erstellen der Bestellung:', error);
      
      const orderId = uuidv4();
      const order = {
        id: orderId,
        user_id: localStorage.getItem("userId") || "guest",
        plan_id: orderDetails.planId,
        plan_name: orderDetails.planName,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        payment_method: orderDetails.paymentMethod,
        payment_id: orderDetails.paymentId,
        status: orderDetails.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Order;
      
      const existingOrders = this.getUserOrdersFromLocalStorage();
      existingOrders.push(order);
      localStorage.setItem("user_orders", JSON.stringify(existingOrders));
      
      return order;
    }
  }
  
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
  
  async getUserOrders(): Promise<Order[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as Order[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Bestellungen:', error);
      
      return this.getUserOrdersFromLocalStorage();
    }
  }
  
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return data as Order;
    } catch (error) {
      console.error('Fehler beim Abrufen der Bestellung:', error);
      
      const orders = this.getUserOrdersFromLocalStorage();
      return orders.find(order => order.id === orderId) || null;
    }
  }
  
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
    try {
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
      
      const { error } = await supabase
        .from('invoices')
        .insert([newInvoice]);
        
      if (error) throw error;
      
      return invoiceUrl;
    } catch (error) {
      console.error('Fehler beim Generieren der Rechnung:', error);
      
      const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
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
  
  async getActiveSubscription(): Promise<Order | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

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
      
      const orders = this.getUserOrdersFromLocalStorage();
      const completedOrders = orders
        .filter(order => order.status === "completed")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return completedOrders.length > 0 ? completedOrders[0] : null;
    }
  }
}

export const orderService = new OrderService();
