
import { Website, websiteService } from "@/services/website-service";
import { WebsiteCard } from "./WebsiteCard";

interface WebsitesListProps {
  websites: Website[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string, shouldPublish: boolean) => Promise<boolean>;
}

export function WebsitesList({ websites, onEdit, onDelete, onPublish }: WebsitesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {websites.map((website) => (
        <WebsiteCard
          key={website.id}
          id={website.id}
          name={website.name}
          url={website.url || ""}
          template={website.template}
          lastUpdated={website.last_saved || website.created_at || ""}
          status={website.status as "entwurf" | "veröffentlicht"}
          onEdit={() => onEdit(website.id)}
          onDelete={() => onDelete(website.id)}
          onPublish={onPublish}
        />
      ))}
    </div>
  );
}
