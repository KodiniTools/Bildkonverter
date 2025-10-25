# 🚀 Quick Start Guide - Vue Bildkonverter

## ⚡ Schnellstart in 3 Schritten

### 1️⃣ Installation

```bash
cd vue-bildkonverter
npm install
```

**Das installiert:**
- Vue 3
- Pinia (State Management)
- Vue Router
- Vue i18n (Internationalisierung)
- Vite (Build Tool)
- SCSS Support
- @vueuse/core (Vue Utilities)

**Installationsdauer:** ~2-3 Minuten

---

### 2️⃣ Development-Server starten

```bash
npm run dev
```

**Der Server startet auf:** http://localhost:5173

**Features:**
- ⚡ Hot Module Replacement (HMR)
- 🔥 Instant Updates
- 🎯 Source Maps
- 📦 Optimierte Bundle-Größe

---

### 3️⃣ Im Browser öffnen

1. Browser öffnen
2. Zu `http://localhost:5173` navigieren
3. Fertig! Die App läuft

---

## 📚 Wichtige Konzepte für Einsteiger

### Vue Composition API verstehen

**Basis-Beispiel:**
```vue
<script setup>
import { ref } from 'vue'

// Reaktive Variable erstellen
const count = ref(0)

// Funktion definieren
function increment() {
  count.value++ // .value ist wichtig im Script!
}
</script>

<template>
  <!-- Im Template kein .value nötig -->
  <button @click="increment">
    Count: {{ count }}
  </button>
</template>
```

---

### Pinia Store verwenden

**1. Store importieren:**
```javascript
import { useImageStore } from '@/stores/imageStore'
```

**2. Store in Komponente nutzen:**
```javascript
const imageStore = useImageStore()

// State lesen
console.log(imageStore.filters.brightness)

// State ändern via Action
imageStore.setFilter('brightness', 120)
```

---

### i18n (Übersetzungen) verwenden

**Im Template:**
```vue
<template>
  <h1>{{ $t('app.title') }}</h1>
  <button>{{ $t('common.save') }}</button>
</template>
```

**Im Script:**
```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

console.log(t('app.title'))
locale.value = 'en' // Sprache ändern
</script>
```

---

## 🎯 Erste Schritte im Code

### 1. Neue Komponente erstellen

```bash
# Erstelle neue Komponente
touch src/components/features/MeineKomponente.vue
```

**Komponenten-Template:**
```vue
<template>
  <div class="meine-komponente">
    <h2>{{ title }}</h2>
    <p>{{ $t('common.loading') }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props definieren
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

// State
const data = ref([])

// Methods
function loadData() {
  // Daten laden...
}
</script>

<style lang="scss" scoped>
.meine-komponente {
  padding: var(--spacing-md);
  
  h2 {
    color: var(--color-primary);
  }
}
</style>
```

---

### 2. Komponente in View verwenden

```vue
<template>
  <div>
    <MeineKomponente title="Hallo Welt" />
  </div>
</template>

<script setup>
import MeineKomponente from '@/components/features/MeineKomponente.vue'
</script>
```

---

### 3. Neue Übersetzung hinzufügen

**Datei:** `src/i18n/index.js`

```javascript
const de = {
  // ... existierende Übersetzungen
  meinBereich: {
    titel: 'Mein Titel',
    beschreibung: 'Meine Beschreibung'
  }
}

const en = {
  // ... existierende Übersetzungen
  meinBereich: {
    titel: 'My Title',
    beschreibung: 'My Description'
  }
}
```

**Verwendung:**
```vue
<template>
  <h1>{{ $t('meinBereich.titel') }}</h1>
</template>
```

---

## 🔧 Verfügbare Scripts

```bash
# Development-Server
npm run dev

# Production Build
npm run build

# Production Preview
npm run preview

# Linting
npm run lint

# Code formatieren
npm run format
```

---

## 📁 Projekt-Struktur verstehen

```
src/
├── components/     # Vue-Komponenten
│   ├── features/  # Feature-spezifisch
│   ├── layout/    # Layout (Header, Footer)
│   └── ui/        # Wiederverwendbar (Button, Modal)
├── composables/   # Wiederverwendbare Logik
├── stores/        # Pinia Stores
├── views/         # Route-Views (Seiten)
├── router/        # Vue Router
├── i18n/          # Übersetzungen
├── styles/        # SCSS Styles
├── utils/         # Utility-Funktionen
└── main.js        # App-Einstieg
```

---

## 🎨 Styling-System

### CSS Variables verwenden

```scss
.my-element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}
```

### SCSS Variables verwenden

```scss
@import '@/styles/variables.scss';

.my-element {
  color: $color-primary;
  padding: $spacing-md;
  
  @include respond-to('md') {
    padding: $spacing-sm;
  }
}
```

### Utility Classes

```html
<div class="flex-center gap-md">
  <button class="btn btn-primary">Primary</button>
  <button class="btn btn-secondary">Secondary</button>
</div>
```

---

## 🐛 Debugging

### Vue DevTools

1. Vue DevTools Extension installieren (Chrome/Firefox)
2. F12 drücken → "Vue" Tab
3. Components, Pinia, Router inspizieren

### Console Logging

```javascript
import { watch } from 'vue'

watch(myRef, (newVal) => {
  console.log('Wert geändert:', newVal)
})
```

### Performance Monitoring

```bash
# Im Development-Modus automatisch aktiviert
npm run dev
```

---

## 💡 Häufige Anfängerfehler

### ❌ FALSCH: .value vergessen

```javascript
const count = ref(0)
count++ // FEHLER!
```

### ✅ RICHTIG:

```javascript
const count = ref(0)
count.value++ // Korrekt!
```

---

### ❌ FALSCH: Nicht-reaktives Objekt

```javascript
const user = { name: 'Max' }
user.name = 'Maria' // Nicht reaktiv!
```

### ✅ RICHTIG:

```javascript
const user = reactive({ name: 'Max' })
user.name = 'Maria' // Reaktiv!
```

---

### ❌ FALSCH: Props direkt mutieren

```javascript
const props = defineProps(['title'])
props.title = 'Neu' // FEHLER!
```

### ✅ RICHTIG:

```javascript
const props = defineProps(['title'])
const localTitle = ref(props.title)
localTitle.value = 'Neu' // Korrekt!
```

---

## 🎓 Lernressourcen

### Dokumentation
- [Vue 3 Docs](https://vuejs.org/) - Offizielle Dokumentation
- [Pinia Docs](https://pinia.vuejs.org/) - State Management
- [Vue i18n Docs](https://vue-i18n.intlify.dev/) - Internationalisierung
- [Vite Docs](https://vitejs.dev/) - Build Tool

### Video-Tutorials
- [Vue Mastery](https://www.vuemastery.com/)
- [Vue School](https://vueschool.io/)

### Interaktive Tutorials
- [Vue.js Tutorial](https://vuejs.org/tutorial/)

---

## 🆘 Hilfe bekommen

### Probleme beim Start?

**1. Node.js Version prüfen:**
```bash
node --version  # Sollte >= 18.0.0 sein
```

**2. Dependencies neu installieren:**
```bash
rm -rf node_modules
npm install
```

**3. Cache leeren:**
```bash
rm -rf node_modules/.vite
npm run dev
```

### Häufige Fehler

**Port bereits in Verwendung:**
```bash
# Anderen Port verwenden
npm run dev -- --port 3000
```

**Module nicht gefunden:**
```bash
# Dependencies installieren
npm install
```

---

## 🎯 Nächste Schritte

Nach dem Quick Start:

1. **README.md lesen** - Vollständige Konzepterklärungen
2. **PROJECT_STRUCTURE.md ansehen** - Projektübersicht
3. **Erste Komponente erstellen** - Learning by doing
4. **Store verwenden** - State Management verstehen
5. **i18n testen** - Sprache wechseln

---

## ✨ Viel Erfolg!

Du hast jetzt alles, was du brauchst, um mit Vue 3 zu starten. 

**Happy Coding! 🚀**
