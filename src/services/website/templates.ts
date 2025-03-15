
import { WebsiteTemplate } from "@/types/website.types";
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TEMPLATES: WebsiteTemplate[] = [
  // Business Templates
  {
    id: "business-corporate",
    name: "Corporate Business",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Professionelles Design für Unternehmen und Firmen",
    category: "business",
  },
  {
    id: "business-agency",
    name: "Digital Agency",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Modernes Layout für Agenturen und Dienstleister",
    category: "business",
  },
  {
    id: "business-consulting",
    name: "Consulting",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Elegantes Design für Beratungsunternehmen",
    category: "business",
    proOnly: true,
  },

  // Shop Templates
  {
    id: "shop-standard",
    name: "Standard Shop",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Klassischer Online-Shop für alle Produktarten",
    category: "shop",
  },
  {
    id: "shop-digital",
    name: "Digital Products",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Spezialisiert für digitale Produkte und Downloads",
    category: "shop",
  },
  {
    id: "shop-premium",
    name: "Premium Shop",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Hochwertiges Design für Luxusprodukte",
    category: "shop",
    proOnly: true,
  },

  // Portfolio Templates
  {
    id: "portfolio-minimal",
    name: "Minimal Portfolio",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Schlichtes Design zur Präsentation Ihrer Arbeiten",
    category: "portfolio",
  },
  {
    id: "portfolio-creative",
    name: "Creative Portfolio",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Kreatives Layout für Designer und Künstler",
    category: "portfolio",
  },
  {
    id: "portfolio-gallery",
    name: "Gallery Portfolio",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Bildorientiertes Design für Fotografen",
    category: "portfolio",
    proOnly: true,
  },

  // Blog Templates
  {
    id: "blog-standard",
    name: "Standard Blog",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Klassisches Blog-Layout für regelmäßige Inhalte",
    category: "blog",
  },
  {
    id: "blog-magazine",
    name: "Magazine Blog",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Magazin-Stil für vielfältige Inhalte und Kategorien",
    category: "blog",
  },
  {
    id: "blog-premium",
    name: "Premium Content",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Optimiert für Premium-Inhalte und Abonnements",
    category: "blog",
    proOnly: true,
  },

  // Landing Page Templates
  {
    id: "landing-product",
    name: "Product Launch",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Optimiert für Produkteinführungen",
    category: "landing",
  },
  {
    id: "landing-event",
    name: "Event Landing",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Perfekt für Events und Veranstaltungen",
    category: "landing",
  },

  // Custom Template (Pro Only)
  {
    id: "custom",
    name: "Leeres Template",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Starten Sie mit einem leeren Template (nur Pro-Nutzer)",
    category: "custom",
    proOnly: true,
  },
];

const DEFAULT_SHOP_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "shop-gaming",
    name: "Gaming Shop",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Spezialisiert für Gaming-Produkte und Server",
    category: "shop",
  },
  {
    id: "shop-subscription",
    name: "Subscription Shop",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Optimiert für Abonnement-basierte Produkte",
    category: "shop",
  },
  {
    id: "shop-marketplace",
    name: "Marketplace",
    thumbnail: "/lovable-uploads/04119b21-ad59-4fb6-b050-64fb8b45a7fa.png",
    description: "Multi-Vendor Marketplace für verschiedene Anbieter",
    category: "shop",
    proOnly: true,
  },
];

// This function returns default content for each template type
export const getTemplateDefaultContent = (templateId: string) => {
  // Business templates
  if (templateId === "business-corporate") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Willkommen bei Ihrem Unternehmen",
            subtitle: "Professionelle Lösungen für Ihre Geschäftsanforderungen",
            buttonText: "Unsere Dienstleistungen",
            buttonLink: "#services",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Über uns",
            content: "Wir sind ein etabliertes Unternehmen mit jahrelanger Erfahrung in der Branche. Unser Team aus Experten ist darauf spezialisiert, maßgeschneiderte Lösungen für Ihr Unternehmen zu entwickeln.",
            alignment: "left"
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "image",
          content: {
            imageUrl: "/placeholder.svg",
            caption: "Unser Hauptsitz",
            altText: "Bürogebäude des Unternehmens"
          },
          order: 2
        },
        {
          id: uuidv4(),
          type: "form",
          content: {
            title: "Kontaktieren Sie uns",
            fields: [
              { id: uuidv4(), type: "text", label: "Name", required: true },
              { id: uuidv4(), type: "email", label: "E-Mail", required: true },
              { id: uuidv4(), type: "textarea", label: "Nachricht", required: true }
            ],
            buttonText: "Anfrage senden"
          },
          order: 3
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  else if (templateId === "business-agency") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Kreative Digitalagentur",
            subtitle: "Wir gestalten digitale Erlebnisse, die begeistern und Ergebnisse liefern",
            buttonText: "Portfolio entdecken",
            buttonLink: "#portfolio",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Unsere Expertise",
            content: "Als führende Digitalagentur bieten wir umfassende Dienstleistungen von der Webentwicklung über Branding bis hin zu digitalen Marketingstrategien. Wir arbeiten mit Kunden jeder Größe zusammen, um ihre Online-Präsenz zu stärken.",
            alignment: "left"
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "image",
          content: {
            imageUrl: "/placeholder.svg",
            caption: "Unser neuestes Projekt",
            altText: "Screenshot eines Webdesign-Projekts"
          },
          order: 2
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  else if (templateId === "business-consulting") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Strategische Beratung für Ihr Unternehmen",
            subtitle: "Maßgeschneiderte Lösungen für komplexe Geschäftsherausforderungen",
            buttonText: "Beratungsgespräch vereinbaren",
            buttonLink: "#contact",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Unsere Beratungsphilosophie",
            content: "Unsere Berater bringen jahrzehntelange Erfahrung in verschiedenen Branchen mit. Wir analysieren Ihr Unternehmen gründlich und entwickeln Strategien, die zu messbaren Ergebnissen führen.",
            alignment: "left"
          },
          order: 1
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  // Shop templates
  else if (templateId === "shop-standard" || templateId === "shop-gaming" || templateId === "shop-digital") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Willkommen in unserem Online-Shop",
            subtitle: "Entdecken Sie unsere Qualitätsprodukte zu attraktiven Preisen",
            buttonText: "Jetzt einkaufen",
            buttonLink: "#products",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "product",
          content: {
            products: [
              {
                id: uuidv4(),
                name: "Produkt 1",
                description: "Produktbeschreibung hier...",
                price: "49,99 €",
                imageUrl: "/placeholder.svg"
              },
              {
                id: uuidv4(),
                name: "Produkt 2",
                description: "Produktbeschreibung hier...",
                price: "29,99 €",
                imageUrl: "/placeholder.svg"
              },
              {
                id: uuidv4(),
                name: "Produkt 3",
                description: "Produktbeschreibung hier...",
                price: "39,99 €",
                imageUrl: "/placeholder.svg"
              }
            ],
            layout: "grid",
            showPrice: true,
            showDescription: true
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Über unseren Shop",
            content: "Unser Online-Shop bietet eine große Auswahl an qualitativ hochwertigen Produkten. Wir garantieren schnelle Lieferung und exzellenten Kundenservice.",
            alignment: "left"
          },
          order: 2
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  // Portfolio templates
  else if (templateId === "portfolio-minimal" || templateId === "portfolio-creative") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Mein kreatives Portfolio",
            subtitle: "Eine Sammlung meiner besten Arbeiten und Projekte",
            buttonText: "Projekte ansehen",
            buttonLink: "#projects",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Über mich",
            content: "Ich bin ein leidenschaftlicher Designer/Entwickler mit Erfahrung in verschiedenen kreativen Bereichen. Mein Ziel ist es, innovative und ansprechende Lösungen zu schaffen, die Ihre Erwartungen übertreffen.",
            alignment: "left"
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "image",
          content: {
            imageUrl: "/placeholder.svg",
            caption: "Projekt: Webdesign für XYZ",
            altText: "Screenshot eines Webdesign-Projekts"
          },
          order: 2
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  // Blog templates
  else if (templateId === "blog-standard" || templateId === "blog-magazine") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Mein Blog",
            subtitle: "Gedanken, Ideen und Inspirationen zu aktuellen Themen",
            buttonText: "Neueste Beiträge",
            buttonLink: "#posts",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Willkommen auf meinem Blog",
            content: "Hier teile ich regelmäßig meine Gedanken zu verschiedenen Themen. Abonnieren Sie meinen Newsletter, um keine Updates zu verpassen.",
            alignment: "left"
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Neuester Beitrag: Die Zukunft des digitalen Marketings",
            content: "In diesem Beitrag untersuche ich die neuesten Trends im digitalen Marketing und wie Sie diese für Ihr Unternehmen nutzen können...",
            alignment: "left"
          },
          order: 2
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  // Landing page templates
  else if (templateId === "landing-product" || templateId === "landing-event") {
    return {
      sections: [
        {
          id: uuidv4(),
          type: "hero",
          content: {
            title: "Neues Produkt: Innovation XYZ",
            subtitle: "Die revolutionäre Lösung für Ihre täglichen Herausforderungen",
            buttonText: "Jetzt vorbestellen",
            buttonLink: "#order",
            imageUrl: "/placeholder.svg",
            alignment: "center"
          },
          order: 0
        },
        {
          id: uuidv4(),
          type: "text",
          content: {
            title: "Was macht unser Produkt besonders?",
            content: "Unser Produkt bietet innovative Funktionen, die Ihren Alltag erleichtern. Es ist einfach zu bedienen, langlebig und kosteneffizient.",
            alignment: "left"
          },
          order: 1
        },
        {
          id: uuidv4(),
          type: "form",
          content: {
            title: "Bestellen Sie jetzt",
            fields: [
              { id: uuidv4(), type: "text", label: "Name", required: true },
              { id: uuidv4(), type: "email", label: "E-Mail", required: true },
              { id: uuidv4(), type: "text", label: "Adresse", required: true }
            ],
            buttonText: "Jetzt kaufen"
          },
          order: 2
        }
      ],
      lastEdited: new Date().toISOString()
    };
  }
  
  // Default empty template
  return {
    sections: [],
    lastEdited: new Date().toISOString()
  };
};

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
  },

  getTemplateDefaultContent
};
