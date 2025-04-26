
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useScriptManagement } from "./useScriptManagement";
import CreateScriptDialog from "./CreateScriptDialog";
import ScriptCard from "./ScriptCard";
import FiveMGuide from "./FiveMGuide";

const RemoteScriptsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { 
    licenses, 
    loading, 
    handleCreateScript, 
    handleUpdateScript, 
    handleRegenerateServerKey, 
    handleDeleteScript 
  } = useScriptManagement();

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

      <CreateScriptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateScript={async (newScript, files) => {
          const success = await handleCreateScript(newScript, files);
          if (success) {
            setDialogOpen(false);
          }
          return success;
        }}
      />

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Lade Scripts...</p>
        </div>
      ) : licenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground py-10">Keine Scripts vorhanden. Erstellen Sie ein neues Script, um zu beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {licenses.map((license) => (
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
