import { describe, it, expect } from 'vitest';
import { averageColor, whiteBalanceFromSample } from '@/utils/whiteBalance';
import { applyTonalAdjustments, whiteBalanceGains } from '@/utils/tonalKernel';
import { hasTonalAdjustments } from '@/utils/imageAdjustments';
import { DEFAULT_FILTERS } from '@/composables/useFilterManagement';

/** Rendert einen Pixel mit den Tonwert-Anpassungen (wie Vorschau und Export). */
function render(rgb: [number, number, number], f: Partial<Record<string, number>> | object) {
  const data = new Uint8ClampedArray([...rgb, 255]);
  applyTonalAdjustments(data, { ...DEFAULT_FILTERS, ...f });
  return [data[0], data[1], data[2]];
}

const spread = (c: number[]) => Math.max(...c) - Math.min(...c);

describe('whiteBalanceGains', () => {
  it('ist bei 0 neutral und wirkt gegenläufig auf Rot/Blau bzw. Grün', () => {
    expect(whiteBalanceGains({})).toEqual({ r: 1, g: 1, b: 1 });
    const warm = whiteBalanceGains({ temperature: 100 });
    expect(warm.r).toBeGreaterThan(1);
    expect(warm.b).toBeLessThan(1);
    expect(warm.g).toBe(1);
    expect(whiteBalanceGains({ tint: 100 }).g).toBeLessThan(1); // Magenta
  });

  it('Standardwerte lassen die Pixel unverändert, Temperatur zählt als Anpassung', () => {
    expect(hasTonalAdjustments(DEFAULT_FILTERS)).toBe(false);
    expect(hasTonalAdjustments({ ...DEFAULT_FILTERS, temperature: 10 })).toBe(true);
    expect(hasTonalAdjustments({ ...DEFAULT_FILTERS, tint: -10 })).toBe(true);
    expect(render([120, 130, 140], {})).toEqual([120, 130, 140]);
  });

  it('Temperatur wärmt ein graues Pixel, negativ kühlt sie es', () => {
    const [r, , b] = render([128, 128, 128], { temperature: 50 });
    expect(r).toBeGreaterThan(b);
    const [r2, , b2] = render([128, 128, 128], { temperature: -50 });
    expect(b2).toBeGreaterThan(r2);
  });
});

describe('whiteBalanceFromSample', () => {
  it('macht eine Probe mit Farbstich neutral', () => {
    const cast: [number, number, number] = [190, 170, 130]; // gelblich
    const values = whiteBalanceFromSample({ r: cast[0], g: cast[1], b: cast[2] });
    expect(values).not.toBeNull();
    expect(values!.temperature).toBeLessThan(0); // kühlen
    expect(spread(render(cast, values!))).toBeLessThanOrEqual(3);
  });

  it('verrechnet die aktuellen Werte (Probe ist schon gerendert)', () => {
    const original: [number, number, number] = [150, 140, 175]; // bläulich-magenta
    const current = { temperature: 20, tint: 0 };
    const [r, g, b] = render(original, current);
    const values = whiteBalanceFromSample({ r, g, b }, current);
    expect(values).not.toBeNull();
    expect(spread(render(original, values!))).toBeLessThanOrEqual(3);
  });

  it('liefert für ein neutrales Grau die neutralen Werte', () => {
    expect(whiteBalanceFromSample({ r: 128, g: 128, b: 128 })).toEqual({
      temperature: 0,
      tint: 0,
    });
  });

  it('lehnt zu dunkle oder ausgefressene Proben ab', () => {
    expect(whiteBalanceFromSample({ r: 5, g: 8, b: 6 })).toBeNull();
    expect(whiteBalanceFromSample({ r: 255, g: 250, b: 240 })).toBeNull();
  });

  it('begrenzt extreme Korrekturen auf den Reglerbereich', () => {
    const values = whiteBalanceFromSample({ r: 240, g: 120, b: 30 })!;
    expect(Math.abs(values.temperature)).toBeLessThanOrEqual(100);
    expect(Math.abs(values.tint)).toBeLessThanOrEqual(100);
  });
});

describe('averageColor', () => {
  it('mittelt deckende Pixel und überspringt transparente', () => {
    const data = new Uint8ClampedArray([100, 110, 120, 255, 200, 210, 220, 255, 0, 0, 0, 0]);
    expect(averageColor(data)).toEqual({ r: 150, g: 160, b: 170 });
    expect(averageColor(new Uint8ClampedArray([1, 2, 3, 0]))).toBeNull();
  });
});
