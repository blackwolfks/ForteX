
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FileBrowser from '@/components/FileBrowser';
import { toast } from 'sonner';

export default function ScriptFileBrowser() {
  const [licenseId, setLicenseId] = useState<string>('');
  const [showBrowser, setShowBrowser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseId.trim()) {
      toast.error('Bitte geben Sie eine Lizenz-ID ein');
      return;
    }
    
    setLoading(true);
    
    // Hier können Sie optional eine Validierung der Lizenz durchführen
    // In diesem einfachen Beispiel gehen wir davon aus, dass die ID gültig ist
    
    setShowBrowser(true);
    setLoading(false);
    toast.success(`Dateien für Lizenz ${licenseId} werden angezeigt`);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Script-Dateiverwaltung</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseId">Lizenz-ID</Label>
              <Input
                id="licenseId"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                placeholder="Geben Sie die Lizenz-ID ein"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird geladen...' : 'Dateien anzeigen'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {showBrowser && (
        <FileBrowser 
          bucketId="script" 
          folderPath={licenseId}
        />
      )}
    </div>
  );
}
