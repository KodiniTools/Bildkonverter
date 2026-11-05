/**
 * Weißabgleich per Pipette: aus einer Farbprobe, die neutral grau sein soll,
 * die Reglerwerte für Temperatur und Tönung berechnen.
 *
 * Die Probe stammt aus der fertig gerenderten Leinwand, enthält also den
 * aktuellen Weißabgleich schon. Die Korrektur wird deshalb mit den aktuellen
 * Gains verrechnet; ein zweiter Klick auf dieselbe Stelle verfeinert weiter.
 */
import { WHITE_BALANCE_STRENGTH, whiteBalanceGains } from './tonalKernel';

export interface WhiteBalanceValues {
  temperature: number;
  tint: number;
}

/** Zu dunkle oder ausgefressene Proben taugen nicht als Graupunkt. */
const MIN_LINEAR = 0.01;
const MAX_LINEAR = 0.98;

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Mittelwert (R, G, B in 0..255) eines RGBA-Ausschnitts; transparente Pixel zählen nicht. */
export function averageColor(data: Uint8ClampedArray): { r: number; g: number; b: number } | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  return n ? { r: r / n, g: g / n, b: b / n } : null;
}

/**
 * Berechnet Temperatur und Tönung so, dass die Probe neutral wird.
 * @param sample Farbe der Probe (sRGB, 0..255) auf der gerenderten Leinwand
 * @param current aktuelle Reglerwerte (darin ist die Probe schon gerendert)
 * @returns neue Reglerwerte (−100..100) oder null, wenn die Probe ungeeignet ist
 */
export function whiteBalanceFromSample(
  sample: { r: number; g: number; b: number },
  current: Partial<WhiteBalanceValues> = {}
): WhiteBalanceValues | null {
  const R = srgbToLinear(sample.r / 255);
  const G = srgbToLinear(sample.g / 255);
  const B = srgbToLinear(sample.b / 255);
  const lo = Math.min(R, G, B);
  const hi = Math.max(R, G, B);
  if (lo < MIN_LINEAR || hi > MAX_LINEAR) return null;

  // Neue Gains = aktuelle Gains × Korrektur (1 / Kanalwert), dann so skaliert,
  // dass Rot + Blau = 2 ergibt (Form von whiteBalanceGains)
  const gains = whiteBalanceGains(current);
  const r = gains.r / R;
  const g = gains.g / G;
  const b = gains.b / B;
  const k = 2 / (r + b);
  const t = (r * k - 1) / WHITE_BALANCE_STRENGTH;
  const m = (1 - g * k) / WHITE_BALANCE_STRENGTH;

  return {
    temperature: Math.round(clamp(t, -1, 1) * 100),
    tint: Math.round(clamp(m, -1, 1) * 100),
  };
}
