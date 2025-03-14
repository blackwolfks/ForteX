
import { useState } from 'react';
import { websiteService, WebsiteTemplate } from '@/services/website-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category === 'business' ? 'Business' : 
               category === 'shop' ? 'Online-Shop' : 
               category === 'portfolio' ? 'Portfolio' : 
               category === 'blog' ? 'Blog' : 
               category === 'landing' ? 'Landing Page' : 
               category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TemplateGrid 
            templates={filteredTemplates} 
            onSelect={onSelect} 
            selectedTemplate={selectedTemplate} 
          />
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <TemplateGrid 
              templates={filteredTemplates} 
              onSelect={onSelect} 
              selectedTemplate={selectedTemplate} 
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
}

function TemplateGrid({ templates, onSelect, selectedTemplate }: TemplateGridProps) {
  return (
    <div>
      <RadioGroup 
        value={selectedTemplate} 
        onValueChange={onSelect} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {templates.map(template => (
          <Label 
            key={template.id} 
            htmlFor={template.id}
            className={`cursor-pointer block h-full transition-all ${
              selectedTemplate === template.id ? 'ring-2 ring-primary rounded-lg' : ''
            }`}
          >
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
                  <RadioGroupItem 
                    value={template.id} 
                    id={template.id} 
                    className="mt-1"
                  />
                </div>
              </CardHeader>
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
