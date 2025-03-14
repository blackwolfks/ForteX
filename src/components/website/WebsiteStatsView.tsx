
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { callRPC } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

// Demo data for statistics
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

const demoDeviceData = [
  { name: 'Desktop', value: 65 },
  { name: 'Mobile', value: 30 },
  { name: 'Tablet', value: 5 },
];

const demoReferrerData = [
  { name: 'Google', value: 45 },
  { name: 'Direct', value: 25 },
  { name: 'Social', value: 20 },
  { name: 'Other', value: 10 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function WebsiteStatsView() {
  const [hasPro, setHasPro] = useState<boolean>(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch user's subscription status when component loads
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await callRPC('get_user_pro_status', {});
        
        if (error) {
          console.error('Fehler beim Abrufen des Pro-Status:', error);
          toast.error('Fehler beim Prüfen deines Pro-Status.');
          setHasPro(false);
          setSubscriptionTier('free');
        } else {
          // Handle the new return type with has_pro and subscription_tier
          if (data && data.length > 0) {
            setHasPro(!!data[0].has_pro);
            setSubscriptionTier(data[0].subscription_tier || 'free');
          } else {
            setHasPro(false);
            setSubscriptionTier('free');
          }
        }
      } catch (err) {
        console.error('Unerwarteter Fehler:', err);
        setHasPro(false);
        setSubscriptionTier('free');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProStatus();
  }, []);
  
  // Function to activate Pro access
  const enableProAccess = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await callRPC('enable_pro_access', {});
      
      if (error) {
        console.error('Fehler beim Aktivieren des Pro-Zugriffs:', error);
        toast.error('Pro-Zugriff konnte nicht aktiviert werden.');
      } else {
        setHasPro(true);
        setSubscriptionTier('pro');
        toast.success('Pro-Zugriff wurde erfolgreich aktiviert!');
      }
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different view based on subscription tier
  const renderSubscriptionInfo = () => {
    return (
      <div className="mb-4 flex items-center gap-2">
        <span className="font-medium">Aktuelles Abonnement:</span>
        <Badge variant={subscriptionTier === 'pro' ? "default" : "outline"} className={
          subscriptionTier === 'pro' 
            ? "bg-gradient-to-r from-purple-500 to-blue-500" 
            : ""
        }>
          {subscriptionTier === 'pro' ? 'PRO' : subscriptionTier === 'basic' ? 'Basic' : 'Free'}
        </Badge>
      </div>
    );
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
            {renderSubscriptionInfo()}
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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold mb-4">Website Analytics Dashboard</h2>
            {renderSubscriptionInfo()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Geräteverteilung</CardTitle>
                <CardDescription>Analyse der genutzten Geräte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demoDeviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {demoDeviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verkehrsquellen</CardTitle>
                <CardDescription>Woher kommen Ihre Besucher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={demoReferrerData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {demoReferrerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
