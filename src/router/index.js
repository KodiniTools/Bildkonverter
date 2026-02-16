import { createRouter, createWebHistory } from 'vue-router'
import { updateSeoMeta } from '@/composables/useSeoMeta'
import HomeView from '@/views/HomeView.vue'

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
        path: '/editor'
      }
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: {
        title: 'Galerie',
        description: 'Bildergalerie mit bearbeiteten Bildern. Verwalten und vergleichen Sie Ihre konvertierten und bearbeiteten Bilder im Bildkonverter Pro.',
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
        path: '/about'
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

export default router
