import { createRouter, createWebHistory } from 'vue-router'
import { useHead } from '@/composables/useHead'
import HomeView from '@/views/HomeView.vue'

/**
 * Definiert die unterstützten Konvertierungs-Kombinationen für format-spezifische Landingpages.
 * Jeder Eintrag erzeugt eine eigene Route unter /konvertieren/:pair.
 */
const formatConversions = [
  { pair: 'heic-zu-jpg', from: 'HEIC', to: 'JPG' },
  { pair: 'png-zu-webp', from: 'PNG', to: 'WebP' },
  { pair: 'jpg-zu-webp', from: 'JPG', to: 'WebP' },
  { pair: 'webp-zu-png', from: 'WebP', to: 'PNG' },
  { pair: 'jpg-zu-png', from: 'JPG', to: 'PNG' },
  { pair: 'png-zu-jpg', from: 'PNG', to: 'JPG' },
  { pair: 'tiff-zu-jpg', from: 'TIFF', to: 'JPG' },
  { pair: 'bmp-zu-webp', from: 'BMP', to: 'WebP' },
  { pair: 'gif-zu-webp', from: 'GIF', to: 'WebP' },
  { pair: 'heic-zu-png', from: 'HEIC', to: 'PNG' },
  { pair: 'webp-zu-jpg', from: 'WebP', to: 'JPG' },
  { pair: 'svg-zu-png', from: 'SVG', to: 'PNG' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Kodini Bildkonverter – Bilder kostenlos online umwandeln | KodiniTools',
        description: 'Kostenloser Online-Bildkonverter: Bilder umwandeln zwischen PNG, JPG, WebP, HEIC, TIFF, GIF und PDF. Schnelle Konvertierung direkt im Browser – sicher und DSGVO-konform.',
        keywords: 'Bildkonverter, Bild umwandeln, PNG zu WebP, HEIC zu JPG, Online Bildbearbeitung, Batch Bildkonverter, Bilder komprimieren'
      }
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: {
        title: 'Bild bearbeiten – Online Editor | Kodini Bildkonverter',
        description: 'Bilder online bearbeiten: Filter, Zuschneiden, Drehen, Komprimieren und in verschiedene Formate konvertieren. Kostenlos und ohne Anmeldung.',
        keywords: 'Bild bearbeiten online, Bildeditor, Filter anwenden, Bild zuschneiden, Bild drehen'
      }
    },
    {
      path: '/batch',
      name: 'batch',
      component: () => import('@/views/BatchView.vue'),
      meta: {
        title: 'Batch Bildkonverter – Mehrere Bilder gleichzeitig umwandeln | KodiniTools',
        description: 'Hunderte Bilder gleichzeitig konvertieren: Wählen Sie Zielformat, Qualität und Größe. Batch-Verarbeitung für PNG, JPG, WebP und mehr – schnell und kostenlos.',
        keywords: 'Batch Bildkonverter, mehrere Bilder konvertieren, Massenkonvertierung, Bilder gleichzeitig umwandeln'
      }
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: {
        title: 'Bildergalerie – Bilder verwalten | Kodini Bildkonverter',
        description: 'Verwalten Sie Ihre Bilder in der Galerie: Hochladen, Vorschau, Bearbeiten und Herunterladen. Erstellen Sie Collagen aus mehreren Bildern.',
        keywords: 'Bildergalerie, Bilder verwalten, Fotocollage erstellen, Bilder herunterladen'
      }
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      meta: {
        title: 'Anleitung – So nutzen Sie den Bildkonverter | KodiniTools',
        description: 'Schritt-für-Schritt-Anleitung für den Kodini Bildkonverter: Bilder hochladen, bearbeiten, konvertieren und herunterladen. Alle Funktionen erklärt.',
        keywords: 'Bildkonverter Anleitung, Bilder konvertieren Anleitung, WebP Anleitung, Bildbearbeitung Tutorial'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: {
        title: 'Über uns – Kodini Bildkonverter | KodiniTools',
        description: 'Erfahren Sie mehr über den Kodini Bildkonverter: Unsere Mission, Technologie und Datenschutz-Standards. Kostenlose Bildbearbeitung, DSGVO-konform.',
        keywords: 'Kodini Bildkonverter, KodiniTools, Über uns, Datenschutz Bildkonverter'
      }
    },
    // Format-spezifische Konvertierungs-Landingpages
    {
      path: '/konvertieren/:pair',
      name: 'format-conversion',
      component: () => import('@/views/FormatConversionView.vue'),
      props: true,
      beforeEnter: (to) => {
        const valid = formatConversions.find(f => f.pair === to.params.pair)
        if (!valid) return { name: 'home' }
      },
      meta: {
        // Meta wird dynamisch im beforeEach-Guard basierend auf :pair gesetzt
        isDynamic: true
      }
    }
  ]
})

// Navigation Guard für dynamische Meta-Tags
router.beforeEach((to, from, next) => {
  // Format-Konvertierungsseiten: Dynamische Meta-Daten generieren
  if (to.name === 'format-conversion' && to.params.pair) {
    const conversion = formatConversions.find(f => f.pair === to.params.pair)
    if (conversion) {
      const { from: srcFormat, to: destFormat, pair } = conversion
      to.meta.title = `${srcFormat} in ${destFormat} umwandeln – Schnell & Kostenlos | KodiniTools`
      to.meta.description = `${srcFormat} Dateien kostenlos in ${destFormat} konvertieren. Schnelle Umwandlung direkt im Browser, ohne Upload. Perfekt für Web-Optimierung und Kompatibilität.`
      to.meta.keywords = `${srcFormat} zu ${destFormat}, ${srcFormat} in ${destFormat} umwandeln, ${srcFormat} konvertieren, ${pair} Konverter, Bildformat ändern`
    }
  }

  // SEO-Meta-Tags aktualisieren via useHead Composable
  useHead(to.meta, to.path)

  next()
})

// Exportiere die Format-Konvertierungen für die Sitemap und Landingpages
export { formatConversions }
export default router
