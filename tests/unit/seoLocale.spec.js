import { beforeEach, describe, expect, it } from 'vitest';
import { updateSeoMeta } from '@/composables/useSeoMeta';
import { initialLocale } from '@/i18n';

const BASE = 'https://kodinitools.com/bildkonverter';
const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const alternates = () =>
  [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
    l.getAttribute('hreflang'),
    l.getAttribute('href'),
  ]);

describe('SEO je Sprache (?lang=en)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  const meta = {
    title: 'Anleitung',
    description: 'DE',
    path: '/guide',
    en: { title: 'Guide', description: 'EN' },
  };

  it('Deutsch: Canonical ohne Parameter, hreflang de/en/x-default', () => {
    updateSeoMeta(meta, 'de');
    expect(document.title).toBe('Anleitung - Bildkonverter Pro | KodiniTools');
    expect(canonical()).toBe(`${BASE}/guide`);
    expect(alternates()).toEqual([
      ['de', `${BASE}/guide`],
      ['en', `${BASE}/guide?lang=en`],
      ['x-default', `${BASE}/guide`],
    ]);
    expect(document.documentElement.lang).toBe('de');
  });

  it('Englisch: englische Texte, Canonical ?lang=en, keine doppelten Links', () => {
    updateSeoMeta(meta, 'en');
    updateSeoMeta(meta, 'en');
    expect(document.title).toBe('Guide - Image Converter Pro | KodiniTools');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe('EN');
    expect(canonical()).toBe(`${BASE}/guide?lang=en`);
    expect(alternates()).toHaveLength(3);
    expect(document.documentElement.lang).toBe('en');
  });

  it('initialLocale: ?lang vor gespeicherter Sprache, sonst Deutsch', () => {
    expect(initialLocale()).toBe('de');
    localStorage.setItem('bildkonverter-locale', 'en');
    expect(initialLocale()).toBe('en');
    window.history.replaceState(null, '', '/bildkonverter/?lang=de');
    expect(initialLocale()).toBe('de');
    localStorage.setItem('locale', 'de');
    window.history.replaceState(null, '', '/bildkonverter/faq?lang=en');
    expect(initialLocale()).toBe('en');
  });
});
