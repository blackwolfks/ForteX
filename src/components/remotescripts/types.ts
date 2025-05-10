
// Grundlegende Typen für Remote Scripts
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
  path: string;         // Für Kompatibilität beibehalten
  fullPath?: string;    // Hinzugefügt, da es in vielen Komponenten verwendet wird
  size?: number;
  is_public?: boolean;  // Standard-Benennung
  isPublic?: boolean;   // Für Abwärtskompatibilität
  created_at?: string;
  updated_at?: string;
  lastModified?: string;
  type?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
  };
}

// Wieder hinzugefügt, da diese in LogsView.tsx verwendet werden
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
