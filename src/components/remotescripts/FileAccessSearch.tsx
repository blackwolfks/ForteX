
import { Search, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileAccessSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  saving: boolean;
  onSave: () => void;
}

const FileAccessSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  saving, 
  onSave 
}: FileAccessSearchProps) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Dateien durchsuchen..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button onClick={onSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Wird gespeichert..." : "Speichern"}
      </Button>
    </div>
  );
};

export default FileAccessSearch;
