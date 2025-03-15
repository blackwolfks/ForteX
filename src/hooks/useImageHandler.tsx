
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { imageUtils } from '@/lib/image-utils';

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
    
    setImageError(false);
    setLoadingRetries(0);
    
    console.log("[useImageHandler] Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Check file size first
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Datei ist zu groß. Die maximale Dateigröße beträgt 5MB.");
      return;
    }
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    console.log("[useImageHandler] File extension:", fileExtension);
    
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      toast.error(`Dateityp .${fileExtension} wird nicht unterstützt. Bitte nur Bilder im JPG, PNG, GIF oder WebP Format hochladen.`);
      return;
    }
    
    setUploading(true);
    try {
      console.log("[useImageHandler] Starting image upload for file:", file.name, "type:", file.type);
      const imageUrl = await onUpload(file);
      
      if (imageUrl) {
        console.log("[useImageHandler] Upload successful, setting new image URL:", imageUrl);
        onUpdate({ imageUrl });
        
        // Force content type in the image preload
        const img = new Image();
        img.crossOrigin = "anonymous"; // Try to handle CORS issues
        
        // Add listener to handle successful load
        img.onload = () => {
          console.log("[useImageHandler] Image preloaded successfully");
        };
        
        // Add error listener to catch preload issues
        img.onerror = (error) => {
          console.error("[useImageHandler] Error preloading image:", error);
          // We don't set error state here to give the component's image a chance to load
        };
        
        // Set the source last to trigger loading
        img.src = imageUrl;
        
        toast.success("Bild erfolgreich hochgeladen");
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
      
      // Force browser to reload the image by appending a cache-busting query parameter
      const cacheBuster = `?t=${Date.now()}`;
      const urlWithoutCache = imageUrl.split('?')[0]; // Remove any existing query params
      
      // Add the proper content type hint based on file extension
      const fileExtension = urlWithoutCache.split('.').pop()?.toLowerCase() || '';
      let contentTypeHint = '';
      
      switch (fileExtension) {
        case 'jpg':
        case 'jpeg':
          contentTypeHint = '&contentType=image/jpeg';
          break;
        case 'png':
          contentTypeHint = '&contentType=image/png';
          break;
        case 'gif':
          contentTypeHint = '&contentType=image/gif';
          break;
        case 'webp':
          contentTypeHint = '&contentType=image/webp';
          break;
      }
      
      const newUrl = `${urlWithoutCache}${cacheBuster}${contentTypeHint}`;
      
      onUpdate({ imageUrl: newUrl });
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
