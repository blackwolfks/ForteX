
export type SectionType = 
  | "hero" 
  | "text" 
  | "image" 
  | "gallery" 
  | "form" 
  | "product" 
  | "video" 
  | "testimonial" 
  | "cta" 
  | "pricing" 
  | "team" 
  | "faq";

export type Website = {
  id: string;
  name: string;
  url: string;
  template: string;
  shop_template: string;
  status: string;
  user_id: string;
  created_at: string;
  last_saved: string;
  settings?: WebsiteSettings;
  seo?: WebsiteSEO;
};

export type WebsiteSettings = {
  fonts?: {
    headings?: string;
    body?: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  layout?: "fixed" | "fluid";
  animations?: boolean;
};

export type WebsiteSEO = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
};

export type WebsiteContent = {
  id: string;
  website_id: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type WebsiteSection = {
  id: string;
  type: SectionType;
  content: Record<string, any>;
  order: number;
  settings?: {
    background?: {
      type: "color" | "image" | "video";
      value: string;
    };
    spacing?: {
      top: number;
      bottom: number;
    };
    layout?: "full-width" | "contained" | "custom";
    animation?: string;
    sticky?: boolean;
  };
};

export type WebsiteTemplate = {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  category: string;
  settings?: WebsiteSettings;
  sections?: WebsiteSection[];
};

export type WebsiteChangeHistory = {
  id: string;
  website_id: string;
  content_snapshot: Record<string, any>;
  changed_fields: string[];
  changed_at: string;
  changed_by: string;
};

export type UndoRedoAction = {
  type: 'undo' | 'redo';
  timestamp: number;
};

export type WebsitePage = {
  id: string;
  website_id: string;
  slug: string;
  title: string;
  is_homepage: boolean;
  sections: WebsiteSection[];
  seo?: WebsiteSEO;
  created_at: string;
  updated_at: string;
};
