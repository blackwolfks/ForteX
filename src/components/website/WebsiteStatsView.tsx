
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip, Legend } from 'recharts';
import { CalendarRange, Users, MousePointerClick, Clock, TrendingUp } from 'lucide-react';

// Beispiel-Statistikdaten (in einer realen Anwendung würden diese von einer API kommen)
const demoData = {
  visits: [
    { name: 'Mo', visits: 0 },
    { name: 'Di', visits: 0 },
    { name: 'Mi', visits: 0 },
    { name: 'Do', visits: 0 },
    { name: 'Fr', visits: 0 },
    { name: 'Sa', visits: 0 },
    { name: 'So', visits: 0 },
  ],
  interactions: [
    { name: 'Mo', clicks: 0, scrolls: 0 },
    { name: 'Di', clicks: 0, scrolls: 0 },
    { name: 'Mi', clicks: 0, scrolls: 0 },
    { name: 'Do', clicks: 0, scrolls: 0 },
    { name: 'Fr', clicks: 0, scrolls: 0 },
    { name: 'Sa', clicks: 0, scrolls: 0 },
    { name: 'So', clicks: 0, scrolls: 0 },
  ],
  summary: {
    totalVisits: 0,
    uniqueVisitors: 0,
    avgTimeOnSite: '0:00',
    conversionRate: '0%'
  }
};

export default function WebsiteStatsView() {
  const [statsData] = useState(demoData);
  const [statsTab, setStatsTab] = useState('visits');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Statistiken</h2>
        <p className="text-muted-foreground">Website-Besuche und Interaktionen</p>
      </div>
      
      {/* Pro-Version Hinweis */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-medium">Statistiken sind für die Pro-Version verfügbar</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Upgrade auf die Pro-Version, um detaillierte Einblicke in die Leistung Ihrer Website zu erhalten.
            </p>
            <Button className="mt-2">Upgrade</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Vorschau der Statistiken (wird in der Pro-Version angezeigt) */}
      <div className="space-y-6 opacity-50 pointer-events-none">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Besucher</h3>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{statsData.summary.uniqueVisitors}</div>
                <p className="text-xs text-muted-foreground">Eindeutige Besucher</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Seitenaufrufe</h3>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{statsData.summary.totalVisits}</div>
                <p className="text-xs text-muted-foreground">Gesamte Besuche</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Verweildauer</h3>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{statsData.summary.avgTimeOnSite}</div>
                <p className="text-xs text-muted-foreground">Durchschnittliche Zeit</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Conversion</h3>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{statsData.summary.conversionRate}</div>
                <p className="text-xs text-muted-foreground">Conversion-Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Besucherdaten</CardTitle>
                <CardDescription>Analyse der Website-Besuche und Interaktionen</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Letzte 7 Tage</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={statsTab} onValueChange={setStatsTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="visits">Besuche</TabsTrigger>
                <TabsTrigger value="interactions">Interaktionen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visits" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData.visits}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="visits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="interactions" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsData.interactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="clicks" stroke="#2563eb" />
                    <Line type="monotone" dataKey="scrolls" stroke="#16a34a" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Benutzerdefinierter Tooltip für Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border border-border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};
