# CONTEXT.md - Bildkonverter Pro

> Automatisch generierte Dokumentation der Codebase-Struktur

---

## Tech-Stack

### Frontend Framework
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Vue.js | 3.4.21 | Modernes JavaScript-Framework mit Composition API |
| Vite | 5.1.6 | Schneller Build-Tool und Dev-Server |
| Vue Router | 4.3.0 | Client-seitiges Routing |
| Pinia | 2.1.7 | State Management |
| Vue-i18n | 9.10.2 | Internationalisierung (DE/EN) |

### Build & Development
| Tool | Version | Zweck |
|------|---------|-------|
| Sass/SCSS | 1.71.1 | CSS-Präprozessor |
| ESLint | 8.57.0 | Code-Linting |
| Prettier | 3.2.5 | Code-Formatierung |
| @vueuse/core | 10.9.0 | Vue Composition Utilities |

### Bibliotheken
| Bibliothek | Version | Verwendung |
|------------|---------|------------|
| canvas-confetti | 1.9.2 | Konfetti-Animationen |
| jsPDF | 2.5.2 | PDF-Generierung |

### Build-Konfiguration
- **Target**: ES2020
- **Base Path**: `/bildkonverter/`
- **Output**: `/dist`

---

## Ordnerstruktur

```
/home/user/Bildkonverter/
├── src/                           # Haupt-Quellcode
│   ├── main.js                    # Vue App Entry Point
│   ├── App.vue                    # Root-Komponente
│   ├── index.html                 # HTML-Template
│   │
│   ├── api/                       # Backend-Kommunikation
│   │   └── api.js                 # API-Client für spezielle Formate (TIFF, GIF, HEIF)
│   │
│   ├── stores/                    # Pinia State Management
│   │   ├── imageStore.js          # Bild-Bearbeitungszustand
│   │   ├── imageStore-extended.js # Erweiterte Bild-Features
│   │   ├── settingsStore.js       # App-Einstellungen
│   │   ├── presetsStore.js        # Filter-Presets
│   │   └── galleryStore.js        # Galerie-Speicher
│   │
│   ├── router/                    # Vue Router
│   │   └── index.js               # Routen: home, editor, gallery, about
│   │
│   ├── i18n/                      # Internationalisierung
│   │   └── index.js               # DE & EN Übersetzungen (900+ Keys)
│   │
│   ├── components/                # Vue-Komponenten
│   │   ├── layout/                # Header, Footer
│   │   ├── editor/                # Canvas-Editor-Komponenten
│   │   ├── features/              # Feature-spezifische Komponenten
│   │   ├── modals/                # Modal-Dialoge
│   │   ├── ui/                    # UI-Komponenten (Toasts, Modals)
│   │   └── dev/                   # Development-Tools
│   │
│   ├── views/                     # Seiten-Komponenten
│   │   ├── HomeView.vue           # Startseite
│   │   ├── EditorView.vue         # Haupt-Bildeditor
│   │   ├── GalleryView.vue        # Bildverwaltung
│   │   ├── AboutView.vue          # Info-Seite
│   │   ├── ImageEditor.vue        # Bild-Editor
│   │   └── BatchView.vue          # Stapelverarbeitung
│   │
│   ├── composables/               # Wiederverwendbare Composition-Logik
│   │   ├── useTransform.js        # Bild-Transformation
│   │   ├── useTextInteraction.js  # Text-Bearbeitung
│   │   ├── useCrop.js             # Zuschnitt-Funktionalität
│   │   └── useTextModal.js        # Text-Modal-Verwaltung
│   │
│   ├── utils/                     # Utility-Funktionen
│   │   ├── textUtils.js           # Text-Messung & Rendering
│   │   ├── validationUtils.js     # Input-Validierung
│   │   └── exportUtils.js         # Export-Funktionalität
│   │
│   ├── assets/                    # Statische Assets
│   │   ├── fonts/                 # Schriftarten
│   │   │   ├── fontList.js        # Verfügbare Fonts
│   │   │   ├── fontManager.js     # Font-Verwaltung
│   │   │   ├── textManager.js     # Text-Manager
│   │   │   └── main.js            # Font-Initialisierung
│   │   └── fonts.css              # Font-Definitionen
│   │
│   └── styles/                    # SCSS-Stylesheets
│       ├── variables.scss         # Design-System-Variablen
│       ├── global.scss            # Globale Styles
│       └── main.scss              # Import-Manager
│
├── dist/                          # Build-Output
├── node_modules/                  # Abhängigkeiten
├── package.json                   # Projekt-Konfiguration
├── package-lock.json              # Dependency Lock
├── tsconfig.json                  # TypeScript-Konfiguration
├── vite.config.js                 # Vite Build-Konfiguration
└── README.md                      # Projekt-Dokumentation
```

---

## Datenschema / State Management

> **Hinweis**: Dies ist eine Client-seitige SPA ohne traditionelle Datenbank. Alle Daten werden im Browser-Speicher und LocalStorage verwaltet.

### Image Store (Haupt-Datenmodell)

```javascript
{
  // Bild-Eigenschaften
  originalImage: HTMLImageElement,    // Original-Bild
  workingUrl: string,                 // Arbeits-URL
  canvas: HTMLCanvasElement,          // Canvas-Element
  ctx: CanvasRenderingContext2D,      // Canvas-Context
  imageWidth: number,                 // Aktuelle Breite
  imageHeight: number,                // Aktuelle Höhe
  originalWidth: number,              // Original-Breite
  originalHeight: number,             // Original-Höhe

  // Filter-Werte
  filters: {
    brightness: 100,                  // 0-200%
    contrast: 100,                    // 0-200%
    saturation: 100,                  // 0-200%
    grayscale: 0,                     // 0-100%
    sepia: 0,                         // 0-100%
    sharpen: 0,                       // 0-100%
    zoom: 1.0                         // Zoom-Faktor
  },

  // Text-Elemente
  texts: Array<TextObject>,           // Siehe Text-Objekt-Schema

  // History (Undo/Redo)
  history: Array<HistoryState>,       // Siehe History-Schema
  historyIndex: number,               // Aktueller Index
  maxHistoryStates: 30,               // Max. Zustände

  // UI-Zustand
  selectedTextId: number | null,      // Ausgewählter Text
  isProcessing: boolean,              // Verarbeitung läuft
  isImageLoaded: boolean,             // Bild geladen
  isDragging: boolean                 // Drag-Modus aktiv
}
```

### Text-Objekt Schema

```javascript
{
  id: number,                         // Eindeutige ID
  content: string,                    // Text-Inhalt
  txt: string,                        // Legacy-Kompatibilität
  x: number,                          // X-Position auf Canvas
  y: number,                          // Y-Position auf Canvas
  fontSize: number,                   // Schriftgröße (px)
  size: number,                       // Legacy-Eigenschaft
  fontFamily: string,                 // Schriftart (z.B. 'Roboto')
  color: string,                      // Hex-Farbcode
  opacity: number,                    // 0-1
  rotation: number,                   // Grad
  shadowBlur: number,                 // Schatten-Unschärfe
  shadowOffsetX: number,              // Schatten X-Offset
  shadowOffsetY: number,              // Schatten Y-Offset
  strokeColor: string,                // Umrandungsfarbe
  strokeWidth: number,                // Umrandungsbreite
  align: 'left' | 'center' | 'right'  // Textausrichtung
}
```

### History State Schema

```javascript
{
  timestamp: number,                  // Zeitstempel
  description: string,                // Beschreibung der Aktion
  type: string,                       // Aktionstyp
  filters: object,                    // Filter-Zustand
  texts: array,                       // Text-Zustand
  selectedTextId: number | null,      // Ausgewählter Text
  imageData: string                   // PNG Data-URL (0.5 Qualität)
}
```

### Settings Store Schema

```javascript
{
  // Erscheinungsbild
  theme: 'light' | 'dark' | 'auto',   // Farbschema
  locale: 'de' | 'en',                // Sprache
  performanceMode: 'low' | 'balanced' | 'high',

  // Export-Optionen
  defaultExportQuality: 95,           // 1-100
  defaultExportFormat: 'png',         // png|jpg|jpeg|webp|gif

  // UI-Einstellungen
  showGrid: boolean,                  // Raster anzeigen
  snapToGrid: boolean,                // Am Raster ausrichten
  gridSize: 20,                       // 5-100px
  autoSave: boolean,                  // Auto-Speichern
  autoSaveInterval: 30000,            // 5s-300s

  // Features
  shortcutsEnabled: boolean,          // Tastenkürzel aktiv
  debugMode: boolean,                 // Debug-Modus
  showPerformanceMetrics: boolean,    // Performance anzeigen

  // Benachrichtigungen
  toastDuration: 3000,                // Toast-Dauer (ms)
  toastPosition: 'top-right'          // Toast-Position
}
```

### Presets Store Schema

```javascript
{
  id: string,                         // z.B. 'vintage', 'custom_123_abc'
  name: string,                       // Anzeigename
  icon: string,                       // Emoji-Icon
  description: string,                // Beschreibung
  isDefault: boolean,                 // Standard-Preset
  createdAt: number,                  // Erstellungsdatum
  updatedAt: number,                  // Aktualisierungsdatum

  filters: {
    brightness: number,
    contrast: number,
    saturation: number,
    grayscale: number,
    sepia: number,
    sharpen: number
  }
}

// Standard-Presets (8 eingebaut)
// - original, vibrant, vintage, bw (Schwarz-Weiß)
// - dramatic, soft, warm, cool
```

### Gallery Store Schema

```javascript
{
  images: [
    {
      id: string,                     // Eindeutige ID
      name: string,                   // Dateiname
      size: number,                   // Dateigröße (Bytes)
      width: number,                  // Bildbreite
      height: number,                 // Bildhöhe
      format: string,                 // Dateiformat
      uploadedAt: number,             // Upload-Zeitstempel
      data: Blob | ArrayBuffer        // Bilddaten
    }
  ],
  selectedImageId: string | null      // Ausgewähltes Bild
}
```

---

## LocalStorage Keys

| Key | Beschreibung |
|-----|--------------|
| `bildkonverter-theme` | Theme-Einstellung |
| `bildkonverter-locale` | Spracheinstellung |
| `bildkonverter-performance` | Performance-Modus |
| `bildkonverter-export-quality` | Standard-Export-Qualität |
| `bildkonverter-export-format` | Standard-Export-Format |
| `bildkonverter_filterPresets` | Benutzerdefinierte Presets (JSON) |

---

## Architektur-Übersicht

### Komponenten-Hierarchie

```
App.vue (Root-Komponente)
├── AppHeader (Navigation, Theme Toggle)
├── RouterView (Dynamische Seiten-Komponente)
│   ├── HomeView (Startseite)
│   ├── EditorView (Haupt-Bildeditor)
│   ├── GalleryView (Bildverwaltung)
│   └── AboutView (Info-Seite)
├── ToastContainer (Benachrichtigungen)
├── TextEditModal (Globaler Text-Editor)
└── PerformanceMonitor (Debug-Modus)
```

### Routen

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/` | HomeView | Startseite mit Drag & Drop |
| `/editor` | EditorView | Haupt-Bildeditor |
| `/gallery` | GalleryView | Bildergalerie |
| `/about` | AboutView | Info & FAQ |

### State Management Pattern

Alle Zustände sind zentralisiert in Pinia Stores:
- **imageStore**: Haupt-Bearbeitungszustand + Canvas-Operationen
- **settingsStore**: Benutzereinstellungen + LocalStorage-Persistenz
- **presetsStore**: Filter-Presets + Import/Export
- **galleryStore**: Bildsammlungsverwaltung

---

## Unterstützte Bildformate

| Format | Browser | Backend API |
|--------|---------|-------------|
| JPEG | ✅ | - |
| PNG | ✅ | - |
| WebP | ✅ | - |
| TIFF | - | ✅ |
| GIF | - | ✅ |
| HEIF | - | ✅ |
| PDF (Export) | ✅ | - |

---

## Design System

### Farben
- **Primary**: `#4a90e2` (Blau)
- **Success**: `#50e3c2`
- **Warning**: `#f8e71c`
- **Error**: `#f44336`
- **Neutral**: Graustufen 100-900

### Spacing
- Base Unit: `8px`
- Verwendung: Vielfache der Base Unit

### Typography
- Responsive Font-Sizing
- System-Fonts mit Fallbacks

---

*Zuletzt aktualisiert: Januar 2026*
