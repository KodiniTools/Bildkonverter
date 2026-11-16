import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { updateSeoMeta } from '@/composables/useSeoMeta';
import { i18n } from '@/i18n';
import HomeView from '@/views/HomeView.vue';
import {
  formatConversionSeo,
  formatConversions,
  routeSeo,
  type FormatConversion,
} from '@/seo/pages';

export type { FormatConversion };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { ...routeSeo.home },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: { ...routeSeo.editor },
    },
    {
      path: '/batch',
      name: 'batch',
      component: () => import('@/views/BatchView.vue'),
      meta: { ...routeSeo.batch },
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: { ...routeSeo.gallery },
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      meta: { ...routeSeo.guide },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { ...routeSeo.about },
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('@/views/FaqView.vue'),
      meta: { ...routeSeo.faq },
    },
    {
      path: '/download',
      name: 'download',
      component: () => import('@/views/DownloadView.vue'),
      meta: { ...routeSeo.download },
    },
    // Format-spezifische Konvertierungs-Landingpages
    {
      path: '/konvertieren/:pair',
      name: 'format-conversion',
      component: () => import('@/views/FormatConversionView.vue'),
      props: true,
      beforeEnter: (to) => {
        const valid = formatConversions.find((f) => f.pair === to.params.pair);
        if (!valid) return { name: 'home' };
      },
      meta: {
        // Meta wird dynamisch im beforeEach-Guard basierend auf :pair gesetzt
        isDynamic: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { ...routeSeo.notFound },
    },
  ],
});

/** Titel, Beschreibung, Canonical und hreflang einer Route in der aktiven Sprache. */
function applyRouteSeo(route: RouteLocationNormalized): void {
  updateSeoMeta(
    {
      title: route.meta.title,
      description: route.meta.description,
      en: route.meta.en,
      path: route.meta.path || route.path,
    },
    i18n.global.locale.value
  );
}

// Sprachwechsel: Meta-Tags der aktuellen Route neu setzen
watch(
  () => i18n.global.locale.value,
  () => applyRouteSeo(router.currentRoute.value)
);

// Navigation Guard: SEO Meta-Tags bei jedem Routenwechsel aktualisieren
router.beforeEach((to, _from, next) => {
  // Handoff-Redirect: Eingehende Handoffs immer zur Galerie umleiten
  // Prüfe sowohl URL-Parameter als auch localStorage (falls Sender keinen Param setzt)
  if (to.name !== 'gallery') {
    const hasHandoffParam = to.query.handoff === 'kodinitools';
    const hasHandoffData = !!localStorage.getItem('kodinitools-handoff');
    if (hasHandoffParam || hasHandoffData) {
      return next({ name: 'gallery', query: { ...to.query, handoff: 'kodinitools' } });
    }
  }

  // Format-Konvertierungsseiten: Dynamische Meta-Daten generieren
  if (to.name === 'format-conversion' && to.params.pair) {
    const conversion = formatConversions.find((f) => f.pair === to.params.pair);
    if (conversion) Object.assign(to.meta, formatConversionSeo(conversion));
  }

  // SEO-Meta-Tags aktualisieren (Sprache: EN = ?lang=en)
  applyRouteSeo(to);

  // noindex für 404 und andere nicht-indexierbare Seiten
  if (to.meta.noIndex) {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
  } else {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow');
    }
  }

  next();
});

// Exportiere die Format-Konvertierungen für die Sitemap und Landingpages
export { formatConversions };
export default router;
