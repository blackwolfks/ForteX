
import { useState, useRef } from 'react';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { MediaFile } from '@/services/website-service';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Image as ImageIcon, 
  FileVideo, 
  FileText, 
  Upload, 
  Trash, 
  Copy, 
  Filter,
  Search,
  X,
  Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function MediaManager() {
  const { websiteContent, selectedWebsite, saveContent } = useWebsiteBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isMediaDetailsOpen, setIsMediaDetailsOpen] = useState(false);
  
  if (!websiteContent || !selectedWebsite) {
    return <div className="text-center py-8">Keine Website ausgewählt</div>;
  }
  
  const mediaFiles = websiteContent.mediaFiles || [];
  
  const filteredMedia = mediaFiles.filter(media => {
    const matchesSearch = media.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || media.type === filterType;
    return matchesSearch && matchesType;
  });
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // In a real implementation, we would upload these files to a storage service
      // For now, we'll simulate adding them to our state
      const newMediaFiles: MediaFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.startsWith('image/') 
          ? 'image' 
          : file.type.startsWith('video/') 
            ? 'video' 
            : 'document';
        
        const mediaFile: MediaFile = {
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          type: fileType as 'image' | 'video' | 'document',
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        
        newMediaFiles.push(mediaFile);
      }
      
      const updatedMediaFiles = [...mediaFiles, ...newMediaFiles];
      websiteContent.mediaFiles = updatedMediaFiles;
      await saveContent();
      
      toast.success(`${newMediaFiles.length} Dateien erfolgreich hochgeladen`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Fehler beim Hochladen der Dateien');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const updatedMediaFiles = mediaFiles.filter(media => media.id !== mediaId);
      websiteContent.mediaFiles = updatedMediaFiles;
      await saveContent();
      
      // If the deleted media is the selected one, close the details dialog
      if (selectedMedia && selectedMedia.id === mediaId) {
        setSelectedMedia(null);
        setIsMediaDetailsOpen(false);
      }
      
      toast.success('Mediendatei erfolgreich gelöscht');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Fehler beim Löschen der Mediendatei');
    }
  };
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL in die Zwischenablage kopiert');
  };
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-8 w-8" />;
      case 'video': return <FileVideo className="h-8 w-8" />;
      case 'document': return <FileText className="h-8 w-8" />;
      default: return <FileText className="h-8 w-8" />;
    }
  };
  
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Medien-Manager</CardTitle>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Medien hochladen
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Medien suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div>
              <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="image">Bilder</TabsTrigger>
                  <TabsTrigger value="video">Videos</TabsTrigger>
                  <TabsTrigger value="document">Dokumente</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {filteredMedia.length === 0 ? (
            <div className="text-center p-12 border rounded-md">
              {mediaFiles.length === 0 ? (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Keine Medien</h3>
                  <p className="text-muted-foreground mb-4">
                    Laden Sie Bilder, Videos oder Dokumente hoch, um sie auf Ihrer Website zu verwenden.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Medien hochladen
                  </Button>
                </>
              ) : (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Keine Ergebnisse</h3>
                  <p className="text-muted-foreground mb-4">
                    Keine Medien für Ihre Suchkriterien gefunden.
                  </p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterType('all'); }}>
                    Filter zurücksetzen
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <div
                    className="h-32 bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => { setSelectedMedia(media); setIsMediaDetailsOpen(true); }}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {getFileIcon(media.type)}
                        <span className="mt-2 text-xs text-muted-foreground">{media.type}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardFooter className="flex justify-between p-2">
                    <div className="truncate text-sm flex-1">
                      <div className="font-medium truncate">{media.name}</div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(media.size)}</div>
                    </div>
                    
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyUrl(media.url)}
                        title="URL kopieren"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMedia(media.id)}
                        title="Löschen"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              <Card className="border-dashed flex items-center justify-center h-[140px] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Medien hinzufügen</span>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isMediaDetailsOpen} onOpenChange={setIsMediaDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mediendetails</DialogTitle>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-muted rounded-md flex items-center justify-center min-h-[300px] overflow-hidden">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-center">
                    {getFileIcon(selectedMedia.type)}
                    <div className="mt-4">Vorschau nicht verfügbar</div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Dateiname</Label>
                  <div className="font-medium">{selectedMedia.name}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Typ</Label>
                  <div className="font-medium capitalize">{selectedMedia.type}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Größe</Label>
                  <div className="font-medium">{formatFileSize(selectedMedia.size)}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Hochgeladen am</Label>
                  <div className="font-medium">
                    {new Date(selectedMedia.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={selectedMedia.url} readOnly />
                    <Button variant="outline" onClick={() => handleCopyUrl(selectedMedia.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleDeleteMedia(selectedMedia.id);
                    }}
                    className="w-full"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
