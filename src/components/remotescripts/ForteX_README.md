
# ForteX Framework für FiveM

Das ForteX Framework ist ein leistungsstarkes System zum sicheren Laden von Remote-Skripten in FiveM. Es ermöglicht die einfache Integration von lizenzierten Skripten in Ihren FiveM-Server, mit mehreren Sicherheitsebenen und automatischen Updates.

## Installation

1. Laden Sie die Dateien aus dem ZIP-Archiv in einen neuen Ordner in Ihrem FiveM-Ressourcen-Verzeichnis (z.B. `[scripts]/fortex`).
2. Öffnen Sie die `config.lua` und tragen Sie Ihren Lizenzschlüssel und Server-Key ein.
3. Fügen Sie `ensure fortex` in Ihre server.cfg ein, um das Framework beim Serverstart zu laden.

## Konfiguration

Bearbeiten Sie die `config.lua` mit Ihren persönlichen Einstellungen:

```lua
CONFIG = {
    -- Ihr Lizenzschlüssel (erhalten Sie von der Web-Admin-Oberfläche)
    LicenseKey = "XXXX-XXXX-XXXX-XXXX",
    
    -- Ihr Server-Key (erhalten Sie von der Web-Admin-Oberfläche)
    ServerKey = "XXXXXXXXXXXX",
    
    -- Die URL des API-Servers (WICHTIG: Verwenden Sie die korrekte Supabase URL)
    ServerUrl = "https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script",
    
    -- Debug-Modus (auf true setzen für mehr Informationen bei Problemen)
    Debug = true,
    
    -- Automatische Updates aktivieren
    AutoUpdate = false,
    
    -- Intervall für automatische Updates (in Minuten)
    UpdateInterval = 60
}
```

## Funktionen

### Automatisches Laden

Das ForteX Framework lädt automatisch die lizenzierten Skripte beim Serverstart.

### Manuelles Neuladen

Sie können die Skripte jederzeit neu laden mit dem Konsolenbefehl:
```
fortex_reload
```

### API für andere Ressourcen

Das Framework stellt eine API bereit, die von anderen Ressourcen genutzt werden kann:

```lua
-- Eine bestimmte Datei laden
exports['fortex']:LoadFile('dateiname.lua', function(success, data)
    if success then
        print("Datei geladen:", data)
    else
        print("Fehler:", data)
    end
end)

-- Eine Datei laden und ausführen
exports['fortex']:ExecuteFile('dateiname.lua', function(success, result)
    if success then
        print("Datei ausgeführt:", result)
    else
        print("Ausführungsfehler:", result)
    end
end)
```

## Sicherheit

Das ForteX Framework bietet mehrere Sicherheitsebenen:

1. Lizenzschlüssel-Validierung
2. Server-Key-Authentifizierung
3. IP-Adress-Validierung (optional einstellbar im Admin-Panel)
4. Skript-Validierung vor der Ausführung

## Fehlerbehebung

### HTML statt Lua-Code erhalten
Wenn Sie eine Fehlermeldung wie `unexpected symbol near '<'` erhalten, bedeutet dies, dass das Framework HTML anstatt Lua-Code erhalten hat. Dies kann folgende Ursachen haben:

1. **Falsche ServerUrl**: Stellen Sie sicher, dass die ServerUrl in der `config.lua` korrekt ist. Sie sollte auf die Supabase Edge Function zeigen, z.B. `https://fewcmtozntpedrsluawj.supabase.co/functions/v1/script`.

2. **Authentifizierungsprobleme**: Überprüfen Sie, ob Ihr Lizenzschlüssel und Server-Key korrekt sind.

3. **Netzwerkprobleme**: Überprüfen Sie, ob Ihr Server eine Verbindung zum Internet hat und keine Firewall den Zugriff blockiert.

Aktivieren Sie den Debug-Modus in der `config.lua` (setzen Sie `Debug = true`), um mehr Informationen zu erhalten.

### Debug-Modus

Der Debug-Modus gibt zusätzliche Informationen in der Serverkonsole aus. Um ihn zu aktivieren, setzen Sie in der `config.lua`:

```lua
Debug = true
```

## Support

Bei Fragen oder Problemen wenden Sie sich bitte an unseren Support unter support@ihre-domain.de
