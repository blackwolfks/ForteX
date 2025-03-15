
import { WebsiteTemplate } from "@/types/website.types";

const DEFAULT_TEMPLATES: WebsiteTemplate[] = [
  // Business Templates
  {
    id: "business-corporate",
    name: "Corporate Business",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Professionelles Design für Unternehmen und Firmen",
    category: "business",
  },
  {
    id: "business-agency",
    name: "Digital Agency",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Modernes Layout für Agenturen und Dienstleister",
    category: "business",
  },
  {
    id: "business-consulting",
    name: "Consulting",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Elegantes Design für Beratungsunternehmen",
    category: "business",
    proOnly: true,
  },

  // Shop Templates
  {
    id: "shop-standard",
    name: "Standard Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Klassischer Online-Shop für alle Produktarten",
    category: "shop",
  },
  {
    id: "shop-digital",
    name: "Digital Products",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Spezialisiert für digitale Produkte und Downloads",
    category: "shop",
  },
  {
    id: "shop-premium",
    name: "Premium Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Hochwertiges Design für Luxusprodukte",
    category: "shop",
    proOnly: true,
  },

  // Portfolio Templates
  {
    id: "portfolio-minimal",
    name: "Minimal Portfolio",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Schlichtes Design zur Präsentation Ihrer Arbeiten",
    category: "portfolio",
  },
  {
    id: "portfolio-creative",
    name: "Creative Portfolio",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Kreatives Layout für Designer und Künstler",
    category: "portfolio",
  },
  {
    id: "portfolio-gallery",
    name: "Gallery Portfolio",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Bildorientiertes Design für Fotografen",
    category: "portfolio",
    proOnly: true,
  },

  // Blog Templates
  {
    id: "blog-standard",
    name: "Standard Blog",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Klassisches Blog-Layout für regelmäßige Inhalte",
    category: "blog",
  },
  {
    id: "blog-magazine",
    name: "Magazine Blog",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Magazin-Stil für vielfältige Inhalte und Kategorien",
    category: "blog",
  },
  {
    id: "blog-premium",
    name: "Premium Content",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Optimiert für Premium-Inhalte und Abonnements",
    category: "blog",
    proOnly: true,
  },

  // Landing Page Templates
  {
    id: "landing-product",
    name: "Product Launch",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Optimiert für Produkteinführungen",
    category: "landing",
  },
  {
    id: "landing-event",
    name: "Event Landing",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Perfekt für Events und Veranstaltungen",
    category: "landing",
  },

  // Custom Template (Pro Only)
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
    id: "shop-gaming",
    name: "Gaming Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Spezialisiert für Gaming-Produkte und Server",
    category: "shop",
  },
  {
    id: "shop-subscription",
    name: "Subscription Shop",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Optimiert für Abonnement-basierte Produkte",
    category: "shop",
  },
  {
    id: "shop-marketplace",
    name: "Marketplace",
    thumbnail: "/lovable-uploads/081aa27c-365a-4179-8f47-23b3cd2f90b8.png",
    description: "Multi-Vendor Marketplace für verschiedene Anbieter",
    category: "shop",
    proOnly: true,
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
