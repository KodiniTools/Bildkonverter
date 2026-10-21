/**
 * Handoff-Empfang: Bilder aus anderen KodiniTools (z. B. Bildergalerie) annehmen oder verwerfen.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import HandoffReceiver from '@/components/features/HandoffReceiver.vue';
import { checkHandoff, consumeHandoff } from '@/lib/core/handoff';
import de from '@/i18n/de';
import en from '@/i18n/en';

const KEY = 'kodinitools-handoff';
const JPEG = 'data:image/jpeg;base64,AAAA';

function payload(count = 2, overrides = {}) {
  return {
    source: 'bildergalerie',
    timestamp: Date.now(),
    images: Array.from({ length: count }, (_, i) => ({
      name: `Bild ${i + 1}`,
      dataUrl: JPEG,
      width: 100,
      height: 50,
    })),
    ...overrides,
  };
}

function store(value) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

function mountReceiver(locale = 'de') {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  return mount(HandoffReceiver, { global: { plugins: [i18n] } });
}

beforeEach(() => localStorage.clear());

describe('Handoff-Protokoll (Empfänger)', () => {
  it('nimmt eine frische Übergabe an und verbraucht sie genau einmal', () => {
    store(payload());
    expect(checkHandoff().images).toHaveLength(2);
    expect(consumeHandoff()).toHaveLength(2);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(consumeHandoff()).toBeNull();
  });

  it('verwirft abgelaufene Übergaben (5 Minuten) und solche ohne Zeitstempel', () => {
    store(payload(1, { timestamp: Date.now() - 6 * 60 * 1000 }));
    expect(checkHandoff()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();

    store(payload(1, { timestamp: undefined }));
    expect(checkHandoff()).toBeNull();
  });

  it('übernimmt nur Einträge mit Bild-Data-URL', () => {
    store(
      payload(1, {
        images: [
          { name: 'ok', dataUrl: JPEG, width: 1, height: 1 },
          { name: 'script', dataUrl: 'javascript:alert(1)', width: 1, height: 1 },
          { name: 'svg', dataUrl: 'data:image/svg+xml;base64,AAAA', width: 1, height: 1 },
          { dataUrl: JPEG },
          null,
        ],
      })
    );
    expect(checkHandoff().images.map((img) => img.name)).toEqual(['ok']);
    expect(consumeHandoff().map((img) => img.name)).toEqual(['ok']);

    store(payload(1, { images: [{ name: 'x', dataUrl: 'nope' }] }));
    expect(checkHandoff()).toBeNull();
  });

  it('behandelt kaputtes JSON als keine Übergabe', () => {
    localStorage.setItem(KEY, '{kaputt');
    expect(checkHandoff()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('HandoffReceiver', () => {
  it('zeigt ohne Übergabe nichts an', () => {
    expect(mountReceiver().find('.handoff-banner').exists()).toBe(false);
  });

  it('nennt die Bildergalerie als Quelle und setzt den Plural (DE/EN)', async () => {
    store(payload(1));
    let w = mountReceiver('de');
    await w.vm.$nextTick();
    expect(w.text()).toContain('1 Bild bereit zur Übernahme');
    expect(w.text()).toContain('Aus Bildergalerie übertragen');

    store(payload(3));
    w = mountReceiver('en');
    await w.vm.$nextTick();
    expect(w.text()).toContain('3 images ready for import');
    expect(w.text()).toContain('Transferred from Bildergalerie');
  });

  it('Übernehmen gibt die Bilder weiter und räumt auf', async () => {
    store(payload(2));
    const w = mountReceiver();
    await w.vm.$nextTick();
    await w.find('.btn-success').trigger('click');

    const [[images]] = w.emitted('accept');
    expect(images.map((img) => img.name)).toEqual(['Bild 1', 'Bild 2']);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(w.find('.handoff-banner').exists()).toBe(false);
  });

  it('Verwerfen lehnt die Bilder ab, ohne sie weiterzugeben', async () => {
    store(payload(2));
    const w = mountReceiver();
    await w.vm.$nextTick();
    await w.find('.btn-secondary-outline').trigger('click');

    expect(w.emitted('accept')).toBeUndefined();
    expect(w.emitted('dismiss')).toHaveLength(1);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(w.find('.handoff-banner').exists()).toBe(false);
  });
});
