
import { Database } from '@/integrations/supabase/types';

// Extract specific types from the Database type
export type Order = Database['public']['Tables']['orders']['Row'] & {
  invoice?: {
    id: string;
    order_id: string;
    customer_name: string;
    customer_email: string;
    billing_address: {
      address: string;
      city: string;
      postal_code: string;
      country: string;
    };
    plan_name?: string;
    amount: number;
    currency: string;
    payment_method: string;
    invoice_number: string;
    invoice_date: string;
    invoice_url: string;
  }
};
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];

// Add any other types needed from the database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
