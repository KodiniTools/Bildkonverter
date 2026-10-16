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

export const MIN_QUALITY = 0.05;
export const TARGET_KB_MIN = 10;
export const TARGET_KB_MAX = 50000;
export const TARGET_KB_DEFAULT = 500;

const SEARCH_STEPS = 7;
const MAX_DOWNSCALE_ROUNDS = 5;
const MIN_EDGE_PX = 16;

const MIME_BY_FORMAT = { jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp' };

/**
 * Nur verlustbehaftete Formate, die der Browser selbst kodiert, lassen sich
 * über die Qualität auf eine Dateigröße bringen.
 * @param {string} format z. B. 'jpeg', 'webp', 'png'
 */
export function supportsTargetSize(format) {
  return Boolean(MIME_BY_FORMAT[String(format).toLowerCase()]);
}

/** @param {string} format */
export function targetMimeType(format) {
  return MIME_BY_FORMAT[String(format).toLowerCase()] || null;
}

/** @param {number} kb */
export function kbToBytes(kb) {
  return Math.max(1, Math.round(kb * 1024));
}

/** Eingabe auf den erlaubten KB-Bereich begrenzen; ungültig → null */
export function clampTargetKb(value) {
  const kb = Number(value);
  if (!Number.isFinite(kb) || kb <= 0) return null;
  return Math.min(TARGET_KB_MAX, Math.max(TARGET_KB_MIN, Math.round(kb)));
}

/**
 * Kopie mit weißem Hintergrund, wie beim JPEG-Export (JPEG hat keinen
 * Alphakanal; der Browser würde Transparenz sonst schwarz füllen).
 * @param {HTMLCanvasElement} source
 */
export function withWhiteBackground(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function scaledCanvas(source, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Höchste Qualität in [MIN_QUALITY, maxQuality], deren Datei passt */
async function searchQuality(canvas, mimeType, maxQuality, maxBytes, encode) {
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
 * @typedef {{ maxBytes: number, allowDownscale: boolean }} TargetSizeOptions
 * @typedef {{
 *   blob: Blob,
 *   quality: number,
 *   scale: number,
 *   width: number,
 *   height: number,
 *   reached: boolean,
 * }} TargetSizeResult
 */

/**
 * Kodiert `canvas` so, dass die Datei höchstens `options.maxBytes` groß ist.
 * Ist das nicht möglich, wird die kleinste erreichte Datei mit
 * `reached: false` geliefert.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} mimeType image/jpeg oder image/webp
 * @param {number} maxQuality gewählte Qualität 0-1 (wird nie überschritten)
 * @param {TargetSizeOptions} options
 * @param {(c: HTMLCanvasElement, type: string, q: number) => Promise<Blob>} [encode]
 * @returns {Promise<TargetSizeResult>}
 */
export async function encodeToTargetSize(
  canvas,
  mimeType,
  maxQuality,
  options,
  encode = canvasToBlob
) {
  const quality = Math.min(1, Math.max(MIN_QUALITY, maxQuality));
  let source = canvas;
  let scale = 1;
  const done = (fit, reached) => ({
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
 * @param {HTMLCanvasElement} canvas bereits vorbereitet (JPEG: weißer Hintergrund)
 * @param {string} format z. B. 'jpeg' oder 'webp'
 * @param {number} quality 0-1
 * @param {TargetSizeOptions|null} [target]
 * @param {Function} [encode]
 * @returns {Promise<TargetSizeResult>}
 */
export async function encodeForExport(canvas, format, quality, target, encode = canvasToBlob) {
  const mimeType = targetMimeType(format);
  if (!mimeType) throw new Error(`Zielgröße für Format ${format} nicht unterstützt`);
  if (target) return encodeToTargetSize(canvas, mimeType, quality, target, encode);
  const blob = await encode(canvas, mimeType, quality);
  return {
    blob,
    quality,
    scale: 1,
    width: canvas.width,
    height: canvas.height,
    reached: true,
  };
}
