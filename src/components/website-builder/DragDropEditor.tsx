
import React, { useState, useRef } from 'react';
import { 
  Layout, 
  Image as ImageIcon, 
  Type, 
  ShoppingBag, 
  Plus, 
  Settings,
  Move,
  Copy,
  Trash,
  ChevronUp,
  ChevronDown,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebsiteSection } from '@/services/website-service';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface DragDropEditorProps {
  onShowSettings: (sectionId: string) => void;
}

export function DragDropEditor({ onShowSettings }: DragDropEditorProps) {
  const { websiteContent, updateSection, addSection, removeSection, reorderSections } = useWebsiteBuilder();
  const [draggedSection, setDraggedSection] = useState<WebsiteSection | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  
  if (!websiteContent) {
    return <div className="text-center py-8">Keine Website-Inhalte gefunden</div>;
  }
  
  const { sections } = websiteContent;
  
  const handleDragStart = (section: WebsiteSection, index: number) => {
    setDraggedSection(section);
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    reorderSections(draggedIndex, index);
    
    setDraggedSection(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedSection(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleAddSection = (type: string) => {
    addSection(type);
    setIsAddSectionDialogOpen(false);
  };
  
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero':
        return <Layout className="h-5 w-5" />;
      case 'text':
        return <Type className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'products':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Layout className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Drag & Drop Editor</h3>
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
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center justify-center"
                onClick={() => handleAddSection('products')}
              >
                <ShoppingBag className="h-8 w-8 mb-2" />
                <span>Produkt-Bereich</span>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
                Abbrechen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md p-4 min-h-[400px] bg-muted/10 relative">
        {sections.length === 0 ? (
          <div className="text-center p-12">
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
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(section, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`cursor-move ${dragOverIndex === index ? 'border-2 border-primary border-dashed' : ''} ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                    <CardTitle className="text-base flex items-center">
                      <Move className="h-4 w-4 mr-2 cursor-grab" />
                      {getSectionIcon(section.type)}
                      <span className="ml-2">
                        {section.title || `${section.type.charAt(0).toUpperCase() + section.type.slice(1)}-Bereich`}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onShowSettings(section.id)}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const duplicatedSection = { ...section, id: crypto.randomUUID() };
                          const newSections = [...sections];
                          newSections.splice(index + 1, 0, duplicatedSection);
                          websiteContent.sections = newSections;
                          updateSection(section.id, {});
                        }}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => index > 0 && reorderSections(index, index - 1)}
                        disabled={index === 0}
                        title="Nach oben verschieben"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => index < sections.length - 1 && reorderSections(index, index + 1)}
                        disabled={index === sections.length - 1}
                        title="Nach unten verschieben"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="p-4 border rounded-md bg-background">
                      {/* Section preview */}
                      <div className="flex items-center justify-center min-h-[100px]">
                        {section.type === 'hero' && (
                          <div className="text-center">
                            <div className="font-bold">{section.title || 'Hero Titel'}</div>
                            <p className="text-sm">{section.content?.substring(0, 50) || 'Hero Inhalt'}...</p>
                          </div>
                        )}
                        {section.type === 'text' && (
                          <div className="text-center">
                            <div className="font-bold">{section.title || 'Text Titel'}</div>
                            <p className="text-sm">{section.content?.substring(0, 50) || 'Text Inhalt'}...</p>
                          </div>
                        )}
                        {section.type === 'image' && (
                          <div className="text-center">
                            <div className="font-bold">{section.title || 'Bild Titel'}</div>
                            {section.imageUrl && (
                              <img src={section.imageUrl} alt={section.title} className="h-20 object-cover mx-auto mt-2" />
                            )}
                          </div>
                        )}
                        {section.type === 'products' && (
                          <div className="text-center">
                            <div className="font-bold">{section.title || 'Produkt Titel'}</div>
                            <p className="text-sm">Kategorie: {section.productCategory || 'Alle'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
