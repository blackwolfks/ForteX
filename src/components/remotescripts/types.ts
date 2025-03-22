
export interface License {
  id: string;
  script_name: string;
  script_file: string | null;
  license_key: string;
  server_key: string;
  server_ip: string | null;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
  has_file_upload?: boolean;
}

export interface NewScriptFormData {
  name: string;
  code: string;
  serverIp: string;
}
