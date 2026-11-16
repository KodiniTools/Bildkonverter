/**
 * Erzeugt aus der gebauten index.html pro Seite und Sprache eine eigene HTML-Datei
 * mit passendem <html lang>, <title>, Description, Canonical, hreflang und
 * Open-Graph/Twitter-Tags. nginx liefert diese Dateien aus (siehe DEPLOYMENT.md),
 * damit Crawler ohne JavaScript unter ?lang=en schon den englischen Head sehen.
 * Der Body bleibt unverändert (SPA, SSI-Partials).
 *
 * Reine String-Verarbeitung ohne DOM, damit vite.config.ts die Datei im Build nutzen kann.
 * Jeder Ersatz prüft, dass sein Tag genau einmal vorkommt – fehlt eins, bricht der Build ab,
 * statt still ein unvollständiges HTML auszuliefern.
 */
import { localeUrls, type Locale } from '../utils/localeSeo';
import { SEO_BASE_URL, indexablePages, seoFullTitle, seoTexts, type PageSeo } from './pages';

/** Unterordner im Build-Ergebnis (dist/_seo/<lang>/<seite>.html). */
export const SEO_DIR = '_seo';
export const SEO_LOCALES: readonly Locale[] = ['de', 'en'];

export interface PrerenderedFile {
  /** Pfad relativ zum Build-Ordner, z. B. '_seo/en/editor.html'. */
  file: string;
  html: string;
}

/** Dateiname einer Seite: '/' → 'index', '/konvertieren/png-zu-webp' → 'konvertieren/png-zu-webp'. */
export function pageFileName(path: string): string {
  const name = path.replace(/^\/+|\/+$/g, '');
  return name === '' ? 'index' : name;
}

/** Pfad der vorgerenderten Datei relativ zum Build-Ordner. */
export function prerenderedFilePath(path: string, locale: Locale): string {
  return `${SEO_DIR}/${locale}/${pageFileName(path)}.html`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Ersetzt genau einen Treffer; 0 oder mehrere Treffer sind ein Fehler im Template. */
function replaceExactlyOnce(
  html: string,
  pattern: RegExp,
  replace: (match: string) => string,
  label: string
): string {
  const all = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  );
  const count = html.match(all)?.length ?? 0;
  if (count !== 1) {
    throw new Error(`SEO-Prerender: ${label} kommt ${count}× in index.html vor (erwartet: 1)`);
  }
  return html.replace(pattern, replace);
}

function metaPattern(attribute: 'name' | 'property', key: string): RegExp {
  return new RegExp(`<meta\\b[^>]*\\b${attribute}="${escapeRegExp(key)}"[^>]*>`);
}

function setMetaContent(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string
): string {
  return replaceExactlyOnce(
    html,
    metaPattern(attribute, key),
    (tag) => tag.replace(/\bcontent="[^"]*"/, `content="${escapeAttr(content)}"`),
    `<meta ${attribute}="${key}">`
  );
}

function removeMeta(html: string, attribute: 'name' | 'property', key: string): string {
  return replaceExactlyOnce(
    html,
    new RegExp(`[ \\t]*${metaPattern(attribute, key).source}\\r?\\n?`),
    () => '',
    `<meta ${attribute}="${key}">`
  );
}

/** Schreibt den Head einer Seite in der gewünschten Sprache in das HTML-Template. */
export function renderPageHtml(template: string, page: PageSeo, locale: Locale): string {
  const { title, description } = seoTexts(page, locale);
  const fullTitle = seoFullTitle(title, locale);
  const { canonical, alternates } = localeUrls(`${SEO_BASE_URL}${page.path}`, locale);

  let html = replaceExactlyOnce(
    template,
    /<html\b[^>]*>/,
    (tag) => tag.replace(/\blang="[^"]*"/, `lang="${locale}"`),
    '<html>'
  );
  html = replaceExactlyOnce(
    html,
    /<title>[^<]*<\/title>/,
    () => `<title>${escapeAttr(fullTitle)}</title>`,
    '<title>'
  );

  if (description) {
    html = setMetaContent(html, 'name', 'description', description);
    html = setMetaContent(html, 'property', 'og:description', description);
    html = setMetaContent(html, 'name', 'twitter:description', description);
  }
  // Suchbegriffe gibt es nur auf Deutsch; auf Englisch fällt das Tag weg.
  if (locale === 'de') {
    if (page.keywords) html = setMetaContent(html, 'name', 'keywords', page.keywords);
  } else {
    html = removeMeta(html, 'name', 'keywords');
  }

  html = setMetaContent(html, 'property', 'og:title', fullTitle);
  html = setMetaContent(html, 'name', 'twitter:title', fullTitle);
  html = setMetaContent(html, 'property', 'og:url', canonical);
  html = setMetaContent(html, 'property', 'og:locale', locale === 'en' ? 'en_US' : 'de_DE');
  html = setMetaContent(
    html,
    'property',
    'og:locale:alternate',
    locale === 'en' ? 'de_DE' : 'en_US'
  );

  if (/<link\b[^>]*\brel="(?:canonical|alternate)"/.test(html)) {
    throw new Error('SEO-Prerender: index.html enthält bereits canonical/alternate-Links');
  }
  const links = [
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
    ...alternates.map(
      ({ hreflang, href }) =>
        `<link rel="alternate" hreflang="${hreflang}" href="${escapeAttr(href)}" />`
    ),
  ]
    .map((link) => `    ${link}\n`)
    .join('');
  return replaceExactlyOnce(html, /[ \t]*<\/head>/, () => `${links}  </head>`, '</head>');
}

/** Alle vorgerenderten Dateien (jede indexierbare Seite × de/en). */
export function prerenderPages(
  template: string,
  pages: readonly PageSeo[] = indexablePages()
): PrerenderedFile[] {
  return pages.flatMap((page) =>
    SEO_LOCALES.map((locale) => ({
      file: prerenderedFilePath(page.path, locale),
      html: renderPageHtml(template, page, locale),
    }))
  );
}
