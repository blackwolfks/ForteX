
import { SectionType } from '@/types/website.types';
import { v4 as uuidv4 } from 'uuid';

// Utility function to get default content for different section types
export const getDefaultContent = (type: SectionType): Record<string, any> => {
  switch (type) {
    case 'hero':
      return {
        title: 'Überschrift',
        subtitle: 'Untertitel',
        buttonText: 'Klicken Sie hier',
        buttonLink: '#',
        imageUrl: '/placeholder.svg',
        alignment: 'center'
      };
    case 'text':
      return {
        title: 'Abschnittsüberschrift',
        content: 'Hier kommt Ihr Text. Klicken Sie zum Bearbeiten.',
        alignment: 'left'
      };
    case 'image':
      return {
        imageUrl: '/placeholder.svg',
        caption: 'Bildbeschreibung',
        altText: 'Beschreibender Text'
      };
    case 'gallery':
      return {
        images: [
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 1' },
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 2' },
          { id: uuidv4(), url: '/placeholder.svg', caption: 'Bild 3' }
        ],
        layout: 'grid'
      };
    case 'form':
      return {
        title: 'Kontaktformular',
        fields: [
          { id: uuidv4(), type: 'text', label: 'Name', required: true },
          { id: uuidv4(), type: 'email', label: 'E-Mail', required: true },
          { id: uuidv4(), type: 'textarea', label: 'Nachricht', required: true }
        ],
        buttonText: 'Absenden'
      };
    case 'product':
      return {
        products: [],
        layout: 'grid',
        showPrice: true,
        showDescription: true
      };
    case 'video':
      return {
        videoUrl: '',
        caption: 'Video-Titel',
        autoplay: false,
        controls: true
      };
    case 'testimonial':
      return {
        quotes: [
          { 
            id: uuidv4(), 
            text: 'Ein tolles Produkt!', 
            author: 'Max Mustermann',
            role: 'Kunde',
            avatarUrl: '/placeholder.svg'
          }
        ],
        layout: 'cards'
      };
    case 'cta':
      return {
        title: 'Handlungsaufforderung',
        subtitle: 'Hier können Sie beschreiben, warum der Benutzer handeln sollte.',
        buttonText: 'Jetzt starten',
        buttonLink: '#',
        bgColor: 'bg-primary'
      };
    case 'pricing':
      return {
        title: 'Preismodelle',
        plans: [
          {
            id: uuidv4(),
            name: 'Basic',
            price: '9,99 €',
            period: 'monatlich',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            buttonText: 'Auswählen',
            buttonLink: '#',
            highlighted: false
          },
          {
            id: uuidv4(),
            name: 'Premium',
            price: '19,99 €',
            period: 'monatlich',
            features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
            buttonText: 'Auswählen',
            buttonLink: '#',
            highlighted: true
          }
        ]
      };
    case 'team':
      return {
        title: 'Unser Team',
        members: [
          {
            id: uuidv4(),
            name: 'Max Mustermann',
            role: 'CEO',
            bio: 'Kurze Biografie',
            imageUrl: '/placeholder.svg',
            socialLinks: {
              twitter: '',
              linkedin: '',
              email: ''
            }
          },
          {
            id: uuidv4(),
            name: 'Erika Musterfrau',
            role: 'CTO',
            bio: 'Kurze Biografie',
            imageUrl: '/placeholder.svg',
            socialLinks: {
              twitter: '',
              linkedin: '',
              email: ''
            }
          }
        ],
        layout: 'grid'
      };
    case 'faq':
      return {
        title: 'Häufig gestellte Fragen',
        items: [
          {
            id: uuidv4(),
            question: 'Was ist Frage 1?',
            answer: 'Dies ist die Antwort auf Frage 1.'
          },
          {
            id: uuidv4(),
            question: 'Was ist Frage 2?',
            answer: 'Dies ist die Antwort auf Frage 2.'
          },
          {
            id: uuidv4(),
            question: 'Was ist Frage 3?',
            answer: 'Dies ist die Antwort auf Frage 3.'
          }
        ]
      };
    default:
      return {};
  }
};
