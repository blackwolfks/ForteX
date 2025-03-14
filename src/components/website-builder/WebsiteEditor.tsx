
import { useState } from 'react';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WebsiteSection } from '@/services/website-service';
import { ProductSection } from './sections/ProductSection';
import { ImageSection } from './sections/ImageSection';
import { HeroSection } from './sections/HeroSection';
import { TextSection } from './sections/TextSection';
import { 
  ChevronUp, 
  ChevronDown, 
  Trash, 
  Settings, 
  Plus, 
  ShoppingBag, 
  Image as ImageIcon, 
  Type, 
  Layout,
  Palette,
  Copy,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplatePicker } from './TemplatePicker';
import { WebsitePreviewInline } from './WebsitePreviewInline';

export function WebsiteEditor() {
  const { 
    websiteContent, 
    addSection, 
    updateSection, 
    removeSection, 
    reorderSections,
    updateProductCategories,
    applyTemplate
  } = useWebsiteBuilder();
  
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  if (!websiteContent) {
    return <div className="text-center py-8">Keine Website-Inhalte gefunden</div>;
  }
  
  const { sections, productCategories } = websiteContent;
  
  const handleAddSection = (type: string) => {
    if (type === 'products' && !selectedCategory) {
      return;
    }
    
    addSection(type, type === 'products' ? selectedCategory : undefined);
    setIsAddSectionDialogOpen(false);
    setSelectedCategory('');
  };
  
  const handleDuplicateSection = (section: WebsiteSection) => {
    const newSection = { ...section, id: crypto.randomUUID() };
    
    // Find the index of the current section
    const currentIndex = sections.findIndex(s => s.id === section.id);
    
    // Add the duplicate section after the current one
    const updatedSections = [...sections];
    updatedSections.splice(currentIndex + 1, 0, newSection);
    
    // Update the websiteContent with the new sections array
    websiteContent.sections = updatedSections;
    
    // Trigger a content update
    updateSection(section.id, {}); // This is just to trigger an update
  };
  
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < sections.length) {
      reorderSections(index, newIndex);
    }
  };
  
  const handleApplyTemplate = (templateName: string) => {
    applyTemplate(templateName);
    setIsTemplatePickerOpen(false);
  };
  
  const renderSectionEditor = (section: WebsiteSection, index: number) => {
    return (
      <Card key={section.id} className="mb-4 border">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base flex items-center">
            {section.type === 'hero' && <Layout className="h-4 w-4 mr-2" />}
            {section.type === 'text' && <Type className="h-4 w-4 mr-2" />}
            {section.type === 'image' && <ImageIcon className="h-4 w-4 mr-2" />}
            {section.type === 'products' && <ShoppingBag className="h-4 w-4 mr-2" />}
            {section.title || `${section.type.charAt(0).toUpperCase() + section.type.slice(1)}-Bereich`}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleMoveSection(index, 'up')}
              disabled={index === 0}
              title="Nach oben verschieben"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleMoveSection(index, 'down')}
              disabled={index === sections.length - 1}
              title="Nach unten verschieben"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDuplicateSection(section)}
              title="Duplizieren"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeSection(section.id)}
              title="Löschen"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {section.type === 'hero' && (
              <HeroSection 
                section={section} 
                onUpdate={(updates) => updateSection(section.id, updates)} 
              />
            )}
            
            {section.type === 'text' && (
              <TextSection 
                section={section} 
                onUpdate={(updates) => updateSection(section.id, updates)} 
              />
            )}
            
            {section.type === 'image' && (
              <ImageSection 
                section={section} 
                onUpdate={(updates) => updateSection(section.id, updates)} 
              />
            )}
            
            {section.type === 'products' && (
              <ProductSection 
                section={section} 
                productCategories={productCategories}
                onUpdate={(updates) => updateSection(section.id, updates)} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Website-Inhalte bearbeiten</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplatePickerOpen(true)}>
            <Palette className="h-4 w-4 mr-2" />
            Template auswählen
          </Button>
          <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Abschnitt hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Abschnitt hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center justify-center"
                  onClick={() => handleAddSection('hero')}
                >
                  <Layout className="h-8 w-8 mb-2" />
                  <span>Hero-Bereich</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center justify-center"
                  onClick={() => handleAddSection('text')}
                >
                  <Type className="h-8 w-8 mb-2" />
                  <span>Text-Bereich</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center justify-center"
                  onClick={() => handleAddSection('image')}
                >
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span>Bild-Bereich</span>
                </Button>
                
                <div className="col-span-2">
                  <div className="flex flex-col space-y-2 mb-4">
                    <Label htmlFor="product-category">Produktkategorie auswählen</Label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger id="product-category">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-auto p-4 flex items-center justify-center"
                    onClick={() => handleAddSection('products')}
                    disabled={!selectedCategory}
                  >
                    <ShoppingBag className="h-6 w-6 mr-2" />
                    <span>Produkt-Bereich hinzufügen</span>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
                  Abbrechen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template auswählen</DialogTitle>
          </DialogHeader>
          <TemplatePicker onSelect={handleApplyTemplate} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplatePickerOpen(false)}>
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Live-Vorschau</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="mt-4">
          {sections.length === 0 ? (
            <div className="text-center p-12 border rounded-md bg-muted/20">
              <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Keine Abschnitte</h3>
              <p className="text-muted-foreground mb-4">
                Fügen Sie Abschnitte zu Ihrer Website hinzu, um mit der Gestaltung zu beginnen.
              </p>
              <Button onClick={() => setIsAddSectionDialogOpen(true)}>
                Ersten Abschnitt hinzufügen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => renderSectionEditor(section, index))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4 relative border rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Live-Vorschau</h3>
              <p className="text-sm text-muted-foreground">So wird Ihre Website für Besucher aussehen</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('desktop')}
              >
                Desktop
              </Button>
              <Button 
                size="sm" 
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('mobile')}
              >
                Mobil
              </Button>
            </div>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
            <WebsitePreviewInline />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
