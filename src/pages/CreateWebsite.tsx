
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CreateWebsiteForm from '@/components/website/CreateWebsiteForm';

export default function CreateWebsite() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/website-builder')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Website-Übersicht
        </Button>
      </div>
      
      <CreateWebsiteForm />
    </div>
  );
}
