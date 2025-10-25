import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home'
      }
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: {
        title: 'Editor'
      }
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: {
        title: 'Gallery'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: {
        title: 'About'
      }
    }
  ]
})

// Navigation Guard für Titel
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Vue Bildkonverter` : 'Vue Bildkonverter'
  next()
})

export default router
