
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
  createCacheBustedUrl: (url: string): string => {
    const urlWithoutCache = url.split('?')[0];
    return `${urlWithoutCache}?t=${Date.now()}`;
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
  }
};
