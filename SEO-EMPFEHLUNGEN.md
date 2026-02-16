# SEO-Empfehlungen: Bildkonverter Pro

Spezifische Empfehlungen fuer technische und inhaltliche SEO-Verbesserungen,
basierend auf der Vue.js/Vite-Architektur des Projekts.

---

## Status-Uebersicht

### Bereits umgesetzt (in diesem Branch)

| Massnahme | Datei(en) | Status |
|---|---|---|
| robots.txt | `public/robots.txt` | Umgesetzt |
| sitemap.xml mit hreflang | `public/sitemap.xml` | Umgesetzt |
| Erweiterte Meta-Tags (OG, Twitter Cards, Canonical) | `index.html` | Umgesetzt |
| Dynamisches SEO-Meta-Management pro Route | `src/composables/useSeoMeta.js`, `src/router/index.js` | Umgesetzt |
| JSON-LD WebApplication Schema | `index.html` | Umgesetzt |
| JSON-LD FAQPage Schema (dynamisch, i18n) | `src/views/HomeView.vue` | Umgesetzt |
| 404-Catch-All-Route mit noindex | `src/router/index.js`, `src/views/NotFoundView.vue` | Umgesetzt |
| Beschreibende Alt-Texte (i18n) | `src/views/HomeView.vue` | Umgesetzt |
| Bild-Dimensionen (width/height) gegen CLS | `src/views/HomeView.vue` | Umgesetzt |
| Kritische Font-Preloads | `index.html` | Umgesetzt |
| hreflang-Tags | `index.html` | Umgesetzt |
| scrollBehavior im Router | `src/router/index.js` | Umgesetzt |
| Meta-Description pro Route | `src/router/index.js` | Umgesetzt |
| theme-color Meta-Tag | `index.html` | Umgesetzt |

---

## 1. Technische SEO-Empfehlungen

### 1.1 Kritisch: Server-Side Rendering (SSR) oder Pre-Rendering

**Problem:** Die App ist eine reine Client-Side-Rendered (CSR) SPA. Suchmaschinen-Crawler,
die kein JavaScript ausfuehren, sehen nur `<div id="app"></div>`. Google rendert JS,
aber mit Verzoegerung (Second Wave Indexing), und andere Crawler (Bing, Yandex,
Social-Media-Previews) haben eingeschraenkte JS-Unterstuetzung.

**Empfehlung (Prioritaet: Hoch):**

**Option A: Pre-Rendering fuer statische Seiten**
```bash
npm install -D vite-plugin-prerender
```
```js
// vite.config.js
import prerender from 'vite-plugin-prerender'

export default defineConfig({
  plugins: [
    vue(),
    prerender({
      routes: ['/', '/editor', '/gallery', '/guide', '/about'],
    })
  ]
})
```
Vorteil: Einfach einzurichten, statische HTML-Dateien fuer Crawler, SPA-Verhalten bleibt.

**Option B: Migration zu Nuxt 3 (SSR/SSG)**
Fuer maximale SEO-Performance. Groesserer Umbau, aber nativer SSR-Support,
automatische Meta-Tag-Verwaltung (`useHead()`), File-based Routing.

**Option C: Dynamisches SSR mit Puppeteer/Rendertron**
Ein Pre-Rendering-Service fuer Crawler-User-Agents auf Nginx-Ebene:
```nginx
location / {
  set $prerender 0;
  if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot") {
    set $prerender 1;
  }
  if ($prerender = 1) {
    proxy_pass http://localhost:3001; # Rendertron-Service
  }
  try_files $uri $uri/ /index.html;
}
```

### 1.2 Nginx-Konfiguration

**Problem:** Die Nginx-Konfiguration ist nicht im Repository enthalten, aber fuer SPA-Routing
und Performance kritisch.

**Empfohlene Nginx-Konfiguration:**
```nginx
server {
    listen 443 ssl http2;
    server_name www.kodinitools.com;
    root /var/www/bildkonverter;

    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache-Steuerung fuer gehashte Assets (aggressive Langzeit-Caches)
    location ~* \.(?:js|css|woff2|png|jpg|jpeg|webp|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML nicht cachen (wichtig fuer SPA-Updates)
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA Fallback: Alle Routen auf index.html
    location /bildkonverter/ {
        try_files $uri $uri/ /bildkonverter/index.html;
    }

    # Komprimierung
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml
               application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;
}
```

### 1.3 Vite-Konfiguration bereinigen

**Problem:** Zwei widersprueuchliche Vite-Konfigurationen existieren:
- `vite.config.js` mit `base: '/bildkonverter/'`
- `vite.config.ts` mit `base: '/bilderseriebearbeiten/'`

**Empfehlung:** Eine der beiden entfernen oder konsolidieren. Die `deploy-check.js` prueft
`vite.config.ts`, aber Vite verwendet standardmaessig `.js` wenn beide vorhanden sind.

### 1.4 Performance-Optimierungen

**a) Font-Optimierung (132 WOFF2-Dateien)**
- Nur tatsaechlich verwendete Schriftarten laden (aktuell 132 Font-Files fuer 13 Familien)
- Kritische Fonts (Supreme Regular/Bold) bereits per `preload` eingebunden (umgesetzt)
- Schriftarten, die nur in spezifischen Komponenten genutzt werden, per dynamischem Import laden

**b) Bild-Optimierung**
```bash
npm install -D vite-imagetools
```
```js
// vite.config.js
import { imagetools } from 'vite-imagetools'

export default defineConfig({
  plugins: [vue(), imagetools()]
})
```
```vue
<!-- Responsive Bilder mit srcset -->
<img
  :src="heroImage"
  :srcset="`${heroImageSmall} 400w, ${heroImageMedium} 800w, ${heroImage} 1200w`"
  sizes="(max-width: 768px) 100vw, 50vw"
  :alt="$t('home.heroAlt')"
  width="500"
  height="333"
  loading="eager"
/>
```

**c) Code-Splitting verbessern**
```js
// vite.config.js - manualChunks optimieren
manualChunks: {
  'vendor': ['vue', 'vue-router', 'pinia'],
  'i18n': ['vue-i18n'],
}
```

**d) Bundle-Groesse analysieren**
```bash
npm install -D rollup-plugin-visualizer
```
```js
import { visualizer } from 'rollup-plugin-visualizer'
// in plugins: visualizer({ open: true, gzipSize: true })
```

### 1.5 Core Web Vitals

| Metrik | Aktueller Status | Empfehlung |
|---|---|---|
| **LCP** (Largest Contentful Paint) | Hero-Image ohne Preload | `<link rel="preload">` fuer Hero-Image, `fetchpriority="high"` |
| **CLS** (Cumulative Layout Shift) | `width`/`height` fehlten | Umgesetzt: Dimensionen hinzugefuegt |
| **INP** (Interaction to Next Paint) | CSS-Animationen blockieren evtl. | `will-change: transform` gezielt einsetzen |

---

## 2. Inhaltliche SEO-Empfehlungen

### 2.1 Seitentitel-Optimierung

**Umgesetzt:** Beschreibende, keyword-reiche Titel pro Route:

| Route | Titel |
|---|---|
| `/` | Kostenlose Bildbearbeitung im Browser - Bildkonverter Pro \| KodiniTools |
| `/editor` | Bild-Editor - Bildkonverter Pro \| KodiniTools |
| `/gallery` | Galerie - Bildkonverter Pro \| KodiniTools |
| `/guide` | Anleitung - Bildkonverter Pro \| KodiniTools |
| `/about` | Ueber uns - Bildkonverter Pro \| KodiniTools |

### 2.2 Meta-Descriptions pro Seite

**Umgesetzt:** Unique, keyword-optimierte Descriptions pro Route (130-160 Zeichen).

**Empfehlung fuer weitere Optimierung:**
- Descriptions regelmaessig A/B-testen ueber Google Search Console
- CTR-Daten analysieren und Descriptions anpassen

### 2.3 Semantische HTML-Struktur

**Aktueller Stand:**
- `<h1>` auf der Startseite vorhanden
- `<h2>` fuer Features und FAQ-Bereich
- `<h3>` fuer Feature-Cards und FAQ-Fragen

**Empfehlung:**
- `<main>` ist in App.vue vorhanden (gut)
- `<section>` Elemente mit ARIA-Labels ergaenzen:
```html
<section class="faq-section" aria-labelledby="faq-heading">
  <h2 id="faq-heading">{{ $t('home.faq.title') }}</h2>
```
- `<nav>` fuer die interne Navigation sicherstellen (AppHeader pruefen)
- `<article>` fuer eigenstaendige Inhaltsbloeocke (Guide-Seite)

### 2.4 Strukturierte Daten erweitern

**Umgesetzt:**
- `WebApplication` Schema in index.html (statisch)
- `FAQPage` Schema auf der Startseite (dynamisch, i18n-reaktiv)

**Empfehlung fuer weitere Schemas:**

**HowTo Schema fuer die Guide-Seite:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Bilder konvertieren mit Bildkonverter Pro",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Bild hochladen",
      "text": "Ziehen Sie ein Bild in den Editor oder klicken Sie auf Hochladen."
    },
    {
      "@type": "HowToStep",
      "name": "Format waehlen und bearbeiten",
      "text": "Waehlen Sie das Zielformat und wenden Sie Filter an."
    },
    {
      "@type": "HowToStep",
      "name": "Herunterladen",
      "text": "Klicken Sie auf Download, um das bearbeitete Bild zu speichern."
    }
  ]
}
```

**BreadcrumbList Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "KodiniTools", "item": "https://www.kodinitools.com" },
    { "@type": "ListItem", "position": 2, "name": "Bildkonverter", "item": "https://www.kodinitools.com/bildkonverter/" }
  ]
}
```

### 2.5 Inhaltliche Erweiterungen

**a) Formatspezifische Landing-Pages (Hohe Prioritaet)**

Neue Routen fuer gezielte Keyword-Abdeckung:
- `/konverter/jpg-zu-png` - "JPG zu PNG konvertieren"
- `/konverter/png-zu-webp` - "PNG zu WebP konvertieren"
- `/konverter/bild-komprimieren` - "Bild komprimieren online"

Diese Seiten koennten als Unterseiten des Editors umgesetzt werden:
```js
{
  path: '/konverter/:conversion',
  name: 'converter',
  component: () => import('@/views/ConverterLandingView.vue'),
  meta: { /* dynamisch basierend auf :conversion */ }
}
```

**b) Blog/Ratgeber-Bereich**
- "Welches Bildformat fuer welchen Zweck?"
- "WebP vs. JPG vs. PNG - Ein Vergleich"
- "Bilder fuer Social Media optimieren - Die richtigen Masse"
- "DSGVO-konforme Bildbearbeitung - Was Sie wissen muessen"

**c) FAQ erweitern**
- Weitere Fragen zu spezifischen Anwendungsfaellen
- Jede FAQ-Frage ist ein potenzielles Featured Snippet in Google

### 2.6 Interne Verlinkung

**Empfehlung:**
- Aus dem Guide auf den Editor verlinken (mit beschreibendem Anchor-Text)
- FAQ-Antworten mit Links zum Editor/Guide anreichern
- Breadcrumb-Navigation einfuehren

### 2.7 URL-basierte Sprachumschaltung

**Aktuell:** Sprache wird per localStorage gesteuert - nicht URL-sichtbar.

**Empfehlung (mittelfristig):**
```
/bildkonverter/       -> Deutsch (Standard)
/bildkonverter/en/    -> Englisch
```

Vorteile:
- Google kann beide Sprachversionen separat crawlen und indexieren
- hreflang-Tags werden aussagekraeftiger
- Nutzer koennen Links in der richtigen Sprache teilen

Umsetzung mit vue-router:
```js
{
  path: '/:locale(de|en)?/',
  children: [
    { path: '', name: 'home', component: HomeView },
    { path: 'editor', name: 'editor', component: EditorView },
    // ...
  ]
}
```

---

## 3. Monitoring & Messung

### 3.1 Google Search Console

- Website-Property einrichten unter `https://www.kodinitools.com/bildkonverter/`
- Sitemap einreichen: `https://www.kodinitools.com/bildkonverter/sitemap.xml`
- Crawling-Fehler ueberwachen
- Core Web Vitals kontrollieren
- Indexierungsstatus pruefen (besonders wichtig bei CSR-SPA)

### 3.2 Empfohlene Tools

| Tool | Zweck |
|---|---|
| Google Search Console | Indexierung, Keywords, Crawl-Fehler |
| Google PageSpeed Insights | Core Web Vitals, Performance |
| Rich Results Test | Strukturierte Daten validieren |
| Schema.org Validator | JSON-LD pruefen |
| Screaming Frog | Technisches SEO-Audit |
| Ahrefs/Semrush | Keyword-Recherche, Backlinks |

### 3.3 KPI-Tracking

| KPI | Ziel |
|---|---|
| Organischer Traffic | Monatliche Steigerung messen |
| Crawled Pages | Alle 5 Routen indexiert |
| Core Web Vitals | Alle Metriken im gruenen Bereich |
| Rich Results | FAQ und WebApplication sichtbar |
| CTR | > 3% fuer Hauptkeywords |

---

## 4. Priorisierte Umsetzungsreihenfolge

### Sofort (bereits umgesetzt)
1. Meta-Tags, OG-Tags, Twitter Cards
2. robots.txt und sitemap.xml
3. Strukturierte Daten (WebApplication, FAQPage)
4. Dynamische Meta-Verwaltung pro Route
5. 404-Fehlerseite
6. Alt-Texte und Bild-Dimensionen
7. Font-Preloading

### Kurzfristig
8. Pre-Rendering einrichten (vite-plugin-prerender)
9. Nginx-Konfiguration optimieren (Caching, Komprimierung, Headers)
10. Vite-Konfigurationen bereinigen (`.js` vs `.ts` Konflikt)
11. Google Search Console einrichten und Sitemap einreichen

### Mittelfristig
12. Bild-Optimierung (vite-imagetools, responsive Bilder)
13. HowTo-Schema auf der Guide-Seite
14. Font-Audit (ungenutzte Fonts entfernen)
15. Bundle-Groesse optimieren

### Langfristig
16. URL-basierte Sprachumschaltung (`/de/`, `/en/`)
17. Formatspezifische Landing-Pages
18. Blog/Ratgeber-Bereich
19. Evaluation SSR/Nuxt-Migration
