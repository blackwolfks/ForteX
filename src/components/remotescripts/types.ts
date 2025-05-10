
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
  game_server?: GameServerType; // Neu hinzugefügt
  category?: ScriptCategoryType; // Neu hinzugefügt
}

export interface NewScriptFormData {
  name: string;
  serverIp?: string | null;
  description?: string | null;
  game_server: GameServerType; // Neu hinzugefügt
  category: ScriptCategoryType; // Neu hinzugefügt
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

// Game Server Typen
export type GameServerType = 'ragemp' | 'fivem' | 'altv' | 'minecraft';

// Kategorien für die verschiedenen Game Server
export type ScriptCategoryType = 
  // Kategorien für RageMP, FiveM und AltV
  | 'script' 
  | 'clothing' 
  | 'vehicle' 
  | 'mlo'
  // Kategorien für Minecraft
  | 'java'
  | 'bedrock';

// ZIP-Datei Einstellungen
export interface ZipFileSettings {
  allowDownload: boolean;
  version?: string;
  releaseNotes?: string;
}

// Logs
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
