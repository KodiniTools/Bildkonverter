# Context.md – Bildkonverter Pro (Entwickler-Referenz)

## Projektübersicht

**Bildkonverter Pro** ist eine Vue 3 Single-Page-Application für browserbasierte Bildbearbeitung und -konvertierung. Alle Verarbeitungsschritte laufen clientseitig (Canvas API); für Sonderformate (TIFF, HEIC, SVG-Export) gibt es eine optionale Backend-API.

- **Paketname:** `vue-bildkonverter` (v3.0.0)
- **Base URL (Produktion):** `/bildkonverter/`
- **Dev-Server:** `http://localhost:5173`
- **Backend-API (Produktion):** `/bildkonverter/api`
- **Backend-API (Entwicklung):** `http://localhost:3000/api`

---

## Tech-Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Framework | Vue 3 (Composition API) | ^3.4 |
| Build-Tool | Vite | ^5.1 |
| State Management | Pinia | ^2.1 |
| Routing | Vue Router | ^4.3 |
| Internationalisierung | Vue i18n | ^9.10 |
| CSS | SCSS | ^1.71 |
| PDF-Export | jsPDF | ^2.5 |
| ZIP-Export | JSZip | ^3.10 |
| Utilities | @vueuse/core | ^10.9 |
| Konfetti | canvas-confetti | ^1.9 |

**Dev-Dependencies:** ESLint, Prettier, `@vitejs/plugin-vue`

---

## Verzeichnisstruktur

```
src/
├── api/
│   └── api.js                    # HTTP-Client für Backend-Konvertierungen
├── assets/
│   ├── fonts/
│   │   ├── fontList.js           # Verfügbare Schriftarten
│   │   ├── fontManager.js        # Laden & Caching von Fonts
│   │   ├── textManager.js        # Text-Rendering-Helfer
│   │   └── main.js
│   └── foto/                     # Statische Bilder (SEO-Seiten etc.)
├── components/
│   ├── CanvasEditor.vue          # Kern-Canvas-Komponente
│   ├── dev/
│   │   └── PerformanceMonitor.vue
│   ├── editor/
│   │   ├── FilterPresets.vue
│   │   ├── PreviewModal.vue
│   │   └── sidebar/
│   │       ├── AdjustmentsPanel.vue   # Helligkeit, Kontrast, Sättigung, Schärfe
│   │       ├── BackgroundPanel.vue    # Canvas-Hintergrundfarbe
│   │       ├── EffectsPanel.vue       # Weichzeichner, Vignette, Invertieren
│   │       ├── ExportPanel.vue        # Format, Qualität, Export-Button
│   │       ├── LightColorPanel.vue    # Belichtung, Lichter, Schatten, Farbton
│   │       └── ResizePanel.vue        # Skalieren mit Seitenverhältnis-Lock
│   ├── features/
│   │   ├── CropTool.vue          # Zuschneiden (frei & festes Seitenverhältnis)
│   │   ├── HandoffReceiver.vue   # Cross-Tool Bildübergabe (KodiniTools-Protokoll)
│   │   ├── ImageUpload.vue       # Drag & Drop / Datei-Dialog
│   │   ├── KeyboardShortcuts.vue # Globaler Tastatur-Listener
│   │   ├── LayerControlPanel.vue # Ebenen-Verwaltung im Collage-Modus
│   │   └── TransformPanel.vue    # Drehen, Spiegeln, Skalieren
│   ├── layout/
│   │   └── AppHeader.vue         # Navigationsleiste mit Theme/Sprache
│   ├── modals/
│   │   └── TextEditModal.vue     # Erweiterter Text-Editor
│   └── ui/
│       └── ToastContainer.vue    # Toast-Benachrichtigungen
├── composables/                  # Vue 3 Composition Functions
│   ├── useCanvasRenderer.js      # Canvas-Rendering (roundedRect, Selektionsrahmen)
│   ├── useCrop.js                # Crop-Logik mit Vorschau
│   ├── useFilterManagement.js    # Filter-State & Validierung
│   ├── useGalleryIntegration.js  # Galerie ↔ Editor Synchronisation
│   ├── useImageHistory.js        # Undo/Redo (History-Snapshots)
│   ├── useImageLayerInteraction.js # Layer-Drag, Resize, Rotate
│   ├── useImageLoader.js         # Datei-Validierung & Format-Erkennung
│   ├── useResizeManager.js       # Canvas-Resize & Social-Presets
│   ├── useSeoMeta.js             # Dynamische Meta-Tags
│   ├── useTextHistory.js         # Text-Undo/Redo
│   ├── useTextInteraction.js     # Text-Dragging & Selektion
│   ├── useTextModal.js           # Modal-Steuerung für Text-Editor
│   └── useTransform.js           # Rotation, Flip, Schatten, Rahmen
├── i18n/
│   └── index.js                  # Alle Übersetzungen (DE + EN)
├── lib/
│   └── core/
│       └── handoff.js            # KodiniTools Cross-Tool-Handoff-Protokoll
├── router/
│   └── index.js                  # Vue Router (11 Routen + Navigation Guards)
├── stores/
│   ├── galleryStore.js           # Galerie-Bilder & Multi-Select
│   ├── imageStore.js             # Kern-Editor-State (Bild, Filter, Ebenen, Text)
│   ├── presetsStore.js           # Filter-Presets (Standard + Benutzerdefiniert)
│   └── settingsStore.js          # App-Einstellungen (Theme, Sprache, Export)
├── styles/
│   ├── variables.scss            # CSS Custom Properties (Farben, Abstände)
│   ├── global.scss               # Reset, Typografie, Utility-Klassen
│   └── main.scss                 # SCSS-Einstiegspunkt
├── utils/
│   ├── exportUtils.js            # FORMAT_INFO-Mapping & Export-Hilfsfunktionen
│   ├── textUtils.js              # Text-Messung, Bounding-Box, Kollisionserkennung
│   └── validationUtils.js        # Datei- & Filter-Validierung
├── views/
│   ├── HomeView.vue              # Startseite (Hero, Features, FAQ, Konvertierungen)
│   ├── EditorView.vue            # Haupt-Editor (Canvas, Toolbar, Sidebar)
│   ├── BatchView.vue             # Stapelverarbeitung (/batch)
│   ├── GalleryView.vue           # Bildverwaltung (/gallery)
│   ├── FormatConversionView.vue  # Formatspezifische Landingpages (/konvertieren/:pair)
│   ├── GuideView.vue             # Tutorial (/guide)
│   ├── FaqView.vue               # FAQ (/faq)
│   ├── AboutView.vue             # Über KodiniTools (/about)
│   └── NotFoundView.vue          # 404-Seite
├── App.vue                       # Root-Komponente (SSI-Integration)
└── main.js                       # App-Einstiegspunkt (Pinia, Router, i18n, Fehlerhandler)
```

---

## Routing

**Datei:** `src/router/index.js`

| Pfad | Komponente | Name |
|------|-----------|------|
| `/` | HomeView | home |
| `/editor` | EditorView | editor |
| `/batch` | BatchView | batch |
| `/gallery` | GalleryView | gallery |
| `/guide` | GuideView | guide |
| `/faq` | FaqView | faq |
| `/about` | AboutView | about |
| `/konvertieren/:pair` | FormatConversionView | format-conversion |
| `/:pathMatch(.*)* ` | NotFoundView | not-found |

**Unterstützte Format-Paare (`:pair`):**  
`heic-zu-jpg`, `png-zu-webp`, `jpg-zu-webp`, `webp-zu-png`, `jpg-zu-png`, `png-zu-jpg`, `tiff-zu-jpg`, `bmp-zu-webp`, `gif-zu-webp`, `heic-zu-png`, `webp-zu-jpg`, `svg-zu-png`, `jpg-zu-pdf`, `png-zu-svg`

**Navigation Guards:**
- Handoff-Weiterleitung (KodiniTools-Protokoll, `?handoff=kodinitools`)
- Dynamische SEO-Meta-Tags für Konvertierungsseiten
- `robots: noindex` für 404-Seite

---

## Pinia Stores

### `imageStore.js` – Kern-Editor-State

**State (Auswahl):**

```js
originalImage       // Originalbild (unveränderlich für Undo-Basis)
workingUrl          // Aktuelle Bild-URL
canvas, ctx         // Canvas-Referenzen
imageWidth, imageHeight
texts[]             // Alle Textelemente
imageLayers[]       // Alle Bild-Ebenen (Collage-Modus)
history[]           // Undo-Stack (max. 50 Einträge)
historyIndex
isProcessing, isImageLoaded, isDragging
```

**Computed:**
`hasImage`, `canUndo`, `canRedo`, `selectedText`, `aspectRatio`, `filtersApplied`, `hasTexts`, `hasImageLayers`, `isCollageMode`

**Wichtige Actions:**
- `loadImageFromFile()` – TIFF/HEIC werden an Backend-API delegiert
- `draw()` – Rendert Canvas mit Filtern, Texten und Ebenen
- `setFilter(name, value)` / `applyPreset(id)` / `resetFilters()`
- Text: `addText()`, `updateText()`, `deleteText()`, `selectText()`, `duplicateText()`, `moveTextLayer()`
- Ebenen: `addImageLayer()`, `addImageLayersFromGallery()`, `updateImageLayer()`, `deleteImageLayer()`, `duplicateImageLayer()`, `moveImageLayerOrder()`
- History: `saveState()`, `undo()`, `redo()`, `restoreState()`
- Export: `exportImage()`, `getScaledTexts()`

### `settingsStore.js` – App-Einstellungen

**State:** `theme` (light/dark/auto), `locale` (de/en), `performanceMode`, `defaultExportQuality` (95), `defaultExportFormat` (png), Grid, Snap, Toast-Einstellungen

**Persistenz:** `localStorage`  
**Sync:** Theme und Locale werden mit dem globalen SSI-Navigation-Element synchronisiert.

### `galleryStore.js` – Bildgalerie

**State:** `images[]`, `selectedImageId`, `selectedImageIds[]`  
**Persistenz:** Nur Sitzung (kein localStorage)  
**Multi-Select-Actions:** `toggleImageSelection()`, `selectAllImages()`, `deselectAllImages()`, `isImageSelected()`

### `presetsStore.js` – Filter-Presets

**8 Standard-Presets:** Original, Vibrant, Vintage, B&W, Dramatic, Soft, Warm, Cool  
**Benutzerdefinierte Presets:** Erstellen, Bearbeiten, Löschen, Duplizieren  
**Persistenz:** `localStorage`  
**Besonderheit:** `findSimilarPreset()` – Automatischer Preset-Vorschlag anhand aktueller Filterwerte

---

## Datenstrukturen

### Textelement

```js
{
  id: number,
  content: string,
  x: number, y: number,          // Position auf Canvas (px)
  fontSize: number,
  fontFamily: string,
  color: string,                 // Hex-Farbe
  fontWeight: number | string,
  fontStyle: string,             // 'italic' | 'normal'
  textAlign: string,             // 'left' | 'center' | 'right'
  textDecoration: string,        // 'underline' | 'line-through'
  shadow: { offsetX, offsetY, blur, color, opacity },
  rotation: number,              // Grad
  opacity: number,               // 0–100
  zIndex: number,
}
```

### Bild-Ebene (Collage)

```js
{
  id: string,
  image: HTMLImageElement,
  url: string,
  name: string,
  x: number, y: number,
  width: number, height: number,
  rotation: number,
  opacity: number,               // 0–100
  visible: boolean,
  locked: boolean,
  filters: { brightness, contrast, saturation, grayscale, sepia, blur, hue },
  border: { width, color, radius },
  shadow: { enabled, offsetX, offsetY, blur, color, opacity },
  flipX: boolean, flipY: boolean,
  thumbnail: string,             // Base64 JPEG (64×64px, generiert via Canvas)
}
```

### Filter-Werte

```js
{
  brightness: 100,   // 0–200 (100 = neutral)
  contrast: 100,     // 0–200
  saturation: 100,   // 0–200
  grayscale: 0,      // 0–100
  sepia: 0,          // 0–100
  sharpen: 0,        // 0–100
  zoom: 1.0,         // 0.1–5.0
}
```

---

## API-Client (`src/api/api.js`)

**Endpunkte:**

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `POST` | `/convert-image` | Bildkonvertierung (TIFF, HEIC, SVG) |
| `GET` | `/formats` | Unterstützte Formate abrufen |
| `POST` | `/upload` | Bild hochladen |

**Schlüsselmethoden:**
- `ApiClient.convertImage(blob, format, filename, options)` – FormData-Upload mit Quality-Option
- `ApiClient.checkBackendAvailability()` – Health-Check mit 5s Timeout

**Wann wird das Backend benötigt?** TIFF- und HEIC/HEIF-Eingabe sowie TIFF- und SVG-Export erfordern eine aktive Backend-Verbindung. Alle anderen Formate laufen vollständig im Browser.

---

## Internationalisierung (`src/i18n/index.js`)

**Sprachen:** Deutsch (`de`), Englisch (`en`)

**Top-Level-Schlüssel:**

| Schlüssel | Bereich |
|-----------|---------|
| `app.*` | App-Metadaten |
| `nav.*` | Navigation |
| `home.*` | Startseite (Features, FAQ, Konvertierungen) |
| `faq.*` | FAQ-Seite |
| `conversion.*` | Konvertierungs-Widget |
| `editor.*` | Editor (Toolbar, Sidebar, Shortcuts, Canvas-Leer-State) |
| `batch.*` | Stapelverarbeitung |
| `gallery.*` | Galerie |
| `guide.*` | Tutorial |
| `about.*` | Über-Seite |
| `error.*` | Fehlermeldungen |
| `success.*` | Erfolgsmeldungen |
| `validation.*` | Formularvalidierung |
| `filter.*` | Filter-Namen & Beschreibungen |
| `preset.*` | Preset-Namen |

**Sprachumschaltung:** Über `settingsStore.setLocale()` – wird mit dem SSI-globalen Navigationselement synchronisiert.

---

## Handoff-Protokoll (`src/lib/core/handoff.js`)

Cross-Tool-Bildübergabe im KodiniTools-Ökosystem (z. B. Bildkonverter → Collage Maker):

- **Kanal:** `localStorage`
- **Auslöser:** URL-Parameter `?handoff=kodinitools`
- **Kompression:** JPEG 0.7 Qualität, max. 1200px
- **Limits:** Max. 20 Bilder, 5 Minuten Ablaufzeit
- **Ablauf:** `prepareHandoff()` → Ziel-URL → `checkHandoff()` → Banner → `consumeHandoff()`

---

## SSI-Integration (`App.vue`)

Die App ist in ein serverseitiges Include-System eingebettet:

- Globale Navigation: `/partials/nav.html`
- Footer: `/partials/footer.html`
- Cookie-Banner: `/partials/cookie-banner.html`

Vue überwacht folgende Custom Events des SSI-Headers:
- `locale-changed`, `language-changed` → Sprache umschalten ohne Reload
- `theme-changed` → Theme-Wechsel

SSI-Header-Elemente mit `data-lang-de` / `data-lang-en` werden automatisch übersetzt.

---

## Styling-Architektur

- **Theme-System:** CSS Custom Properties auf `<html data-theme="light|dark">`
- **Breakpoints:** Definiert in `src/styles/variables.scss`
- **Scoped SCSS:** Jede Vue-Komponente hat eigene `<style scoped lang="scss">`
- **`:deep()`:** Für Targeting von nativen Kind-Elementen in scoped SCSS nötig
- **Dark Mode:** Systemabhängig (via `prefers-color-scheme`) oder manuell

---

## Validierung (`src/utils/validationUtils.js`)

```js
ValidationUtils.validateImageFile(file)
// Max. 50 MB, Min. 1 KB
// Erlaubte MIME-Typen: JPEG, PNG, WebP, GIF, BMP, SVG, TIFF, HEIC/HEIF

ValidationUtils.validateFilterValue(filterName, value)
// Bereichsprüfung je Filter (z. B. brightness: 0–200)
```

---

## Export-Formate (`src/utils/exportUtils.js`)

`FORMAT_INFO`-Map mit Metadaten pro Format:

| Format | Qualitätseinstellung | Backend erforderlich |
|--------|---------------------|----------------------|
| PNG | Nein (verlustfrei) | Nein |
| JPEG | Ja (0–100) | Nein |
| WebP | Ja (0–100) | Nein |
| TIFF | Ja | Ja |
| GIF | Nein | Nein (einfach) / Ja (animiert) |
| HEIF | Ja | Ja |
| PDF | Nein | Nein (jsPDF) |

---

## Tastaturkürzel (Editor)

| Kürzel | Aktion |
|--------|--------|
| `Ctrl + Z` | Rückgängig (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Wiederholen (Redo) |
| `Ctrl + V` | Bild aus Zwischenablage einfügen |
| `T` | Text hinzufügen |
| `Esc` | Zuschneiden abbrechen / Dialog schließen |

---

## Entwicklungsbefehle

```bash
npm run dev           # Entwicklungsserver starten (Port 5173)
npm run build         # Produktions-Build → dist/
npm run preview       # Produktions-Build lokal vorschauen
npm run lint          # ESLint-Prüfung
npm run lint:fix      # ESLint-Fehler automatisch beheben
npm run format        # Prettier-Formatierung anwenden
npm run format:check  # Prettier-Formatierung prüfen
```

---

## Build-Konfiguration (`vite.config.js`)

- **Output:** `dist/`
- **Minification:** esbuild (keine Sourcemaps)
- **Path-Alias:** `@/` → `./src/`
- **SCSS API:** `modern-compiler`
- **Chunks:** Vue-Kern als separater `vendor`-Chunk
- **Assets:** Cache-Busting mit Content-Hash

---

## Umgebungsvariablen

Keine `.env`-Datei. Konfiguration erfolgt via Vite-Umgebungsvariablen:

| Variable | Verwendung |
|----------|-----------|
| `import.meta.env.PROD` | Produktionsmodus-Check |
| `import.meta.env.DEV` | Entwicklungsmodus |
| `import.meta.env.BASE_URL` | Basis-Pfad (`/bildkonverter/`) |

---

## Performance-Hinweise

- Canvas-Kontext mit `{ willReadFrequently: true }` für häufige `getImageData()`-Calls
- History-Stack auf max. 50 Zustände begrenzt
- Handoff max. 20 Bilder
- Vue-Komponenten lazy-geladen via `() => import()`
- SCSS-Warnung `quietDeps: true` unterdrückt Sass-Deprecation-Warnungen aus Dependencies
