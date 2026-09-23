import { describe, it, expect } from 'vitest';
import { calculateTargetSize, calculatePdfLayout, OPAQUE_FORMATS } from '@/utils/conversionUtils';

describe('calculateTargetSize', () => {
  const img = { width: 400, height: 300 };

  it('behält die Originalgröße ohne Vorgaben', () => {
    expect(calculateTargetSize(img, {})).toEqual({ width: 400, height: 300 });
  });
  it('leitet die Höhe aus der Breite ab (Seitenverhältnis)', () => {
    expect(calculateTargetSize(img, { width: 100 })).toEqual({ width: 100, height: 75 });
  });
  it('leitet die Breite aus der Höhe ab', () => {
    expect(calculateTargetSize(img, { height: 150 })).toEqual({ width: 200, height: 150 });
  });
  it('passt in beide Vorgaben ein, wenn das Seitenverhältnis erhalten bleibt', () => {
    expect(calculateTargetSize(img, { width: 100, height: 100 })).toEqual({
      width: 100,
      height: 75,
    });
  });
  it('übernimmt beide Vorgaben exakt, wenn das Seitenverhältnis frei ist', () => {
    expect(calculateTargetSize(img, { width: 100, height: 100, maintainAspect: false })).toEqual({
      width: 100,
      height: 100,
    });
  });
  it('lässt bei nur einer Vorgabe ohne Seitenverhältnis die andere Kante unverändert', () => {
    expect(calculateTargetSize(img, { width: 100, maintainAspect: false })).toEqual({
      width: 100,
      height: 300,
    });
  });
});

describe('calculatePdfLayout (A4, 10 mm Rand)', () => {
  it('legt Querformat-Bilder quer und zentriert vertikal', () => {
    const l = calculatePdfLayout({ width: 400, height: 300 });
    expect(l.orientation).toBe('landscape');
    expect(l.format).toBe('a4');
    expect(l.width).toBe(277);
    expect(l.height).toBeCloseTo(207.75);
    expect(l.x).toBe(10);
    expect(l.y).toBeCloseTo((210 - 207.75) / 2);
  });
  it('legt Hochformat-Bilder hochkant', () => {
    const l = calculatePdfLayout({ width: 300, height: 400 });
    expect(l.orientation).toBe('portrait');
    expect(l.width).toBe(190);
    expect(l.height).toBeCloseTo(253.33, 1);
  });
  it('begrenzt sehr hohe Bilder auf die Seitenhöhe und zentriert horizontal', () => {
    const l = calculatePdfLayout({ width: 100, height: 1000 });
    expect(l.height).toBe(277);
    expect(l.width).toBeCloseTo(27.7);
    expect(l.y).toBe(10);
    expect(l.x).toBeCloseTo((210 - 27.7) / 2);
  });
});

describe('OPAQUE_FORMATS', () => {
  it('nennt die Formate ohne Transparenz', () => {
    expect(OPAQUE_FORMATS).toEqual(['jpg', 'bmp', 'pdf']);
  });
});
