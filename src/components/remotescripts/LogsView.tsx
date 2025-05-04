
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Database, Search, Filter, Calendar, Clock, FileText, X, Check } from "lucide-react";
import { LogEntry, LogsFilter } from "./types";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DatePicker } from "@/components/ui/datepicker";
import { toast } from 'sonner';

const LogsView = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LogsFilter>({
    level: 'all',
    search: '',
    licenseId: null, // Initialize as null to avoid UUID type errors
  });
  const [licenses, setLicenses] = useState<{id: string, name: string}[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  // Fetch licenses and logs
  useEffect(() => {
    // Fetch licenses for the dropdown
    const fetchLicenses = async () => {
      try {
        // Get the user's licenses directly using the RPC function
        const { data, error } = await supabase.rpc('get_user_licenses');
        console.log("Licenses retrieved:", data);

        if (error) {
          console.error('Error fetching licenses:', error);
          throw error;
        }
        
        setLicenses(data.map((license: any) => ({
          id: license.id,
          name: license.script_name
        })));
        
        // After fetching licenses, fetch logs
        await fetchLogs();
      } catch (error) {
        console.error('Error fetching licenses:', error);
        toast.error("Lizenzen konnten nicht geladen werden.");
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  // Handle date range selection
  const handleDateChange = (date: Date | null, type: 'start' | 'end') => {
    if (type === 'start') {
      setFilters(prev => ({ 
        ...prev, 
        startDate: date 
      }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        endDate: date 
      }));
    }
  };

  // Fetch logs based on current filters
  const fetchLogs = async () => {
    setLoading(true);
    try {
      console.log("Fetching logs with filters:", filters);
      
      // IMPORTANT FIX: Make absolutely sure we never send 'all' as a license_id parameter
      const licenseIdParam = filters.licenseId && filters.licenseId !== 'all' ? filters.licenseId : undefined;
      console.log("License ID parameter being sent to RPC:", licenseIdParam);
      
      // Create a query object for the RPC call making sure to never send 'all' as p_license_id
      const { data, error } = await supabase.rpc('get_script_logs', {
        p_level: filters.level !== 'all' ? filters.level : undefined,
        p_source: filters.source !== 'all' ? filters.source : undefined,
        p_search: filters.search || undefined,
        p_start_date: filters.startDate?.toISOString(),
        p_end_date: filters.endDate?.toISOString(),
        p_limit: 100,
        p_license_id: licenseIdParam // Using the explicitly checked parameter
      });

      if (error) {
        console.error('Error from get_script_logs:', error);
        throw error;
      }
      
      console.log("Successfully retrieved logs:", data ? data.length : 0);
      
      const formattedLogs: LogEntry[] = data.map((log: any) => ({
        id: log.id,
        licenseId: log.license_id,
        timestamp: log.log_timestamp,
        level: log.level,
        message: log.message,
        source: log.source,
        details: log.details,
        errorCode: log.error_code,
        clientIp: log.client_ip,
        fileName: log.file_name,
        scriptName: log.script_name,
      }));
      
      setLogs(formattedLogs);
      
      // Extract unique sources for filter dropdown
      const uniqueSources = Array.from(
        new Set(data.map((log: any) => log.source).filter(Boolean))
      ) as string[];
      setSources(uniqueSources);
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error("Logs konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when they change
  useEffect(() => {
    fetchLogs();
  }, [
    filters.licenseId, 
    filters.level, 
    filters.source, 
    filters.startDate, 
    filters.endDate
  ]);

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error': 
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': 
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': 
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': 
        return <Database className="h-4 w-4 text-gray-500" />;
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

  // Handle search input
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchLogs();
    }
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
                onValueChange={(value) => {
                  console.log("License selection changed to:", value);
                  // CRITICAL FIX: Ensure we store null, not 'all' string in the state
                  const licenseIdValue = value === 'all' ? null : value;
                  console.log("Setting licenseId filter to:", licenseIdValue);
                  setFilters({...filters, licenseId: licenseIdValue});
                }}
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
                    <SelectItem key={source} value={source}>
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
                onKeyDown={handleSearch}
                className="flex-grow"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  setFilters({ 
                    level: 'all', 
                    search: '',
                    source: undefined,
                    licenseId: null, // CRITICAL FIX: Use null, not 'all' 
                    startDate: undefined,
                    endDate: undefined
                  });
                  fetchLogs(); // Explicitly fetch logs after resetting filters
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Zeitraum:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{filters.startDate ? format(filters.startDate, 'dd.MM.yyyy') : 'Von'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    selected={filters.startDate || undefined}
                    onChange={(date) => handleDateChange(date, 'start')}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{filters.endDate ? format(filters.endDate, 'dd.MM.yyyy') : 'Bis'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <DatePicker
                    selected={filters.endDate || undefined}
                    onChange={(date) => handleDateChange(date, 'end')}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="gap-1"
            >
              <Search className="h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
          
          {/* Logs table */}
          {loading ? (
            <div className="text-center py-8">Logs werden geladen...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Logs gefunden, die den Filterkriterien entsprechen.
            </div>
          ) : (
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Zeitstempel</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Nachricht</TableHead>
                    <TableHead>Script Name</TableHead>
                    <TableHead>Quelle</TableHead>
                    <TableHead>IP/Datei</TableHead>
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
                      <TableCell>
                        <div className="font-medium">{log.message}</div>
                        {log.details && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {log.details}
                          </div>
                        )}
                        {log.errorCode && (
                          <div className="mt-1">
                            <span className="font-mono bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                              {log.errorCode}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{log.scriptName}</TableCell>
                      <TableCell>{log.source || '—'}</TableCell>
                      <TableCell>
                        {log.clientIp ? (
                          <span className="font-mono text-xs">{log.clientIp}</span>
                        ) : log.fileName ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">{log.fileName}</span>
                          </div>
                        ) : '—'}
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
