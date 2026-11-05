import { describe, it, expect } from 'vitest';
import {
  applyDetailAdjustments,
  blurLuminance,
  clarityRadius,
  hasDetailAdjustments,
} from '@/utils/detailKernel';
import { DEFAULT_FILTERS } from '@/composables/useFilterManagement';

/** Graues RGBA-Bild aus einer Funktion (x, y) → Grauwert 0..255. */
function image(width: number, height: number, gray: (x: number, y: number) => number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const v = gray(x, y);
      data.set([v, v, v, 255], (y * width + x) * 4);
    }
  return data;
}

const at = (data: Uint8ClampedArray, width: number, x: number, y: number) =>
  data[(y * width + x) * 4];

describe('hasDetailAdjustments', () => {
  it('erkennt aktive Regler, Standardwerte sind neutral', () => {
    expect(hasDetailAdjustments(DEFAULT_FILTERS)).toBe(false);
    expect(hasDetailAdjustments({})).toBe(false);
    expect(hasDetailAdjustments({ sharpness: 10 })).toBe(true);
    expect(hasDetailAdjustments({ clarity: -5 })).toBe(true);
    expect(hasDetailAdjustments({ grain: 1 })).toBe(true);
  });
});

describe('blurLuminance', () => {
  it('erhält eine konstante Fläche und glättet eine Kante', () => {
    const flat = new Float32Array(25).fill(0.4);
    expect(Array.from(blurLuminance(flat, 5, 5, 1)).every((v) => Math.abs(v - 0.4) < 1e-6)).toBe(
      true
    );
    const edge = new Float32Array(10 * 3);
    for (let y = 0; y < 3; y++) for (let x = 5; x < 10; x++) edge[y * 10 + x] = 1;
    const out = blurLuminance(edge, 10, 3, 1);
    expect(out[1 * 10 + 4]).toBeGreaterThan(0);
    expect(out[1 * 10 + 5]).toBeLessThan(1);
  });
});

describe('applyDetailAdjustments', () => {
  const W = 20;
  const H = 10;
  const edge = () => image(W, H, (x) => (x < 10 ? 80 : 170));

  it('ändert nichts bei neutralen Werten oder falscher Puffergröße', () => {
    const data = edge();
    const copy = data.slice();
    applyDetailAdjustments(data, W, H, DEFAULT_FILTERS);
    applyDetailAdjustments(data, W + 1, H, { sharpness: 100 });
    expect(data).toEqual(copy);
  });

  it('Schärfen verstärkt den Kontrast an Kanten, lässt Flächen unberührt', () => {
    const data = edge();
    applyDetailAdjustments(data, W, H, { sharpness: 100 });
    expect(at(data, W, 9, 5)).toBeLessThan(80);
    expect(at(data, W, 10, 5)).toBeGreaterThan(170);
    expect(at(data, W, 2, 5)).toBe(80);
    expect(at(data, W, 17, 5)).toBe(170);
  });

  it('Klarheit hebt den lokalen Kontrast, negativ glättet sie ihn', () => {
    const up = edge();
    applyDetailAdjustments(up, W, H, { clarity: 100 });
    expect(at(up, W, 10, 5) - at(up, W, 9, 5)).toBeGreaterThan(90);

    const down = edge();
    applyDetailAdjustments(down, W, H, { clarity: -100 });
    expect(at(down, W, 10, 5) - at(down, W, 9, 5)).toBeLessThan(90);
  });

  it('Körnung ist reproduzierbar, monochrom und lässt Alpha unverändert', () => {
    const a = image(W, H, () => 128);
    const b = image(W, H, () => 128);
    a[3] = 77;
    b[3] = 77;
    applyDetailAdjustments(a, W, H, { grain: 60 });
    applyDetailAdjustments(b, W, H, { grain: 60 });
    expect(a).toEqual(b);
    expect(new Set(Array.from({ length: W * H }, (_, p) => a[p * 4])).size).toBeGreaterThan(10);
    for (let i = 0; i < a.length; i += 4) {
      expect(a[i]).toBe(a[i + 1]);
      expect(a[i]).toBe(a[i + 2]);
    }
    expect(a[3]).toBe(77);
  });

  it('Klarheit-Radius wächst mit der Bildgröße, mindestens 2 px', () => {
    expect(clarityRadius(50, 50)).toBe(2);
    expect(clarityRadius(4000, 3000)).toBe(60);
  });
});
