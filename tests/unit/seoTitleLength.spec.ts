import { describe, expect, it } from 'vitest';
import { indexablePages, seoFullTitle, seoTexts } from '@/seo/pages';

// Google kürzt Titel ab etwa 60 Zeichen; alle indexierbaren Seiten bleiben darunter.
describe('SEO-Titellänge', () => {
  for (const locale of ['de', 'en'] as const) {
    it(`alle indexierbaren Seiten (${locale}) haben höchstens 60 Zeichen`, () => {
      const tooLong = indexablePages()
        .map((page) => seoFullTitle(seoTexts(page, locale).title, locale))
        .filter((title) => [...title].length > 60);
      expect(tooLong).toEqual([]);
    });
  }
});
