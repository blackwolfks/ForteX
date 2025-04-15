
import { Database } from '@/integrations/supabase/types';

// Extract specific types from the Database type
export type Order = Database['public']['Tables']['orders']['Row'];
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
