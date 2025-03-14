export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invoices: {
        Row: {
          amount: number
          billing_address: Json
          currency: string
          customer_email: string
          customer_name: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_url: string | null
          order_id: string
          payment_method: string
          plan_name: string
        }
        Insert: {
          amount: number
          billing_address: Json
          currency: string
          customer_email: string
          customer_name: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          order_id: string
          payment_method: string
          plan_name: string
        }
        Update: {
          amount?: number
          billing_address?: Json
          currency?: string
          customer_email?: string
          customer_name?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          order_id?: string
          payment_method?: string
          plan_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_id: string | null
          payment_method: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          payment_id?: string | null
          payment_method: string
          plan_id: string
          plan_name: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string | null
          payment_method?: string
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_keys: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          key: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          key: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          key?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cfx_imported: boolean
          cfx_resource_id: string | null
          created_at: string
          description: string
          id: string
          image: string | null
          is_subscription: boolean
          name: string
          price: number
          short_description: string
          subscription_interval: string | null
          user_id: string
        }
        Insert: {
          category: string
          cfx_imported?: boolean
          cfx_resource_id?: string | null
          created_at?: string
          description: string
          id?: string
          image?: string | null
          is_subscription?: boolean
          name: string
          price: number
          short_description: string
          subscription_interval?: string | null
          user_id: string
        }
        Update: {
          category?: string
          cfx_imported?: boolean
          cfx_resource_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          is_subscription?: boolean
          name?: string
          price?: number
          short_description?: string
          subscription_interval?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          updated_at: string | null
          website_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          website_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string | null
          id: string
          last_saved: string | null
          name: string
          shop_template: string
          status: string | null
          template: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_saved?: string | null
          name: string
          shop_template: string
          status?: string | null
          template: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_saved?: string | null
          name?: string
          shop_template?: string
          status?: string | null
          template?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_website:
        | {
            Args: {
              website_name: string
              website_url: string
              website_template: string
              website_shop_template: string
            }
            Returns: string
          }
        | {
            Args: {
              website_name: string
              website_url: string
              website_template: string
              website_shop_template: string
              website_status?: string
            }
            Returns: string
          }
      delete_website: {
        Args: {
          website_id: string
        }
        Returns: undefined
      }
      get_user_websites: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          id: string
          last_saved: string | null
          name: string
          shop_template: string
          status: string | null
          template: string
          url: string
          user_id: string
        }[]
      }
      get_website_by_id: {
        Args: {
          website_id: string
        }
        Returns: {
          created_at: string | null
          id: string
          last_saved: string | null
          name: string
          shop_template: string
          status: string | null
          template: string
          url: string
          user_id: string
        }[]
      }
      get_website_content: {
        Args: {
          website_id: string
        }
        Returns: {
          id: string
          website_id: string
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      save_website_content: {
        Args: {
          website_id: string
          content_data: Json
        }
        Returns: undefined
      }
      update_website:
        | {
            Args: {
              website_id: string
              website_name: string
              website_url: string
              website_template: string
              website_shop_template: string
            }
            Returns: undefined
          }
        | {
            Args: {
              website_id: string
              website_name: string
              website_url: string
              website_template: string
              website_shop_template: string
              website_status?: string
            }
            Returns: undefined
          }
      update_website_status: {
        Args: {
          website_id: string
          website_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
