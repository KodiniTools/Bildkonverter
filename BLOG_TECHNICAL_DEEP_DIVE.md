# Bildkonverter Pro: Ein technischer Deep Dive

> **Ein umfassender Leitfaden zu Vue.js 3, Canvas API, Web Audio und modernen Browser-Technologien am Beispiel einer professionellen Bildbearbeitungsanwendung**

---

## Inhaltsverzeichnis

1. [Einleitung](#1-einleitung)
2. [Projektarchitektur im Uberblick](#2-projektarchitektur-im-uberblick)
3. [Vue.js 3 Composition API - Meisterklasse](#3-vuejs-3-composition-api---meisterklasse)
4. [State Management mit Pinia](#4-state-management-mit-pinia)
5. [Canvas API - Bildbearbeitung im Browser](#5-canvas-api---bildbearbeitung-im-browser)
6. [Web Audio API - Audio Visualizer](#6-web-audio-api---audio-visualizer)
7. [Fortgeschrittene Browser-Technologien](#7-fortgeschrittene-browser-technologien)
8. [Performance-Optimierung](#8-performance-optimierung)
9. [Architekturentscheidungen und Best Practices](#9-architekturentscheidungen-und-best-practices)
10. [Fazit](#10-fazit)

---

## 1. Einleitung

Bildkonverter Pro ist mehr als nur ein Bildbearbeitungstool - es ist ein Showcase moderner Web-Entwicklungstechniken. Diese Dokumentation richtet sich an Entwickler, die verstehen mochten, wie Vue.js 3, die Canvas API und Web Audio API zusammenarbeiten, um leistungsstarke Browser-Anwendungen zu erstellen.

### Was Sie lernen werden

- **Vue.js 3 Composition API**: Reactive State, Composables, und moderne Patterns
- **Pinia State Management**: Zentrale Datenverwaltung ohne Vuex-Komplexitat
- **Canvas 2D API**: Pixelmanipulation, Filter, Layer-System
- **Web Audio API**: Echtzeit-Audioanalyse und Visualisierung
- **Moderne Browser-APIs**: File API, Blob, MediaRecorder, LocalStorage

### Technologie-Stack

| Technologie | Version | Verwendungszweck |
|-------------|---------|------------------|
| Vue.js | 3.4.21 | Reaktives UI-Framework |
| Pinia | 2.1.7 | State Management |
| Vue Router | 4.3.0 | SPA-Navigation |
| Vue i18n | 9.10.2 | Internationalisierung |
| Vite | 5.x | Build-Tool & Dev-Server |
| jsPDF | 2.5.2 | PDF-Export |

---

## 2. Projektarchitektur im Uberblick

### 2.1 Verzeichnisstruktur

```
/src
├── /api                    # Backend-Integration
│   └── api.js             # API-Client fur Server-Konvertierung
├── /assets                 # Statische Ressourcen
│   └── /fonts/main.js     # Audio Visualizer Modul
├── /components             # Vue-Komponenten
│   ├── /dev               # Entwicklungstools
│   ├── /editor            # Editor-spezifische Komponenten
│   ├── /features          # Feature-Komponenten
│   ├── /layout            # Layout-Komponenten
│   ├── /modals            # Modal-Dialoge
│   └── /ui                # Wiederverwendbare UI-Elemente
├── /composables            # Composition Functions
│   ├── useCrop.js         # Crop-Tool Logik
│   ├── useFilterManagement.js
│   ├── useImageHistory.js  # Undo/Redo
│   ├── useTextInteraction.js
│   └── ...
├── /i18n                   # Ubersetzungen (DE/EN)
├── /router                 # Vue Router Konfiguration
├── /stores                 # Pinia Stores
│   ├── imageStore.js      # Hauptstore fur Bildbearbeitung
│   ├── settingsStore.js   # App-Einstellungen
│   ├── presetsStore.js    # Filter-Presets
│   └── galleryStore.js    # Bildergalerie
├── /styles                 # SCSS Stylesheets
├── /utils                  # Hilfsfunktionen
│   ├── exportUtils.js     # Export-Logik
│   ├── textUtils.js       # Text-Rendering
│   └── validationUtils.js # Validierung
├── /views                  # Seiten-Komponenten
├── App.vue                 # Root-Komponente
└── main.js                 # Einstiegspunkt
```

### 2.2 Datenfluss-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Vue Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Views      │    │  Components  │    │  Composables │   │
│  │  (Seiten)    │◄──►│   (UI)       │◄──►│  (Logik)     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│          │                   │                   │           │
│          └───────────────────┼───────────────────┘           │
│                              ▼                               │
│                    ┌──────────────────┐                      │
│                    │   Pinia Stores   │                      │
│                    │  (Zentraler      │                      │
│                    │   State)         │                      │
│                    └──────────────────┘                      │
│                              │                               │
│          ┌───────────────────┼───────────────────┐           │
│          ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ LocalStorage │    │  Canvas API  │    │  File API    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Vue.js 3 Composition API - Meisterklasse

### 3.1 Script Setup Syntax

Die Anwendung nutzt durchgangig die moderne `<script setup>` Syntax, die Vue 3.2+ eingefuhrt hat:

```vue
<!-- Traditionelle Options API (alt) -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>

<!-- Composition API mit script setup (modern) -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
</script>
```

### 3.2 Reaktivitat verstehen

#### ref() vs reactive()

```javascript
// ref() - Fur primitive Werte und einzelne Referenzen
const isLoading = ref(false)
const selectedTextId = ref(null)
const imageWidth = ref(800)

// Zugriff uber .value
isLoading.value = true

// reactive() - Fur komplexe Objekte
const filters = reactive({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0
})

// Direkter Zugriff
filters.brightness = 120
```

**Wann was verwenden?**

| Situation | Empfehlung | Grund |
|-----------|------------|-------|
| Primitive Werte (number, string, boolean) | `ref()` | Einfache Handhabung |
| Komplexe Objekte mit vielen Eigenschaften | `reactive()` | Kein `.value` notig |
| Arrays | `ref()` | Bessere Ersetzbarkeit |
| Nullable/undefined Werte | `ref()` | Kann komplett ersetzt werden |

### 3.3 Computed Properties

Computed Properties sind gecachte, abgeleitete Werte:

```javascript
// imageStore.js
const hasImage = computed(() => !!originalImage.value)

const hasActiveFilters = computed(() => {
  return filters.brightness !== 100 ||
         filters.contrast !== 100 ||
         filters.saturation !== 100 ||
         filters.grayscale > 0 ||
         filters.sepia > 0
})

// Mit Getter und Setter
const selectedText = computed({
  get: () => texts.value.find(t => t.id === selectedTextId.value),
  set: (newText) => {
    const index = texts.value.findIndex(t => t.id === newText.id)
    if (index !== -1) texts.value[index] = newText
  }
})
```

### 3.4 Watchers fur Seiteneffekte

```javascript
// Einfacher Watch
watch(selectedTextId, (newId, oldId) => {
  console.log(`Text selection changed: ${oldId} -> ${newId}`)
})

// Watch mit Optionen
watch(
  () => filters.brightness,
  (newValue) => {
    draw() // Canvas neu zeichnen
  },
  { immediate: true } // Sofort ausfuhren
)

// Mehrere Quellen beobachten
watch(
  [() => filters.brightness, () => filters.contrast],
  ([brightness, contrast]) => {
    console.log('Filter changed:', { brightness, contrast })
    draw()
  }
)

// watchEffect - automatische Dependency-Erkennung
watchEffect(() => {
  // Wird ausgefuhrt wenn sich brightness ODER contrast andert
  document.title = `Brightness: ${filters.brightness}%`
})
```

### 3.5 Composables - Wiederverwendbare Logik

Composables sind das Herzstuck der Composition API. Sie kapseln wiederverwendbare Logik:

#### Beispiel: useFilterManagement.js

```javascript
// composables/useFilterManagement.js
import { ref, computed } from 'vue'

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  sharpen: 0,
  blur: 0,
  hue: 0
}

export function useFilterManagement(options = {}) {
  const { onFilterChange } = options

  // State
  const filters = ref({ ...DEFAULT_FILTERS })
  const background = ref({
    color: '#ffffff',
    opacity: 100,
    transparent: false
  })

  // Computed
  const hasActiveFilters = computed(() => {
    return Object.keys(DEFAULT_FILTERS).some(
      key => filters.value[key] !== DEFAULT_FILTERS[key]
    )
  })

  const filterString = computed(() => {
    const parts = []
    if (filters.value.brightness !== 100) {
      parts.push(`brightness(${filters.value.brightness}%)`)
    }
    if (filters.value.contrast !== 100) {
      parts.push(`contrast(${filters.value.contrast}%)`)
    }
    // ... weitere Filter
    return parts.join(' ') || 'none'
  })

  // Actions
  function setFilter(name, value) {
    if (name in filters.value) {
      filters.value[name] = value
      onFilterChange?.()
    }
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    onFilterChange?.()
  }

  function applyPreset(preset) {
    filters.value = { ...DEFAULT_FILTERS, ...preset.filters }
    onFilterChange?.()
  }

  return {
    filters,
    background,
    hasActiveFilters,
    filterString,
    setFilter,
    resetFilters,
    applyPreset,
    DEFAULT_FILTERS
  }
}
```

#### Beispiel: useTextInteraction.js

```javascript
// composables/useTextInteraction.js
export function useTextInteraction(canvasRef, imageStore) {
  const isDragging = ref(false)
  const isResizing = ref(false)
  const dragStart = ref({ x: 0, y: 0 })
  const selectedTextId = ref(null)

  // Koordinaten-Umrechnung DOM -> Canvas
  function getCanvasPosition(event) {
    const rect = canvasRef.value.getBoundingClientRect()
    const scaleX = imageStore.imageWidth / rect.width
    const scaleY = imageStore.imageHeight / rect.height

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  // Text an Position finden
  function findTextAtPosition(x, y) {
    const texts = imageStore.texts
    // Von oben nach unten durchsuchen (letzter = oberster)
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i]
      const bounds = getTextBounds(text)

      if (x >= bounds.left && x <= bounds.right &&
          y >= bounds.top && y <= bounds.bottom) {
        return i
      }
    }
    return -1
  }

  // Mouse Event Handler
  function handleMouseDown(event) {
    const pos = getCanvasPosition(event)
    const textIndex = findTextAtPosition(pos.x, pos.y)

    if (textIndex !== -1) {
      selectedTextId.value = imageStore.texts[textIndex].id
      isDragging.value = true
      dragStart.value = pos

      // Doppelklick-Erkennung fur Textbearbeitung
      if (event.detail === 2) {
        openTextEditor(selectedTextId.value)
        isDragging.value = false
      }
    } else {
      selectedTextId.value = null
    }
  }

  function handleMouseMove(event) {
    if (!isDragging.value || selectedTextId.value === null) return

    const pos = getCanvasPosition(event)
    const deltaX = pos.x - dragStart.value.x
    const deltaY = pos.y - dragStart.value.y

    imageStore.updateText(selectedTextId.value, {
      x: imageStore.getTextById(selectedTextId.value).x + deltaX,
      y: imageStore.getTextById(selectedTextId.value).y + deltaY
    })

    dragStart.value = pos
  }

  function handleMouseUp() {
    if (isDragging.value) {
      isDragging.value = false
      imageStore.saveState('Text verschoben', 'text-move')
    }
  }

  // Event Listener registrieren
  onMounted(() => {
    const canvas = canvasRef.value
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
  })

  onUnmounted(() => {
    const canvas = canvasRef.value
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    selectedTextId,
    isDragging,
    isResizing
  }
}
```

### 3.6 Provide/Inject fur Dependency Injection

```javascript
// Parent-Komponente
import { provide } from 'vue'

const imageStore = useImageStore()
provide('imageStore', imageStore)
provide('canvasContext', ctx)

// Child-Komponente (beliebig tief verschachtelt)
import { inject } from 'vue'

const imageStore = inject('imageStore')
const ctx = inject('canvasContext')
```

---

## 4. State Management mit Pinia

### 4.1 Warum Pinia statt Vuex?

| Feature | Vuex | Pinia |
|---------|------|-------|
| Mutations | Erforderlich | Nicht notig |
| TypeScript | Komplex | Native Unterstutzung |
| Modules | Namespace-basiert | Unabhangige Stores |
| DevTools | Ja | Ja + bessere Integration |
| Composition API | Eingeschrankt | Vollstandig |
| Bundle Size | ~10KB | ~1KB |

### 4.2 Store-Definition mit Composition API

```javascript
// stores/imageStore.js
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

export const useImageStore = defineStore('image', () => {
  // ============================================
  // STATE
  // ============================================

  const canvas = ref(null)
  const ctx = ref(null)
  const originalImage = ref(null)
  const imageWidth = ref(800)
  const imageHeight = ref(600)

  const filters = reactive({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    sharpen: 0,
    blur: 0
  })

  const texts = ref([])
  const imageLayers = ref([])
  const selectedTextId = ref(null)
  const selectedLayerId = ref(null)

  // History fur Undo/Redo
  const history = ref([])
  const historyIndex = ref(-1)
  const maxHistoryStates = 50

  // ============================================
  // COMPUTED (Getters)
  // ============================================

  const hasImage = computed(() => !!originalImage.value)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const hasActiveFilters = computed(() => {
    return filters.brightness !== 100 ||
           filters.contrast !== 100 ||
           filters.saturation !== 100 ||
           filters.grayscale > 0 ||
           filters.sepia > 0
  })

  const selectedText = computed(() => {
    if (selectedTextId.value === null) return null
    return texts.value.find(t => t.id === selectedTextId.value)
  })

  // ============================================
  // ACTIONS
  // ============================================

  function initCanvas(canvasElement) {
    canvas.value = canvasElement
    ctx.value = canvasElement.getContext('2d', {
      willReadFrequently: true, // Optimierung fur haufiges Auslesen
      alpha: true
    })
  }

  async function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      // Validierung
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        reject(new Error(validation.errors.join(', ')))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()

        img.onload = () => {
          originalImage.value = img
          imageWidth.value = img.width
          imageHeight.value = img.height

          // Canvas-Grosse anpassen
          canvas.value.width = img.width
          canvas.value.height = img.height

          // Filter zurucksetzen
          resetFilters()

          // Zeichnen
          draw()

          // History initialisieren
          saveState('Bild geladen', 'image-load')

          resolve(img)
        }

        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
        img.src = e.target.result
      }

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
      reader.readAsDataURL(file)
    })
  }

  function setFilter(name, value) {
    if (!(name in filters)) return

    // Wert validieren und begrenzen
    const validated = validateFilterValue(name, value)
    filters[name] = validated.value

    draw()
  }

  function resetFilters() {
    filters.brightness = 100
    filters.contrast = 100
    filters.saturation = 100
    filters.grayscale = 0
    filters.sepia = 0
    filters.sharpen = 0
    filters.blur = 0

    draw()
  }

  function draw() {
    if (!ctx.value) return

    const c = ctx.value

    // Canvas leeren
    c.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Modus: Collage mit Layern
    if (imageLayers.value.length > 0) {
      drawImageLayers(c)
    }
    // Modus: Einzelbild mit Filtern
    else if (originalImage.value) {
      // Filter-String aufbauen
      c.filter = buildFilterString()
      c.drawImage(
        originalImage.value,
        0, 0,
        imageWidth.value, imageHeight.value
      )
    }

    // Filter zurucksetzen fur Text
    c.filter = 'none'

    // Texte zeichnen
    drawTexts(c)
  }

  function buildFilterString() {
    const parts = []

    if (filters.brightness !== 100) {
      parts.push(`brightness(${filters.brightness}%)`)
    }
    if (filters.contrast !== 100) {
      parts.push(`contrast(${filters.contrast}%)`)
    }
    if (filters.saturation !== 100) {
      parts.push(`saturate(${filters.saturation}%)`)
    }
    if (filters.grayscale > 0) {
      parts.push(`grayscale(${filters.grayscale}%)`)
    }
    if (filters.sepia > 0) {
      parts.push(`sepia(${filters.sepia}%)`)
    }
    if (filters.blur > 0) {
      parts.push(`blur(${filters.blur}px)`)
    }

    return parts.length > 0 ? parts.join(' ') : 'none'
  }

  // ============================================
  // TEXT MANAGEMENT
  // ============================================

  function addText(textData = {}) {
    const defaultText = {
      content: 'Neuer Text',
      x: imageWidth.value / 2,
      y: imageHeight.value / 2,
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      opacity: 100,
      rotation: 0,
      shadow: false,
      align: 'center'
    }

    const newText = {
      ...defaultText,
      ...textData,
      id: Date.now() + Math.random()
    }

    texts.value.push(newText)
    selectedTextId.value = newText.id

    draw()
    saveState('Text hinzugefugt', 'text-add')

    return newText
  }

  function updateText(textId, updates) {
    const index = texts.value.findIndex(t => t.id === textId)
    if (index === -1) return

    texts.value[index] = {
      ...texts.value[index],
      ...updates
    }

    draw()
  }

  function deleteText(textId) {
    const index = texts.value.findIndex(t => t.id === textId)
    if (index === -1) return

    texts.value.splice(index, 1)

    if (selectedTextId.value === textId) {
      selectedTextId.value = null
    }

    draw()
    saveState('Text geloscht', 'text-delete')
  }

  function drawTexts(context) {
    texts.value.forEach(text => {
      context.save()

      // Font zusammenbauen
      const fontStyle = text.italic ? 'italic' : 'normal'
      const fontWeight = text.bold ? 'bold' : 'normal'
      context.font = `${fontStyle} ${fontWeight} ${text.fontSize}px ${text.fontFamily}`

      // Farbe und Transparenz
      context.fillStyle = text.color
      context.globalAlpha = text.opacity / 100
      context.textAlign = text.align || 'center'
      context.textBaseline = 'middle'

      // Rotation
      if (text.rotation) {
        context.translate(text.x, text.y)
        context.rotate((text.rotation * Math.PI) / 180)
        context.translate(-text.x, -text.y)
      }

      // Schatten
      if (text.shadow) {
        context.shadowColor = 'rgba(0, 0, 0, 0.5)'
        context.shadowBlur = 4
        context.shadowOffsetX = 2
        context.shadowOffsetY = 2
      }

      // Text zeichnen
      context.fillText(text.content, text.x, text.y)

      context.restore()
    })
  }

  // ============================================
  // HISTORY (Undo/Redo)
  // ============================================

  function saveState(description, type) {
    // Alles nach aktuellem Index entfernen
    history.value = history.value.slice(0, historyIndex.value + 1)

    // Neuen State speichern
    const state = {
      canvasData: canvas.value.toDataURL(),
      filters: { ...filters },
      texts: JSON.parse(JSON.stringify(texts.value)),
      imageLayers: JSON.parse(JSON.stringify(imageLayers.value)),
      timestamp: Date.now(),
      description,
      type
    }

    history.value.push(state)

    // Maximum einhalten
    if (history.value.length > maxHistoryStates) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  function undo() {
    if (!canUndo.value) return

    historyIndex.value--
    restoreState(history.value[historyIndex.value])
  }

  function redo() {
    if (!canRedo.value) return

    historyIndex.value++
    restoreState(history.value[historyIndex.value])
  }

  function restoreState(state) {
    // Filter wiederherstellen
    Object.assign(filters, state.filters)

    // Texte wiederherstellen
    texts.value = JSON.parse(JSON.stringify(state.texts))

    // Bild aus DataURL laden
    const img = new Image()
    img.onload = () => {
      ctx.value.drawImage(img, 0, 0)
    }
    img.src = state.canvasData
  }

  // ============================================
  // RETURN - Offentliche API des Stores
  // ============================================

  return {
    // State
    canvas,
    ctx,
    originalImage,
    imageWidth,
    imageHeight,
    filters,
    texts,
    imageLayers,
    selectedTextId,
    selectedLayerId,
    history,
    historyIndex,

    // Computed
    hasImage,
    canUndo,
    canRedo,
    hasActiveFilters,
    selectedText,

    // Actions
    initCanvas,
    loadImageFromFile,
    setFilter,
    resetFilters,
    draw,
    addText,
    updateText,
    deleteText,
    saveState,
    undo,
    redo
  }
})
```

### 4.3 Store-Persistierung mit LocalStorage

```javascript
// stores/settingsStore.js
export const useSettingsStore = defineStore('settings', () => {
  // State aus LocalStorage initialisieren
  const theme = ref(
    localStorage.getItem('bildkonverter-theme') || 'light'
  )
  const locale = ref(
    localStorage.getItem('bildkonverter-locale') || 'de'
  )
  const exportQuality = ref(
    parseInt(localStorage.getItem('bildkonverter-quality')) || 95
  )

  // Computed
  const isDarkMode = computed(() => theme.value === 'dark')

  // Actions mit Persistierung
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('bildkonverter-theme', newTheme)

    // DOM aktualisieren
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  function setLocale(newLocale) {
    locale.value = newLocale
    localStorage.setItem('bildkonverter-locale', newLocale)
  }

  function setExportQuality(quality) {
    exportQuality.value = quality
    localStorage.setItem('bildkonverter-quality', quality.toString())
  }

  // Initialisierung beim App-Start
  function initialize() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    theme,
    locale,
    exportQuality,
    isDarkMode,
    setTheme,
    setLocale,
    setExportQuality,
    initialize
  }
})
```

---

## 5. Canvas API - Bildbearbeitung im Browser

### 5.1 Canvas Grundlagen

```javascript
// Canvas-Element initialisieren
const canvas = document.getElementById('editor-canvas')
const ctx = canvas.getContext('2d', {
  willReadFrequently: true,  // Optimiert fur ImageData-Zugriffe
  alpha: true,               // Transparenz aktivieren
  desynchronized: false      // Synchron mit DOM (Standard)
})

// Canvas-Grosse setzen (nicht CSS-Grosse!)
canvas.width = 1920
canvas.height = 1080

// Skalierung fur HiDPI-Displays
const dpr = window.devicePixelRatio || 1
canvas.width = width * dpr
canvas.height = height * dpr
ctx.scale(dpr, dpr)
```

### 5.2 CSS-Filter auf Canvas

Die einfachste Methode fur Bildfilter ist die CSS-Filter-Eigenschaft des Canvas-Kontexts:

```javascript
function applyFilters(ctx, image, filters) {
  // Filter-String zusammenbauen
  const filterParts = []

  // Helligkeit (0% = schwarz, 100% = normal, 200% = doppelt hell)
  if (filters.brightness !== 100) {
    filterParts.push(`brightness(${filters.brightness}%)`)
  }

  // Kontrast
  if (filters.contrast !== 100) {
    filterParts.push(`contrast(${filters.contrast}%)`)
  }

  // Sattigung
  if (filters.saturation !== 100) {
    filterParts.push(`saturate(${filters.saturation}%)`)
  }

  // Graustufen
  if (filters.grayscale > 0) {
    filterParts.push(`grayscale(${filters.grayscale}%)`)
  }

  // Sepia
  if (filters.sepia > 0) {
    filterParts.push(`sepia(${filters.sepia}%)`)
  }

  // Weichzeichner
  if (filters.blur > 0) {
    filterParts.push(`blur(${filters.blur}px)`)
  }

  // Farbton-Rotation (hue-rotate)
  if (filters.hue !== 0) {
    filterParts.push(`hue-rotate(${filters.hue}deg)`)
  }

  // Filter anwenden
  ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none'

  // Bild zeichnen
  ctx.drawImage(image, 0, 0)

  // Filter zurucksetzen
  ctx.filter = 'none'
}
```

### 5.3 Pixelmanipulation mit ImageData

Fur komplexere Filter (z.B. Scharfen) benotigen wir direkten Pixelzugriff:

```javascript
function sharpenImage(ctx, width, height, amount) {
  // Pixel-Daten auslesen
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data // Uint8ClampedArray: [R,G,B,A, R,G,B,A, ...]

  // Kopie fur Originalwerte
  const original = new Uint8ClampedArray(data)

  // Scharfungs-Kernel (Laplace)
  const kernel = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ]

  // Kernel uber alle Pixel anwenden
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4

      for (let c = 0; c < 3; c++) { // RGB, nicht Alpha
        let sum = 0

        // 3x3 Nachbarschaft
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4
            const kpos = (ky + 1) * 3 + (kx + 1)
            sum += original[kidx + c] * kernel[kpos]
          }
        }

        // Mit Originalwert interpolieren
        const sharpened = original[idx + c] + (sum - original[idx + c]) * (amount / 100)
        data[idx + c] = Math.min(255, Math.max(0, sharpened))
      }
    }
  }

  // Pixel zuruckschreiben
  ctx.putImageData(imageData, 0, 0)
}
```

### 5.4 Layer-System fur Collagen

```javascript
function drawImageLayers(ctx) {
  // Layer von unten nach oben zeichnen
  imageLayers.value.forEach(layer => {
    if (!layer.visible) return

    ctx.save()

    // Transparenz
    ctx.globalAlpha = layer.opacity / 100

    // Layer-spezifische Filter
    ctx.filter = buildLayerFilterString(layer.filters)

    // Transformation: Rotation um Mittelpunkt
    if (layer.rotation !== 0) {
      const centerX = layer.x + layer.width / 2
      const centerY = layer.y + layer.height / 2

      ctx.translate(centerX, centerY)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)
    }

    // Spiegelung
    if (layer.flipH || layer.flipV) {
      ctx.translate(
        layer.flipH ? layer.x + layer.width : 0,
        layer.flipV ? layer.y + layer.height : 0
      )
      ctx.scale(
        layer.flipH ? -1 : 1,
        layer.flipV ? -1 : 1
      )
    }

    // Bild zeichnen
    ctx.drawImage(
      layer.image,
      layer.x,
      layer.y,
      layer.width,
      layer.height
    )

    ctx.restore()

    // Auswahlrahmen zeichnen wenn selektiert
    if (layer.id === selectedLayerId.value) {
      drawSelectionHandles(ctx, layer)
    }
  })
}

function drawSelectionHandles(ctx, layer) {
  const handleSize = 10
  const handles = [
    { x: layer.x, y: layer.y }, // top-left
    { x: layer.x + layer.width, y: layer.y }, // top-right
    { x: layer.x + layer.width, y: layer.y + layer.height }, // bottom-right
    { x: layer.x, y: layer.y + layer.height } // bottom-left
  ]

  // Rahmen
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(layer.x, layer.y, layer.width, layer.height)
  ctx.setLineDash([])

  // Griffe
  ctx.fillStyle = '#3b82f6'
  handles.forEach(handle => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    )
  })
}
```

### 5.5 Export-Funktionen

```javascript
// Export als verschiedene Formate
function exportCanvas(canvas, format, quality = 0.95, filename = 'image') {
  return new Promise((resolve, reject) => {
    const mimeTypes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    }

    const mimeType = mimeTypes[format] || 'image/png'

    // Canvas zu Blob konvertieren
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Konvertierung fehlgeschlagen'))
          return
        }

        // Download triggern
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.${format}`
        link.click()

        // Cleanup
        URL.revokeObjectURL(url)

        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

// PDF-Export mit jsPDF
async function exportAsPDF(canvas, filename) {
  const { jsPDF } = await import('jspdf')

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  })

  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${filename}.pdf`)
}
```

---

## 6. Web Audio API - Audio Visualizer

### 6.1 Grundkonzepte der Web Audio API

Die Web Audio API bietet eine leistungsstarke Moglichkeit, Audio im Browser zu verarbeiten:

```
┌─────────────────────────────────────────────────────────────┐
│                     AudioContext                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ AudioSource  │───►│ Processing   │───►│ Destination  │   │
│  │ (Input)      │    │ Nodes        │    │ (Output)     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
│  Quellen:              Verarbeitung:       Ausgabe:          │
│  - MediaElementSource  - GainNode          - Lautsprecher    │
│  - AudioBufferSource   - AnalyserNode      - MediaRecorder   │
│  - MediaStreamSource   - BiquadFilter                        │
│  - OscillatorNode      - ConvolverNode                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 AudioContext und AnalyserNode

```javascript
class AudioAnalyzer {
  constructor() {
    // AudioContext erstellen
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // AnalyserNode fur Frequenzanalyse
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048  // Frequenzauflosung (Potenz von 2)
    this.analyser.smoothingTimeConstant = 0.8  // Glattung (0-1)

    // Buffer fur Frequenzdaten
    this.bufferLength = this.analyser.frequencyBinCount  // = fftSize / 2
    this.dataArray = new Uint8Array(this.bufferLength)
    this.floatDataArray = new Float32Array(this.bufferLength)
  }

  // Audio-Element verbinden
  connectAudioElement(audioElement) {
    // MediaElementSource erstellen
    const source = this.audioContext.createMediaElementSource(audioElement)

    // Verketten: Source -> Analyser -> Destination
    source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)

    return source
  }

  // Audio-Datei laden
  async loadAudioFile(file) {
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    // BufferSource erstellen
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer

    source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)

    return source
  }

  // Frequenzdaten abrufen (0-255)
  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray)
    return this.dataArray
  }

  // Frequenzdaten in Dezibel (-Infinity bis 0)
  getFloatFrequencyData() {
    this.analyser.getFloatFrequencyData(this.floatDataArray)
    return this.floatDataArray
  }

  // Wellenform-Daten (Zeitdomane)
  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.dataArray)
    return this.dataArray
  }
}
```

### 6.3 Frequenz-Visualisierung

```javascript
class AudioVisualizer {
  constructor(canvas, analyzer) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.analyzer = analyzer
    this.isRunning = false
  }

  // Balken-Visualisierung
  drawBars() {
    const frequencyData = this.analyzer.getFrequencyData()
    const { width, height } = this.canvas

    this.ctx.clearRect(0, 0, width, height)

    const barCount = 64
    const barWidth = width / barCount
    const barSpacing = 2

    for (let i = 0; i < barCount; i++) {
      // Frequenzbereich samplen
      const start = Math.floor(i * frequencyData.length / barCount)
      const end = Math.floor((i + 1) * frequencyData.length / barCount)

      let sum = 0
      for (let j = start; j < end; j++) {
        sum += frequencyData[j]
      }
      const average = sum / (end - start)

      // Balkenhohe berechnen
      const barHeight = (average / 255) * height * 0.9

      // Farbe basierend auf Frequenz
      const hue = (i / barCount) * 240  // Blau -> Rot
      this.ctx.fillStyle = `hsl(${hue}, 80%, 50%)`

      // Balken zeichnen
      this.ctx.fillRect(
        i * barWidth + barSpacing / 2,
        height - barHeight,
        barWidth - barSpacing,
        barHeight
      )
    }
  }

  // Wellenform-Visualisierung
  drawWaveform() {
    const timeDomainData = this.analyzer.getTimeDomainData()
    const { width, height } = this.canvas

    this.ctx.clearRect(0, 0, width, height)

    this.ctx.beginPath()
    this.ctx.strokeStyle = '#3b82f6'
    this.ctx.lineWidth = 2

    const sliceWidth = width / timeDomainData.length
    let x = 0

    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0  // 0-2 normalisieren
      const y = v * height / 2

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    this.ctx.stroke()
  }

  // Kreisformige Visualisierung
  drawCircular() {
    const frequencyData = this.analyzer.getFrequencyData()
    const { width, height } = this.canvas

    this.ctx.clearRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2
    const baseRadius = Math.min(width, height) / 4

    const bars = 180

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2

      // Frequenzwert
      const freqIndex = Math.floor(i * frequencyData.length / bars)
      const value = frequencyData[freqIndex] / 255

      // Linienenden berechnen
      const innerRadius = baseRadius
      const outerRadius = baseRadius + value * baseRadius

      const x1 = centerX + Math.cos(angle) * innerRadius
      const y1 = centerY + Math.sin(angle) * innerRadius
      const x2 = centerX + Math.cos(angle) * outerRadius
      const y2 = centerY + Math.sin(angle) * outerRadius

      // Linie zeichnen
      const hue = (i / bars) * 360
      this.ctx.strokeStyle = `hsl(${hue}, 100%, ${50 + value * 30}%)`
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.moveTo(x1, y1)
      this.ctx.lineTo(x2, y2)
      this.ctx.stroke()
    }
  }

  // Animation Loop
  start(visualizationType = 'bars') {
    this.isRunning = true

    const animate = () => {
      if (!this.isRunning) return

      switch (visualizationType) {
        case 'bars':
          this.drawBars()
          break
        case 'waveform':
          this.drawWaveform()
          break
        case 'circular':
          this.drawCircular()
          break
      }

      requestAnimationFrame(animate)
    }

    animate()
  }

  stop() {
    this.isRunning = false
  }
}
```

### 6.4 Video-Recording mit MediaRecorder

```javascript
class CanvasRecorder {
  constructor(canvas, audioContext) {
    this.canvas = canvas
    this.audioContext = audioContext
    this.mediaRecorder = null
    this.chunks = []
  }

  async startRecording(audioSource) {
    // Canvas-Stream erstellen (30 fps)
    const canvasStream = this.canvas.captureStream(30)

    // Audio-Stream erstellen
    const audioDestination = this.audioContext.createMediaStreamDestination()
    audioSource.connect(audioDestination)

    // Streams kombinieren
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ])

    // MediaRecorder konfigurieren
    const mimeType = this.getSupportedMimeType()
    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 5000000  // 5 Mbps
    })

    this.chunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(100)  // Alle 100ms ein Chunk
  }

  stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder.mimeType
        })

        // Download triggern
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `visualization_${Date.now()}.webm`
        a.click()

        URL.revokeObjectURL(url)
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    throw new Error('Kein unterstütztes Video-Format gefunden')
  }
}
```

### 6.5 Vollstandiges Audio Visualizer Beispiel

```javascript
// Vollstandige Integration
class AudioVisualizerApp {
  constructor() {
    this.canvas = document.getElementById('visualizer')
    this.fileInput = document.getElementById('audio-input')
    this.playButton = document.getElementById('play-btn')
    this.recordButton = document.getElementById('record-btn')

    this.analyzer = new AudioAnalyzer()
    this.visualizer = new AudioVisualizer(this.canvas, this.analyzer)
    this.recorder = new CanvasRecorder(this.canvas, this.analyzer.audioContext)

    this.audioSource = null
    this.isPlaying = false
    this.isRecording = false

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (file) {
        await this.loadAudio(file)
      }
    })

    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stop()
      } else {
        this.play()
      }
    })

    this.recordButton.addEventListener('click', async () => {
      if (this.isRecording) {
        await this.stopRecording()
      } else {
        await this.startRecording()
      }
    })
  }

  async loadAudio(file) {
    // AudioContext muss durch User-Interaktion aktiviert werden
    if (this.analyzer.audioContext.state === 'suspended') {
      await this.analyzer.audioContext.resume()
    }

    this.audioSource = await this.analyzer.loadAudioFile(file)
  }

  play() {
    if (!this.audioSource) return

    this.audioSource.start(0)
    this.visualizer.start('circular')
    this.isPlaying = true

    this.audioSource.onended = () => {
      this.stop()
    }
  }

  stop() {
    this.audioSource?.stop()
    this.visualizer.stop()
    this.isPlaying = false
  }

  async startRecording() {
    if (!this.audioSource) return

    await this.recorder.startRecording(this.audioSource)
    this.isRecording = true

    // Auch Wiedergabe starten
    this.play()
  }

  async stopRecording() {
    this.stop()
    await this.recorder.stopRecording()
    this.isRecording = false
  }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  new AudioVisualizerApp()
})
```

---

## 7. Fortgeschrittene Browser-Technologien

### 7.1 File API

```javascript
// Datei-Auswahl und Validierung
async function handleFileInput(event) {
  const files = event.target.files

  for (const file of files) {
    // Validierung
    const validation = validateFile(file)
    if (!validation.isValid) {
      console.error(validation.errors)
      continue
    }

    // Datei verarbeiten
    if (file.type.startsWith('image/')) {
      await processImage(file)
    } else if (file.type.startsWith('audio/')) {
      await processAudio(file)
    }
  }
}

function validateFile(file) {
  const errors = []

  // Grossenbegrenzung (50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push(`Datei zu gross: ${formatBytes(file.size)} (max ${formatBytes(maxSize)})`)
  }

  // Minimalgrossse (1KB)
  if (file.size < 1024) {
    errors.push('Datei zu klein')
  }

  // MIME-Type prufen
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Nicht unterstützter Dateityp: ${file.type}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Datei als DataURL lesen
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Datei als ArrayBuffer lesen
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
```

### 7.2 Drag & Drop API

```javascript
// Drag & Drop fur Bildupload
function setupDragAndDrop(dropZone) {
  // Verhindern, dass der Browser die Datei offnet
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  })

  // Visuelle Ruckmeldung
  ;['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, () => {
      dropZone.classList.add('drag-active')
    })
  })

  ;['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, () => {
      dropZone.classList.remove('drag-active')
    })
  })

  // Drop verarbeiten
  dropZone.addEventListener('drop', async (e) => {
    const files = e.dataTransfer.files

    for (const file of files) {
      await processFile(file)
    }
  })
}
```

### 7.3 Blob und Object URLs

```javascript
// Blob erstellen
function createImageBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

// Object URL Management
class ObjectURLManager {
  constructor() {
    this.urls = new Set()
  }

  create(blob) {
    const url = URL.createObjectURL(blob)
    this.urls.add(url)
    return url
  }

  revoke(url) {
    URL.revokeObjectURL(url)
    this.urls.delete(url)
  }

  revokeAll() {
    this.urls.forEach(url => URL.revokeObjectURL(url))
    this.urls.clear()
  }
}

// Verwendung
const urlManager = new ObjectURLManager()

// URL erstellen
const blob = await createImageBlob(canvas)
const url = urlManager.create(blob)

// In img-Element verwenden
const img = document.createElement('img')
img.src = url
img.onload = () => {
  // URL kann freigegeben werden nachdem das Bild geladen ist
  urlManager.revoke(url)
}
```

### 7.4 LocalStorage und SessionStorage

```javascript
// Storage-Wrapper mit JSON-Serialisierung
class StorageManager {
  constructor(storage = localStorage, prefix = 'app') {
    this.storage = storage
    this.prefix = prefix
  }

  getKey(key) {
    return `${this.prefix}-${key}`
  }

  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.getKey(key))
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  set(key, value) {
    try {
      this.storage.setItem(this.getKey(key), JSON.stringify(value))
      return true
    } catch (e) {
      // QuotaExceededError behandeln
      if (e.name === 'QuotaExceededError') {
        console.warn('LocalStorage voll')
        this.cleanup()
        return false
      }
      throw e
    }
  }

  remove(key) {
    this.storage.removeItem(this.getKey(key))
  }

  clear() {
    // Nur eigene Keys loschen
    const keysToRemove = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => this.storage.removeItem(key))
  }

  cleanup() {
    // Alteste Eintrage loschen wenn Platz knapp
    const items = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key.startsWith(this.prefix)) {
        const value = this.get(key.replace(`${this.prefix}-`, ''))
        if (value?.timestamp) {
          items.push({ key, timestamp: value.timestamp })
        }
      }
    }

    // Nach Alter sortieren und alteste loschen
    items.sort((a, b) => a.timestamp - b.timestamp)
    const toDelete = items.slice(0, Math.ceil(items.length / 2))
    toDelete.forEach(item => this.storage.removeItem(item.key))
  }
}

// Verwendung in der App
const storage = new StorageManager(localStorage, 'bildkonverter')

// Einstellungen speichern
storage.set('theme', 'dark')
storage.set('recentFiles', ['file1.jpg', 'file2.png'])
storage.set('customPresets', [
  { id: 1, name: 'Mein Preset', filters: { brightness: 120 } }
])

// Einstellungen laden
const theme = storage.get('theme', 'light')
const recentFiles = storage.get('recentFiles', [])
```

### 7.5 Clipboard API

```javascript
// Bild in Zwischenablage kopieren
async function copyCanvasToClipboard(canvas) {
  try {
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ])

    return true
  } catch (err) {
    console.error('Kopieren fehlgeschlagen:', err)
    return false
  }
}

// Bild aus Zwischenablage einfugen
async function pasteImageFromClipboard() {
  try {
    const items = await navigator.clipboard.read()

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          return blob
        }
      }
    }

    return null
  } catch (err) {
    console.error('Einfugen fehlgeschlagen:', err)
    return null
  }
}
```

---

## 8. Performance-Optimierung

### 8.1 Canvas-Optimierungen

```javascript
// 1. willReadFrequently fur haufiges Auslesen
const ctx = canvas.getContext('2d', {
  willReadFrequently: true  // Optimiert getImageData()
})

// 2. Offscreen Canvas fur Hintergrundverarbeitung
function processInBackground(imageData) {
  const offscreen = new OffscreenCanvas(
    imageData.width,
    imageData.height
  )
  const ctx = offscreen.getContext('2d')
  ctx.putImageData(imageData, 0, 0)

  // Filter anwenden ohne das sichtbare Canvas zu blockieren
  // ...

  return ctx.getImageData(0, 0, offscreen.width, offscreen.height)
}

// 3. requestAnimationFrame fur flussige Animationen
function animateCanvas() {
  let animationId = null

  function render(timestamp) {
    // Logik nur wenn notig ausfuhren
    if (needsUpdate) {
      draw()
      needsUpdate = false
    }

    animationId = requestAnimationFrame(render)
  }

  // Starten
  animationId = requestAnimationFrame(render)

  // Stoppen
  return () => cancelAnimationFrame(animationId)
}

// 4. Dirty Regions - nur geanderte Bereiche neu zeichnen
function drawDirtyRegions(dirtyRects) {
  dirtyRects.forEach(rect => {
    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    // Nur diesen Bereich neu zeichnen
    drawRegion(rect)

    ctx.restore()
  })
}
```

### 8.2 Vue-Optimierungen

```javascript
// 1. shallowRef fur grosse Objekte
import { shallowRef } from 'vue'

// Statt ref() - keine tiefe Reaktivitat
const largeImageData = shallowRef(null)

// Manuell Trigger bei Anderungen
function updateImageData(newData) {
  largeImageData.value = newData
  triggerRef(largeImageData)
}

// 2. markRaw fur nicht-reaktive Objekte
import { markRaw } from 'vue'

const canvas = markRaw(document.getElementById('canvas'))
const image = markRaw(new Image())

// 3. computed mit Cache
const expensiveComputation = computed(() => {
  // Wird nur bei Anderung der Dependencies neu berechnet
  return heavyCalculation(filters.value)
})

// 4. v-memo fur Listen-Rendering
// In Template:
// <div v-for="item in list" :key="item.id" v-memo="[item.id, item.updated]">
```

### 8.3 Lazy Loading

```javascript
// Router mit Lazy Loading
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue')
  },
  {
    path: '/editor',
    name: 'editor',
    // Mit Webpack Magic Comments
    component: () => import(
      /* webpackChunkName: "editor" */
      './views/EditorView.vue'
    )
  }
]

// Komponenten Lazy Loading
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,  // Zeige Loading erst nach 200ms
  timeout: 10000
})
```

### 8.4 Debouncing und Throttling

```javascript
// Debounce - wartet bis Aktivitat endet
function debounce(fn, delay) {
  let timeoutId = null

  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Throttle - maximal einmal pro Intervall
function throttle(fn, limit) {
  let inThrottle = false

  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Verwendung
const debouncedFilter = debounce((value) => {
  imageStore.setFilter('brightness', value)
}, 100)

const throttledMouseMove = throttle((event) => {
  handleTextDrag(event)
}, 16)  // ~60fps
```

---

## 9. Architekturentscheidungen und Best Practices

### 9.1 Zusammenfassung der Architekturentscheidungen

| Entscheidung | Begrundung |
|--------------|------------|
| **Vue 3 Composition API** | Bessere Code-Organisation, TypeScript-Unterstutzung, wiederverwendbare Composables |
| **Pinia statt Vuex** | Einfachere API, keine Mutations notig, bessere TypeScript-Integration |
| **Canvas-basiertes Rendering** | Direkte Pixelmanipulation, CSS-Filter, Layer-System moglich |
| **Client-Side Processing** | Datenschutz, keine Server-Abhangigkeit, sofortiges Feedback |
| **LocalStorage Persistenz** | Schneller Zugriff, keine Datenbank notig fur Einstellungen |
| **Composables fur Logik** | Wiederverwendbar, testbar, modulare Funktionalitat |

### 9.2 Best Practices

#### Code-Organisation

```
// Gute Struktur fur Composables
composables/
├── useFeature.js       # Hauptlogik
├── useFeature.test.js  # Tests
└── index.js            # Re-exports
```

#### Fehlerbehandlung

```javascript
// Zentrales Error Handling
function handleError(error, context) {
  console.error(`[${context}]`, error)

  // User-freundliche Nachricht anzeigen
  if (window.$toast) {
    window.$toast.error(
      getUserFriendlyMessage(error),
      'Fehler'
    )
  }

  // Optional: Error Tracking
  // errorTracker.capture(error, { context })
}

// In Komponenten
async function loadImage(file) {
  try {
    await imageStore.loadImageFromFile(file)
  } catch (error) {
    handleError(error, 'ImageUpload.loadImage')
  }
}
```

#### Accessibility

```vue
<template>
  <button
    @click="applyFilter"
    :aria-label="t('editor.filters.apply')"
    :aria-pressed="isActive"
    role="button"
  >
    <span class="icon" aria-hidden="true">{{ icon }}</span>
    <span class="sr-only">{{ label }}</span>
  </button>
</template>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
```

---

## 10. Fazit

Bildkonverter Pro demonstriert, wie moderne Web-Technologien zusammenarbeiten konnen, um leistungsstarke Browser-Anwendungen zu erstellen:

### Kernerkenntnisse

1. **Vue 3 Composition API** ermoglicht saubere, wiederverwendbare Logik durch Composables
2. **Pinia** vereinfacht State Management erheblich gegenuber Vuex
3. **Canvas API** bietet machtige Moglichkeiten fur Bildbearbeitung direkt im Browser
4. **Web Audio API** ermoglicht Echtzeit-Audioanalyse und -visualisierung
5. **Moderne Browser-APIs** (File, Blob, Clipboard) machen viele Server-Roundtrips uberflussig

### Weiterführende Ressourcen

- [Vue 3 Dokumentation](https://vuejs.org/guide/introduction.html)
- [Pinia Dokumentation](https://pinia.vuejs.org/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vite Dokumentation](https://vitejs.dev/)

---

*Dieses Dokument wurde fur Entwickler erstellt, die moderne Web-Technologien verstehen und anwenden mochten. Die gezeigten Patterns und Techniken konnen als Referenz fur eigene Projekte dienen.*

**Version:** 1.0.0
**Letzte Aktualisierung:** Januar 2026
**Lizenz:** MIT
