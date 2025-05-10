
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GameServerType, ScriptCategoryType } from './types';

const GameServerSelection = () => {
  const navigate = useNavigate();
  const [selectedServer, setSelectedServer] = useState<GameServerType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategoryType | null>(null);

  const handleContinue = () => {
    if (selectedServer && selectedCategory) {
      // Weiterleitung zur Remote Scripts Seite mit Parametern
      navigate(`/dashboard/remote-scripts?server=${selectedServer}&category=${selectedCategory}`);
    }
  };

  // Kategorien basierend auf dem ausgewählten Server
  const getCategories = () => {
    if (selectedServer === 'minecraft') {
      return [
        { id: 'java', name: 'Java', description: 'Java Edition Plugins und Mods' },
        { id: 'bedrock', name: 'Bedrock', description: 'Bedrock Edition Addons' },
      ];
    }
    
    return [
      { id: 'script', name: 'Script', description: 'Spielmechaniken und Funktionen' },
      { id: 'clothing', name: 'Kleidung', description: 'Benutzerdefinierte Kleidungsstücke' },
      { id: 'vehicle', name: 'Fahrzeuge', description: 'Benutzerdefinierte Fahrzeuge' },
      { id: 'mlo', name: 'MLO', description: 'Map-Erweiterungen und Gebäude' },
    ];
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Server & Kategorie auswählen</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server-Auswahl */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>1. Game Server auswählen</CardTitle>
            <CardDescription>
              Wähle den Game Server, für den du ein Script erstellen möchtest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ServerCard 
                title="RageMP" 
                description="Multiplayer-Modifikation für GTA V"
                selected={selectedServer === 'ragemp'}
                onClick={() => setSelectedServer('ragemp')}
              />
              
              <ServerCard 
                title="FiveM" 
                description="Community-driven Modifikation für GTA V"
                selected={selectedServer === 'fivem'}
                onClick={() => setSelectedServer('fivem')}
              />
              
              <ServerCard 
                title="AltV" 
                description="Alternative Multiplayer für GTA V"
                selected={selectedServer === 'altv'}
                onClick={() => setSelectedServer('altv')}
              />
              
              <ServerCard 
                title="Minecraft" 
                description="Minecraft Server Plugins"
                selected={selectedServer === 'minecraft'}
                onClick={() => setSelectedServer('minecraft')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kategorie-Auswahl (nur sichtbar, wenn ein Server ausgewählt ist) */}
        {selectedServer && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>2. Kategorie auswählen</CardTitle>
              <CardDescription>
                Wähle die passende Kategorie für dein Script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedCategory || ""} 
                onValueChange={(value) => setSelectedCategory(value as ScriptCategoryType)}
                className="space-y-3"
              >
                {getCategories().map((category) => (
                  <div key={category.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={category.id} id={category.id} />
                    <Label htmlFor={category.id} className="flex flex-col cursor-pointer flex-1">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">{category.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fortsetzen-Button (nur aktiviert, wenn beides ausgewählt ist) */}
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleContinue} 
          disabled={!selectedServer || !selectedCategory}
          className="bg-turquoise-500 hover:bg-turquoise-600"
        >
          Weiter zu Remote Scripts
        </Button>
      </div>
    </div>
  );
};

// Hilfskomponente für die Server-Karten
interface ServerCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const ServerCard = ({ title, description, selected, onClick }: ServerCardProps) => (
  <div 
    className={`p-4 border rounded-lg cursor-pointer transition-all ${
      selected ? 'border-turquoise-500 bg-turquoise-50 dark:bg-turquoise-950/20' : 'hover:bg-muted/50'
    }`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium">{title}</h3>
      {selected && <Badge className="bg-turquoise-500">Ausgewählt</Badge>}
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default GameServerSelection;
