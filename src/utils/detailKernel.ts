/**
 * detailKernel.ts
 *
 * Reine Pixel-Berechnung der Detail-Anpassungen (Schärfen, Klarheit, Körnung).
 * Wie tonalKernel.ts ohne Imports und DOM-Zugriff, damit sie identisch im
 * Hauptthread und im Web Worker läuft. Läuft nach den Tonwert-Anpassungen.
 *
 *  - sharpness (0..100):   Unscharf maskieren mit kleinem Radius (Kanten)
 *  - clarity   (-100..100): lokaler Kontrast mit großem Radius, auf die
 *                          Mitteltöne gewichtet; negativ wirkt weichzeichnend
 *  - grain     (0..100):   monochromes Filmkorn, deterministisch (Vorschau
 *                          und Export sehen gleich aus)
 *
 * Alle drei wirken auf die Luminanz und verschieben R, G und B um denselben
 * Betrag: so entstehen keine Farbsäume.
 */

import type { FilterValues, PixelData } from '@/types/filters';

const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

/** Maximale Stärke je Regler (bei 100). */
const SHARPEN_AMOUNT = 1.5;
const CLARITY_AMOUNT = 0.6;
const GRAIN_AMOUNT = 0.12;

/**
 * Prüft, ob mindestens eine Detail-Anpassung aktiv ist.
 */
export function hasDetailAdjustments(f: FilterValues): boolean {
  return (f.sharpness ?? 0) !== 0 || (f.clarity ?? 0) !== 0 || (f.grain ?? 0) !== 0;
}

/** Radius des Klarheit-Weichzeichners: 2 % der kürzeren Seite, mindestens 2 px. */
export function clarityRadius(width: number, height: number): number {
  return Math.max(2, Math.round(Math.min(width, height) * 0.02));
}

/**
 * Box-Weichzeichner entlang der Zeilen mit gleitender Summe; die Ränder
 * werden fortgesetzt (Randpixel wiederholt).
 */
function boxRows(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number
): void {
  const inv = 1 / (radius * 2 + 1);
  const last = width - 1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      sum += src[row + (k < 0 ? 0 : k > last ? last : k)];
    }
    for (let x = 0; x < width; x++) {
      dst[row + x] = sum * inv;
      const out = x - radius;
      const inn = x + radius + 1;
      sum += src[row + (inn > last ? last : inn)] - src[row + (out < 0 ? 0 : out)];
    }
  }
}

/**
 * Box-Weichzeichner entlang der Spalten. Arbeitet zeilenweise mit einer
 * Summe je Spalte, damit der Speicher der Reihe nach gelesen wird.
 */
function boxColumns(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
  sums: Float32Array
): void {
  const inv = 1 / (radius * 2 + 1);
  const last = height - 1;
  sums.fill(0);
  for (let k = -radius; k <= radius; k++) {
    const row = (k < 0 ? 0 : k > last ? last : k) * width;
    for (let x = 0; x < width; x++) sums[x] += src[row + x];
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const out = y - radius;
    const inn = y + radius + 1;
    const outRow = (out < 0 ? 0 : out) * width;
    const inRow = (inn > last ? last : inn) * width;
    for (let x = 0; x < width; x++) {
      dst[row + x] = sums[x] * inv;
      sums[x] += src[inRow + x] - src[outRow + x];
    }
  }
}

/**
 * Weichzeichner der Luminanz: `passes` Box-Durchläufe je Richtung
 * (3 nähern einen Gauß-Weichzeichner an).
 * @returns neues Array
 */
export function blurLuminance(
  lum: Float32Array,
  width: number,
  height: number,
  radius: number,
  passes = 3
): Float32Array {
  const a = new Float32Array(lum.length);
  const b = new Float32Array(lum.length);
  const sums = new Float32Array(width);
  let src = lum;
  for (let pass = 0; pass < passes; pass++) {
    boxRows(src, b, width, height, radius);
    boxColumns(b, a, width, height, radius, sums);
    src = a;
  }
  return a;
}

/** Ganzzahl-Hash → -1..1 (reproduzierbares Rauschen je Pixelindex). */
function noise(i: number): number {
  let x = (i + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return ((x >>> 0) / 0xffffffff) * 2 - 1;
}

/**
 * Wendet Schärfen, Klarheit und Körnung direkt auf RGBA-Pixeldaten an.
 * @param data - RGBA-Pixeldaten (wird in-place verändert)
 */
export function applyDetailAdjustments(
  data: PixelData,
  width: number,
  height: number,
  f: FilterValues
): void {
  if (!hasDetailAdjustments(f) || width * height * 4 !== data.length) return;

  const sharpen = ((f.sharpness ?? 0) / 100) * SHARPEN_AMOUNT;
  const clarity = ((f.clarity ?? 0) / 100) * CLARITY_AMOUNT;
  const grain = ((f.grain ?? 0) / 100) * GRAIN_AMOUNT;
  const n = width * height;

  const lum = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    lum[p] = (LUM_R * data[i] + LUM_G * data[i + 1] + LUM_B * data[i + 2]) / 255;
  }

  // Schärfen: ein 3×3-Box-Durchlauf reicht als Unschärfemaske
  const fine = sharpen !== 0 ? blurLuminance(lum, width, height, 1, 1) : null;
  const coarse =
    clarity !== 0 ? blurLuminance(lum, width, height, clarityRadius(width, height)) : null;

  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const l = lum[p];
    // Gewicht der Mitteltöne: 1 bei 0,5, 0 bei Schwarz und Weiß
    const mid = 1 - (2 * l - 1) * (2 * l - 1);
    let delta = 0;
    if (fine) delta += sharpen * (l - fine[p]);
    if (coarse) delta += clarity * (l - coarse[p]) * mid;
    if (grain !== 0) delta += grain * noise(p) * (0.5 + 0.5 * mid);
    if (delta === 0) continue;
    const d = delta * 255;
    data[i] = data[i] + d;
    data[i + 1] = data[i + 1] + d;
    data[i + 2] = data[i + 2] + d;
    // Alpha bleibt unverändert; Uint8ClampedArray rundet und begrenzt
  }
}
