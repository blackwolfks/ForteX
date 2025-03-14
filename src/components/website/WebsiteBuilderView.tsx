
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebsiteList from './WebsiteList';
import WebsiteStatsView from './WebsiteStatsView';
import WebsiteBuilderSettings from './WebsiteBuilderSettings';

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
          <WebsiteStatsView />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <WebsiteBuilderSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
