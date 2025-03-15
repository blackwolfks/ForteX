
import { cn } from "./utils";

/**
 * Utility functions for handling images
 */
export const imageUtils = {
  /**
   * Gets a URL without cache parameters, useful for comparing or cleaning image URLs
   */
  getUrlWithoutCache: (url: string): string => {
    return url.split('?')[0];
  },
  
  /**
   * Creates a cache-busting URL by appending a timestamp
   */
  createCacheBustedUrl: (url: string, enforceContentType: boolean = true): string => {
    const urlWithoutCache = url.split('?')[0];
    const timestamp = Date.now();
    
    // If we need to enforce content type based on extension
    if (enforceContentType) {
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
      
      return `${urlWithoutCache}?t=${timestamp}${contentTypeHint}`;
    }
    
    return `${urlWithoutCache}?t=${timestamp}`;
  },
  
  /**
   * Validates if the file extension is an accepted image format
   */
  isAcceptedImageFormat: (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  },
  
  /**
   * Returns the image CSS classes with optional additional classes
   */
  getImageClasses: (additionalClasses?: string): string => {
    return cn(
      "w-full h-auto rounded-lg", 
      additionalClasses
    );
  },
  
  /**
   * Gets the appropriate MIME content type based on file extension
   */
  getContentTypeFromExtension: (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream'; // Generic binary file as fallback
    }
  },
  
  /**
   * Creates an img HTML element with proper attributes for preloading
   */
  preloadImage: (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Set the source last to trigger loading
      img.src = url;
    });
  },
  
  /**
   * Ensures proper content type by adding direct headers to the URL
   * This is especially useful for Supabase storage URLs
   */
  fixSupabaseImageUrl: (url: string): string => {
    if (!url || url === '/placeholder.svg') return url;
    
    const urlWithoutCache = url.split('?')[0];
    const fileExtension = urlWithoutCache.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    
    let mimeType = '';
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        // If we can't determine the type, try to use png as fallback
        mimeType = 'image/png';
    }
    
    // Force both the cache bust and explicit content type
    return `${urlWithoutCache}?t=${timestamp}&contentType=${encodeURIComponent(mimeType)}`;
  }
};
