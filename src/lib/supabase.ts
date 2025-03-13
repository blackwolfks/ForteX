
import { createClient } from '@supabase/supabase-js';

// Ersetze diese Werte mit deinen eigenen Supabase-Anmeldedaten
// In einer Produktionsumgebung sollten diese in Umgebungsvariablen gespeichert werden
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Supabase-Client erstellen
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Typdefinitionen für Datenbanktabellen
export type Product = {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  category: string;
  is_subscription: boolean;
  subscription_interval?: string;
  cfx_resource_id?: string;
  cfx_imported: boolean;
  image?: string;
  created_at: string;
  user_id: string;
};

export type Order = {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_id?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  two_factor_enabled: boolean;
  two_factor_method: "email" | "phone" | "authenticator" | null;
  phone_number: string | null;
};

export type Invoice = {
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
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_url?: string;
};
