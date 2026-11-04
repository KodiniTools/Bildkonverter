import { expect, test } from '@playwright/test';
import { collectPageErrors, prepare, type Locale, type Theme } from './helpers';

/** Alle Routen aus src/router/index.js mit ihrer H1 je Sprache. Der Editor hat keine H1. */
const PAGES: ReadonlyArray<{ path: string; heading: Record<Locale, string> | null }> = [
  {
    path: './',
    heading: { de: 'Willkommen beim Bildkonverter Pro', en: 'Welcome to Image Converter Pro' },
  },
  { path: './editor', heading: null },
  { path: './batch', heading: { de: 'Batch-Konvertierung', en: 'Batch Conversion' } },
  { path: './gallery', heading: { de: 'Galerie', en: 'Gallery' } },
  { path: './guide', heading: { de: 'Benutzeranleitung', en: 'User Guide' } },
  { path: './faq', heading: { de: 'Häufig gestellte Fragen', en: 'Frequently Asked Questions' } },
  { path: './about', heading: { de: 'Über Bildkonverter Pro', en: 'About Image Converter Pro' } },
  {
    path: './konvertieren/png-zu-webp',
    heading: {
      de: 'PNG in WebP umwandeln – Für schnellere Websites',
      en: 'Convert PNG to WebP – For Faster Websites',
    },
  },
  { path: './gibt-es-nicht', heading: { de: '404', en: '404' } },
];

for (const { path, heading } of PAGES) {
  for (const locale of ['de', 'en'] as const) {
    for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
      test(`${path} · ${locale} · ${theme}`, async ({ page }) => {
        const errors = collectPageErrors(page);
        await prepare(page, locale, theme);
        await page.goto(path);

        if (heading) {
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading[locale]);
        } else {
          await expect(page.locator('input[type="file"]')).toBeAttached();
        }
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(errors).toEqual([]);
      });
    }
  }
}

test('?lang=en hat Vorrang vor der gespeicherten Sprache', async ({ page }) => {
  await prepare(page, 'de');
  await page.goto('./faq?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Frequently Asked Questions');
});
