/**
 * Auto-Verbessern: leitet aus dem Histogramm eines Bildes Werte für die
 * vorhandenen Tonwert-Regler ab (Belichtung, Helligkeit, Kontrast, Lichter,
 * Schatten, Sättigung). Das Ergebnis sind normale Reglerwerte: Nutzer sehen,
 * was passiert ist, können nachjustieren und mit Rückgängig zurück.
 *
 * Die Reihenfolge entspricht dem Tonwert-Kernel (utils/tonalKernel.js):
 * Belichtung → Helligkeit → Kontrast → Lichter/Schatten → Sättigung.
 */

/** Reglerwerte, die Auto-Verbessern setzt (gleiche Skalen wie die Sidebar). */
export interface AutoEnhanceValues {
  exposure: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
}

/** Neutrale Werte: Auto-Verbessern ändert nichts. */
export const AUTO_ENHANCE_NEUTRAL: Readonly<AutoEnhanceValues> = Object.freeze({
  exposure: 0,
  brightness: 100,
  contrast: 100,
  highlights: 0,
  shadows: 0,
  saturation: 100,
});

/** Kantenlänge, auf die das Bild für die Analyse verkleinert wird. */
export const AUTO_ENHANCE_SAMPLE_SIZE = 256;

// Luminanz-Gewichte wie im Tonwert-Kernel (Rec. 709)
const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

/** Zielhelligkeit der Mitteltöne (Median der Luminanz). */
const TARGET_MEDIAN = 0.46;
/** Nur ein Teil der rechnerischen Korrektur wird angewendet (natürlicher Look). */
const STRENGTH = 0.7;

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Belichtungsstufe wie im Kernel: ±50 entspricht ±2 Blendenstufen. */
function applyExposure(v: number, exposure: number): number {
  if (exposure === 0) return v;
  return linearToSrgb(clamp(srgbToLinear(v) * Math.pow(2, exposure / 25), 0, 1));
}

interface Histogram {
  /** Luminanz-Histogramm mit 256 Klassen */
  bins: Uint32Array;
  count: number;
  /** mittlere Buntheit (max − min der Kanäle), 0..1 */
  chroma: number;
}

function buildHistogram(data: Uint8ClampedArray): Histogram {
  const bins = new Uint32Array(256);
  let count = 0;
  let chromaSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // (fast) transparente Pixel zählen nicht
    if (data[i + 3] < 16) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    bins[Math.round(LUM_R * r + LUM_G * g + LUM_B * b)]++;
    chromaSum += Math.max(r, g, b) - Math.min(r, g, b);
    count++;
  }
  return { bins, count, chroma: count ? chromaSum / count / 255 : 0 };
}

/** Luminanz (0..1), unter der der Anteil `p` der Pixel liegt. */
function percentile(h: Histogram, p: number): number {
  const target = p * h.count;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += h.bins[i];
    if (acc >= target) return i / 255;
  }
  return 1;
}

/** Anteil der Pixel mit Luminanz unter bzw. über einer Schwelle. */
function fraction(h: Histogram, from: number, to: number): number {
  let n = 0;
  for (let i = Math.round(from * 255); i <= Math.round(to * 255); i++) n += h.bins[i];
  return h.count ? n / h.count : 0;
}

/**
 * Berechnet die Reglerwerte für Auto-Verbessern aus RGBA-Pixeldaten.
 * Reine Funktion ohne DOM; leere oder vollständig transparente Daten
 * ergeben die neutralen Werte.
 */
export function computeAutoEnhance(data: Uint8ClampedArray): AutoEnhanceValues {
  const h = buildHistogram(data);
  if (h.count === 0) return { ...AUTO_ENHANCE_NEUTRAL };

  const lo = percentile(h, 0.005);
  const hi = percentile(h, 0.995);
  const median = percentile(h, 0.5);

  // Einfarbige Fläche: nichts zu verbessern
  if (hi - lo < 0.02) return { ...AUTO_ENHANCE_NEUTRAL };

  // 1) Belichtung: Median Richtung Zielhelligkeit (im linearen Licht)
  let exposure = 0;
  const linMedian = Math.max(srgbToLinear(median), 1e-4);
  const stops = Math.log2(srgbToLinear(TARGET_MEDIAN) / linMedian);
  // Toleranz ±0,5 Blenden (Median etwa 0,38–0,55): ausgewogene Bilder bleiben unberührt
  if (Math.abs(stops) > 0.5) {
    exposure = Math.round(clamp(stops * 25 * STRENGTH, -25, 25));
  }

  // 2) Tonwertspreizung: Schwarz- und Weißpunkt nach der Belichtung auf 0..1
  //    ((v·b − 0,5)·c + 0,5 bildet [lo, hi] auf [0, 1] ab für
  //    c = (hi + lo) / (hi − lo) und b = 1 / (hi + lo))
  const loE = applyExposure(lo, exposure);
  const hiE = applyExposure(hi, exposure);
  let brightness = 100;
  let contrast = 100;
  if (hiE - loE < 0.97) {
    const c = (hiE + loE) / (hiE - loE);
    const b = 1 / (hiE + loE);
    contrast = Math.round(clamp(1 + (c - 1) * STRENGTH, 1, 1.4) * 100);
    brightness = Math.round(clamp(1 + (b - 1) * STRENGTH, 0.8, 1.3) * 100);
  }

  // 3) Lichter/Schatten: abgesoffene Tiefen aufhellen, helle Flächen dämpfen
  const darkShare = fraction(h, 0, 0.15);
  const brightShare = fraction(h, 0.9, 1);
  const shadows = darkShare > 0.2 ? Math.round(clamp((darkShare - 0.2) * 100, 5, 30)) : 0;
  const highlights = brightShare > 0.2 ? -Math.round(clamp((brightShare - 0.2) * 100, 5, 30)) : 0;

  // 4) Sättigung: flaue Farben leicht anheben, Graustufenbilder nicht anfassen
  let saturation = 100;
  if (h.chroma > 0.03 && h.chroma < 0.12) saturation = 115;
  else if (h.chroma >= 0.12 && h.chroma < 0.2) saturation = 108;

  return { exposure, brightness, contrast, highlights, shadows, saturation };
}

/** true, wenn die Werte nichts verändern (Bild war bereits ausgewogen). */
export function isNeutralEnhance(v: AutoEnhanceValues): boolean {
  return (Object.keys(AUTO_ENHANCE_NEUTRAL) as (keyof AutoEnhanceValues)[]).every(
    (k) => v[k] === AUTO_ENHANCE_NEUTRAL[k]
  );
}

/**
 * Liest ein verkleinertes Abbild der Bildquelle (längste Seite
 * AUTO_ENHANCE_SAMPLE_SIZE) und berechnet daraus die Reglerwerte.
 * Wirft bei nicht lesbaren Quellen (z. B. Cross-Origin) den Fehler weiter.
 */
export function autoEnhanceFromImage(
  image: HTMLImageElement | HTMLCanvasElement
): AutoEnhanceValues {
  const w = (image as HTMLImageElement).naturalWidth || image.width;
  const hgt = (image as HTMLImageElement).naturalHeight || image.height;
  if (!w || !hgt) return { ...AUTO_ENHANCE_NEUTRAL };
  const scale = Math.min(1, AUTO_ENHANCE_SAMPLE_SIZE / Math.max(w, hgt));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(hgt * scale));
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { ...AUTO_ENHANCE_NEUTRAL };
  ctx.drawImage(image, 0, 0, sw, sh);
  return computeAutoEnhance(ctx.getImageData(0, 0, sw, sh).data);
}
