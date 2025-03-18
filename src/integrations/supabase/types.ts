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
      pro_users: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
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
      script_file_access: {
        Row: {
          created_at: string
          file_path: string
          id: string
          is_public: boolean
          license_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          is_public?: boolean
          license_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          is_public?: boolean
          license_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_file_access_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "server_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      server_licenses: {
        Row: {
          aktiv: boolean | null
          created_at: string | null
          id: string
          license_key: string
          script_file: string | null
          script_name: string
          server_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aktiv?: boolean | null
          created_at?: string | null
          id?: string
          license_key: string
          script_file?: string | null
          script_name: string
          server_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aktiv?: boolean | null
          created_at?: string | null
          id?: string
          license_key?: string
          script_file?: string | null
          script_name?: string
          server_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          subscription_tier: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          subscription_tier?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          subscription_tier?: string
          user_id?: string
        }
        Relationships: []
      }
      website_builder_settings: {
        Row: {
          created_at: string | null
          custom_domains: Json | null
          default_domain: string | null
          id: string
          seo_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_domains?: Json | null
          default_domain?: string | null
          id?: string
          seo_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_domains?: Json | null
          default_domain?: string | null
          id?: string
          seo_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_change_history: {
        Row: {
          changed_at: string
          changed_by: string
          changed_fields: string[]
          content_snapshot: Json
          id: string
          website_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          changed_fields: string[]
          content_snapshot: Json
          id?: string
          website_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          changed_fields?: string[]
          content_snapshot?: Json
          id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_change_history_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          updated_at: string
          website_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
          website_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
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
      website_templates: {
        Row: {
          category: string
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          pro_only: boolean | null
          thumbnail: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          pro_only?: boolean | null
          thumbnail?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          pro_only?: boolean | null
          thumbnail?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      websites: {
        Row: {
          created_at: string
          id: string
          last_saved: string
          name: string
          shop_template: string | null
          status: string
          template: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_saved?: string
          name: string
          shop_template?: string | null
          status?: string
          template: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_saved?: string
          name?: string
          shop_template?: string | null
          status?: string
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
      add_website_change_history: {
        Args: {
          site_id: string
          content_snapshot: Json
          changed_fields: string[]
        }
        Returns: string
      }
      check_license_by_keys: {
        Args: {
          p_license_key: string
          p_server_key: string
        }
        Returns: {
          valid: boolean
          license_key: string
          script_name: string
          script_file: string
          server_ip: string
          aktiv: boolean
          id: string
          has_file_upload: boolean
        }[]
      }
      check_license_by_server_key: {
        Args: {
          p_server_key: string
        }
        Returns: {
          valid: boolean
          license_key: string
          script_name: string
          script_file: string
          server_ip: string
          aktiv: boolean
          id: string
          has_file_upload: boolean
        }[]
      }
      create_license:
        | {
            Args: {
              p_script_name: string
              p_script_file?: string
            }
            Returns: {
              id: string
              license_key: string
              server_key: string
            }[]
          }
        | {
            Args: {
              p_script_name: string
              p_script_file?: string
              p_server_ip?: string
            }
            Returns: {
              id: string
              license_key: string
              server_key: string
            }[]
          }
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
      delete_license: {
        Args: {
          p_license_id: string
        }
        Returns: boolean
      }
      delete_website: {
        Args: {
          site_id: string
        }
        Returns: undefined
      }
      enable_pro_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          success: boolean
        }[]
      }
      enable_subscription: {
        Args: {
          tier_name: string
        }
        Returns: {
          success: boolean
        }[]
      }
      generate_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_templates: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          thumbnail: string
          category: string
          pro_only: boolean
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_file_access_for_license: {
        Args: {
          p_license_id: string
        }
        Returns: {
          id: string
          license_id: string
          file_path: string
          is_public: boolean
          created_at: string
          updated_at: string
        }[]
      }
      get_template_by_id: {
        Args: {
          template_id: string
        }
        Returns: {
          id: string
          name: string
          description: string
          thumbnail: string
          category: string
          pro_only: boolean
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_user_licenses: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          license_key: string
          server_key: string
          script_name: string
          script_file: string
          aktiv: boolean
          created_at: string
        }[]
      }
      get_user_pro_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_pro: boolean
          subscription_tier: string
        }[]
      }
      get_user_websites: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          url: string
          template: string
          shop_template: string
          status: string
          user_id: string
          created_at: string
          last_saved: string
        }[]
      }
      get_website_builder_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          default_domain: string
          custom_domains: Json
          seo_settings: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_website_by_id: {
        Args: {
          site_id: string
        }
        Returns: {
          id: string
          name: string
          url: string
          template: string
          shop_template: string
          status: string
          user_id: string
          created_at: string
          last_saved: string
        }[]
      }
      get_website_change_history: {
        Args: {
          site_id: string
        }
        Returns: {
          id: string
          website_id: string
          content_snapshot: Json
          changed_fields: string[]
          changed_at: string
          changed_by: string
        }[]
      }
      get_website_content: {
        Args: {
          site_id: string
        }
        Returns: {
          id: string
          website_id: string
          content: Json
          created_at: string
          updated_at: string
        }[]
      }
      regenerate_server_key: {
        Args: {
          p_license_id: string
        }
        Returns: string
      }
      save_website_builder_settings: {
        Args: {
          p_default_domain?: string
          p_custom_domains?: Json
          p_seo_settings?: Json
        }
        Returns: boolean
      }
      save_website_content: {
        Args: {
          site_id: string
          content_data: Json
        }
        Returns: undefined
      }
      update_file_access: {
        Args: {
          p_license_id: string
          p_file_path: string
          p_is_public: boolean
        }
        Returns: boolean
      }
      update_license: {
        Args: {
          p_license_id: string
          p_script_name?: string
          p_script_file?: string
          p_server_ip?: string
          p_aktiv?: boolean
          p_has_file_upload?: boolean
          p_regenerate_server_key?: boolean
        }
        Returns: {
          success: boolean
          server_key: string
        }[]
      }
      update_website:
        | {
            Args: {
              site_id: string
              website_name: string
              website_url: string
              website_template: string
              website_shop_template: string
              website_status?: string
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
            }
            Returns: undefined
          }
      update_website_status: {
        Args: {
          site_id: string
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
