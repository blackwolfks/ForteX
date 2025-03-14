
import { useIsMobile } from "@/hooks/use-mobile";
import { WebsiteContent } from "@/services/website-service";
import { Separator } from "@/components/ui/separator";

interface WebsitePreviewProps {
  content: WebsiteContent;
}

export const WebsitePreview = ({ content }: WebsitePreviewProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} h-full overflow-auto`}>
      <div className="max-w-4xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
          {content.subtitle && (
            <h2 className="text-xl text-gray-600 mb-4">{content.subtitle}</h2>
          )}
          {content.description && (
            <p className="text-gray-600">{content.description}</p>
          )}
        </div>
        
        {/* Section previews */}
        {content.sections.length > 0 ? (
          <div className="space-y-12">
            {content.sections.map((section) => (
              <div key={section.id} className="py-4">
                <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                <p className="text-gray-700 mb-6">{section.description}</p>
                <Separator />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 italic">
            <p>Keine Abschnitte vorhanden. Fügen Sie Abschnitte hinzu, um die Vorschau zu sehen.</p>
          </div>
        )}
      </div>
    </div>
  );
};
