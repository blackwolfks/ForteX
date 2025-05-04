
import { Search, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

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
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  
  const searchSuggestions = [
    "lua",
    ".js",
    ".json",
    "config",
    "index"
  ];

  return (
    <div className="flex items-center space-x-2">
      <Popover open={showSearchHelp} onOpenChange={setShowSearchHelp}>
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => setShowSearchHelp(true)} />
            <Input
              placeholder="Dateien durchsuchen..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchHelp(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="bottom" align="start">
          <Command>
            <CommandInput placeholder="Suchen Sie nach Dateityp oder Namen..." />
            <CommandList>
              <CommandGroup heading="Häufige Suchbegriffe">
                {searchSuggestions.map((suggestion) => (
                  <CommandItem 
                    key={suggestion}
                    onSelect={() => {
                      setSearchQuery(suggestion);
                      setShowSearchHelp(false);
                    }}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Tipps">
                <CommandItem disabled>Verwenden Sie Dateierweiterungen wie ".lua" oder ".js"</CommandItem>
                <CommandItem disabled>Geben Sie "config" ein, um Konfigurationsdateien zu finden</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button onClick={onSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Wird gespeichert..." : "Speichern"}
      </Button>
    </div>
  );
};

export default FileAccessSearch;
