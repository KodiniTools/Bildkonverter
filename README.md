# 🎨Bildkonverter Pro - Moderne Zweisprachige Vue 3 Anwendung

Eine professionelle Bildbearbeitungs-Anwendung, vollständig neu entwickelt mit **Vue 3**, **Pinia**, **Vue i18n** und modernen Web-Technologien.

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Vue 3 Konzepte Erklärt](#vue-3-konzepte-erklärt)
- [Projektstruktur](#projektstruktur)
- [Installation & Setup](#installation--setup)
- [Architektur](#architektur)
- [Stores (State Management)](#stores-state-management)
- [i18n (Internationalisierung)](#i18n-internationalisierung)
- [Komponenten-System](#komponenten-system)
- [Entwicklung](#entwicklung)
- [Migration von Legacy-Code](#migration-von-legacy-code)

---

## 🎯 Überblick

Diese Anwendung wurde von einer klassischen JavaScript-Anwendung in eine moderne Vue 3 Single Page Application (SPA) umgewandelt. Sie nutzt:

- ✅ **Vue 3** mit Composition API
- ✅ **Pinia** für zentrales State Management
- ✅ **Vue i18n** für Deutsch/Englisch Unterstützung
- ✅ **Vue Router** für Navigation
- ✅ **Vite** als Build-Tool (schneller als Webpack)
- ✅ **SCSS** für strukturiertes Styling

---

## 📚 Vue 3 Konzepte Erklärt

### 1. **Was ist Vue?**

Vue ist ein **progressives JavaScript-Framework** für den Aufbau von Benutzeroberflächen. "Progressiv" bedeutet, dass man mit einfachen Features starten und nach Bedarf erweitern kann.

**Vorteile von Vue:**
- 🚀 Reaktive Daten (Änderungen im State aktualisieren automatisch die UI)
- 🧩 Komponenten-basiert (Wiederverwendbare UI-Bausteine)
- 📦 Klein und performant (ca. 20KB minimiert)
- 📖 Exzellente Dokumentation
- 🎓 Leichte Lernkurve

### 2. **Composition API vs Options API**

Vue bietet zwei Arten, Komponenten zu schreiben:

**Options API (alt):**
```javascript
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
```

**Composition API (neu - wir verwenden das):**
```javascript
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    
    function increment() {
      count.value++
    }
    
    return { count, increment }
  }
}
```

**Warum Composition API?**
- ✅ Bessere TypeScript-Unterstützung
- ✅ Logik kann extrahiert und wiederverwendet werden (Composables)
- ✅ Klarere Organisation bei komplexen Komponenten
- ✅ Bessere Code-Completion in IDEs

### 3. **Script Setup (Noch moderner)**

Wir verwenden `<script setup>`, eine syntaktische Vereinfachung:

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

**Vorteile von Script Setup:**
- 🎯 Weniger Boilerplate-Code
- ⚡ Bessere Performance (zur Compile-Zeit optimiert)
- 🔧 Automatische Registrierung von Komponenten
- 💡 Klarere Intention

### 4. **Reaktivität verstehen**

Vue's Reaktivitätssystem ist das Herzstück:

```javascript
import { ref, reactive, computed, watch } from 'vue'

// ref() für primitive Werte
const count = ref(0)
count.value++ // .value ist nötig im Script

// reactive() für Objekte
const user = reactive({
  name: 'Max',
  age: 25
})
user.name = 'Maria' // kein .value nötig

// computed() für berechnete Werte
const doubleCount = computed(() => count.value * 2)

// watch() um auf Änderungen zu reagieren
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})
```

**Wichtig:**
- `ref()` erfordert `.value` im Script, aber nicht im Template
- `reactive()` funktioniert nur mit Objekten/Arrays
- `computed()` ist gecacht und wird nur neu berechnet wenn Dependencies sich ändern

---

## 🏗️ Projektstruktur

```
vue-bildkonverter/
├── public/                 # Statische Assets (werden nicht verarbeitet)
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/            # Assets die verarbeitet werden (Bilder, Fonts)
│   ├── components/        # Vue-Komponenten
│   │   ├── layout/       # Layout-Komponenten (Header, Footer)
│   │   ├── ui/           # Wiederverwendbare UI-Komponenten (Button, Modal)
│   │   ├── features/     # Feature-spezifische Komponenten
│   │   └── dev/          # Development-Tools (Performance Monitor)
│   ├── composables/       # Wiederverwendbare Composition-Logik
│   ├── i18n/             # Internationalisierung
│   │   └── index.js      # i18n-Konfiguration mit DE/EN Übersetzungen
│   ├── router/           # Vue Router Konfiguration
│   │   └── index.js
│   ├── stores/           # Pinia Stores (State Management)
│   │   ├── imageStore.js
│   │   ├── presetsStore.js
│   │   └── settingsStore.js
│   ├── styles/           # Globale Styles
│   │   ├── variables.scss
│   │   ├── global.scss
│   │   └── main.scss
│   ├── utils/            # Utility-Funktionen
│   │   └── validationUtils.js
│   ├── views/            # Route-Views (Seiten)
│   │   ├── HomeView.vue
│   │   ├── EditorView.vue
│   │   └── SettingsView.vue
│   ├── App.vue           # Root-Komponente
│   └── main.js           # Einstiegspunkt
├── index.html            # HTML-Einstiegspunkt
├── vite.config.js        # Vite-Konfiguration
├── package.json          # Dependencies und Scripts
└── README.md             # Diese Datei
```

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 oder **yarn** >= 1.22.0

### Installation

```bash
# In das Projektverzeichnis wechseln
cd vue-bildkonverter

# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# Für Production bauen
npm run build

# Production-Build preview
npm run preview
```

Die Anwendung läuft standardmäßig auf http://localhost:5173

---

## 🏛️ Architektur

### Single Page Application (SPA)

Eine SPA lädt nur einmal HTML und aktualisiert dann den Inhalt dynamisch über JavaScript:

**Vorteile:**
- ⚡ Schnellere Navigation (kein Reload)
- 🎭 Flüssigere UX mit Transitions
- 📱 App-ähnliches Gefühl
- 🔌 Offline-Fähigkeit möglich

**Nachteile:**
- 🐢 Längere initiale Ladezeit
- 🔍 SEO erfordert SSR (Server-Side Rendering)
- 📦 Größeres Bundle

### Komponenten-Hierarchie

```
App.vue (Root)
├── AppHeader.vue
├── Router View
│   ├── HomeView.vue
│   │   └── ImageUpload.vue
│   └── EditorView.vue
│       ├── ImageCanvas.vue
│       ├── FilterControls.vue
│       ├── FilterPresets.vue
│       ├── TextControls.vue
│       └── ExportControls.vue
├── ToastContainer.vue
└── KeyboardShortcuts.vue
```

---

## 📦 Stores (State Management)

### Was ist Pinia?

**Pinia** ist der offizielle State Management für Vue 3 (Nachfolger von Vuex).

**State Management löst:**
- 🔄 Props-Drilling (Daten durch viele Komponenten reichen)
- 🎯 Zentraler State (Single Source of Truth)
- 🔍 Besseres Debugging
- ⏱️ Time-Travel Debugging

### Store-Struktur

**1. imageStore.js - Verwaltet Bildbearbeitung**

```javascript
export const useImageStore = defineStore('image', () => {
  // STATE - Reaktive Daten
  const filters = reactive({
    brightness: 100,
    contrast: 100,
    // ...
  })
  
  // COMPUTED - Berechnete Werte
  const hasImage = computed(() => workingUrl.value !== null)
  
  // ACTIONS - Methoden die State ändern
  function setFilter(filterName, value) {
    filters[filterName] = value
    draw()
  }
  
  return { filters, hasImage, setFilter }
})
```

**Verwendung in Komponenten:**

```vue
<script setup>
import { useImageStore } from '@/stores/imageStore'

const imageStore = useImageStore()

// State lesen
console.log(imageStore.filters.brightness)

// Computed verwenden
if (imageStore.hasImage) {
  // ...
}

// Actions aufrufen
imageStore.setFilter('brightness', 120)
</script>
```

**2. presetsStore.js - Verwaltet Filter-Presets**

- Standard-Presets (nicht löschbar)
- Custom-Presets (benutzerdefiniert)
- Import/Export-Funktionalität
- LocalStorage-Persistierung

**3. settingsStore.js - App-Einstellungen**

- Theme (Light/Dark/Auto)
- Sprache (DE/EN)
- Performance-Modi
- Export-Einstellungen
- UI-Präferenzen

### Store Best Practices

✅ **DO:**
- Stores für globalen State verwenden
- Actions für State-Mutationen
- Computed für abgeleitete Werte
- Stores modular halten (nach Feature)

❌ **DON'T:**
- Lokalen Komponenten-State in Stores
- State direkt mutieren (immer über Actions)
- Zu viele kleine Stores (Balance finden)

---

## 🌍 i18n (Internationalisierung)

### Vue i18n Setup

**Konfiguration (src/i18n/index.js):**

```javascript
import { createI18n } from 'vue-i18n'

const messages = {
  de: {
    app: {
      title: 'Bildkonverter Pro'
    },
    common: {
      save: 'Speichern'
    }
  },
  en: {
    app: {
      title: 'Image Converter Pro'
    },
    common: {
      save: 'Save'
    }
  }
}

export const i18n = createI18n({
  legacy: false,          // Composition API verwenden
  locale: 'de',           // Standard-Sprache
  fallbackLocale: 'de',   // Fallback wenn Übersetzung fehlt
  messages
})
```

### Verwendung in Komponenten

**Im Template:**

```vue
<template>
  <h1>{{ $t('app.title') }}</h1>
  <button>{{ $t('common.save') }}</button>
  
  <!-- Mit Variablen -->
  <p>{{ $t('greeting', { name: 'Max' }) }}</p>
</template>
```

**Im Script:**

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

console.log(t('app.title'))

// Sprache ändern
locale.value = 'en'
</script>
```

### i18n Features

**1. Pluralisierung:**

```javascript
messages: {
  de: {
    items: 'kein Element | ein Element | {count} Elemente'
  }
}

// Verwendung:
{{ $t('items', 0) }}  // "kein Element"
{{ $t('items', 1) }}  // "ein Element"
{{ $t('items', 5) }}  // "5 Elemente"
```

**2. Datums-/Zahlenformatierung:**

```javascript
// Konfiguration
numberFormats: {
  de: {
    currency: {
      style: 'currency',
      currency: 'EUR'
    }
  }
}

// Verwendung:
{{ $n(1234.56, 'currency') }}  // "1.234,56 €"
```

---

## 🧩 Komponenten-System

### Anatomie einer Vue-Komponente

```vue
<!-- TEMPLATE - HTML mit Vue-Syntax -->
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">
      {{ $t('common.save') }}
    </button>
  </div>
</template>

<!-- SCRIPT - Logik -->
<script setup>
import { ref, computed, onMounted } from 'vue'

// Props (von Parent empfangen)
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

// Emits (Events an Parent senden)
const emit = defineEmits(['save', 'cancel'])

// State
const count = ref(0)

// Computed
const doubleCount = computed(() => count.value * 2)

// Methods
function handleClick() {
  emit('save', count.value)
}

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
})
</script>

<!-- STYLE - CSS/SCSS -->
<style lang="scss" scoped>
.my-component {
  padding: 1rem;
  
  h1 {
    color: var(--color-primary);
  }
}
</style>
```

### Props und Events

**Parent → Child (Props):**

```vue
<!-- Parent -->
<MyComponent title="Hello" :count="10" />

<!-- Child -->
<script setup>
const props = defineProps({
  title: String,
  count: Number
})
</script>
```

**Child → Parent (Events):**

```vue
<!-- Child -->
<script setup>
const emit = defineEmits(['save'])

function handleSave() {
  emit('save', { id: 1, name: 'Test' })
}
</script>

<!-- Parent -->
<MyComponent @save="onSave" />

<script setup>
function onSave(data) {
  console.log(data)
}
</script>
```

### Composables (Wiederverwendbare Logik)

Composables sind Funktionen die Composition API verwenden und extrahiert werden können:

```javascript
// composables/useCanvas.js
import { ref, onMounted } from 'vue'

export function useCanvas() {
  const canvas = ref(null)
  const ctx = ref(null)
  
  onMounted(() => {
    if (canvas.value) {
      ctx.value = canvas.value.getContext('2d')
    }
  })
  
  function drawRect(x, y, width, height) {
    ctx.value.fillRect(x, y, width, height)
  }
  
  return {
    canvas,
    ctx,
    drawRect
  }
}

// Verwendung in Komponenten:
import { useCanvas } from '@/composables/useCanvas'

const { canvas, drawRect } = useCanvas()
```

---

## 🔧 Entwicklung

### Development Scripts

```bash
# Development-Server (Hot Reload)
npm run dev

# Linting (Code-Qualität prüfen)
npm run lint

# Formatierung (Prettier)
npm run format

# Production Build
npm run build

# Production Preview
npm run preview
```

### Environment Variables

Erstelle `.env.local` für lokale Variablen:

```env
VITE_APP_VERSION=3.0.0
VITE_API_URL=https://api.example.com
```

Verwendung:

```javascript
console.log(import.meta.env.VITE_APP_VERSION)
```

### Debugging

**Vue DevTools:**
- Chrome/Firefox Extension installieren
- Inspect Components, Pinia Stores, Router
- Time-Travel Debugging

**Console Logging:**

```javascript
import { watch } from 'vue'

watch(myRef, (newVal, oldVal) => {
  console.log('Changed:', oldVal, '→', newVal)
})
```

---

## 🔄 Migration von Legacy-Code

### Schritt-für-Schritt Migration

**1. ImageConverter Klasse → imageStore:**

```javascript
// ALT (imageConverter.js)
class ImageConverter {
  constructor() {
    this.filters = { brightness: 100 }
  }
  
  setFilter(name, value) {
    this.filters[name] = value
  }
}

// NEU (imageStore.js)
export const useImageStore = defineStore('image', () => {
  const filters = reactive({ brightness: 100 })
  
  function setFilter(name, value) {
    filters[name] = value
  }
  
  return { filters, setFilter }
})
```

**2. Event Listeners → Composables:**

```javascript
// ALT
window.addEventListener('keydown', handleKeydown)

// NEU (composables/useKeyboard.js)
export function useKeyboard() {
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
```

**3. DOM Manipulation → Reactive State:**

```javascript
// ALT
document.getElementById('brightness').value = 120

// NEU
const brightness = ref(120)

// Im Template:
<input v-model="brightness" type="range">
```

### Integration bestehender Module

**validationUtils.js** kann direkt verwendet werden:

```javascript
import { ValidationUtils } from '@/utils/validationUtils'

const validation = ValidationUtils.validateImageFile(file)
if (!validation.isValid) {
  console.error(validation.errors)
}
```

---

## 📝 Best Practices

### Komponenten

- ✅ Kleine, fokussierte Komponenten
- ✅ Props für Daten, Events für Kommunikation
- ✅ Scoped Styles verwenden
- ✅ Klare Prop-Types definieren

### State Management

- ✅ Stores für globalen State
- ✅ ref/reactive für lokalen State
- ✅ Actions für asynchrone Operationen
- ✅ Computed für abgeleitete Daten

### Performance

- ✅ `v-show` statt `v-if` für häufige Toggles
- ✅ Computed caching nutzen
- ✅ Große Listen virtualisieren
- ✅ Code-Splitting mit Lazy Loading

---

## 🎓 Lernressourcen

### Vue 3

- [Vue 3 Dokumentation](https://vuejs.org/)
- [Vue Mastery](https://www.vuemastery.com/)
- [Vue School](https://vueschool.io/)

### Pinia

- [Pinia Dokumentation](https://pinia.vuejs.org/)

### Vue i18n

- [Vue i18n Dokumentation](https://vue-i18n.intlify.dev/)

---

## 🤝 Nächste Schritte

1. **Komponenten erstellen:**
   - ImageCanvas.vue
   - FilterControls.vue
   - FilterPresets.vue
   - TextControls.vue
   - ExportControls.vue

2. **Composables entwickeln:**
   - useCanvas.js
   - useKeyboard.js
   - useToast.js
   - useHistory.js (Undo/Redo)

3. **Views vervollständigen:**
   - EditorView.vue
   - SettingsView.vue
   - AboutView.vue

4. **Tests schreiben:**
   - Unit Tests (Vitest)
   - Component Tests (Vue Test Utils)
   - E2E Tests (Playwright/Cypress)

---
## Author: Dinko Ramić - Kodini Tools - kodinitools.com

## 💡 Tipps für Einsteiger

### Reactivity verstehen

```javascript
// ❌ FALSCH
const user = { name: 'Max' }
user.name = 'Maria' // Nicht reaktiv!

// ✅ RICHTIG
const user = reactive({ name: 'Max' })
user.name = 'Maria' // Reaktiv!

// ✅ AUCH RICHTIG
const name = ref('Max')
name.value = 'Maria' // Reaktiv!
```

### Template Syntax

```vue
<template>
  <!-- Textinterpolation -->
  {{ message }}
  
  <!-- Attribute binden -->
  <img :src="imageUrl">
  <div :class="{ active: isActive }">
  
  <!-- Event Listener -->
  <button @click="handleClick">
  <input @input="handleInput">
  
  <!-- Two-Way Binding -->
  <input v-model="text">
  
  <!-- Conditions -->
  <div v-if="isVisible">Visible</div>
  <div v-else>Hidden</div>
  
  <!-- Loops -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### Lifecycle Hooks

```javascript
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  console.log('Component mounted')
})

onUpdated(() => {
  console.log('Component updated')
})

onUnmounted(() => {
  console.log('Component unmounted - cleanup here')
})
```

---

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei für Details

---

## 🙋 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Dokumentation konsultieren
- Community-Forum besuchen

**Viel Erfolg mit Vue 3! 🚀**
