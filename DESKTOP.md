# Bildkonverter Pro als Windows-App

Die Web-App wird mit [Tauri 2](https://tauri.app) als Windows-Desktop-App verpackt.
Ergebnis: ein Installer (`.exe`, NSIS) und MSI-Pakete (`.msi`, Deutsch und Englisch).

## Installer bekommen

Gebaut wird auf GitHub Actions (Windows-Runner), Workflow `.github/workflows/desktop-windows.yml`:

- **Manuell:** GitHub → Actions → „Windows-Desktop-App“ → „Run workflow“. Die Dateien liegen danach
  im Lauf unter „Artifacts“ → `bildkonverter-windows` (ZIP mit `nsis/*.exe` und `msi/*.msi`).
- **Release:** Tag `desktop-vX.Y.Z` pushen (z. B. `git tag desktop-v3.0.0 && git push origin desktop-v3.0.0`).
  Der Workflow legt ein GitHub-Release mit `.exe` und `.msi` an.

Die Versionsnummer kommt aus `package.json` (`version`, für MSI nur `X.Y.Z`).

## Lokal bauen (nur unter Windows)

Voraussetzungen: Node 22, Rust (stable, MSVC), Visual Studio Build Tools („Desktopentwicklung mit C++“).

```bash
npm ci
npm run tauri dev     # App-Fenster mit Vite-Dev-Server
npm run tauri build   # Installer nach src-tauri/target/release/bundle/{nsis,msi}/
```

## Wie es funktioniert

- `vite build --mode desktop` (`npm run build:desktop`) baut mit Basis `/` nach `dist-desktop/`.
  Der Web-Build (`npm run build`, Basis `/bildkonverter/`, `dist/`) bleibt unverändert.
- Alles aus `public/` landet im Paket, auch das ONNX-Modell für „Hintergrund entfernen“ (~90 MB).
  Es funktioniert offline.
- Sonderformate (TIFF, GIF, HEIC) laufen wie im Web über die Live-API
  (`.env.desktop`: `VITE_API_BASE_URL`), dafür braucht der Rechner Internet. Die Anfragen gehen
  über den HTTP-Client der App (`@tauri-apps/plugin-http`), nicht über den WebView, damit CORS sie
  nicht blockiert. Erlaubt ist nur `https://kodinitools.com/bildkonverter/api/*`
  (`src-tauri/capabilities/default.json`).
- Links nach außen (kodinitools.com, Blog) öffnen im Standardbrowser.
- Die Weiterleitung an andere Kodini-Tools (Collage Maker …) ist in der Desktop-App ausgeblendet
  (`IS_DESKTOP` in `src/lib/core/desktop.ts`).
- Läuft auf Windows 10/11 mit Microsoft Edge WebView2 (dort vorinstalliert; sonst lädt der
  Installer WebView2 nach).

## Signatur

Die Installer sind nicht signiert. Windows SmartScreen zeigt beim ersten Start
„Der Computer wurde durch Windows geschützt“ → „Weitere Informationen“ → „Trotzdem ausführen“.
Für eine Signatur braucht es ein Code-Signing-Zertifikat (z. B. Azure Trusted Signing oder ein
OV/EV-Zertifikat); das lässt sich später im Workflow ergänzen.
