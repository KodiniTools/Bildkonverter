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
│   │   ├── fontList.js           # Verfügbare Schriftarten (generiert)
│   │   └── fonts.css             # @font-face-Deklarationen (generiert)
│   └── foto/                     # Statische Bilder (SEO-Seiten etc.)
├── components/
│   ├── dev/
│   │   └── PerformanceMonitor.vue
│   ├── guide/
│   │   └── GuideSectionHeader.vue  # Abschnitts-Überschrift (Icon, Titel, Beschreibung) der Anleitung
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
│   │   ├── HandoffReceiver.vue   # Cross-Tool Bildübergabe (KodiniTools-Protokoll)
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
│   ├── editor/                   # Editor-spezifische Composables (aus EditorView.vue ausgelagert)
│   │   ├── useCanvasInteraction.js  # Maus/Touch auf dem Canvas: Text, Ebenen, Crop, Pan, Pinch
│   │   ├── useEditorDetach.js       # Bild vom Hintergrund lösen / wieder verbinden
│   │   ├── useEditorExport.js       # Export-Dialog, Drucken, Handoff an andere Tools
│   │   ├── useEditorHistory.js      # Gemeinsame Undo/Redo-Historie (Snapshot des Editor-Zustands)
│   │   ├── useEditorKeyboard.js     # Tastatur-Shortcuts
│   │   ├── useEditorPreview.js      # Vorher/Nachher-Modal
│   │   ├── useEditorResize.js       # Größe ändern: Live-Vorschau, Presets, Anwenden
│   │   ├── useEditorText.js         # Text-Ebenen anlegen, ändern, löschen
│   │   ├── useImageInfo.js          # Breite/Höhe/Dateigröße-Anzeige
│   │   └── useTransformHandlers.js  # Event-Handler für Transformationen
│   ├── useBatchConversion.js     # Batch-Konverter: Dateien, Verarbeitung, Download
│   ├── useCanvasRenderer.js      # Canvas-Rendering (roundedRect, Selektionsrahmen)
│   ├── useCrop.js                # Crop-Logik mit Vorschau
│   ├── useFilterManagement.js    # Filter-State & Validierung
│   ├── useImageHistory.js        # Undo/Redo (gemeinsame Editor-Historie: Bild, Filter, Transform, Text)
│   ├── useImageLayerInteraction.js # Layer-Drag, Resize, Rotate
│   ├── useImageLoader.js         # Datei-Validierung, Format-Erkennung, Galerie → Editor
│   ├── useResizeManager.js       # Canvas-Resize & Social-Presets
│   ├── useSeoMeta.js             # Dynamische Meta-Tags
│   ├── useTextModal.js           # Modal-Steuerung für Text-Editor
│   └── useTransform.js           # Rotation, Flip, Schatten, Rahmen
├── i18n/
│   ├── de.js                     # Deutsche Übersetzungen
│   ├── en.js                     # Englische Übersetzungen (gleicher Schlüsselsatz)
│   └── index.js                  # createI18n-Konfiguration
├── lib/
│   └── core/
│       └── handoff.js            # KodiniTools Cross-Tool-Handoff-Protokoll
├── router/
│   └── index.js                  # Vue Router (11 Routen + Navigation Guards)
├── stores/
│   ├── galleryStore.js           # Galerie-Bilder & Multi-Select
│   ├── imageStore.js             # Gemeinsamer Editor-State (Basisbild, Texte, Ebenen, Ebenen-Historie)
│   └── settingsStore.js          # App-Einstellungen (Theme, Sprache, Export)
├── styles/
│   ├── variables.scss            # SCSS-Tokens und Mixins (erzeugt kein CSS)
│   ├── theme.scss                # CSS Custom Properties für Light/Dark (einmal über main.scss)
│   ├── global.scss               # Reset, Typografie, Utility-Klassen
│   └── main.scss                 # SCSS-Einstiegspunkt
├── utils/
│   ├── conversionUtils.js        # Canvas → PNG/JPG/WebP/BMP/PDF/SVG, A4-Layout, Backend-Formate
│   ├── exportUtils.js            # ExportManager (Download-Export im Editor)
│   ├── fileUtils.js              # Endungslisten (inkl. RAW), isImageFile, Vorschau-Helfer, formatSize
│   ├── formatInfo.js             # FORMAT_INFO-Mapping aller Export-Formate
│   ├── textUtils.js              # Text-Messung, Bounding-Box, Kollisionserkennung
│   └── validationUtils.js        # Validierung hochgeladener Bilddateien
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

### `imageStore.js` – Gemeinsamer Editor-State

Filter, Transformationen und die Editor-Historie liegen nicht im Store, sondern in
den Editor-Composables (`useFilterManagement`, `useTransform`, `useEditorHistory`);
das Rendering übernimmt `useCanvasRenderer`.

**State:**

```js
originalImage       // Zuletzt geladenes Basisbild (Referenz für Galerie/Handoff)
workingUrl          // Aktuelle Bild-URL
imageWidth, imageHeight
texts[], selectedTextId
imageLayers[], selectedLayerId   // Bild-Ebenen (Collage-/Ebenen-Modus)
canvasBackgroundColor
history[], historyIndex          // Ebenen-Historie (max. 50 Einträge)
```

**Computed:**
`hasImage`, `canUndo`, `canRedo`, `hasImageLayers`, `imageLayerCount`, `selectedImageLayer`

**Actions:**
- `initCanvas()`, `loadImageFromFile()` – TIFF/HEIC/RAW werden an die Backend-API delegiert
- `draw()` – schnelle Zwischenansicht (Bild oder Ebenen plus Texte) nach Store-Aktionen
- Text: `addText()`, `updateText()`, `deleteText()`
- Ebenen: `addImageLayer()`, `addImageLayersFromGallery()`, `updateImageLayer()`, `deleteImageLayer()`, `selectImageLayer()`, `duplicateImageLayer()`, `moveImageLayerOrder()`, `clearImageLayers()`
- Ebenen-Historie: `saveState()`, `undo()`, `redo()` (genutzt vom Ebenen-Panel)

### `settingsStore.js` – App-Einstellungen

**State:** `theme` (light/dark/auto), `locale` (de/en), `performanceMode`, `defaultExportQuality` (95), `defaultExportFormat` (png), Grid, Snap, Toast-Einstellungen

**Persistenz:** `localStorage`  
**Sync:** Theme und Locale werden mit dem globalen SSI-Navigation-Element synchronisiert.

### `galleryStore.js` – Bildgalerie

**State:** `images[]`, `selectedImageId`, `selectedImageIds[]`  
**Persistenz:** Nur Sitzung (kein localStorage)  
**Multi-Select-Actions:** `toggleImageSelection()`, `selectAllImages()`, `deselectAllImages()`, `isImageSelected()`

### Filter-Presets (`components/editor/FilterPresets.vue`)

Es gibt keinen eigenen Preset-Store. Standard-Presets, benutzerdefinierte Presets,
Import/Export und die `localStorage`-Persistenz liegen vollständig in der Komponente.

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
| `POST` | `/convert-image` | Bildkonvertierung (TIFF, HEIC, RAW, SVG) |
| `GET` | `/formats` | Unterstützte Formate abrufen |
| `POST` | `/upload` | Bild hochladen |

**Schlüsselmethoden:**
- `ApiClient.convertImage(blob, format, filename, options)` – FormData-Upload mit Quality-Option
- `ApiClient.checkBackendAvailability()` – Health-Check mit 5s Timeout

**Wann wird das Backend benötigt?** TIFF-, HEIC/HEIF- und RAW-Eingabe (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF) sowie TIFF- und SVG-Export erfordern eine aktive Backend-Verbindung. Alle anderen Formate laufen vollständig im Browser.

---

## Internationalisierung (`src/i18n/`)

**Sprachen:** Deutsch (`de.js`), Englisch (`en.js`), gleicher Schlüsselsatz; `index.js` erzeugt die
vue-i18n-Instanz. Jeder Schlüssel wird in der App referenziert, entweder als Literal, über
Datenarrays (z.B. Guide-Features) oder über Template-Präfixe wie `guide.filters.${key}`.

**Top-Level-Schlüssel:**

| Schlüssel | Bereich |
|-----------|---------|
| `nav.*` | Navigation |
| `home.*` | Startseite (Features, Konvertierungen, weitere Tools) |
| `faq.*` | FAQ-Seite |
| `conversion.*` | Konvertierungs-Landingpages und Widget |
| `editor.*` | Editor (Toolbar, Sidebar, Formate, Ablösen) |
| `transform.*`, `textPanel.*`, `textModal.*` | Transformationen, Text-Panel, Text-Dialog |
| `layerPanel.*` | Ebenen-Panel im Collage-Modus |
| `filters.*`, `presets.*` | Filter- und Preset-Namen |
| `shortcuts.*` | Tastaturkürzel-Übersicht |
| `batch.*` | Stapelverarbeitung |
| `gallery.*` | Galerie |
| `guide.*` | Anleitung |
| `about.*`, `notFound.*` | Über-Seite, 404 |
| `toast.*`, `confirm.*`, `common.*` | Benachrichtigungen, Bestätigungsdialoge, gemeinsame Beschriftungen |
| `handoff.*` | Cross-Tool-Übergabe |

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
// Erlaubte MIME-Typen: JPEG, PNG, WebP, GIF, BMP, SVG, TIFF, HEIC/HEIF, RAW
// Endungen aus fileUtils (IMAGE_EXTENSIONS)
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
npm test              # Unit- und Browser-Tests (Vitest)
npm run test:unit     # nur Unit-Tests (happy-dom)
npm run test:browser  # nur Browser-Tests (Chromium via Playwright)
```

---

## Tests (`tests/`, `vitest.config.js`)

Zwei Vitest-Projekte:

| Projekt | Umgebung | Inhalt |
|---------|----------|--------|
| `unit` | happy-dom | `fileUtils`, `conversionUtils` (Zielgröße, A4-Layout), i18n-Konsistenz (gleicher Schlüsselsatz de/en, jeder referenzierte Schlüssel existiert, kein Schlüssel verwaist), `GuideSectionHeader` mit Vue Test Utils |
| `browser` | Chromium (Vitest Browser Mode, Playwright) | `useCanvasRenderer` (Vorschau vs. Export pixelgenau, Auswahlrahmen, Vignette, Transparenz, Texte, Collage), `useBatchConversion` (JPG/WebP/PNG, Skalierung, PDF einzeln und gesamt, SVG-Fallback ohne Backend, Fehlerpfad, Reset/Entfernen/Leeren), `useEditorHistory` (Snapshot, Undo/Redo mit vollständiger Wiederherstellung, Redo-Zweig, Reset), `useEditorResize` (Live-Vorschau mit Entprellung, Presets, Anwenden, Validierung), `useEditorDetach` (Ablösen als Ebene, Fehlerpfad, Verbinden, Umschalten, Hintergrund-Sync) |

Die Browser-Tests brauchen einen echten 2D-Canvas und laufen deshalb nicht in jsdom/happy-dom.
`vitest.config.js` sucht Chromium über Playwright, ersatzweise unter `PLAYWRIGHT_BROWSERS_PATH`
oder per `VITEST_CHROMIUM`.

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
