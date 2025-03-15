
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { imageUtils } from '@/lib/image-utils';
import { supabase } from '@/integrations/supabase/client';

interface UseImageHandlerProps {
  imageUrl: string;
  onUpdate: (content: Record<string, any>) => void;
  onUpload: (file: File) => Promise<string | null>;
}

export function useImageHandler({ imageUrl, onUpdate, onUpload }: UseImageHandlerProps) {
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingRetries, setLoadingRetries] = useState(0);
  
  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);
  
  // Attempt to reload the image if it fails initially
  useEffect(() => {
    if (imageError && loadingRetries < 2 && imageUrl && imageUrl !== '/placeholder.svg') {
      const timer = setTimeout(() => {
        console.log(`[useImageHandler] Retrying image load (attempt ${loadingRetries + 1}):`, imageUrl);
        setImageError(false);
        setLoadingRetries(prev => prev + 1);
      }, 2000); // Wait 2 seconds before retry
      
      return () => clearTimeout(timer);
    }
  }, [imageError, imageUrl, loadingRetries]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("[useImageHandler] User not authenticated");
      toast.error("Sie müssen angemeldet sein, um Bilder hochzuladen");
      return;
    }
    
    setImageError(false);
    setLoadingRetries(0);
    
    console.log("[useImageHandler] Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Check file size first
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return;
    }
    
    // Check file extension
    if (!imageUtils.isAcceptedImageFormat(file.name)) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
      return;
    }
    
    // Validate that file is actually an image
    const isImage = await imageUtils.isActuallyImage(file);
    if (!isImage) {
      toast.error("Die ausgewählte Datei scheint kein gültiges Bild zu sein. Bitte wählen Sie eine echte Bilddatei aus.");
      return;
    }
    
    setUploading(true);
    try {
      console.log("[useImageHandler] Starting image upload for file:", file.name, "type:", file.type);
      
      // Datei klonen, um sicherzustellen, dass wir eine frische Kopie haben
      const clonedFile = new File([await file.arrayBuffer()], file.name, {
        type: imageUtils.getContentTypeFromExtension(file.name)
      });
      console.log("[useImageHandler] Created cloned file with type:", clonedFile.type);
      
      // Die geklonte Datei mit korrektem MIME-Type hochladen
      const imageUrl = await onUpload(clonedFile);
      
      if (imageUrl) {
        console.log("[useImageHandler] Upload successful, setting new image URL:", imageUrl);
        // Use our fixed URL to ensure proper content type
        const fixedImageUrl = imageUtils.fixSupabaseImageUrl(imageUrl);
        onUpdate({ imageUrl: fixedImageUrl });
        
        // Preload image to catch any issues early
        const preloadSuccess = await imageUtils.preloadImage(fixedImageUrl);
        if (preloadSuccess) {
          console.log("[useImageHandler] Image preloaded successfully");
          toast.success("Bild erfolgreich hochgeladen");
        } else {
          console.warn("[useImageHandler] Image preload failed, but continuing");
          toast.success("Bild hochgeladen, kann aber möglicherweise nicht angezeigt werden");
        }
      } else {
        console.error("[useImageHandler] Upload failed - no URL returned");
        toast.error("Fehler beim Hochladen des Bildes");
      }
    } catch (error) {
      console.error('[useImageHandler] Error uploading image:', error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };
  
  const handleRetryLoad = () => {
    if (imageUrl && imageUrl !== '/placeholder.svg') {
      console.log("[useImageHandler] Manually retrying image load:", imageUrl);
      setImageError(false);
      
      // Use our utility to create a fixed URL
      const fixedImageUrl = imageUtils.fixSupabaseImageUrl(imageUrl);
      
      onUpdate({ imageUrl: fixedImageUrl });
      toast.info("Bild wird neu geladen...");
    }
  };
  
  return {
    uploading,
    imageError,
    setImageError,
    handleImageUpload,
    handleRetryLoad
  };
}
