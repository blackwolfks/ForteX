
import { useState, useEffect } from 'react';
import FileBrowser from './FileBrowser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { callRPC } from '@/lib/supabase';

interface LicenseFileBrowserProps {
  licenseId: string;
}

export default function LicenseFileBrowser({ licenseId }: LicenseFileBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenseData, setLicenseData] = useState<any | null>(null);

  useEffect(() => {
    const fetchLicenseData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: licenses, error } = await callRPC('get_user_licenses', {});
        
        if (error) {
          console.error('Fehler beim Abrufen der Lizenzen:', error);
          setError('Fehler beim Abrufen der Lizenzdaten');
          return;
        }
        
        const license = licenses.find((l: any) => l.id === licenseId);
        
        if (!license) {
          setError('Lizenz nicht gefunden');
          return;
        }
        
        setLicenseData(license);
      } catch (err) {
        console.error('Fehler beim Laden der Lizenzdaten:', err);
        setError('Unerwarteter Fehler beim Laden der Lizenzdaten');
      } finally {
        setLoading(false);
      }
    };
    
    if (licenseId) {
      fetchLicenseData();
    }
  }, [licenseId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center p-8 text-destructive">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lizenzdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Skriptname</p>
              <p>{licenseData.script_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lizenzschlüssel</p>
              <p>{licenseData.license_key}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Server-Key</p>
              <p>{licenseData.server_key}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p>{licenseData.aktiv ? 'Aktiv' : 'Inaktiv'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <FileBrowser bucketId="script" folderPath={licenseId} />
    </div>
  );
}
