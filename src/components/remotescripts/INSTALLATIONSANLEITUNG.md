
# ForteX - Installationsanleitung für FiveM

## Installation auf Ihrem FiveM-Server

1. **Erstellen Sie einen neuen Ordner in Ihrem Ressourcen-Verzeichnis**
   - Navigieren Sie zu Ihrem FiveM Server-Verzeichnis
   - Gehen Sie in das Resources-Verzeichnis (typischerweise `server-data/resources/`)
   - Erstellen Sie einen neuen Ordner, z.B. `[scripts]/fortex` oder direkt `fortex`

2. **Kopieren Sie die folgenden Dateien in den Ordner**
   - `FiveM_ForteX.lua` (Hauptskript)
   - `ForteX_config.lua` (Konfigurationsdatei)
   - `ForteX_test.lua` (Testskript)
   - `fxmanifest.lua` (Manifest-Datei für FiveM)

3. **Konfigurieren Sie Ihre Lizenzschlüssel**
   - Öffnen Sie die Datei `ForteX_config.lua`
   - Tragen Sie Ihren persönlichen Lizenzschlüssel und Server-Key ein
   - Zum Testen können Sie die Test-Keys verwenden:
     ```lua
     LicenseKey = "ABCD-EFGH-IJKL-MNOP"
     ServerKey = "123456789ABC"
     ```

4. **Fügen Sie die Ressource in Ihre server.cfg ein**
   - Öffnen Sie Ihre `server.cfg`
   - Fügen Sie folgende Zeile hinzu:
     ```
     ensure fortex
     ```

5. **Starten Sie Ihren Server neu**
   - Starten Sie Ihren FiveM-Server neu, um die Änderungen zu übernehmen

## Überprüfen der Installation

Nach dem Server-Neustart sollten Sie in der Konsole das ForteX ASCII-Logo sehen und eine Meldung, dass das Skript geladen wurde. 

Sie können die folgenden Konsolenbefehle verwenden, um die Funktionalität zu testen:

- `fortex_test` - Testet die API-Verbindung mit Ihren konfigurierten Keys
- `fortex_test_keys` - Testet die API-Verbindung mit den Standard-Test-Keys

## Fehlerbehebung

Wenn Sie Fehlermeldungen erhalten:

1. **401 Authentifizierungsfehler**
   - Überprüfen Sie, ob Ihr Lizenzschlüssel und Server-Key korrekt sind
   - Stellen Sie sicher, dass die Keys in der Datenbank registriert sind

2. **Server kann keine Verbindung herstellen**
   - Überprüfen Sie Ihre Firewall-Einstellungen
   - Stellen Sie sicher, dass Ihr Server eine Internetverbindung hat

3. **Ressource wird nicht gefunden**
   - Stellen Sie sicher, dass der Pfad in der `ensure`-Anweisung korrekt ist
   - Überprüfen Sie, ob alle Dateien vorhanden sind

## Support

Bei weiteren Fragen oder Problemen wenden Sie sich bitte an den Support.
