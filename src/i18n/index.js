import { createI18n } from 'vue-i18n';
import de from './de';
import en from './en';
import { resolveInitialLocale } from '@/utils/localeSeo';

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Startsprache: ?lang=de|en (hreflang-Ziel), dann 'locale' (globale Nav),
 * dann der alte App-Key, sonst Deutsch.
 */
export function initialLocale() {
  return resolveInitialLocale(
    globalThis.location?.search ?? '',
    readStored('locale') || readStored('bildkonverter-locale')
  );
}

/**
 * i18n-Konfiguration – die Übersetzungen liegen je Sprache in de.js und en.js.
 */
const startLocale = initialLocale();
// Speichern, damit die globale Nav (liest 'locale' bei DOMContentLoaded) dieselbe Sprache zeigt
try {
  localStorage.setItem('locale', startLocale);
  localStorage.setItem('bildkonverter-locale', startLocale);
} catch {
  // Speicher gesperrt: Sprache gilt nur für diesen Aufruf
}

export const i18n = createI18n({
  legacy: false,
  locale: startLocale,
  fallbackLocale: 'de',
  messages: {
    de,
    en,
  },
});

export default i18n;
