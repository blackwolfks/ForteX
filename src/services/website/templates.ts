
import { WebsiteTemplate } from "@/types/website.types";

const DEFAULT_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "business",
    name: "Business",
    thumbnail: "/placeholder.svg",
    description: "Professionelle Website für Unternehmen",
    category: "business",
  },
  {
    id: "shop",
    name: "Online Shop",
    thumbnail: "/placeholder.svg",
    description: "E-Commerce-Plattform für Produkte",
    category: "shop",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    thumbnail: "/placeholder.svg",
    description: "Präsentieren Sie Ihre Arbeit und Projekte",
    category: "portfolio",
  },
  {
    id: "blog",
    name: "Blog",
    thumbnail: "/placeholder.svg",
    description: "Teilen Sie Ihre Gedanken und Inhalte",
    category: "blog",
  },
  {
    id: "landing",
    name: "Landing Page",
    thumbnail: "/placeholder.svg",
    description: "Einzelne Seite für Marketingkampagnen",
    category: "landing",
  },
];

const DEFAULT_SHOP_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "basic-shop",
    name: "Basic Shop",
    thumbnail: "/placeholder.svg",
    description: "Einfacher Online-Shop",
    category: "shop",
  },
  {
    id: "advanced-shop",
    name: "Advanced Shop",
    thumbnail: "/placeholder.svg",
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
    return DEFAULT_TEMPLATES.find(t => t.id === id) || null;
  }
};
