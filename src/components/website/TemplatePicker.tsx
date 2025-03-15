
import { useState, useEffect } from 'react';
import { websiteService, WebsiteTemplate } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LockIcon } from 'lucide-react';

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
  selectedTemplate?: string;
  includeShopTemplates?: boolean;
}

export default function TemplatePicker({
  onSelect,
  selectedTemplate,
  includeShopTemplates = false
}: TemplatePickerProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isProUser, setIsProUser] = useState<boolean>(false);
  
  // Check if user is a Pro user
  const { data: proStatus } = useQuery({
    queryKey: ['user-pro-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_pro_status');
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 60000, // 1 minute
  });
  
  useEffect(() => {
    if (proStatus) {
      setIsProUser(proStatus.is_pro || false);
    }
  }, [proStatus]);
  
  const templates = websiteService.getTemplates();
  const shopTemplates = includeShopTemplates 
    ? websiteService.getShopTemplates() 
    : [];
  
  const allTemplates = [...templates, ...shopTemplates];
  
  const filteredTemplates = activeTab === 'all' 
    ? allTemplates 
    : allTemplates.filter(template => template.category === activeTab);
  
  const categories = Array.from(
    new Set(allTemplates.map(template => template.category))
  );
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap justify-start">
          <TabsTrigger value="all">Alle</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category === 'business' ? 'Business' : 
               category === 'shop' ? 'Online-Shop' : 
               category === 'portfolio' ? 'Portfolio' : 
               category === 'blog' ? 'Blog' : 
               category === 'landing' ? 'Landing Page' : 
               category === 'custom' ? 'Leeres Template' : 
               category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TemplateGrid 
            templates={filteredTemplates} 
            onSelect={onSelect} 
            selectedTemplate={selectedTemplate}
            isProUser={isProUser}
          />
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <TemplateGrid 
              templates={filteredTemplates} 
              onSelect={onSelect} 
              selectedTemplate={selectedTemplate}
              isProUser={isProUser}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface TemplateGridProps {
  templates: WebsiteTemplate[];
  onSelect: (templateId: string) => void;
  selectedTemplate?: string;
  isProUser: boolean;
}

function TemplateGrid({ templates, onSelect, selectedTemplate, isProUser }: TemplateGridProps) {
  return (
    <div>
      <RadioGroup 
        value={selectedTemplate} 
        onValueChange={onSelect} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {templates.map(template => {
          const isProTemplate = template.proOnly;
          const canSelect = !isProTemplate || isProUser;
          
          return (
            <TooltipProvider key={template.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`${!canSelect ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                    <Label 
                      htmlFor={template.id} 
                      className={`block h-full transition-all ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary rounded-lg' : ''
                      } ${!canSelect ? 'pointer-events-none' : ''}`}
                    >
                      <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
                        {isProTemplate && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge variant="secondary" className="font-semibold">
                              <LockIcon className="h-3 w-3 mr-1" /> Pro
                            </Badge>
                          </div>
                        )}
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img 
                            src={template.thumbnail} 
                            alt={template.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription>{template.description}</CardDescription>
                            </div>
                            {canSelect && (
                              <RadioGroupItem 
                                value={template.id} 
                                id={template.id} 
                                className="mt-1"
                                disabled={!canSelect}
                              />
                            )}
                            {!canSelect && (
                              <LockIcon className="h-5 w-5 text-muted-foreground mt-1" />
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Label>
                  </div>
                </TooltipTrigger>
                {!canSelect && (
                  <TooltipContent>
                    <p>Diese Vorlage ist nur für Pro-Benutzer verfügbar.</p>
                    <p>Upgrade auf Pro, um Zugriff zu erhalten.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </RadioGroup>
    </div>
  );
}
