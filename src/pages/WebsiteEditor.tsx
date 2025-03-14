
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { websiteService } from '@/services/website-service';
import DragDropEditor from '@/components/website/DragDropEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function WebsiteEditor() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkWebsite = async () => {
      if (!websiteId) {
        setError('Keine Website-ID angegeben');
        setLoading(false);
        return;
      }
      
      try {
        const website = await websiteService.getWebsiteById(websiteId);
        if (!website) {
          setError('Website nicht gefunden');
        }
      } catch (err) {
        console.error('Error fetching website:', err);
        setError('Fehler beim Laden der Website');
      } finally {
        setLoading(false);
      }
    };
    
    checkWebsite();
  }, [websiteId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !websiteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-4">{error || 'Fehler'}</h1>
        <p className="text-muted-foreground mb-6">Die angeforderte Website konnte nicht geladen werden.</p>
        <Button onClick={() => navigate('/dashboard/website-builder')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }
  
  return <DragDropEditor websiteId={websiteId} />;
}
