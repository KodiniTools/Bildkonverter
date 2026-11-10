/**
 * SEO Meta-Tag Management Composable
 *
 * Aktualisiert dynamisch <title>, <meta> und <link rel="canonical">
 * bei jedem Routenwechsel. Da die App eine CSR-SPA ist, werden die
 * Tags per DOM-Manipulation gesetzt – für Crawler ohne JS-Ausführung
 * bleiben die statischen Werte aus index.html bestehen.
 *
 * Sprachfassungen: Deutsch ohne Parameter, Englisch mit ?lang=en.
 */

import { localeUrls } from '@/utils/localeSeo';
import type { RouteSeoTexts } from '@/types/router';

/** SEO-Felder einer Route (Ausschnitt aus route.meta) */
export interface SeoMeta extends RouteSeoTexts {
  /** URL-Pfad der Route (z. B. '/editor') */
  path?: string;
  /** Englische Texte */
  en?: RouteSeoTexts;
}

const BASE_URL = 'https://kodinitools.com/bildkonverter';
const SITE_NAME = 'KodiniTools';
const DEFAULT_TITLE_SUFFIX = 'Bildkonverter Pro';

/**
 * Setzt oder aktualisiert ein <meta>-Tag im <head>
 */
function setMetaTag(attribute: string, key: string, content: string | undefined): void {
  if (!content) return;
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Setzt oder aktualisiert <link rel="canonical">
 */
function setCanonical(url: string): void {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Setzt oder aktualisiert <link rel="alternate" hreflang="...">
 */
function setAlternate(hreflang: string, url: string): void {
  let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Aktualisiert alle SEO-relevanten Meta-Tags für die aktuelle Route
 * (title wird mit Suffix kombiniert).
 *
 * @param locale - aktive Sprache ('de' | 'en'; alles andere gilt als Deutsch)
 */
export function updateSeoMeta(meta: SeoMeta, locale: string = 'de'): void {
  const lang = locale === 'en' ? 'en' : 'de';
  const texts = lang === 'en' && meta.en ? meta.en : meta;
  const { title, description } = texts;
  const { path = '' } = meta;

  // Title (Produktname je Sprache)
  const suffix = lang === 'en' ? 'Image Converter Pro' : DEFAULT_TITLE_SUFFIX;
  const fullTitle = title ? `${title} - ${suffix} | ${SITE_NAME}` : `${suffix} | ${SITE_NAME}`;
  document.title = fullTitle;

  // Canonical URL (EN = ?lang=en) und hreflang de/en/x-default
  const { canonical: canonicalUrl, alternates } = localeUrls(`${BASE_URL}${path}`, lang);
  setCanonical(canonicalUrl);
  for (const { hreflang, href } of alternates) setAlternate(hreflang, href);
  updateHreflang(lang);

  // Meta Description
  if (description) {
    setMetaTag('name', 'description', description);
  }

  // Open Graph
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:url', canonicalUrl);
  if (description) {
    setMetaTag('property', 'og:description', description);
  }

  // Twitter Card
  setMetaTag('name', 'twitter:title', fullTitle);
  if (description) {
    setMetaTag('name', 'twitter:description', description);
  }
}

/**
 * Setzt die hreflang-Tags basierend auf der aktuellen Sprache
 */
export function updateHreflang(locale: string): void {
  setMetaTag('property', 'og:locale', locale === 'en' ? 'en_US' : 'de_DE');
  document.documentElement.setAttribute('lang', locale);
}
