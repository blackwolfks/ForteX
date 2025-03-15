
import { WebsiteTemplate } from "@/types/website.types";

const DEFAULT_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "business",
    name: "Business",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Professionelle Website für Unternehmen",
    category: "business",
  },
  {
    id: "shop",
    name: "Online Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "E-Commerce-Plattform für Produkte",
    category: "shop",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Präsentieren Sie Ihre Arbeit und Projekte",
    category: "portfolio",
  },
  {
    id: "blog",
    name: "Blog",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Teilen Sie Ihre Gedanken und Inhalte",
    category: "blog",
  },
  {
    id: "landing",
    name: "Landing Page",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Einzelne Seite für Marketingkampagnen",
    category: "landing",
  },
  {
    id: "custom",
    name: "Leeres Template",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Starten Sie mit einem leeren Template (nur Pro-Nutzer)",
    category: "custom",
    proOnly: true,
  },
];

const DEFAULT_SHOP_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "basic-shop",
    name: "Basic Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Einfacher Online-Shop",
    category: "shop",
  },
  {
    id: "advanced-shop",
    name: "Advanced Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Erweiterter Online-Shop mit Funktionen",
    category: "shop",
  },
];

export const templateService = {
  getTemplates(): WebsiteTemplate[] {
    return DEFAULT_TEMPLATES;
  },
  
  getShopTemplates(): WebsiteTemplate[] {
    return DEFAULT_SHOP_TEMPLATES;
  },
  
  getTemplate(id: string): WebsiteTemplate | null {
    const allTemplates = [...DEFAULT_TEMPLATES, ...DEFAULT_SHOP_TEMPLATES];
    return allTemplates.find(t => t.id === id) || null;
  }
};
