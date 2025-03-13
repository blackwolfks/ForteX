
import { supabase, Product } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
      // Benutzer-ID aus dem Auth-State abrufen oder einen Fallback verwenden
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'anonymous';

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

      // Produkt in die Datenbank einfügen
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;

      return data as Product;
    } catch (error) {
      console.error('Fehler beim Erstellen des Produkts:', error);
      
      // Fallback: In localStorage speichern, wenn die DB-Verbindung fehlschlägt
      const productId = uuidv4();
      const product = {
        id: productId,
        ...productData,
        created_at: new Date().toISOString(),
        user_id: 'anonymous',
      };

      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      localStorage.setItem('products', JSON.stringify([...existingProducts, product]));
      
      // Wir wandeln hier das Format um, um der Datenbankstruktur zu entsprechen
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        short_description: product.shortDescription,
        price: product.price,
        category: product.category,
        is_subscription: product.isSubscription,
        subscription_interval: product.subscriptionInterval,
        cfx_resource_id: product.cfxResourceId,
        cfx_imported: product.cfxImported,
        image: product.image,
        created_at: product.created_at,
        user_id: product.user_id,
      };
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      // Produkte aus der Datenbank abrufen
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Produkte:', error);
      
      // Fallback: Aus localStorage laden, wenn die DB-Verbindung fehlschlägt
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Format der lokalen Produkte anpassen, um mit der DB-Struktur übereinzustimmen
      return localProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        short_description: product.shortDescription || '',
        price: product.price,
        category: product.category,
        is_subscription: product.isSubscription || false,
        subscription_interval: product.subscriptionInterval,
        cfx_resource_id: product.cfxResourceId,
        cfx_imported: product.cfxImported || false,
        image: product.image,
        created_at: product.createdAt || product.created_at || new Date().toISOString(),
        user_id: product.userId || product.user_id || 'anonymous',
      }));
    }
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen des Produkts:', error);
      
      // Fallback: Aus localStorage laden
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const product = localProducts.find((p: any) => p.id === productId);
      
      if (!product) return null;
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        short_description: product.shortDescription || '',
        price: product.price,
        category: product.category,
        is_subscription: product.isSubscription || false,
        subscription_interval: product.subscriptionInterval,
        cfx_resource_id: product.cfxResourceId,
        cfx_imported: product.cfxImported || false,
        image: product.image,
        created_at: product.createdAt || product.created_at || new Date().toISOString(),
        user_id: product.userId || product.user_id || 'anonymous',
      };
    }
  }

  async updateProduct(productId: string, productData: Partial<CreateProductInput>): Promise<Product | null> {
    try {
      // Produkt in der Datenbank aktualisieren
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
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Produkts:', error);
      
      // Fallback: In localStorage aktualisieren
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const productIndex = localProducts.findIndex((p: any) => p.id === productId);
      
      if (productIndex === -1) return null;
      
      const updatedProduct = {
        ...localProducts[productIndex],
        ...productData,
      };
      
      localProducts[productIndex] = updatedProduct;
      localStorage.setItem('products', JSON.stringify(localProducts));
      
      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        short_description: updatedProduct.shortDescription || '',
        price: updatedProduct.price,
        category: updatedProduct.category,
        is_subscription: updatedProduct.isSubscription || false,
        subscription_interval: updatedProduct.subscriptionInterval,
        cfx_resource_id: updatedProduct.cfxResourceId,
        cfx_imported: updatedProduct.cfxImported || false,
        image: updatedProduct.image,
        created_at: updatedProduct.createdAt || updatedProduct.created_at || new Date().toISOString(),
        user_id: updatedProduct.userId || updatedProduct.user_id || 'anonymous',
      };
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      // Produkt aus der Datenbank löschen
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Produkts:', error);
      
      // Fallback: Aus localStorage löschen
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const filteredProducts = localProducts.filter((p: any) => p.id !== productId);
      localStorage.setItem('products', JSON.stringify(filteredProducts));
      
      return true;
    }
  }

  async generateProductKey(productId: string): Promise<string> {
    // Generiert einen Produktschlüssel im Format XXXX-XXXX-XXXX-XXXX
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      if (i < 3) key += '-';
    }
    
    try {
      // In der Praxis würden wir den Schlüssel in einer separaten Tabelle in der Datenbank speichern
      const { error } = await supabase
        .from('product_keys')
        .insert([
          { 
            product_id: productId, 
            key: key, 
            is_used: false, 
            created_at: new Date().toISOString() 
          }
        ]);
        
      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Speichern des Produktschlüssels:', error);
      // Fallback: Schlüssel nur generieren, aber nicht speichern
    }
    
    return key;
  }
}

export const productService = new ProductService();
