
// Import from the correct location
import type { Product } from '@/lib/types';

export type { Product };

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

export interface ProductCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isSubscription?: boolean;
  subscriptionInterval?: string;
}
