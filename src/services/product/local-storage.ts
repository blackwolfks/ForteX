
import { v4 as uuidv4 } from 'uuid';
import { Product, CreateProductInput } from './types';

export class ProductLocalStorage {
  // Helper function to get local user ID
  getLocalUserId(): string {
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

  // Helper function to save to localStorage
  saveProductToLocalStorage(productData: CreateProductInput, userId: string): Product {
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
      user_id: userId,
    };

    // Store only products for the current user
    const localProductsKey = `products_${userId}`;
    const existingProducts = JSON.parse(localStorage.getItem(localProductsKey) || '[]');
    localStorage.setItem(localProductsKey, JSON.stringify([...existingProducts, product]));
    
    return product;
  }

  // Helper function to fetch from localStorage
  getLocalProducts(userId: string): Product[] {
    const localProductsKey = `products_${userId}`;
    const localProducts = JSON.parse(localStorage.getItem(localProductsKey) || '[]');
    return localProducts;
  }

  // Update local product
  updateLocalProduct(productId: string, productData: Partial<CreateProductInput>, userId: string): Product | null {
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
    
    return null;
  }

  // Delete local product
  deleteLocalProduct(productId: string, userId: string): boolean {
    const localProducts = this.getLocalProducts(userId);
    const localProductIndex = localProducts.findIndex(p => p.id === productId);
    
    if (localProductIndex >= 0) {
      // Delete the local product
      localProducts.splice(localProductIndex, 1);
      const localProductsKey = `products_${userId}`;
      localStorage.setItem(localProductsKey, JSON.stringify(localProducts));
      return true;
    }
    
    return false;
  }
}

export const productLocalStorage = new ProductLocalStorage();
