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
import { applyDetailAdjustments } from '@/utils/detailKernel';
import {
  getAdjustedImage,
  onAdjustmentReady,
  clearAdjustmentCache,
} from '@/utils/imageAdjustments';
import { canvasToBlob } from '@/utils/conversionUtils';
import { makeImage } from './helpers';
import { context2d } from '@/utils/canvas2d';

const FILTERS = { exposure: 20, contrast: 120, highlights: -30, shadows: 25, saturation: 140 };

let img: HTMLImageElement;
beforeAll(async () => {
  img = await makeImage(120, 80, 0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetImageWorker();
  clearAdjustmentCache();
});

function pixelsOf(source: HTMLImageElement | HTMLCanvasElement): ImageData {
  const c = document.createElement('canvas');
  // Canvas haben keine natural*-Maße: wie bisher auf width/height zurückfallen
  const natural = source as Partial<HTMLImageElement>;
  c.width = natural.naturalWidth || source.width;
  c.height = natural.naturalHeight || source.height;
  const ctx = context2d(c, { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

const nextAdjustment = () =>
  new Promise<void>((resolve) => {
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
    expect(result!.width).toBe(main.width);
    expect(result!.data).toEqual(main.data);
  });

  it('Schärfen, Klarheit und Körnung im Worker entsprechen exakt dem Hauptthread', async () => {
    const detail = { ...FILTERS, sharpness: 70, clarity: -40, grain: 30 };
    const main = pixelsOf(img);
    applyTonalAdjustments(main.data, detail);
    applyDetailAdjustments(main.data, main.width, main.height, detail);
    const result = await adjustInWorker(pixelsOf(img), detail);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual(main.data);
  });

  it('Weißabgleich (Temperatur/Tönung) im Worker entspricht exakt dem Hauptthread', async () => {
    const wb = { ...FILTERS, temperature: -35, tint: 20 };
    const main = pixelsOf(img);
    applyTonalAdjustments(main.data, wb);
    const result = await adjustInWorker(pixelsOf(img), wb);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual(main.data);
  });

  it('Kurven im Worker entsprechen exakt dem Hauptthread', async () => {
    const curves = {
      ...FILTERS,
      curveRgb: '0,0 64,52 192,204 255,255',
      curveB: '0,20 128,110 255,240',
    };
    const main = pixelsOf(img);
    applyTonalAdjustments(main.data, curves);
    const result = await adjustInWorker(pixelsOf(img), curves);
    expect(result).not.toBeNull();
    expect(result!.data).toEqual(main.data);
  });

  it('nur Detail-Regler aktiv: getAdjustedImage rechnet pixelbasiert', () => {
    const { el, cssFilter } = getAdjustedImage(img, { sharpness: 50 });
    expect(el).toBeInstanceOf(HTMLCanvasElement);
    expect(cssFilter).toBe('none');
    expect(pixelsOf(el).data).not.toEqual(pixelsOf(img).data);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp'])('kodiert %s im Worker', async (type) => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 48;
    context2d(c).drawImage(img, 0, 0, 64, 48);
    const blob = await encodeInWorker(c, type, 0.8);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob!.type).toBe(type);
    expect(blob!.size).toBeGreaterThan(0);
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
