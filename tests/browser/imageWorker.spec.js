/**
 * Bild-Worker: Tonwerte und Kodierung im Worker, Rückfall auf den Hauptthread
 * und asynchrone Vorschau über getAdjustedImage.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import {
  adjustInWorker,
  encodeInWorker,
  isImageWorkerAvailable,
  resetImageWorker,
} from '@/lib/imageWorker';
import { applyTonalAdjustments } from '@/utils/tonalKernel';
import {
  getAdjustedImage,
  onAdjustmentReady,
  clearAdjustmentCache,
} from '@/utils/imageAdjustments';
import { canvasToBlob } from '@/utils/conversionUtils';
import { makeImage } from './helpers';

const FILTERS = { exposure: 20, contrast: 120, highlights: -30, shadows: 25, saturation: 140 };

let img;
beforeAll(async () => {
  img = await makeImage(120, 80, 0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetImageWorker();
  clearAdjustmentCache();
});

function pixelsOf(source) {
  const c = document.createElement('canvas');
  c.width = source.naturalWidth || source.width;
  c.height = source.naturalHeight || source.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

const nextAdjustment = () =>
  new Promise((resolve) => {
    const off = onAdjustmentReady(() => {
      off();
      resolve();
    });
  });

describe('imageWorker', () => {
  it('ist in Chromium verfügbar', () => {
    expect(isImageWorkerAvailable()).toBe(true);
  });

  it('Tonwerte im Worker entsprechen exakt dem Hauptthread', async () => {
    const main = pixelsOf(img);
    applyTonalAdjustments(main.data, FILTERS);
    const result = await adjustInWorker(pixelsOf(img), FILTERS);
    expect(result).not.toBeNull();
    expect(result.width).toBe(main.width);
    expect(result.data).toEqual(main.data);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp'])('kodiert %s im Worker', async (type) => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 48;
    c.getContext('2d').drawImage(img, 0, 0, 64, 48);
    const blob = await encodeInWorker(c, type, 0.8);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(type);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('canvasToBlob fällt ohne Worker auf den Hauptthread zurück', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    expect(isImageWorkerAvailable()).toBe(false);
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const blob = await canvasToBlob(c, 'image/jpeg', 0.7);
    expect(blob.type).toBe('image/jpeg');
    expect(await adjustInWorker(pixelsOf(img), FILTERS)).toBeNull();
  });
});

describe('getAdjustedImage – asynchrone Vorschau', () => {
  it('liefert zuerst einen Platzhalter und nach dem Worker das echte Ergebnis', async () => {
    const ready = nextAdjustment();
    const first = getAdjustedImage(img, FILTERS, { async: true });
    // Noch kein Ergebnis: Originalbild mit CSS-Näherung
    expect(first.el).toBe(img);
    expect(first.cssFilter).toContain('brightness(');
    await ready;

    const second = getAdjustedImage(img, FILTERS, { async: true });
    expect(second.el).toBeInstanceOf(HTMLCanvasElement);
    expect(second.cssFilter).toBe('none');

    const expected = pixelsOf(img);
    applyTonalAdjustments(expected.data, FILTERS);
    expect(pixelsOf(second.el).data).toEqual(expected.data);
  });

  it('zeigt bis zum neuen Ergebnis das letzte Ergebnis desselben Bildes', async () => {
    let ready = nextAdjustment();
    getAdjustedImage(img, FILTERS, { async: true });
    await ready;
    const previous = getAdjustedImage(img, FILTERS, { async: true }).el;

    ready = nextAdjustment();
    const placeholder = getAdjustedImage(img, { ...FILTERS, exposure: 40 }, { async: true });
    expect(placeholder.el).toBe(previous);
    expect(placeholder.cssFilter).toBe('none');
    await ready;
    expect(getAdjustedImage(img, { ...FILTERS, exposure: 40 }, { async: true }).el).not.toBe(
      previous
    );
  });

  it('synchroner Aufruf (Export) rechnet sofort', () => {
    const { el, cssFilter } = getAdjustedImage(img, FILTERS);
    expect(el).toBeInstanceOf(HTMLCanvasElement);
    expect(cssFilter).toBe('none');
  });
});
