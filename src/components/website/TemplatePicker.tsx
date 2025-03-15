
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LockIcon, StarIcon, CheckIcon } from 'lucide-react';
import { templateService } from '@/services/website/templates';
import { WebsiteTemplate } from '@/types/website.types';
import { Skeleton } from "@/components/ui/skeleton";

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
  
  // Fetch templates from the database
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['website-templates'],
    queryFn: async () => {
      return await templateService.getTemplates();
    },
  });
  
  // Fetch shop templates if needed
  const { data: shopTemplates = [], isLoading: shopTemplatesLoading } = useQuery({
    queryKey: ['shop-templates'],
    queryFn: async () => {
      if (!includeShopTemplates) return [];
      return await templateService.getShopTemplates();
    },
    enabled: includeShopTemplates,
  });
  
  useEffect(() => {
    if (proStatus && proStatus.length > 0) {
      setIsProUser(proStatus[0].has_pro || false);
    }
  }, [proStatus]);
  
  const allTemplates = [...templates, ...shopTemplates];
  
  const filteredTemplates = activeTab === 'all' 
    ? allTemplates 
    : allTemplates.filter(template => template.category === activeTab);
  
  const categories = Array.from(
    new Set(allTemplates.map(template => template.category))
  );
  
  const isLoading = templatesLoading || shopTemplatesLoading;
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap justify-start mb-6 bg-card">
          <TabsTrigger value="all" className="flex-1">Alle</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex-1">
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
          {isLoading ? (
            <TemplateLoadingSkeleton />
          ) : (
            <TemplateGrid 
              templates={filteredTemplates} 
              onSelect={onSelect} 
              selectedTemplate={selectedTemplate}
              isProUser={isProUser}
            />
          )}
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {isLoading ? (
              <TemplateLoadingSkeleton />
            ) : (
              <TemplateGrid 
                templates={filteredTemplates} 
                onSelect={onSelect} 
                selectedTemplate={selectedTemplate}
                isProUser={isProUser}
              />
            )}
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
                        selectedTemplate === template.id 
                          ? 'ring-2 ring-primary rounded-lg shadow-glow' 
                          : 'hover:shadow-soft'
                      } ${!canSelect ? 'pointer-events-none' : ''}`}
                    >
                      <Card className="h-full border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative">
                        {selectedTemplate === template.id && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant="primary" className="font-semibold">
                              <CheckIcon className="h-3 w-3 mr-1" /> Ausgewählt
                            </Badge>
                          </div>
                        )}
                        
                        {isProTemplate && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge variant="secondary" className="font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                              <StarIcon className="h-3 w-3 mr-1" /> Premium
                            </Badge>
                          </div>
                        )}
                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-darkgray-500 to-darkgray-700">
                          <img 
                            src={template.thumbnail || '/placeholder.svg'} 
                            alt={template.name} 
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                          />
                        </div>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {template.description}
                              </CardDescription>
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
                  <TooltipContent className="p-4 max-w-xs">
                    <p className="font-semibold mb-1">Premium Template</p>
                    <p>Diese Vorlage ist nur für Pro-Benutzer verfügbar.</p>
                    <p className="mt-2">Upgraden Sie auf Pro, um Zugriff zu erhalten und Ihre Website mit diesem exklusiven Design zu erstellen.</p>
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

function TemplateLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="h-full overflow-hidden relative">
          <Skeleton className="aspect-video w-full" />
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
