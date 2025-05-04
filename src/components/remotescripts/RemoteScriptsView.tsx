
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Plus, Search, Filter } from "lucide-react";
import { useScriptManagement } from "./useScriptManagement";
import CreateScriptDialog from "./CreateScriptDialog";
import ScriptCard from "./ScriptCard";
import FiveMGuide from "./FiveMGuide";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RemoteScriptsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Remote Scripts</h2>
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
              onUpdateScript={handleUpdateScript}
              onRegenerateServerKey={handleRegenerateServerKey}
              onDeleteScript={handleDeleteScript}
            />
          ))}
        </div>
      )}
      
      <FiveMGuide />
    </div>
  );
};

export default RemoteScriptsView;
