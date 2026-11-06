/**
 * Reine Vor- und Nachbearbeitung für das Segmentierungsmodell (ISNet).
 * Ohne DOM und ohne ONNX Runtime, damit sie im Worker läuft und sich direkt
 * testen lässt. Entspricht der Vorverarbeitung von rembg für ISNet:
 * Bild auf 1024 × 1024, Werte durch das Maximum teilen, 0,5 abziehen.
 */

/** Kantenlänge, mit der das Modell rechnet. */
export const MODEL_SIZE = 1024;

/**
 * RGBA-Pixel (Breite = Höhe = size) in den Modell-Eingang (1 × 3 × size × size, CHW).
 * Transparente Pixel bleiben, wie sie sind (ihre Farbe zählt mit).
 */
export function toModelInput(rgba: Uint8ClampedArray, size = MODEL_SIZE): Float32Array {
  const n = size * size;
  if (rgba.length !== n * 4) throw new Error(`Erwartet ${n * 4} Werte, erhalten ${rgba.length}`);
  let max = 1e-6;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] > max) max = rgba[i];
    if (rgba[i + 1] > max) max = rgba[i + 1];
    if (rgba[i + 2] > max) max = rgba[i + 2];
  }
  const out = new Float32Array(3 * n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    out[p] = rgba[i] / max - 0.5;
    out[n + p] = rgba[i + 1] / max - 0.5;
    out[2 * n + p] = rgba[i + 2] / max - 0.5;
  }
  return out;
}

/** Modell-Ausgabe (beliebige Skala) auf 0..255 strecken (min–max wie in rembg). */
export function toAlphaMask(output: Float32Array | number[]): Uint8ClampedArray {
  let min = Infinity;
  let max = -Infinity;
  for (const v of output) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const mask = new Uint8ClampedArray(output.length);
  const range = max - min;
  if (!(range > 1e-6)) {
    // Keine Trennung erkennbar: alles behalten statt alles zu löschen
    mask.fill(255);
    return mask;
  }
  for (let i = 0; i < output.length; i++) mask[i] = ((output[i] - min) / range) * 255;
  return mask;
}

/** Schreibt eine Maske (eine Zahl je Pixel) als Alpha in RGBA-Daten (Farbe weiß). */
export function maskToRgba(mask: Uint8ClampedArray): Uint8ClampedArray<ArrayBuffer> {
  const rgba = new Uint8ClampedArray(mask.length * 4);
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    rgba[i] = 255;
    rgba[i + 1] = 255;
    rgba[i + 2] = 255;
    rgba[i + 3] = mask[p];
  }
  return rgba;
}
