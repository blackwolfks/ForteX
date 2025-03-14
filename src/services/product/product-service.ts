
import { supabase } from '@/lib/supabase';
import { Product, CreateProductInput } from './types';
import { productLocalStorage } from './local-storage';
import { productKeyService } from './product-keys';

class ProductService {
  async createProduct(productData: CreateProductInput): Promise<Product> {
    try {
      // Get user ID from the Auth state
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const userId = userData.user.id;
      
      const newProduct: Omit<Product, 'id' | 'created_at'> = {
        name: productData.name,
        description: productData.description,
        short_description: productData.shortDescription,
        price: productData.price,
        category: productData.category,
        is_subscription: productData.isSubscription,
        subscription_interval: productData.subscriptionInterval,
        cfx_resource_id: productData.cfxResourceId,
        cfx_imported: productData.cfxImported,
        image: productData.image,
        user_id: userId,
      };

      // Insert product into the database
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Fallback: Save to localStorage if DB connection fails
        return productLocalStorage.saveProductToLocalStorage(productData, userId);
      }

      return data as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Get user ID for local storage 
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || productLocalStorage.getLocalUserId();
      
      // Fallback: Save to localStorage if DB connection fails
      return productLocalStorage.saveProductToLocalStorage(productData, userId);
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const userId = userData.user.id;
      
      // Only fetch products for the current user
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)  // Only select products belonging to current user
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add local products for the current user
      const localProducts = productLocalStorage.getLocalProducts(userId);
      
      return [...(data || []), ...localProducts];
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Try to get user ID for local storage
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || productLocalStorage.getLocalUserId();
      
      // Fallback: Load from localStorage
      return productLocalStorage.getLocalProducts(userId);
    }
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      // First check the database
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) return data;
      
      // If not in the database, check localStorage
      if (userId) {
        const localProducts = productLocalStorage.getLocalProducts(userId);
        return localProducts.find(p => p.id === productId) || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      
      // Try to get user ID for local storage
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || productLocalStorage.getLocalUserId();
      
      // Fallback: Check localStorage
      const localProducts = productLocalStorage.getLocalProducts(userId);
      return localProducts.find(p => p.id === productId) || null;
    }
  }

  async updateProduct(productId: string, productData: Partial<CreateProductInput>): Promise<Product | null> {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Check if it's a local product
      const localProducts = productLocalStorage.getLocalProducts(userId);
      const localProductIndex = localProducts.findIndex(p => p.id === productId);
      
      if (localProductIndex >= 0) {
        // Update local product
        return productLocalStorage.updateLocalProduct(productId, productData, userId);
      }
      
      // If not a local product, update in the database
      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          short_description: productData.shortDescription,
          price: productData.price,
          category: productData.category,
          is_subscription: productData.isSubscription,
          subscription_interval: productData.subscriptionInterval,
          cfx_resource_id: productData.cfxResourceId,
          cfx_imported: productData.cfxImported,
          image: productData.image,
        })
        .eq('id', productId)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Check if it's a local product
      const isLocalDeleted = productLocalStorage.deleteLocalProduct(productId, userId);
      if (isLocalDeleted) {
        return true;
      }
      
      // If not a local product, delete from the database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async generateProductKey(productId: string): Promise<string> {
    return productKeyService.generateProductKey(productId);
  }
}

export const productService = new ProductService();
