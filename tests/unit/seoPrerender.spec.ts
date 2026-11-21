/**
 * Vorgerenderte Sprachfassungen (src/seo/prerender.ts): Crawler ohne JavaScript sollen unter
 * ?lang=en denselben Head sehen, den useSeoMeta zur Laufzeit setzt.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { updateSeoMeta } from '@/composables/useSeoMeta';
import {
  formatConversionSeo,
  formatConversions,
  indexablePages,
  routeSeo,
  type PageSeo,
} from '@/seo/pages';
import { pageFileName, prerenderPages, prerenderedFilePath, renderPageHtml } from '@/seo/prerender';
import router from '@/router';

const BASE = 'https://kodinitools.com/bildkonverter';
const template = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Die Werte, die ein Crawler im Head liest. */
function headOf(doc: Document) {
  const attr = (selector: string, name: string) =>
    doc.head.querySelector(selector)?.getAttribute(name) ?? null;
  return {
    lang: doc.documentElement.getAttribute('lang'),
    title: doc.title,
    description: attr('meta[name="description"]', 'content'),
    canonical: attr('link[rel="canonical"]', 'href'),
    alternates: [...doc.head.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
      l.getAttribute('hreflang'),
      l.getAttribute('href'),
    ]),
    ogTitle: attr('meta[property="og:title"]', 'content'),
    ogUrl: attr('meta[property="og:url"]', 'content'),
    ogDescription: attr('meta[property="og:description"]', 'content'),
    ogLocale: attr('meta[property="og:locale"]', 'content'),
    twitterTitle: attr('meta[name="twitter:title"]', 'content'),
    twitterDescription: attr('meta[name="twitter:description"]', 'content'),
  };
}

describe('SEO-Seitenliste (src/seo/pages.ts)', () => {
  it('enthält alle statischen Routen und Format-Landingpages, aber keine 404', () => {
    const paths = indexablePages().map((p) => p.path);
    expect(paths).toHaveLength(8 + formatConversions.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/');
    expect(paths).toContain('/konvertieren/png-zu-webp');
    expect(paths).not.toContain('/404');
  });

  it('jede indexierbare Seite hat deutsche und englische Texte', () => {
    for (const page of indexablePages()) {
      expect(page.title, page.path).toBeTruthy();
      expect(page.description, page.path).toBeTruthy();
      expect(page.en?.title, page.path).toBeTruthy();
      expect(page.en?.description, page.path).toBeTruthy();
    }
  });

  it('der Router nutzt dieselben Texte', () => {
    for (const [name, seo] of [
      ['home', routeSeo.home],
      ['editor', routeSeo.editor],
      ['download', routeSeo.download],
      ['not-found', routeSeo.notFound],
    ] as const) {
      const route = router.getRoutes().find((r) => r.name === name);
      expect(route?.meta.title, name).toBe(seo.title);
      expect(route?.meta.path, name).toBe(seo.path);
    }
  });

  it('Format-Landingpage: Texte wie bisher im Router-Guard', () => {
    const seo = formatConversionSeo({ pair: 'png-zu-webp', from: 'PNG', to: 'WebP' });
    expect(seo).toEqual({
      title: 'PNG in WebP umwandeln',
      description:
        'PNG Dateien kostenlos in WebP konvertieren. Schnelle Umwandlung direkt im Browser, ohne Upload. Perfekt für Web-Optimierung und Kompatibilität.',
      keywords:
        'PNG zu WebP, PNG in WebP umwandeln, PNG konvertieren, png-zu-webp Konverter, Bildformat ändern',
      path: '/konvertieren/png-zu-webp',
      en: {
        title: 'Convert PNG to WebP',
        description:
          'Convert PNG files to WebP for free. Fast conversion right in your browser, no upload. Perfect for web optimization and compatibility.',
      },
    });
  });
});

describe('Dateinamen', () => {
  it('bildet Pfade auf _seo/<lang>/<seite>.html ab', () => {
    expect(pageFileName('/')).toBe('index');
    expect(pageFileName('/editor')).toBe('editor');
    expect(prerenderedFilePath('/', 'en')).toBe('_seo/en/index.html');
    expect(prerenderedFilePath('/konvertieren/heic-zu-jpg', 'de')).toBe(
      '_seo/de/konvertieren/heic-zu-jpg.html'
    );
  });

  it('erzeugt jede Seite in beiden Sprachen', () => {
    const files = prerenderPages(template).map((f) => f.file);
    expect(files).toHaveLength(indexablePages().length * 2);
    expect(files).toContain('_seo/en/editor.html');
    expect(files).toContain('_seo/de/index.html');
  });
});

describe('renderPageHtml', () => {
  it('Englisch: lang, Titel, Description, Canonical ?lang=en, hreflang, OG', () => {
    const head = headOf(parse(renderPageHtml(template, routeSeo.editor, 'en')));
    expect(head).toEqual({
      lang: 'en',
      title: 'Image Editor - Image Converter Pro | KodiniTools',
      description: routeSeo.editor.en.description,
      canonical: `${BASE}/editor?lang=en`,
      alternates: [
        ['de', `${BASE}/editor`],
        ['en', `${BASE}/editor?lang=en`],
        ['x-default', `${BASE}/editor`],
      ],
      ogTitle: 'Image Editor - Image Converter Pro | KodiniTools',
      ogUrl: `${BASE}/editor?lang=en`,
      ogDescription: routeSeo.editor.en.description,
      ogLocale: 'en_US',
      twitterTitle: 'Image Editor - Image Converter Pro | KodiniTools',
      twitterDescription: routeSeo.editor.en.description,
    });
  });

  it('Englisch: keine deutschen Keywords; Deutsch: Keywords der Seite', () => {
    const en = parse(renderPageHtml(template, routeSeo.batch, 'en'));
    expect(en.head.querySelector('meta[name="keywords"]')).toBeNull();
    const de = parse(renderPageHtml(template, routeSeo.batch, 'de'));
    expect(de.head.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe(
      routeSeo.batch.keywords
    );
  });

  it('Startseite Deutsch: Canonical mit Schrägstrich, lang=de', () => {
    const head = headOf(parse(renderPageHtml(template, routeSeo.home, 'de')));
    expect(head.lang).toBe('de');
    expect(head.canonical).toBe(`${BASE}/`);
    expect(head.title).toBe('Bilder konvertieren online - Bildkonverter Pro | KodiniTools');
  });

  it('lässt Body, SSI-Includes und Skripte unverändert', () => {
    const html = renderPageHtml(template, routeSeo.faq, 'en');
    const body = (s: string) => s.slice(s.indexOf('<body>'));
    expect(body(html)).toBe(body(template));
    expect(html).toContain('<!--#include virtual="/partials/nav.html" -->');
  });

  it('maskiert Sonderzeichen in Attributen und Titel', () => {
    const page: PageSeo = {
      title: 'A "B" & <C>',
      description: 'x"><script>',
      path: '/test',
      en: { title: 'A "B" & <C>', description: 'x"><script>' },
    };
    const html = renderPageHtml(template, page, 'en');
    expect(html).not.toContain('<script>"');
    expect(html).toContain('content="x&quot;&gt;&lt;script&gt;"');
    expect(parse(html).title).toBe('A "B" & <C> - Image Converter Pro | KodiniTools');
  });

  it('bricht ab, wenn ein erwartetes Tag in der Vorlage fehlt', () => {
    const broken = template.replace(/<meta\s+property="og:url"[^>]*>/, '');
    expect(() => renderPageHtml(broken, routeSeo.home, 'en')).toThrow(/og:url/);
  });
});

describe('Vorgerendert = Laufzeit', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  it.each(['de', 'en'] as const)('%s: gleicher Head wie useSeoMeta für jede Seite', (locale) => {
    for (const page of indexablePages()) {
      const pre = headOf(parse(renderPageHtml(template, page, locale)));
      // Laufzeit auf demselben Ausgangs-HTML wie im Browser
      const live = parse(template);
      document.documentElement.innerHTML = live.documentElement.innerHTML;
      document.documentElement.setAttribute('lang', 'de');
      updateSeoMeta(page, locale);
      const runtime = headOf(document);
      expect(pre, `${locale} ${page.path}`).toEqual(runtime);
    }
  });
});
