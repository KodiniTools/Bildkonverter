import { createRouter, createWebHistory } from 'vue-router'
import { updateSeoMeta } from '@/composables/useSeoMeta'
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
  { pair: 'svg-zu-png', from: 'SVG', to: 'PNG' },
  { pair: 'jpg-zu-pdf', from: 'JPG', to: 'PDF' },
  { pair: 'png-zu-svg', from: 'PNG', to: 'SVG' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Kostenlose Bildbearbeitung im Browser',
        description: 'Kostenloser Online-Bildkonverter: Bilder konvertieren, bearbeiten, komprimieren und zuschneiden direkt im Browser. Unterstützt JPG, PNG, WebP, TIFF, GIF, HEIF und PDF. DSGVO-konform.',
        keywords: 'Bildkonverter, Bild umwandeln, PNG zu WebP, HEIC zu JPG, Online Bildbearbeitung, Batch Bildkonverter, Bilder komprimieren',
        path: '/'
      }
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: {
        title: 'Bild-Editor',
        description: 'Online Bild-Editor: Bilder bearbeiten mit Filtern, Effekten, Helligkeit, Kontrast und Sättigung. Formate konvertieren zwischen JPG, PNG, WebP, TIFF, GIF und PDF. Kostenlos im Browser.',
        keywords: 'Bild bearbeiten online, Bildeditor, Filter anwenden, Bild zuschneiden, Bild drehen',
        path: '/editor'
      }
    },
    {
      path: '/batch',
      name: 'batch',
      component: () => import('@/views/BatchView.vue'),
      meta: {
        title: 'Batch Bildkonverter – Mehrere Bilder gleichzeitig umwandeln',
        description: 'Hunderte Bilder gleichzeitig konvertieren: Wählen Sie Zielformat, Qualität und Größe. Batch-Verarbeitung für PNG, JPG, WebP und mehr – schnell und kostenlos.',
        keywords: 'Batch Bildkonverter, mehrere Bilder konvertieren, Massenkonvertierung, Bilder gleichzeitig umwandeln',
        path: '/batch'
      }
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: {
        title: 'Galerie',
        description: 'Bildergalerie mit bearbeiteten Bildern. Verwalten und vergleichen Sie Ihre konvertierten und bearbeiteten Bilder im Bildkonverter Pro.',
        keywords: 'Bildergalerie, Bilder verwalten, Fotocollage erstellen, Bilder herunterladen',
        path: '/gallery'
      }
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      meta: {
        title: 'Anleitung',
        description: 'Schritt-für-Schritt-Anleitung zum Bildkonverter Pro: Bilder hochladen, bearbeiten, konvertieren und exportieren. Tipps zu Filtern, Zuschneiden und Formatwahl.',
        keywords: 'Bildkonverter Anleitung, Bilder konvertieren Anleitung, WebP Anleitung, Bildbearbeitung Tutorial',
        path: '/guide'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: {
        title: 'Über uns',
        description: 'Über Bildkonverter Pro von KodiniTools: Datenschutz-fokussierte Bildbearbeitung mit lokaler Verarbeitung im Browser. Server in Deutschland, DSGVO-konform.',
        keywords: 'Kodini Bildkonverter, KodiniTools, Über uns, Datenschutz Bildkonverter',
        path: '/about'
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
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: 'Seite nicht gefunden',
        description: 'Die angeforderte Seite wurde nicht gefunden.',
        noIndex: true,
        path: '/404'
      }
    }
  ]
})

// Navigation Guard: SEO Meta-Tags bei jedem Routenwechsel aktualisieren
router.beforeEach((to, from, next) => {
  // Format-Konvertierungsseiten: Dynamische Meta-Daten generieren
  if (to.name === 'format-conversion' && to.params.pair) {
    const conversion = formatConversions.find(f => f.pair === to.params.pair)
    if (conversion) {
      const { from: srcFormat, to: destFormat, pair } = conversion
      to.meta.title = `${srcFormat} in ${destFormat} umwandeln – Schnell & Kostenlos`
      to.meta.description = `${srcFormat} Dateien kostenlos in ${destFormat} konvertieren. Schnelle Umwandlung direkt im Browser, ohne Upload. Perfekt für Web-Optimierung und Kompatibilität.`
      to.meta.keywords = `${srcFormat} zu ${destFormat}, ${srcFormat} in ${destFormat} umwandeln, ${srcFormat} konvertieren, ${pair} Konverter, Bildformat ändern`
      to.meta.path = `/konvertieren/${pair}`
    }
  }

  // SEO-Meta-Tags aktualisieren
  updateSeoMeta({
    title: to.meta.title,
    description: to.meta.description,
    path: to.meta.path || to.path
  })

  // noindex für 404 und andere nicht-indexierbare Seiten
  if (to.meta.noIndex) {
    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow')
  } else {
    const robotsMeta = document.querySelector('meta[name="robots"]')
    if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow')
    }
  }

  next()
})

// Exportiere die Format-Konvertierungen für die Sitemap und Landingpages
export { formatConversions }
export default router
