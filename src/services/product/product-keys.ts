
import { supabase } from '@/lib/supabase';

export class ProductKeyService {
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

export const productKeyService = new ProductKeyService();
