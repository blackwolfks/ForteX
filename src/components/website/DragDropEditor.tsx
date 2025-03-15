
import { useState, useRef } from 'react';
import { SectionType, WebsiteSection } from '@/services/website-service';
import { useWebsiteBuilder, EditorMode } from '@/hooks/useWebsiteBuilder';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Save, Edit, Eye, Smartphone, ChevronUp, ChevronDown, Copy, Trash2, Layers, Undo2, Redo2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import HeroSection from './sections/HeroSection';
import TextSection from './sections/TextSection';
import ImageSection from './sections/ImageSection';
import FormSection from './sections/FormSection';
import ProductSection from './sections/ProductSection';
import { toast } from 'sonner';
import { websiteService } from '@/services/website-service';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { useHotkeys } from '@/hooks/useHotkeys';

interface DragDropEditorProps {
  websiteId: string;
  onMediaUpload?: (file: File) => Promise<string | null>;
}

export default function DragDropEditor({ websiteId, onMediaUpload }: DragDropEditorProps) {
  const {
    website,
    sections,
    loading,
    saving,
    mode,
    selectedSectionId,
    canUndo,
    canRedo,
    setMode,
    setSelectedSectionId,
    saveContent,
    addSection,
    updateSectionContent,
    reorderSections,
    deleteSection,
    duplicateSection,
    publishWebsite,
    undo,
    redo
  } = useWebsiteBuilder(websiteId);
  
  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const dragOverSectionRef = useRef<string | null>(null);
  
  useHotkeys([
    { key: 'mod+z', callback: undo, enabled: canUndo },
    { key: 'mod+shift+z', callback: redo, enabled: canRedo },
    { key: 'mod+s', callback: () => saveContent(), preventDefault: true }
  ]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const handleSave = async () => {
    console.log('Save button clicked');
    if (!websiteId) {
      console.error('WebsiteId is missing');
      toast.error('Fehler: Website-ID nicht gefunden');
      return;
    }
    
    const success = await saveContent();
    if (success) {
      toast.success('Website erfolgreich gespeichert');
    } else {
      toast.error('Fehler beim Speichern der Website');
    }
  };
  
  const handlePublish = async () => {
    const success = await publishWebsite();
    if (success) {
      toast.success('Website erfolgreich veröffentlicht');
    }
  };
  
  const handleDragStart = (sectionId: string) => {
    setDraggingSection(sectionId);
  };
  
  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    dragOverSectionRef.current = sectionId;
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingSection && dragOverSectionRef.current) {
      const draggedIndex = sections.findIndex(s => s.id === draggingSection);
      const dropIndex = sections.findIndex(s => s.id === dragOverSectionRef.current);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        reorderSections(draggedIndex, dropIndex);
      }
      
      setDraggingSection(null);
      dragOverSectionRef.current = null;
    }
  };
  
  const handleMoveUp = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      reorderSections(index, index - 1);
    }
  };
  
  const handleMoveDown = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index < sections.length - 1) {
      reorderSections(index, index + 1);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (onMediaUpload) {
      return await onMediaUpload(file);
    }
    
    return await websiteService.uploadMedia(file);
  };
  
  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <HeroSection 
            section={section} 
            isEditing={false}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
            onUpload={handleFileUpload}
          />
        );
      case 'text':
        return (
          <TextSection 
            section={section} 
            isEditing={false}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      case 'image':
        return (
          <ImageSection 
            section={section} 
            isEditing={false}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
            onUpload={handleFileUpload}
          />
        );
      case 'form':
        return (
          <FormSection 
            section={section} 
            isEditing={false}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      case 'product':
        return (
          <ProductSection 
            section={section} 
            isEditing={false}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      default:
        return <div>Unbekannter Abschnittstyp: {section.type}</div>;
    }
  };
  
  const renderEditingSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <HeroSection 
            section={section} 
            isEditing={true}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
            onUpload={handleFileUpload}
          />
        );
      case 'text':
        return (
          <TextSection 
            section={section} 
            isEditing={true}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      case 'image':
        return (
          <ImageSection 
            section={section} 
            isEditing={true}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
            onUpload={handleFileUpload}
          />
        );
      case 'form':
        return (
          <FormSection 
            section={section} 
            isEditing={true}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      case 'product':
        return (
          <ProductSection 
            section={section} 
            isEditing={true}
            onUpdate={(content) => updateSectionContent(section.id, content)} 
          />
        );
      default:
        return <div>Unbekannter Abschnittstyp: {section.type}</div>;
    }
  };
  
  const sectionTypeMap: Record<SectionType, string> = {
    hero: 'Header',
    text: 'Text',
    image: 'Bild',
    gallery: 'Galerie',
    form: 'Formular',
    product: 'Produkte',
    video: 'Video',
    testimonial: 'Testimonials',
    cta: 'Call-to-Action',
    pricing: 'Preise',
    team: 'Team',
    faq: 'FAQ'
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-darkgray-700 border-b border-darkgray-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('edit')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vorschau
          </Button>
          <Button
            variant={mode === 'mobile-preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('mobile-preview')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobil
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rückgängig (Strg+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Wiederherstellen (Strg+Shift+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePublish}
            disabled={saving}
            className="bg-turquoise-500 hover:bg-turquoise-600"
          >
            Veröffentlichen
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {mode === 'edit' && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} className="flex flex-col">
                <div className="w-full h-full bg-darkgray-700 border-r border-darkgray-600 p-4 overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg mb-2">Abschnitte hinzufügen</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(['hero', 'text', 'image', 'form', 'product'] as SectionType[]).map(type => (
                        <Card 
                          key={type} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => addSection(type)}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="text-xs font-medium">{sectionTypeMap[type]}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Struktur</h3>
                    <div className="space-y-2">
                      {sections.map(section => (
                        <div 
                          key={section.id}
                          className={`p-2 border rounded-md cursor-pointer flex items-center justify-between ${
                            selectedSectionId === section.id ? 'bg-muted border-primary' : ''
                          }`}
                          onClick={() => setSelectedSectionId(section.id)}
                          draggable
                          onDragStart={() => handleDragStart(section.id)}
                          onDragOver={(e) => handleDragOver(e, section.id)}
                          onDrop={handleDrop}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <span>{sectionTypeMap[section.type] || 'Abschnitt'}</span>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <span className="sr-only">Aktionen</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMoveUp(section.id)}>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Nach oben
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveDown(section.id)}>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Nach unten
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateSection(section.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplizieren
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteSection(section.id)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      
                      {sections.length === 0 && (
                        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                          <p>Keine Abschnitte</p>
                          <p className="text-xs mt-1">Fügen Sie Abschnitte hinzu, um Ihre Website zu gestalten</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={60}>
                <div className="h-full overflow-auto bg-white">
                  {sections.map(section => renderSection(section))}
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full overflow-y-auto">
                  {selectedSectionId && (
                    <div className="h-full overflow-y-auto">
                      {renderEditingSection(
                        sections.find(s => s.id === selectedSectionId) as WebsiteSection
                      )}
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </>
          )}

          {mode !== 'edit' && (
            <ResizablePanel defaultSize={100}>
              <div className="h-full overflow-auto">
                {mode === 'mobile-preview' ? (
                  <div className="flex justify-center p-4 h-full bg-darkgray-800">
                    <div className="w-[375px] h-[667px] border border-darkgray-600 rounded-lg overflow-hidden shadow-lg">
                      <div className="w-full h-full bg-white overflow-y-auto">
                        {sections.map(section => renderSection(section))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto bg-white">
                    {sections.map(section => renderSection(section))}
                  </div>
                )}
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
