import { createI18n } from 'vue-i18n';
import de from './de';
import en from './en';

/**
 * i18n-Konfiguration – die Übersetzungen liegen je Sprache in de.js und en.js.
 */
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('bildkonverter-locale') || 'de',
  fallbackLocale: 'de',
  messages: {
    de,
    en,
  },
});

export default i18n;
