
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
}

export interface NewScriptFormData {
  name: string;
  serverIp: string;
  code?: string; // Keeping for backward compatibility, but will be unused
}

export interface FileItem {
  name: string;
  id?: string;
  size?: number;
  isPublic: boolean;
  fullPath: string;
  metadata?: {
    size: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
  };
  updated_at?: string;
}

export interface LogEntry {
  id: string;
  licenseId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
  details?: string;
  errorCode?: string;
  clientIp?: string;
  fileName?: string;
  script_name?: string; // Added to show script name in logs
}

export interface LogsFilter {
  level?: 'info' | 'warning' | 'error' | 'debug' | 'all';
  source?: string;
  licenseId?: string; // Changed from string to string | undefined
  search?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}
