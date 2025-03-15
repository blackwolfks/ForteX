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
   * Checks if a filename is an image based on its extension
   */
  isImageFileName: (filename: string): boolean => {
    if (!filename) return false;
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
  },
  
  /**
   * Validates if the file extension is an accepted image format
   */
  isAcceptedImageFormat: (filename: string): boolean => {
    if (!filename) return false;
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  },
  
  /**
   * Checks if a file is actually an image by inspecting the file content
   * This performs a binary check for image file headers
   */
  isActuallyImage: async (file: File): Promise<boolean> => {
    // Simple file type check based on MIME type
    if (!file.type.startsWith('image/')) {
      console.log("[imageUtils] File doesn't have an image MIME type:", file.type);
      // We'll still do the binary check to be thorough
    }
    
    // Binary signature check for common image formats
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!reader.result || !(reader.result instanceof ArrayBuffer)) {
          console.log("[imageUtils] Failed to read file as ArrayBuffer");
          resolve(false);
          return;
        }
        
        const arr = new Uint8Array(reader.result).subarray(0, 12);
        const header = Array.from(arr).map(byte => byte.toString(16).padStart(2, '0')).join('');
        console.log("[imageUtils] File binary header:", header);
        
        // Magic number signatures for different image formats
        const isJpeg = header.startsWith('ffd8ffe0') || header.startsWith('ffd8ffe1') || 
                       header.startsWith('ffd8ffdb') || header.startsWith('ffd8fffe');
        const isPng = header.startsWith('89504e47');
        const isGif = header.startsWith('47494638');
        const isWebp = header.indexOf('57454250') > -1; // WEBP might not be at the start
        
        const result = isJpeg || isPng || isGif || isWebp;
        console.log("[imageUtils] Is file an actual image:", result, {
          isJpeg, isPng, isGif, isWebp
        });
        
        resolve(result);
      };
      reader.onerror = () => {
        console.error("[imageUtils] Error reading file");
        resolve(false);
      };
      reader.readAsArrayBuffer(file);
    });
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
    if (!filename) return 'application/octet-stream';
    
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
        // Always use a specific image type as fallback
        return 'application/octet-stream'; 
    }
  },
  
  /**
   * Preloads an image to test if it can be loaded
   */
  preloadImage: (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        console.log("[imageUtils] Image preloaded successfully:", url);
        resolve(true);
      };
      img.onerror = () => {
        console.error("[imageUtils] Failed to preload image:", url);
        resolve(false);
      };
      
      // Set the source last to trigger loading
      img.src = url;
      
      // Timeout after 8 seconds (longer timeout for slow connections)
      setTimeout(() => {
        console.warn("[imageUtils] Image preload timed out:", url);
        resolve(false);
      }, 8000);
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
        // Fall back to octet-stream if we can't determine the type
        mimeType = 'application/octet-stream';
    }
    
    // Force both cache bust and explicit content type
    const fixedUrl = `${urlWithoutCache}?t=${timestamp}&contentType=${encodeURIComponent(mimeType)}`;
    return fixedUrl;
  }
};
