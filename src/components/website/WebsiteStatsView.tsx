
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { callRPC } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Demo-Daten für die Statistiken
const demoVisitData = [
  { name: '01.05', visits: 20 },
  { name: '02.05', visits: 15 },
  { name: '03.05', visits: 25 },
  { name: '04.05', visits: 22 },
  { name: '05.05', visits: 30 },
  { name: '06.05', visits: 28 },
  { name: '07.05', visits: 35 },
];

const demoInteractionData = [
  { name: '01.05', interactions: 5 },
  { name: '02.05', interactions: 4 },
  { name: '03.05', interactions: 8 },
  { name: '04.05', interactions: 10 },
  { name: '05.05', interactions: 12 },
  { name: '06.05', interactions: 15 },
  { name: '07.05', interactions: 18 },
];

export default function WebsiteStatsView() {
  const [hasPro, setHasPro] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Abrufen des Pro-Status beim Laden der Komponente
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await callRPC('get_user_pro_status', {});
        
        if (error) {
          console.error('Fehler beim Abrufen des Pro-Status:', error);
          toast.error('Fehler beim Prüfen deines Pro-Status.');
          setHasPro(false);
        } else {
          setHasPro(!!data?.has_pro);
        }
      } catch (err) {
        console.error('Unerwarteter Fehler:', err);
        setHasPro(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProStatus();
  }, []);
  
  // Funktion zum Aktivieren des Pro-Zugriffs (für Demozwecke)
  const enableProAccess = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await callRPC('enable_pro_access', {});
      
      if (error) {
        console.error('Fehler beim Aktivieren des Pro-Zugriffs:', error);
        toast.error('Pro-Zugriff konnte nicht aktiviert werden.');
      } else {
        setHasPro(true);
        toast.success('Pro-Zugriff wurde erfolgreich aktiviert!');
      }
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {!hasPro ? (
        <Card>
          <CardHeader>
            <CardTitle>Website-Statistiken - PRO Version</CardTitle>
            <CardDescription>
              Erhalte detaillierte Einblicke in die Performance deiner Websites mit dem Pro-Zugriff
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-2">Upgrade auf PRO</h3>
              <p className="mb-4">Erhalte vollständigen Zugriff auf alle Website-Statistiken und erweiterte Analysetools.</p>
              <Button 
                onClick={enableProAccess} 
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Wird verarbeitet...' : 'Pro-Zugriff freischalten'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Website-Besuche</CardTitle>
              <CardDescription>Analyse der Besucherzahlen der letzten 7 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={demoVisitData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="visits" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benutzerinteraktionen</CardTitle>
              <CardDescription>Analyse der Benutzerinteraktionen der letzten 7 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={demoInteractionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="interactions" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
