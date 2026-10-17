import { logger } from '@/utils/logger';
import { applyTonalAdjustments } from './tonalKernel';
import { adjustInWorker, isImageWorkerAvailable } from '@/lib/imageWorker';

export { applyTonalAdjustments };
/**
 * imageAdjustments.js
 *
 * Echte, pixelbasierte Bildanpassungen anstelle der bisherigen
 * CSS-Filter-Näherungen. Belichtung, Lichter und Schatten wurden
 * zuvor nur über `brightness()`/`contrast()` "gefälscht" – das
 * veränderte immer das gesamte Bild statt gezielt Tonwertbereiche.
 *
 * Diese Datei berechnet die Anpassungen direkt auf den Pixeldaten:
 *
 *  Tonwert-Anpassungen (echt, per Pixel):
 *   - exposure   (Belichtung)  – linearer Licht-Gain in stops
 *   - brightness (Helligkeit)  – linearer Faktor
 *   - contrast   (Kontrast)    – um den Mittelwert 0.5
 *   - highlights (Lichter)     – nur helle Tonwerte (Luminanz-Maske)
 *   - shadows    (Schatten)    – nur dunkle Tonwerte (Luminanz-Maske)
 *   - saturation (Sättigung)   – luminanzerhaltend
 *
 *  Effekt-Filter (weiterhin als CSS-Filter beim Zeichnen, da nativ
 *  schneller/qualitativ gleichwertig):
 *   - blur, hue-rotate, sepia, grayscale, invert
 */

// Standardwerte der Tonwert-Anpassungen (kein Effekt)
const TONAL_DEFAULTS = {
  exposure: 0,
  brightness: 100,
  contrast: 100,
  highlights: 0,
  shadows: 0,
  saturation: 100,
};

// Einfacher Ein-Eintrag-Cache, damit renderImage() und
// renderImageForExport() (bzw. Crop) denselben Puffer wiederverwenden.
let _cache = { key: null, canvas: null };

/**
 * Prüft, ob mindestens eine echte Tonwert-Anpassung aktiv ist.
 * @param {Object} f - Filter-Objekt
 * @returns {boolean}
 */
export function hasTonalAdjustments(f) {
  return (
    (f.exposure ?? 0) !== TONAL_DEFAULTS.exposure ||
    (f.brightness ?? 100) !== TONAL_DEFAULTS.brightness ||
    (f.contrast ?? 100) !== TONAL_DEFAULTS.contrast ||
    (f.highlights ?? 0) !== TONAL_DEFAULTS.highlights ||
    (f.shadows ?? 0) !== TONAL_DEFAULTS.shadows ||
    (f.saturation ?? 100) !== TONAL_DEFAULTS.saturation
  );
}

/**
 * Baut den CSS-Filter-String für die reinen Effekt-Filter.
 * Diese werden beim Zeichnen auf dem Ziel-Canvas angewendet.
 * @param {Object} f - Filter-Objekt
 * @returns {string} CSS-Filter-String ('none' wenn keiner aktiv)
 */
export function buildEffectFilterString(f) {
  const parts = [];
  if ((f.blur ?? 0) > 0) parts.push(`blur(${f.blur}px)`);
  if ((f.hue ?? 0) !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  if ((f.sepia ?? 0) > 0) parts.push(`sepia(${f.sepia}%)`);
  if ((f.grayscale ?? 0) > 0) parts.push(`grayscale(${f.grayscale}%)`);
  if ((f.invert ?? 0) > 0) parts.push(`invert(${f.invert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Fallback-Filter-String (CSS-Näherung inkl. Tonwerte).
 * Wird nur genutzt, wenn die Pixelverarbeitung nicht möglich ist
 * (z. B. "tainted canvas" bei Cross-Origin-Bildern).
 * @param {Object} f - Filter-Objekt
 * @returns {string}
 */
export function buildApproxFilterString(f) {
  const exposureAdjust = 100 + (f.exposure ?? 0);
  const highlightsAdjust = 100 + (f.highlights ?? 0) * 0.5;
  const shadowsAdjust = 100 + (f.shadows ?? 0) * 0.3;
  const parts = [
    `brightness(${(f.brightness ?? 100) * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)`,
    `contrast(${(f.contrast ?? 100) * (shadowsAdjust / 100)}%)`,
    `saturate(${f.saturation ?? 100}%)`,
  ];
  const effect = buildEffectFilterString(f);
  if (effect !== 'none') parts.push(effect);
  return parts.join(' ');
}

function tonalSignature(f) {
  return [
    f.exposure ?? 0,
    f.brightness ?? 100,
    f.contrast ?? 100,
    f.highlights ?? 0,
    f.shadows ?? 0,
    f.saturation ?? 100,
  ].join(',');
}

// Zuletzt fertig berechnete Quelle je Bild (Quelle + Größe). Dient im
// asynchronen Modus als Platzhalter, bis der Worker das neue Ergebnis liefert.
let _lastGood = { imageKey: null, canvas: null };

// Asynchroner Modus: höchstens ein Worker-Auftrag gleichzeitig; neue Anfragen
// ersetzen eine wartende (nur die jüngste Filtereinstellung zählt).
let _inFlightKey = null;
let _queued = null;
const _readyListeners = new Set();

/**
 * Registriert einen Callback, der aufgerufen wird, sobald der Worker ein
 * neues Ergebnis geliefert hat (z. B. um die Vorschau neu zu zeichnen).
 * @param {() => void} listener
 * @returns {() => void} Abmelden
 */
export function onAdjustmentReady(listener) {
  _readyListeners.add(listener);
  return () => _readyListeners.delete(listener);
}

// Kurze Kennung je Bildobjekt statt der (oft mehrere MB langen) Data-URL im
// Cache-Schlüssel; eine geänderte Quelle desselben Elements gibt eine neue.
const _imageIds = new WeakMap();
let _nextImageId = 0;

function imageKeyOf(image, w, h) {
  const src = image.src || image._adjKey || '';
  let entry = _imageIds.get(image);
  if (!entry || entry.src !== src) {
    entry = { src, id: ++_nextImageId };
    _imageIds.set(image, entry);
  }
  return `${entry.id}|${w}x${h}`;
}

/** Bild in Originalauflösung auf einen Canvas zeichnen und Pixel lesen */
function readPixels(image, w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.drawImage(image, 0, 0, w, h);
  return { off, octx, imgData: octx.getImageData(0, 0, w, h) };
}

// Unveränderte Quellpixel des aktuellen Bildes (asynchroner Modus): Das Lesen
// (drawImage + getImageData) kostet bei großen Bildern deutlich mehr als das
// Kopieren eines Puffers und muss so nur einmal je Bild geschehen.
let _source = { imageKey: null, data: null };

function sourcePixels(image, w, h, imageKey) {
  if (_source.imageKey !== imageKey) {
    const { imgData } = readPixels(image, w, h);
    _source = { imageKey, data: imgData.data };
  }
  return new ImageData(_source.data.slice(), w, h);
}

function store(key, imageKey, canvas) {
  _cache = { key, canvas };
  _lastGood = { imageKey, canvas };
}

async function runWorkerJob(job) {
  _inFlightKey = job.key;
  try {
    const imgData = sourcePixels(job.image, job.w, job.h, job.imageKey);
    let adjusted = await adjustInWorker(imgData, job.filters);
    if (!adjusted) {
      // Kein Worker (mehr): im Hauptthread rechnen, Ergebnis identisch
      adjusted = sourcePixels(job.image, job.w, job.h, job.imageKey);
      applyTonalAdjustments(adjusted.data, job.filters);
    }
    const off = document.createElement('canvas');
    off.width = job.w;
    off.height = job.h;
    off.getContext('2d').putImageData(adjusted, 0, 0);
    // Ein inzwischen invalidierter Cache (neues Bild) wird nicht überschrieben
    if (job.generation === _generation) {
      store(job.key, job.imageKey, off);
      _readyListeners.forEach((listener) => listener());
    }
  } catch (e) {
    logger.warn('Pixelbasierte Anpassung im Worker nicht möglich:', e);
  } finally {
    _inFlightKey = null;
    const next = _queued;
    _queued = null;
    if (next && next.key !== _cache.key && next.generation === _generation) {
      runWorkerJob(next);
    }
  }
}

let _generation = 0;

/**
 * Liefert eine Zeichenquelle mit gebackenen Tonwert-Anpassungen sowie
 * den CSS-Filter-String für die verbleibenden Effekt-Filter.
 *
 * - Ohne aktive Tonwert-Anpassung wird das Originalbild zurückgegeben
 *   (schneller Pfad, kein getImageData).
 * - Bei Erfolg ist `el` ein Offscreen-Canvas in Bild-Auflösung.
 * - Schlägt die Pixelverarbeitung fehl (tainted canvas), wird auf die
 *   CSS-Näherung zurückgefallen, damit nichts kaputtgeht.
 * - Mit `{ async: true }` (Live-Vorschau) rechnet der Web Worker. Bis sein
 *   Ergebnis da ist, wird das zuletzt berechnete Ergebnis desselben Bildes
 *   gezeigt (sonst die CSS-Näherung); danach meldet onAdjustmentReady.
 *   Ohne Worker oder ohne `async` (Export, Zuschnitt) wird wie bisher
 *   synchron gerechnet.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image
 * @param {Object} filters
 * @param {{ async?: boolean }} [options]
 * @returns {{ el: HTMLImageElement|HTMLCanvasElement, cssFilter: string }}
 */
export function getAdjustedImage(image, filters, { async = false } = {}) {
  const effect = buildEffectFilterString(filters);

  if (!image || !hasTonalAdjustments(filters)) {
    return { el: image, cssFilter: effect };
  }

  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  if (!w || !h) {
    return { el: image, cssFilter: effect };
  }

  const imageKey = imageKeyOf(image, w, h);
  const key = `${imageKey}|${tonalSignature(filters)}`;
  if (_cache.key === key && _cache.canvas) {
    return { el: _cache.canvas, cssFilter: effect };
  }

  if (async && isImageWorkerAvailable()) {
    const job = { key, imageKey, image, w, h, filters: { ...filters }, generation: _generation };
    if (_inFlightKey === null) runWorkerJob(job);
    else _queued = _inFlightKey === key ? null : job;
    const placeholder = _lastGood.imageKey === imageKey ? _lastGood.canvas : null;
    return placeholder
      ? { el: placeholder, cssFilter: effect }
      : { el: image, cssFilter: buildApproxFilterString(filters) };
  }

  try {
    const { off, octx, imgData } = readPixels(image, w, h);
    applyTonalAdjustments(imgData.data, filters);
    octx.putImageData(imgData, 0, 0);

    store(key, imageKey, off);
    return { el: off, cssFilter: effect };
  } catch (e) {
    // z. B. SecurityError bei Cross-Origin-Bildern → CSS-Näherung
    logger.warn('Pixelbasierte Anpassung nicht möglich, nutze CSS-Näherung:', e);
    return { el: image, cssFilter: buildApproxFilterString(filters) };
  }
}

/**
 * Invalidiert den internen Cache (z. B. wenn ein neues Bild geladen wird).
 */
export function clearAdjustmentCache() {
  _cache = { key: null, canvas: null };
  _lastGood = { imageKey: null, canvas: null };
  _source = { imageKey: null, data: null };
  _queued = null;
  _generation++;
}

export default {
  hasTonalAdjustments,
  buildEffectFilterString,
  buildApproxFilterString,
  applyTonalAdjustments,
  getAdjustedImage,
  clearAdjustmentCache,
  onAdjustmentReady,
};
