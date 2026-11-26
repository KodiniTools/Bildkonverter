import { describe, expect, it } from 'vitest';
import { splitHeroTitle } from '@/utils/heroTitle';
import de from '@/i18n/de';
import en from '@/i18n/en';

describe('splitHeroTitle', () => {
  it('teilt den deutschen Titel am Gedankenstrich', () => {
    expect(splitHeroTitle(de.home.title)).toEqual({
      lead: 'Bilder konvertieren online –',
      brand: 'Bildkonverter Pro',
    });
  });

  it('teilt den englischen Titel am Gedankenstrich', () => {
    expect(splitHeroTitle(en.home.title)).toEqual({
      lead: 'Convert images online –',
      brand: 'Image Converter Pro',
    });
  });

  it('lässt einen Titel ohne Gedankenstrich ganz im ersten Teil', () => {
    expect(splitHeroTitle('Bildkonverter')).toEqual({ lead: 'Bildkonverter', brand: '' });
  });

  it('ergibt zusammengesetzt wieder den Originaltext', () => {
    const { lead, brand } = splitHeroTitle(de.home.title);
    expect(`${lead} ${brand}`).toBe(de.home.title);
  });
});
