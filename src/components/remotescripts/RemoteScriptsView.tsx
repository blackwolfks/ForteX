
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Plus, Search, Filter } from "lucide-react";
import { useScriptManagement } from "./useScriptManagement";
import CreateScriptDialog from "./CreateScriptDialog";
import ScriptCard from "./ScriptCard";
import FiveMGuide from "./FiveMGuide";
import { GameServerType, ScriptCategoryType } from "./types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RemoteScriptsViewProps {
  gameServer?: string;
  category?: string;
}

const RemoteScriptsView = ({ gameServer = 'fivem', category = 'script' }: RemoteScriptsViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Konvertiere string zu GameServerType und ScriptCategoryType
  const selectedServer = gameServer as GameServerType;
  const selectedCategory = category as ScriptCategoryType;
  
  const { 
    licenses, 
    loading, 
    handleCreateScript, 
    handleUpdateScript, 
    handleRegenerateServerKey, 
    handleDeleteScript 
  } = useScriptManagement();
  
  // Filter licenses based on search query and status filter
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.script_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && license.aktiv) || 
                         (statusFilter === "inactive" && !license.aktiv);
    
    return matchesSearch && matchesStatus;
  });

  // Server-Typen für Header-Anzeige
  const getServerDisplayName = (server: GameServerType): string => {
    const serverNames: Record<GameServerType, string> = {
      'ragemp': 'RageMP',
      'fivem': 'FiveM',
      'altv': 'AltV',
      'minecraft': 'Minecraft'
    };
    return serverNames[server];
  };

  // Kategorie-Typ für Header-Anzeige
  const getCategoryDisplayName = (category: ScriptCategoryType): string => {
    const categoryNames: Record<ScriptCategoryType, string> = {
      'script': 'Scripts',
      'clothing': 'Kleidungen',
      'vehicle': 'Fahrzeuge',
      'mlo': 'MLOs',
      'java': 'Java Edition',
      'bedrock': 'Bedrock Edition'
    };
    return categoryNames[category];
  };

  // Create a ScriptCard component adapter for the handleUpdateScript function
  const handleScriptCardUpdate = async (
    licenseId: string, 
    scriptName: string, 
    scriptCode: string | null, 
    serverIp: string | null, 
    isActive: boolean
  ) => {
    // Map the parameters to what handleUpdateScript expects
    return await handleUpdateScript(licenseId, {
      name: scriptName,
      description: scriptCode,  // Using scriptCode as description
      is_active: isActive
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Remote Scripts</h2>
          <p className="text-muted-foreground">
            {getServerDisplayName(selectedServer)} &gt; {getCategoryDisplayName(selectedCategory)}
          </p>
        </div>
        <Button 
          className="bg-turquoise-500 hover:bg-turquoise-600"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neues Script erstellen
        </Button>
      </div>
      
      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Scripts durchsuchen..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Scripts</SelectItem>
              <SelectItem value="active">Aktive Scripts</SelectItem>
              <SelectItem value="inactive">Inaktive Scripts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CreateScriptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gameServer={selectedServer}
        category={selectedCategory}
        onCreateScript={async (newScript, files) => {
          console.log("Creating script with data:", newScript);
          const success = await handleCreateScript(newScript, files);
          if (success) {
            setDialogOpen(false);
          }
          return Promise.resolve();
        }}
      />

      {loading ? (
        <div className="text-center py-10">Lade Scripts...</div>
      ) : licenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Keine Scripts vorhanden. Erstellen Sie ein neues Script, um zu beginnen.</p>
          </CardContent>
        </Card>
      ) : filteredLicenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Keine Scripts gefunden, die Ihren Suchkriterien entsprechen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLicenses.map((license) => (
            <ScriptCard
              key={license.id}
              license={license}
              onUpdateScript={handleScriptCardUpdate}
              onRegenerateServerKey={handleRegenerateServerKey}
              onDeleteScript={handleDeleteScript}
            />
          ))}
        </div>
      )}
      
      {/* Spezifische Guide je nach Server-Typ anzeigen */}
      {selectedServer === 'fivem' && <FiveMGuide />}
    </div>
  );
};

export default RemoteScriptsView;
