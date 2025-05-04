
import { Search, Save, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FileAccessSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  saving: boolean;
  onSave: () => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  fileTypeFilter: string;
  setFileTypeFilter: (filter: string) => void;
}

const FileAccessSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  saving, 
  onSave,
  sortOrder,
  setSortOrder,
  fileTypeFilter,
  setFileTypeFilter
}: FileAccessSearchProps) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  
  const searchSuggestions = [
    "lua",
    ".js",
    ".json",
    "config",
    "index"
  ];

  const fileTypes = [
    { value: "all", label: "Alle Dateitypen" },
    { value: "lua", label: "Lua Dateien (.lua)" },
    { value: "js", label: "JavaScript (.js)" },
    { value: "json", label: "JSON (.json)" },
    { value: "config", label: "Konfigurationsdateien" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name (A-Z)" },
    { value: "name_desc", label: "Name (Z-A)" },
    { value: "size_asc", label: "Größe (Klein-Groß)" },
    { value: "size_desc", label: "Größe (Groß-Klein)" },
    { value: "updated_asc", label: "Zuletzt bearbeitet (Älteste)" },
    { value: "updated_desc", label: "Zuletzt bearbeitet (Neueste)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:space-x-2">
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
        
        <div className="flex flex-col md:flex-row gap-2 md:gap-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-full md:w-[180px]">
                  <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                    <SelectTrigger className="w-full">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Dateityp filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filtern nach Dateityp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-full md:w-[220px]">
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sortieren nach" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sortieren nach Eigenschaften</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileAccessSearch;
