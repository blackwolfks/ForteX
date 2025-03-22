
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FiveMGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>FiveM Integration Guide</CardTitle>
        <CardDescription>Eine Anleitung zur Integration Ihrer Scripts in FiveM</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Um Ihre Scripts in FiveM zu integrieren, folgen Sie dieser Anleitung:</p>
          
          <div className="bg-muted p-4 rounded-md font-mono text-sm">
            <pre>{`-- Beispiel config.lua
CONFIG = {}
CONFIG.LicenseKey = "XXXX-XXXX-XXXX-XXXX" -- Ihr Lizenzschlüssel
CONFIG.ServerKey = "XXXXXXXXXXXX" -- Ihr Server-Key
CONFIG.ServerUrl = "${window.location.origin}/api/script" -- API-URL

-- Beispiel für den Abruf eines Scripts
function LoadRemoteScript()
    PerformHttpRequest(CONFIG.ServerUrl, function(err, scriptData, headers)
        if err ~= 200 then
            print("Fehler beim Abrufen des Scripts: " .. tostring(err))
            return
        end
        
        -- Script ausführen
        local func, err = load(scriptData)
        if func then
            func()
        else
            print("Fehler beim Laden des Scripts: " .. tostring(err))
        end
    end, "GET", "", {
        ["X-License-Key"] = CONFIG.LicenseKey,
        ["X-Server-Key"] = CONFIG.ServerKey
    })
end

-- Script beim Start laden
Citizen.CreateThread(LoadRemoteScript)
`}</pre>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Ersetzen Sie die Platzhalter mit Ihren eigenen Werten aus der Lizenzverwaltung.
            Diese Methode ermöglicht es Ihnen, Ihre Scripts sicher zu verteilen und sie bei Bedarf remote zu aktualisieren.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiveMGuide;
