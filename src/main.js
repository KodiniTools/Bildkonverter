import '@/assets/fonts/fonts.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import i18n from './i18n';

// Globale Styles
import './styles/main.scss';
import { logger } from '@/utils/logger';

/**
 * Vue App Initialisierung
 */
const app = createApp(App);

// Plugins
app.use(createPinia());
app.use(router);
app.use(i18n);

// Globale Fehlerbehandlung
app.config.errorHandler = (err, instance, info) => {
  logger.error('❌ Vue Error:', err);
  logger.error('Component:', instance);
  logger.error('Info:', info);
};

// Globale Warn-Handler (nur in Development)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    logger.warn('⚠️ Vue Warning:', msg);
    logger.warn('Trace:', trace);
  };
}

// Performance Monitoring (nur in Development)
if (import.meta.env.DEV) {
  app.config.performance = true;
}

// Mount App
app.mount('#app');

logger.log('✅ Vue Bildkonverter Pro erfolgreich geladen');
logger.log('🔧 Environment:', import.meta.env.MODE);
logger.log('📦 Version:', import.meta.env.VITE_APP_VERSION || '3.0.0');
