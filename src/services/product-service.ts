
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
      // Benutzer-ID aus dem Auth-State abrufen
      const { data: userData } = await supabase.auth.getUser();
      
      // Wenn kein Benutzer eingeloggt ist, einen temporären Eintrag im localStorage erstellen
      if (!userData?.user) {
        console.log('Kein Benutzer eingeloggt, speichere Produkt im localStorage');
        return this.saveProductToLocalStorage(productData);
      }
      
      // Wenn ein Benutzer eingeloggt ist, in Supabase speichern
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

      // Produkt in die Datenbank einfügen
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Speichern in Supabase:', error);
        throw error;
      }

      return data as Product;
    } catch (error) {
      console.error('Fehler beim Erstellen des Produkts:', error);
      
      // Fallback: In localStorage speichern, wenn die DB-Verbindung fehlschlägt
      return this.saveProductToLocalStorage(productData);
    }
  }

  // Hilfsfunktion zum Speichern im localStorage
  private saveProductToLocalStorage(productData: CreateProductInput): Product {
    const productId = uuidv4();
    const now = new Date().toISOString();
    
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
      user_id: 'local-' + uuidv4(), // Lokaler Platzhalter für user_id
    };

    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    localStorage.setItem('products', JSON.stringify([...existingProducts, product]));
    
    return product;
  }

  async getProducts(): Promise<Product[]> {
    try {
      // Versuche zuerst, Produkte aus der Datenbank zu laden
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Füge lokale Produkte hinzu, wenn welche vorhanden sind
      const localProducts = this.getLocalProducts();
      
      return [...(data || []), ...localProducts];
    } catch (error) {
      console.error('Fehler beim Abrufen der Produkte:', error);
      
      // Fallback: Aus localStorage laden
      return this.getLocalProducts();
    }
  }

  // Hilfsfunktion zum Abrufen aus localStorage
  private getLocalProducts(): Product[] {
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    return localProducts;
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      // Prüfe zuerst in der Datenbank
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) return data;
      
      // Wenn nicht in der Datenbank, prüfe localStorage
      const localProducts = this.getLocalProducts();
      return localProducts.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Produkts:', error);
      
      // Fallback: Aus localStorage laden
      const localProducts = this.getLocalProducts();
      return localProducts.find(p => p.id === productId) || null;
    }
  }

  async updateProduct(productId: string, productData: Partial<CreateProductInput>): Promise<Product | null> {
    try {
      // Prüfe zuerst, ob es ein lokales Produkt ist
      const localProducts = this.getLocalProducts();
      const localProductIndex = localProducts.findIndex(p => p.id === productId);
      
      if (localProductIndex >= 0) {
        // Update das lokale Produkt
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
        localStorage.setItem('products', JSON.stringify(localProducts));
        
        return updatedProduct;
      }
      
      // Wenn es kein lokales Produkt ist, update in der Datenbank
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
      console.error('Fehler beim Aktualisieren des Produkts:', error);
      return null;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      // Prüfe zuerst, ob es ein lokales Produkt ist
      const localProducts = this.getLocalProducts();
      const localProductIndex = localProducts.findIndex(p => p.id === productId);
      
      if (localProductIndex >= 0) {
        // Lösche das lokale Produkt
        localProducts.splice(localProductIndex, 1);
        localStorage.setItem('products', JSON.stringify(localProducts));
        return true;
      }
      
      // Wenn es kein lokales Produkt ist, lösche in der Datenbank
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Produkts:', error);
      return false;
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
            is_used: false
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
