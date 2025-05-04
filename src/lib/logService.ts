
import { supabase } from './supabase';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface LogParams {
  licenseId: string;
  level: LogLevel;
  message: string;
  source?: string;
  details?: string;
  errorCode?: string;
  clientIp?: string;
  fileName?: string;
}

/**
 * Sends a log entry to the logging system
 */
export async function addLog({
  licenseId,
  level,
  message,
  source,
  details,
  errorCode,
  clientIp,
  fileName
}: LogParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('log', {
      body: {
        license_id: licenseId,
        level,
        message,
        source,
        details,
        error_code: errorCode,
        client_ip: clientIp,
        file_name: fileName
      }
    });

    if (error) {
      console.error('Error adding log entry:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Exception adding log entry:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Helper function for logging info messages
 */
export function logInfo(licenseId: string, message: string, options?: Omit<LogParams, 'licenseId' | 'level' | 'message'>) {
  return addLog({ licenseId, level: 'info', message, ...options });
}

/**
 * Helper function for logging warning messages
 */
export function logWarning(licenseId: string, message: string, options?: Omit<LogParams, 'licenseId' | 'level' | 'message'>) {
  return addLog({ licenseId, level: 'warning', message, ...options });
}

/**
 * Helper function for logging error messages
 */
export function logError(licenseId: string, message: string, options?: Omit<LogParams, 'licenseId' | 'level' | 'message'>) {
  return addLog({ licenseId, level: 'error', message, ...options });
}

/**
 * Helper function for logging debug messages
 */
export function logDebug(licenseId: string, message: string, options?: Omit<LogParams, 'licenseId' | 'level' | 'message'>) {
  return addLog({ licenseId, level: 'debug', message, ...options });
}
