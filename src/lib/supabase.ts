import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// For older code parts that still use the direct import
export const supabase = supabaseClient;

// Type definitions for database tables
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
  invoice?: Invoice;
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

// Type for server licenses with fully qualified fields
export type ServerLicense = {
  id: string;
  license_key: string;
  server_key: string;
  script_name: string;
  script_file?: string | null;
  server_ip?: string | null;
  aktiv: boolean;
  has_file_upload: boolean;
  created_at: string;
  updated_at?: string;
};

// Type for file access permissions
export type FileAccess = {
  id: string;
  license_id: string;
  file_path: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

// Hilfsfunktion, um den Status eines Storage-Buckets zu prüfen und zu erstellen
export const checkStorageBucket = async (bucketName: string = 'script'): Promise<boolean> => {
  try {
    console.log(`Überprüfe Storage-Bucket '${bucketName}'...`);
    
    // Bucket-Liste abrufen
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
    
    if (listError) {
      console.error("Fehler beim Abrufen der Buckets:", listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' existiert nicht. Versuche ihn zu erstellen...`);
      
      // Create the bucket with public access
      const { data, error: createError } = await supabaseClient.storage.createBucket(bucketName, {
        public: true  // Make bucket public
      });
      
      if (createError) {
        console.error(`Fehler beim Erstellen des Buckets '${bucketName}':`, createError);
        return false;
      }
      
      console.log(`Bucket '${bucketName}' erfolgreich erstellt.`);
      return true;
    }
    
    // Ensure bucket is public
    const { error: updateError } = await supabaseClient.storage.updateBucket(bucketName, {
      public: true
    });
    
    if (updateError) {
      console.error(`Fehler beim Aktualisieren des Buckets '${bucketName}':`, updateError);
    } else {
      console.log(`Bucket '${bucketName}' auf public gesetzt.`);
    }
    
    console.log(`Bucket '${bucketName}' existiert bereits.`);
    return true;
  } catch (error) {
    console.error("Unerwarteter Fehler beim Überprüfen/Erstellen des Buckets:", error);
    return false;
  }
};
