
// Export types from the types file
export type {
  SectionType,
  Website,
  WebsiteContent,
  WebsiteSection,
  WebsiteTemplate,
  WebsiteChangeHistory
} from '@/types/website.types';

// Import and re-export all services
import { templateService } from './website/templates';
import { contentService } from './website/content';
import { mediaService } from './website/media';
import { websiteManageService } from './website/manage';
import { settingsService } from './website/settings';

// Export combined service
export const websiteService = {
  // Website management
  getUserWebsites: websiteManageService.getUserWebsites,
  getWebsiteById: websiteManageService.getWebsiteById,
  createWebsite: websiteManageService.createWebsite,
  updateWebsite: websiteManageService.updateWebsite,
  updateWebsiteStatus: websiteManageService.updateWebsiteStatus,
  deleteWebsite: websiteManageService.deleteWebsite,
  
  // Content management
  getWebsiteContent: contentService.getWebsiteContent,
  saveWebsiteContent: contentService.saveWebsiteContent,
  addWebsiteChangeHistory: contentService.addWebsiteChangeHistory,
  getWebsiteChangeHistory: contentService.getWebsiteChangeHistory,
  
  // Media management
  uploadMedia: mediaService.uploadMedia,
  
  // Template management
  getTemplates: templateService.getTemplates,
  getShopTemplates: templateService.getShopTemplates,
  getTemplate: templateService.getTemplate,
  
  // Settings management
  getSettings: settingsService.getSettings,
  saveSettings: settingsService.saveSettings
};
