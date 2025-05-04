
export interface License {
  id: string;
  script_name: string;
  license_key: string;
  server_key: string;
  server_ip: string | null;
  aktiv: boolean;
  user_id: string;
  created_at: string;
  has_file_upload: boolean;
  script_file: string | null;
}

export interface NewScriptFormData {
  name: string;
  serverIp?: string;
}

export interface LogEntry {
  id: string;
  licenseId: string;
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  details?: string;
  errorCode?: string;
  clientIp?: string;
  fileName?: string;
  scriptName: string;
}

export interface LogsFilter {
  level: 'all' | 'error' | 'warning' | 'info' | 'debug';
  search?: string;
  source?: string;
  licenseId: string | null;
  startDate?: Date;
  endDate?: Date;
}

export interface FileItem {
  name: string;
  size: number;
  isPublic: boolean;
  lastModified: string;
  type: string;
}
