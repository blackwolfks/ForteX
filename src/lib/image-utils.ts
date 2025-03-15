
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
  }
};
