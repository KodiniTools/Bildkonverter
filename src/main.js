import '@/assets/fonts/fonts.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Globale Styles
import './styles/main.scss'

// Font Awesome (optional - kann auch über CDN eingebunden werden)
// import '@fortawesome/fontawesome-free/css/all.css'

/**
 * Vue App Initialisierung
 */
const app = createApp(App)

// Plugins
app.use(createPinia())
app.use(router)
app.use(i18n)

// Globale Fehlerbehandlung
app.config.errorHandler = (err, instance, info) => {
  console.error('❌ Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// Globale Warn-Handler (nur in Development)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('⚠️ Vue Warning:', msg)
    console.warn('Trace:', trace)
  }
}

// Performance Monitoring (nur in Development)
if (import.meta.env.DEV) {
  app.config.performance = true
}

// Mount App
app.mount('#app')

console.log('✅ Vue Bildkonverter Pro erfolgreich geladen')
console.log('🔧 Environment:', import.meta.env.MODE)
console.log('📦 Version:', import.meta.env.VITE_APP_VERSION || '3.0.0')
