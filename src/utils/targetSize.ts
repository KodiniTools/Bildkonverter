/**
 * Ziel-Dateigröße beim Export (z. B. „max. 500 KB“) und Größenschätzung.
 *
 * Vorgehen: Erst mit der gewählten Qualität kodieren. Ist die Datei zu groß,
 * sucht eine Binärsuche die höchste Qualität, die noch passt. Reicht selbst
 * die Mindestqualität nicht, wird – nur wenn erlaubt – das Bild schrittweise
 * verkleinert. Export und Schätzung nutzen dieselbe Funktion, damit die
 * Vorschau dem späteren Ergebnis entspricht.
 */
import { canvasToBlob } from './conversionUtils';
import { exifOverhead, withExif } from './exif';
import { context2d } from './canvas2d';

export const MIN_QUALITY = 0.05;
export const TARGET_KB_MIN = 10;
export const TARGET_KB_MAX = 50000;
export const TARGET_KB_DEFAULT = 500;

const SEARCH_STEPS = 7;
const MAX_DOWNSCALE_ROUNDS = 5;
const MIN_EDGE_PX = 16;

const MIME_BY_FORMAT: Readonly<Record<string, string>> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

/** Kodiert einen Canvas (Standard: canvasToBlob aus conversionUtils) */
export type EncodeFn = (canvas: HTMLCanvasElement, type: string, quality: number) => Promise<Blob>;

export interface TargetSizeOptions {
  maxBytes: number;
  allowDownscale: boolean;
}

export interface TargetSizeResult {
  blob: Blob;
  quality: number;
  scale: number;
  width: number;
  height: number;
  reached: boolean;
}

interface QualityFit {
  blob: Blob;
  quality: number;
}

/**
 * Nur verlustbehaftete Formate, die der Browser selbst kodiert, lassen sich
 * über die Qualität auf eine Dateigröße bringen.
 * @param format z. B. 'jpeg', 'webp', 'png'
 */
export function supportsTargetSize(format: unknown): boolean {
  return Boolean(MIME_BY_FORMAT[String(format).toLowerCase()]);
}

export function targetMimeType(format: unknown): string | null {
  return MIME_BY_FORMAT[String(format).toLowerCase()] || null;
}

export function kbToBytes(kb: number): number {
  return Math.max(1, Math.round(kb * 1024));
}

/** Eingabe auf den erlaubten KB-Bereich begrenzen; ungültig → null */
export function clampTargetKb(value: unknown): number | null {
  const kb = Number(value);
  if (!Number.isFinite(kb) || kb <= 0) return null;
  return Math.min(TARGET_KB_MAX, Math.max(TARGET_KB_MIN, Math.round(kb)));
}

/**
 * Kopie mit weißem Hintergrund, wie beim JPEG-Export (JPEG hat keinen
 * Alphakanal; der Browser würde Transparenz sonst schwarz füllen).
 */
export function withWhiteBackground(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = context2d(canvas);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function scaledCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Höchste Qualität in [MIN_QUALITY, maxQuality], deren Datei passt */
async function searchQuality(
  canvas: HTMLCanvasElement,
  mimeType: string,
  maxQuality: number,
  maxBytes: number,
  encode: EncodeFn
): Promise<{ fit: QualityFit | null; smallest: Blob }> {
  const top = await encode(canvas, mimeType, maxQuality);
  if (top.size <= maxBytes) return { fit: { blob: top, quality: maxQuality }, smallest: top };

  const bottom = await encode(canvas, mimeType, MIN_QUALITY);
  if (bottom.size > maxBytes) return { fit: null, smallest: bottom };

  let lo = MIN_QUALITY;
  let hi = maxQuality;
  let best = { blob: bottom, quality: MIN_QUALITY };
  for (let i = 0; i < SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encode(canvas, mimeType, mid);
    if (blob.size <= maxBytes) {
      best = { blob, quality: mid };
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { fit: best, smallest: bottom };
}

/**
 * Kodiert `canvas` so, dass die Datei höchstens `options.maxBytes` groß ist.
 * Ist das nicht möglich, wird die kleinste erreichte Datei mit
 * `reached: false` geliefert.
 *
 * @param mimeType image/jpeg oder image/webp
 * @param maxQuality gewählte Qualität 0-1 (wird nie überschritten)
 */
export async function encodeToTargetSize(
  canvas: HTMLCanvasElement,
  mimeType: string,
  maxQuality: number,
  options: TargetSizeOptions,
  encode: EncodeFn = canvasToBlob
): Promise<TargetSizeResult> {
  const quality = Math.min(1, Math.max(MIN_QUALITY, maxQuality));
  let source = canvas;
  let scale = 1;
  const done = (fit: QualityFit, reached: boolean): TargetSizeResult => ({
    ...fit,
    scale,
    width: source.width,
    height: source.height,
    reached,
  });

  let { fit, smallest } = await searchQuality(source, mimeType, quality, options.maxBytes, encode);
  if (fit) return done(fit, true);

  if (options.allowDownscale) {
    for (let round = 0; round < MAX_DOWNSCALE_ROUNDS; round++) {
      // Dateigröße wächst etwa mit der Pixelzahl: Kantenlänge mit √(Ziel/Ist) skalieren
      const factor = Math.min(0.9, Math.sqrt(options.maxBytes / smallest.size) * 0.95);
      const nextScale = scale * factor;
      if (Math.min(canvas.width, canvas.height) * nextScale < MIN_EDGE_PX) break;
      scale = nextScale;
      source = scaledCanvas(canvas, scale);
      ({ fit, smallest } = await searchQuality(
        source,
        mimeType,
        quality,
        options.maxBytes,
        encode
      ));
      if (fit) return done(fit, true);
    }
  }

  return done({ blob: smallest, quality: MIN_QUALITY }, false);
}

/**
 * Kodiert ein Export-Canvas mit oder ohne Zielgröße. Ohne Zielgröße (oder bei
 * nicht unterstützten Formaten) genau eine Kodierung mit der gewählten Qualität.
 *
 * @param canvas bereits vorbereitet (JPEG: weißer Hintergrund)
 * @param format z. B. 'jpeg' oder 'webp'
 * @param quality 0-1
 * @param exif normalisierter EXIF-Block (exif.js); wird eingefügt, die
 *   Zielgröße hält dafür Platz frei
 */
export async function encodeForExport(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
  target?: TargetSizeOptions | null,
  encode: EncodeFn = canvasToBlob,
  exif: Uint8Array | null = null
): Promise<TargetSizeResult> {
  const mimeType = targetMimeType(format);
  if (!mimeType) throw new Error(`Zielgröße für Format ${format} nicht unterstützt`);
  let result: TargetSizeResult;
  if (target) {
    const reserve = exif ? exifOverhead(exif) : 0;
    result = await encodeToTargetSize(
      canvas,
      mimeType,
      quality,
      { ...target, maxBytes: Math.max(1, target.maxBytes - reserve) },
      encode
    );
  } else {
    const blob = await encode(canvas, mimeType, quality);
    result = {
      blob,
      quality,
      scale: 1,
      width: canvas.width,
      height: canvas.height,
      reached: true,
    };
  }
  if (exif) {
    result.blob = await withExif(result.blob, exif);
    result.reached = !target || result.blob.size <= target.maxBytes;
  }
  return result;
}
