
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileWarning, AlertTriangle, Info, Bug } from "lucide-react";
import { LogEntry, LogsFilter } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const LogsView = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LogsFilter>({
    level: 'all',
    search: '',
    licenseId: null, // Explicitly use null instead of "all" string to avoid UUID type issues
    source: 'all',
  });
  const [licenses, setLicenses] = useState<{id: string, name: string}[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    // Fetch licenses for the dropdown
    const fetchLicenses = async () => {
      try {
        const { data, error } = await supabase
          .from('server_licenses')
          .select('id, script_name')
          .order('script_name', { ascending: true });

        if (error) throw error;
        
        console.log("Fetched licenses:", data);
        
        setLicenses(data.map(license => ({
          id: license.id,
          name: license.script_name
        })));
      } catch (error) {
        console.error('Error fetching licenses:', error);
        toast({
          title: "Fehler",
          description: "Lizenzen konnten nicht geladen werden",
          variant: "destructive"
        });
      }
    };

    // Fetch logs from database
    const fetchLogs = async () => {
      setLoading(true);
      try {
        console.log("Fetching logs with filters:", JSON.stringify(filters));
        
        // Convert Date objects to ISO strings if they exist
        const startDateParam = filters.startDate instanceof Date 
          ? filters.startDate.toISOString() 
          : filters.startDate;
        
        const endDateParam = filters.endDate instanceof Date 
          ? filters.endDate.toISOString() 
          : filters.endDate;
        
        // Pass null for querying all logs, not a string 'all'
        // This prevents the UUID validation error
        const { data, error } = await supabase.rpc('get_script_logs', {
          p_license_id: filters.licenseId,
          p_level: filters.level === 'all' ? null : filters.level,
          p_source: filters.source === 'all' ? null : filters.source,
          p_search: filters.search || null,
          p_start_date: startDateParam || null,
          p_end_date: endDateParam || null,
          p_limit: 100
        });

        if (error) {
          console.error("Error from get_script_logs:", error);
          throw error;
        }

        console.log("Logs response data:", data);

        if (data) {
          // Transform the returned data to match our LogEntry type
          const formattedLogs: LogEntry[] = data.map(log => ({
            id: log.id,
            licenseId: log.license_id,
            timestamp: log.log_timestamp,
            level: log.level as 'info' | 'warning' | 'error' | 'debug',
            message: log.message,
            source: log.source || undefined,
            details: log.details || undefined,
            errorCode: log.error_code || undefined,
            clientIp: log.client_ip || undefined,
            fileName: log.file_name || undefined,
            script_name: log.script_name || undefined
          }));
          
          setLogs(formattedLogs);
          
          // Extract unique sources for filter dropdown
          const uniqueSources = Array.from(new Set(data
            .map(log => log.source)
            .filter(Boolean)));
          setSources(uniqueSources as string[]);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast({
          title: "Fehler",
          description: "Logs konnten nicht geladen werden: " + (error as Error).message,
          variant: "destructive"
        });
        setLogs([]); // Make sure we set empty logs on error
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
    fetchLogs();
  }, [filters, toast]);

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error': 
        return <FileWarning className="h-4 w-4 text-red-500" />;
      case 'warning': 
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': 
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': 
        return <Bug className="h-4 w-4 text-gray-500" />;
      default: 
        return null;
    }
  };

  // Get level badge color
  const getLevelBadge = (level: string) => {
    switch(level) {
      case 'error': 
        return <Badge variant="destructive">Error</Badge>;
      case 'warning': 
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Warnung</Badge>;
      case 'info': 
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Info</Badge>;
      case 'debug': 
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Debug</Badge>;
      default: 
        return null;
    }
  };

  // Format timestamp to local date and time
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd. MMM yyyy, HH:mm:ss', { locale: de });
    } catch (error) {
      return timestamp;
    }
  };

  // Handle license selection change
  const handleLicenseChange = (value: string) => {
    // Use null for "all" licenses, avoiding the string "all" which causes UUID validation issues
    setFilters({
      ...filters, 
      licenseId: value === 'all' ? null : value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>
          Ansicht der Systemlogs für Remote Scripts mit Fehleranalyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select 
                value={filters.level || 'all'} 
                onValueChange={(value) => setFilters({...filters, level: value as LogsFilter['level']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Level</SelectItem>
                  <SelectItem value="error">Nur Fehler</SelectItem>
                  <SelectItem value="warning">Nur Warnungen</SelectItem>
                  <SelectItem value="info">Nur Info</SelectItem>
                  <SelectItem value="debug">Nur Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={filters.licenseId === null ? 'all' : filters.licenseId}
                onValueChange={handleLicenseChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Script auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Scripts</SelectItem>
                  {licenses.map((license) => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={filters.source || 'all'}
                onValueChange={(value) => setFilters({...filters, source: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Quelle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Quellen</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source || 'unknown'}>
                      {source || 'Unbekannt'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Suche nach Fehlercodes, Nachrichten..."
                value={filters.search || ''}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="flex-grow"
              />
              <Button 
                variant="outline"
                onClick={() => setFilters({ 
                  level: 'all', 
                  search: '', 
                  licenseId: null,
                  source: 'all' 
                })}
              >
                Zurücksetzen
              </Button>
            </div>
          </div>
          
          {/* Logs table */}
          {loading ? (
            <div className="text-center py-8">Logs werden geladen...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Logs gefunden, die den Filterkriterien entsprechen.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Zeitstempel</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[150px]">Script</TableHead>
                    <TableHead>Nachricht</TableHead>
                    <TableHead>Quelle</TableHead>
                    <TableHead>Fehlercode</TableHead>
                    <TableHead>Datei</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          {getLevelBadge(log.level)}
                        </div>
                      </TableCell>
                      <TableCell>{log.script_name || 'Unbekannt'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{log.message}</div>
                        {log.details && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {log.details}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>
                        {log.errorCode && (
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {log.errorCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.fileName && (
                          <span className="font-mono text-sm">{log.fileName}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsView;
