
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { WebsiteSection } from '@/services/website-service';

export function WebsitePreviewInline() {
  const { websiteContent } = useWebsiteBuilder();
  
  if (!websiteContent) {
    return <div className="text-center py-8">Keine Vorschau verfügbar</div>;
  }
  
  const { sections, layout } = websiteContent;
  
  const renderHeader = () => {
    const { header } = layout;
    
    return (
      <header className="border-b p-4 flex justify-between items-center">
        <div className="font-bold text-lg">{header.logoText}</div>
        <nav className="hidden sm:flex gap-4">
          {header.navigation.map((item, index) => (
            <a key={index} href="#" className="text-sm hover:text-primary">
              {item.label}
            </a>
          ))}
        </nav>
      </header>
    );
  };
  
  const renderFooter = () => {
    const { footer } = layout;
    
    return (
      <footer className="border-t p-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="font-bold mb-2">{footer.companyName}</div>
              <p className="text-sm text-muted-foreground">
                {footer.copyrightText}
              </p>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Links</h4>
                  <ul className="space-y-2">
                    {footer.links.map((link, index) => (
                      <li key={index}>
                        <a href="#" className="text-sm hover:text-primary">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Social Media</h4>
                  <ul className="space-y-2">
                    {footer.socialMedia.map((social, index) => (
                      <li key={index}>
                        <a href="#" className="text-sm hover:text-primary">
                          {social.platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  };
  
  const renderSection = (section: WebsiteSection) => {
    const sectionStyle = {
      backgroundColor: section.backgroundColor || '#ffffff',
      color: section.textColor || '#000000',
      textAlign: section.alignment || 'left'
    } as React.CSSProperties;
    
    switch (section.type) {
      case 'hero':
        return (
          <section 
            key={section.id} 
            className="py-16 px-4"
            style={sectionStyle}
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-4">{section.title}</h1>
                  <p className="mb-6">{section.content}</p>
                  {section.buttonText && (
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                      {section.buttonText}
                    </button>
                  )}
                </div>
                {section.imageUrl && (
                  <div>
                    <img 
                      src={section.imageUrl} 
                      alt={section.title || "Hero image"} 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
        
      case 'text':
        return (
          <section 
            key={section.id} 
            className="py-12 px-4"
            style={sectionStyle}
          >
            <div className="max-w-4xl mx-auto">
              {section.title && (
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              )}
              <div className="prose max-w-none">
                {section.content}
              </div>
            </div>
          </section>
        );
        
      case 'image':
        return (
          <section 
            key={section.id} 
            className="py-12 px-4"
            style={sectionStyle}
          >
            <div className="max-w-5xl mx-auto">
              {section.title && (
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              )}
              {section.imageUrl && (
                <img 
                  src={section.imageUrl} 
                  alt={section.title || "Image"} 
                  className="w-full h-auto rounded-lg my-4"
                />
              )}
              {section.content && (
                <p className="text-muted-foreground">{section.content}</p>
              )}
            </div>
          </section>
        );
        
      case 'products':
        return (
          <section 
            key={section.id} 
            className="py-12 px-4"
            style={sectionStyle}
          >
            <div className="max-w-7xl mx-auto">
              {section.title && (
                <h2 className="text-2xl font-bold mb-6 text-center">{section.title}</h2>
              )}
              {section.content && (
                <p className="text-center max-w-3xl mx-auto mb-8">{section.content}</p>
              )}
              <div className={`grid grid-cols-1 md:grid-cols-${section.columns || 3} gap-6`}>
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border rounded-lg overflow-hidden bg-card">
                    <div className="aspect-square bg-muted"></div>
                    <div className="p-4">
                      <div className="font-medium">Produktname</div>
                      <div className="text-sm text-muted-foreground">Produktbeschreibung</div>
                      <div className="mt-2 font-bold">€99.99</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="border rounded-lg overflow-hidden bg-background w-full preview-container">
      {renderHeader()}
      <main>
        {sections.map(renderSection)}
      </main>
      {renderFooter()}
    </div>
  );
}
