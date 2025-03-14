
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebsiteList from './WebsiteList';

export default function WebsiteBuilderView() {
  const [activeTab, setActiveTab] = useState('websites');
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="websites" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="websites">Websites</TabsTrigger>
            <TabsTrigger value="analytics">Statistiken</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="websites" className="space-y-6">
          <WebsiteList />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
              <CardDescription>Website-Besuche und Interaktionen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Statistiken sind für die Pro-Version verfügbar</p>
                <Button variant="outline" className="mt-4">Upgrade</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website-Builder Einstellungen</CardTitle>
              <CardDescription>Konfigurieren Sie Ihren Website-Builder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Allgemeine Einstellungen</h3>
                <p className="text-muted-foreground mb-4">Passen Sie die allgemeinen Einstellungen Ihres Website-Builders an</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Standard-Domain</h4>
                      <p className="text-sm text-muted-foreground">Die Domain für neu erstellte Websites</p>
                    </div>
                    <Button variant="outline">Konfigurieren</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Benutzerdefinierte Domains</h4>
                      <p className="text-sm text-muted-foreground">Eigene Domains für Ihre Websites verwenden</p>
                    </div>
                    <Button variant="outline">Verwalten</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SEO-Einstellungen</h4>
                      <p className="text-sm text-muted-foreground">Standard-SEO-Einstellungen für neue Websites</p>
                    </div>
                    <Button variant="outline">Bearbeiten</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
