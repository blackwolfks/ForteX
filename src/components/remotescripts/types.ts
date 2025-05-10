
// Wenn diese Datei nicht existiert, erstelle ich sie mit den grundlegenden Typen
export interface License {
  id: string;
  license_key: string;
  server_key: string;
  script_name: string;
  script_file: string | null;
  server_ip: string | null;
  aktiv: boolean;
  has_file_upload: boolean;
  created_at: string;
  updated_at?: string;
  description?: string | null;
}

export interface NewScriptFormData {
  name: string;
  serverIp?: string | null;
  description?: string | null;
}

export interface FileItem {
  id?: string;
  name: string;
  path: string;
  size?: number;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}
