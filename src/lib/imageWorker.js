/**
 * Client für den Bild-Worker (src/workers/image.worker.js).
 *
 * Ein einzelner Worker reicht: Der Editor bearbeitet ein Bild, die Aufträge
 * laufen nacheinander. Jeder Auftrag hat ein Timeout. Lässt sich der Worker
 * nicht starten oder stürzt er ab, liefern die Funktionen `null` und die
 * Aufrufer rechnen wie bisher im Hauptthread (identisches Ergebnis).
 */
import { logger } from '@/utils/logger';
// Eingebettet und per Blob-URL gestartet: Eine separate Worker-Datei würde
// unter Cross-Origin-Embedder-Policy einen eigenen Header brauchen;
// Blob-Worker erben die Policy der Seite (wie in Bilder-Batchbearbeitung).
import InlineImageWorker from '@/workers/image.worker.js?worker&inline';

export const WORKER_TIMEOUT_MS = 20000;

let worker = null;
let failed = false;
let nextId = 0;
const pending = new Map();

/** Unterstützt der Browser Worker mit OffscreenCanvas? */
export function isImageWorkerSupported() {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

/** Ist der Worker nutzbar (unterstützt und nicht ausgefallen)? */
export function isImageWorkerAvailable() {
  return isImageWorkerSupported() && !failed;
}

function rejectAll(reason) {
  for (const [id, entry] of pending) {
    clearTimeout(entry.timer);
    pending.delete(id);
    entry.reject(new Error(reason));
  }
}

function markFailed(reason) {
  if (!failed) logger.warn(`[ImageWorker] ${reason} – Bildverarbeitung im Hauptthread.`);
  failed = true;
  worker?.terminate();
  worker = null;
  rejectAll(reason);
}

function getWorker() {
  if (worker || failed) return worker;
  try {
    worker = new InlineImageWorker();
  } catch (error) {
    markFailed(`Worker nicht startbar: ${error?.message || error}`);
    return null;
  }
  worker.onmessage = (event) => {
    const { id } = event.data;
    const entry = pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(id);
    if (event.data.error) entry.reject(new Error(event.data.error));
    else entry.resolve(event.data);
  };
  worker.onerror = (event) => {
    event.preventDefault?.();
    markFailed(`Worker-Fehler: ${event.message || 'nicht ladbar'}`);
  };
  return worker;
}

function dispatch(message, transfer) {
  const target = getWorker();
  if (!target) return Promise.reject(new Error('Worker nicht verfügbar'));
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    // Ein hängender Worker würde alle folgenden Aufträge blockieren:
    // nach einem Timeout endgültig auf den Hauptthread wechseln
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Worker-Timeout nach ${WORKER_TIMEOUT_MS} ms`));
      markFailed(`Worker-Timeout nach ${WORKER_TIMEOUT_MS} ms`);
    }, WORKER_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    target.postMessage({ ...message, id }, transfer);
  });
}

/**
 * Tonwert-Anpassungen im Worker. Der Puffer von `imageData` wird übertragen
 * und ist danach im Hauptthread leer.
 * @param {ImageData} imageData
 * @param {object} filters
 * @returns {Promise<ImageData|null>} null = kein Worker, Aufrufer rechnet selbst
 */
export async function adjustInWorker(imageData, filters) {
  if (!isImageWorkerAvailable()) return null;
  const { width, height } = imageData;
  const buffer = imageData.data.buffer;
  try {
    const result = await dispatch(
      { operation: 'tonal', buffer, width, height, filters: { ...filters } },
      [buffer]
    );
    return new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);
  } catch (error) {
    logger.warn('[ImageWorker] Tonwert-Anpassung fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Kodiert einen Canvas im Worker. Der Inhalt wird beim Aufruf als ImageBitmap
 * erfasst; spätere Änderungen am Canvas wirken sich nicht mehr aus.
 * @param {HTMLCanvasElement} canvas
 * @param {string} type z. B. image/jpeg
 * @param {number} [quality] 0-1
 * @returns {Promise<Blob|null>} null = kein Worker oder Fehler
 */
export async function encodeInWorker(canvas, type, quality) {
  if (!isImageWorkerAvailable() || !canvas.width || !canvas.height) return null;
  try {
    const bitmap = await createImageBitmap(canvas);
    const result = await dispatch({ operation: 'encode', bitmap, type, quality }, [bitmap]);
    return result.blob;
  } catch (error) {
    logger.warn('[ImageWorker] Kodierung fehlgeschlagen:', error);
    return null;
  }
}

/** Nur für Tests: Worker beenden und Zustand zurücksetzen */
export function resetImageWorker() {
  rejectAll('Worker zurückgesetzt');
  worker?.terminate();
  worker = null;
  failed = false;
}
