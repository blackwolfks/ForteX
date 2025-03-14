
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { WebsiteEditor } from "./WebsiteEditor";
import { EmptyWebsitesList } from "./EmptyWebsitesList";
import { WebsitesList } from "./WebsitesList";
import { NewWebsiteDialog } from "./NewWebsiteDialog";
import { useWebsiteBuilder } from "@/hooks/useWebsiteBuilder";

export function WebsiteBuilderView() {
  const {
    websites,
    isLoading,
    selectedWebsite,
    setSelectedWebsite,
    showNewWebsiteDialog,
    setShowNewWebsiteDialog,
    isCreating,
    handleCreateWebsite,
    handleDeleteWebsite,
    handlePublishWebsite,
    loadWebsites
  } = useWebsiteBuilder();

  // Show website editor when a website is selected
  if (selectedWebsite) {
    return (
      <WebsiteEditor
        websiteId={selectedWebsite}
        onBack={() => {
          setSelectedWebsite(null);
          loadWebsites(); // Reload websites to get updated data
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website-Builder</h2>
        <Button onClick={() => setShowNewWebsiteDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Neue Website
        </Button>
      </div>

      <NewWebsiteDialog 
        open={showNewWebsiteDialog}
        onOpenChange={setShowNewWebsiteDialog}
        onCreateWebsite={handleCreateWebsite}
        isCreating={isCreating}
      />

      {isLoading ? (
        <div className="text-center py-10">
          <p>Websites werden geladen...</p>
        </div>
      ) : websites.length > 0 ? (
        <WebsitesList 
          websites={websites}
          onEdit={setSelectedWebsite}
          onDelete={handleDeleteWebsite}
          onPublish={handlePublishWebsite}
        />
      ) : (
        <EmptyWebsitesList onCreateNew={() => setShowNewWebsiteDialog(true)} />
      )}
    </div>
  );
}
