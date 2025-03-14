
import { supabase, Product as SupabaseProduct } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
        return this.saveProductToLocalStorage(productData);
      }

      return data as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Fallback: Save to localStorage if DB connection fails
      return this.saveProductToLocalStorage(productData);
    }
  }

  // Helper function to save to localStorage
  private saveProductToLocalStorage(productData: CreateProductInput): Product {
    const productId = uuidv4();
    const now = new Date().toISOString();
    
    // Get user ID from localStorage if available
    const authUserString = localStorage.getItem('supabase.auth.token');
    let userId = 'local-' + uuidv4();
    
    if (authUserString) {
      try {
        const authData = JSON.parse(authUserString);
        if (authData?.user?.id) {
          userId = authData.user.id;
        }
      } catch (e) {
        console.error('Error parsing auth data from localStorage:', e);
      }
    }
    
    const product: Product = {
      id: productId,
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
      created_at: now,
      user_id: userId,
    };

    // Store only products for the current user
    const localProductsKey = `products_${userId}`;
    const existingProducts = JSON.parse(localStorage.getItem(localProductsKey) || '[]');
    localStorage.setItem(localProductsKey, JSON.stringify([...existingProducts, product]));
    
    return product;
  }

  async getProducts(): Promise<Product[]> {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const userId = userData.user.id;
      
      // Try to fetch products from the database (RLS will filter for current user)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add local products for the current user
      const localProducts = this.getLocalProducts(userId);
      
      return [...(data || []), ...localProducts];
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Try to get user ID for local storage
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || this.getLocalUserId();
      
      // Fallback: Load from localStorage
      return this.getLocalProducts(userId);
    }
  }

  // Helper function to get local user ID
  private getLocalUserId(): string {
    const authUserString = localStorage.getItem('supabase.auth.token');
    if (authUserString) {
      try {
        const authData = JSON.parse(authUserString);
        if (authData?.user?.id) {
          return authData.user.id;
        }
      } catch (e) {
        console.error('Error parsing auth data from localStorage:', e);
      }
    }
    return 'local-user';
  }

  // Helper function to fetch from localStorage
  private getLocalProducts(userId: string): Product[] {
    const localProductsKey = `products_${userId}`;
    const localProducts = JSON.parse(localStorage.getItem(localProductsKey) || '[]');
    return localProducts;
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
        const localProducts = this.getLocalProducts(userId);
        return localProducts.find(p => p.id === productId) || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      
      // Try to get user ID for local storage
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || this.getLocalUserId();
      
      // Fallback: Check localStorage
      const localProducts = this.getLocalProducts(userId);
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
      const localProducts = this.getLocalProducts(userId);
      const localProductIndex = localProducts.findIndex(p => p.id === productId);
      
      if (localProductIndex >= 0) {
        // Update the local product
        const updatedProduct = {
          ...localProducts[localProductIndex],
          name: productData.name || localProducts[localProductIndex].name,
          description: productData.description || localProducts[localProductIndex].description,
          short_description: productData.shortDescription || localProducts[localProductIndex].short_description,
          price: productData.price || localProducts[localProductIndex].price,
          category: productData.category || localProducts[localProductIndex].category,
          is_subscription: productData.isSubscription !== undefined ? productData.isSubscription : localProducts[localProductIndex].is_subscription,
          subscription_interval: productData.subscriptionInterval,
          cfx_resource_id: productData.cfxResourceId,
          cfx_imported: productData.cfxImported !== undefined ? productData.cfxImported : localProducts[localProductIndex].cfx_imported,
          image: productData.image || localProducts[localProductIndex].image,
        };
        
        localProducts[localProductIndex] = updatedProduct;
        const localProductsKey = `products_${userId}`;
        localStorage.setItem(localProductsKey, JSON.stringify(localProducts));
        
        return updatedProduct;
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
      const localProducts = this.getLocalProducts(userId);
      const localProductIndex = localProducts.findIndex(p => p.id === productId);
      
      if (localProductIndex >= 0) {
        // Delete the local product
        localProducts.splice(localProductIndex, 1);
        const localProductsKey = `products_${userId}`;
        localStorage.setItem(localProductsKey, JSON.stringify(localProducts));
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
    // Generate a product key in format XXXX-XXXX-XXXX-XXXX
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      if (i < 3) key += '-';
    }
    
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Verify that the product belongs to the current user
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
        
      if (productError) throw productError;
      
      if (!productData || productData.user_id !== userData.user.id) {
        throw new Error("Product not found or access denied");
      }
      
      // Store the key in a separate table in the database
      const { error } = await supabase
        .from('product_keys')
        .insert([
          { 
            product_id: productId, 
            key: key, 
            is_used: false
          }
        ]);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving product key:', error);
      // Fallback: Generate key but don't save
    }
    
    return key;
  }
}

export const productService = new ProductService();
