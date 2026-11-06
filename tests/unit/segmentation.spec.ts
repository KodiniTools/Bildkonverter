import { describe, it, expect } from 'vitest';
import { maskToRgba, toAlphaMask, toModelInput } from '@/lib/backgroundRemoval/segmentation';

describe('toModelInput', () => {
  it('liefert CHW-Planes, geteilt durch das Maximum, minus 0,5', () => {
    // 2×2: rot, grün, blau, grau (Maximum 200)
    const rgba = new Uint8ClampedArray([
      200, 0, 0, 255, 0, 200, 0, 255, 0, 0, 200, 255, 100, 100, 100, 0,
    ]);
    const out = toModelInput(rgba, 2);
    expect(out).toHaveLength(12);
    expect(Array.from(out.slice(0, 4))).toEqual([0.5, -0.5, -0.5, 0]); // R
    expect(Array.from(out.slice(4, 8))).toEqual([-0.5, 0.5, -0.5, 0]); // G
    expect(Array.from(out.slice(8, 12))).toEqual([-0.5, -0.5, 0.5, 0]); // B
  });

  it('lehnt eine falsche Puffergröße ab und übersteht ein schwarzes Bild', () => {
    expect(() => toModelInput(new Uint8ClampedArray(8), 2)).toThrow();
    const black = toModelInput(new Uint8ClampedArray(16), 2);
    expect(Array.from(black).every((v) => v === -0.5)).toBe(true);
  });
});

describe('toAlphaMask', () => {
  it('streckt die Ausgabe auf 0..255', () => {
    expect(Array.from(toAlphaMask([-2, 0, 2]))).toEqual([0, 128, 255]);
  });

  it('behält bei einer flachen Ausgabe alles (keine Trennung)', () => {
    expect(Array.from(toAlphaMask(new Float32Array([0.3, 0.3])))).toEqual([255, 255]);
  });
});

describe('maskToRgba', () => {
  it('schreibt die Maske als Alpha', () => {
    expect(Array.from(maskToRgba(new Uint8ClampedArray([0, 200])))).toEqual([
      255, 255, 255, 0, 255, 255, 255, 200,
    ]);
  });
});
