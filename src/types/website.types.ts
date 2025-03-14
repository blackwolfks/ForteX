
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
};

export type WebsiteTemplate = {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  category: string;
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
