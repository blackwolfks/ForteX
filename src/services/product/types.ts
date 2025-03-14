
import { Product as SupabaseProduct } from '@/lib/supabase';

// Re-export the Product type from lib/supabase
export type Product = SupabaseProduct;

export interface CreateProductInput {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  category: string;
  isSubscription: boolean;
  subscriptionInterval?: string;
  cfxResourceId?: string;
  cfxImported: boolean;
  image?: string;
}
