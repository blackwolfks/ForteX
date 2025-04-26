
export interface License {
  id: string;
  license_key: string;
  server_key: string;
  script_name: string;
  aktiv: boolean;
  created_at: string;
  server_ip: string | null;
  has_file_upload: boolean;
  updated_at: string;
}

export interface NewScriptFormData {
  name: string;
  serverIp?: string;
}

export interface FileAccessInfo {
  id: string;
  license_id: string;
  file_path: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
