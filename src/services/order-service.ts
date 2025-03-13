
// Order service to handle order creation and management
// In a real application, this would store orders in a database and handle invoice generation

// User orders stored in local storage for demo purposes
const ORDERS_STORAGE_KEY = "user_orders";

export interface OrderDetails {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
}

export interface Invoice {
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
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceUrl?: string;
}

export interface Order extends OrderDetails {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
}

class OrderService {
  // Create a new order
  async createOrder(orderDetails: OrderDetails): Promise<Order> {
    const userId = localStorage.getItem("userId") || "guest";
    
    const order: Order = {
      id: `order-${Math.random().toString(36).substring(2, 10)}`,
      userId,
      ...orderDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store order in local storage
    const existingOrders = this.getUserOrders();
    existingOrders.push(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existingOrders));
    
    return order;
  }
  
  // Get user orders
  getUserOrders(): Order[] {
    const userId = localStorage.getItem("userId") || "guest";
    const ordersJson = localStorage.getItem(ORDERS_STORAGE_KEY);
    
    if (!ordersJson) {
      return [];
    }
    
    try {
      const allOrders = JSON.parse(ordersJson) as Order[];
      return allOrders.filter(order => order.userId === userId);
    } catch (err) {
      console.error("Error parsing orders from local storage", err);
      return [];
    }
  }
  
  // Get order by ID
  getOrderById(orderId: string): Order | null {
    const orders = this.getUserOrders();
    return orders.find(order => order.id === orderId) || null;
  }
  
  // Update order status
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
    const orders = this.getUserOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return null;
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    
    return orders[orderIndex];
  }
  
  // Generate invoice for an order
  async generateInvoice(invoice: Invoice): Promise<string> {
    // In a real application, this would generate a PDF invoice
    console.log("Generating invoice", invoice);
    
    const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invoiceDate = new Date().toISOString();
    
    // Update the order with invoice information
    const orders = this.getUserOrders();
    const orderIndex = orders.findIndex(order => order.id === invoice.orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].invoice = {
        ...invoice,
        invoiceNumber,
        invoiceDate,
        invoiceUrl: `/invoices/${invoiceNumber}.pdf`
      };
      
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
    
    // Return simulated invoice URL
    return `/invoices/${invoiceNumber}.pdf`;
  }
  
  // Get user's active subscription
  getActiveSubscription(): Order | null {
    const orders = this.getUserOrders();
    // Filter completed orders and sort by date (newest first)
    const completedOrders = orders
      .filter(order => order.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Return the most recent completed order as the active subscription
    return completedOrders.length > 0 ? completedOrders[0] : null;
  }
}

export const orderService = new OrderService();
