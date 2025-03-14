
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  category: 'business' | 'shop' | 'portfolio' | 'blog';
}

const TEMPLATES: Template[] = [
  {
    id: 'business-standard',
    name: 'Business Standard',
    description: 'Ein professionelles Template für Unternehmen mit modernem Design.',
    previewImage: '/placeholder.svg',
    category: 'business'
  },
  {
    id: 'shop-modern',
    name: 'Shop Modern',
    description: 'Modern und minimalistisch mit Fokus auf Produktpräsentation.',
    previewImage: '/placeholder.svg',
    category: 'shop'
  },
  {
    id: 'portfolio-creative',
    name: 'Portfolio Creative',
    description: 'Kreatives Design für Portfolios und Freelancer.',
    previewImage: '/placeholder.svg',
    category: 'portfolio'
  },
  {
    id: 'blog-clean',
    name: 'Blog Clean',
    description: 'Ein übersichtliches Template für Blogs und Content-Seiten.',
    previewImage: '/placeholder.svg',
    category: 'blog'
  },
  {
    id: 'shop-premium',
    name: 'Shop Premium',
    description: 'Premium Shop-Design mit erweiterten Funktionen.',
    previewImage: '/placeholder.svg',
    category: 'shop'
  },
  {
    id: 'business-dark',
    name: 'Business Dark',
    description: 'Dunkles Theme für eine moderne Unternehmenswebsite.',
    previewImage: '/placeholder.svg',
    category: 'business'
  }
];

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const filteredTemplates = selectedCategory === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(template => template.category === selectedCategory);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          Alle
        </Button>
        <Button 
          variant={selectedCategory === 'business' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('business')}
          size="sm"
        >
          Business
        </Button>
        <Button 
          variant={selectedCategory === 'shop' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('shop')}
          size="sm"
        >
          Shop
        </Button>
        <Button 
          variant={selectedCategory === 'portfolio' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('portfolio')}
          size="sm"
        >
          Portfolio
        </Button>
        <Button 
          variant={selectedCategory === 'blog' ? 'default' : 'outline'} 
          onClick={() => setSelectedCategory('blog')}
          size="sm"
        >
          Blog
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => onSelect(template.id)}
          >
            <div className="aspect-video overflow-hidden bg-muted">
              <img 
                src={template.previewImage} 
                alt={template.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-base">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
