
// Define types for the Supabase database
export type Database = {
  public: {
    Tables: {
      server_licenses: {
        Row: {
          id: string;
          license_key: string;
          script_name: string;
          server_key: string;
          server_ip: string | null;
          aktiv: boolean;
          has_file_upload: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          license_key: string;
          script_name: string;
          server_key: string;
          server_ip?: string | null;
          aktiv?: boolean;
          has_file_upload?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          license_key?: string;
          script_name?: string;
          server_key?: string;
          server_ip?: string | null;
          aktiv?: boolean;
          has_file_upload?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      check_license_by_keys: {
        Args: {
          p_license_key: string;
          p_server_key: string;
        };
        Returns: {
          valid: boolean;
          license_key: string | null;
          script_name: string | null;
          server_ip: string | null;
          aktiv: boolean;
          id: string | null;
          has_file_upload: boolean;
        }[];
      };
    };
  };
};
