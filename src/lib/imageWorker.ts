/**
 * Client für den Bild-Worker (src/workers/image.worker.ts).
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
import InlineImageWorker from '@/workers/image.worker.ts?worker&inline';
import type { FilterValues } from '@/types/filters';
import type {
  EncodeReply,
  ImageWorkerJob,
  ImageWorkerReply,
  TonalReply,
} from '@/types/workerMessages';

interface PendingEntry {
  resolve: (reply: ImageWorkerReply) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export const WORKER_TIMEOUT_MS = 20000;

let worker: Worker | null = null;
let failed = false;
let nextId = 0;
const pending = new Map<number, PendingEntry>();

/** Unterstützt der Browser Worker mit OffscreenCanvas? */
export function isImageWorkerSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

/** Ist der Worker nutzbar (unterstützt und nicht ausgefallen)? */
export function isImageWorkerAvailable(): boolean {
  return isImageWorkerSupported() && !failed;
}

function rejectAll(reason: string): void {
  for (const [id, entry] of pending) {
    clearTimeout(entry.timer);
    pending.delete(id);
    entry.reject(new Error(reason));
  }
}

function markFailed(reason: string): void {
  if (!failed) logger.warn(`[ImageWorker] ${reason} – Bildverarbeitung im Hauptthread.`);
  failed = true;
  worker?.terminate();
  worker = null;
  rejectAll(reason);
}

function getWorker(): Worker | null {
  if (worker || failed) return worker;
  try {
    worker = new InlineImageWorker();
  } catch (error) {
    markFailed(`Worker nicht startbar: ${(error as Error | undefined)?.message || error}`);
    return null;
  }
  worker.onmessage = (event: MessageEvent<ImageWorkerReply>) => {
    const { id } = event.data;
    const entry = pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(id);
    if ('error' in event.data && event.data.error) entry.reject(new Error(event.data.error));
    else entry.resolve(event.data);
  };
  worker.onerror = (event: ErrorEvent) => {
    event.preventDefault?.();
    markFailed(`Worker-Fehler: ${event.message || 'nicht ladbar'}`);
  };
  return worker;
}

/** Sendet einen Auftrag; R ist die erwartete Antwort der Operation */
function dispatch<R extends ImageWorkerReply>(
  message: ImageWorkerJob,
  transfer: Transferable[]
): Promise<R> {
  const target = getWorker();
  if (!target) return Promise.reject(new Error('Worker nicht verfügbar'));
  const id = ++nextId;
  return new Promise<R>((resolve, reject) => {
    // Ein hängender Worker würde alle folgenden Aufträge blockieren:
    // nach einem Timeout endgültig auf den Hauptthread wechseln
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Worker-Timeout nach ${WORKER_TIMEOUT_MS} ms`));
      markFailed(`Worker-Timeout nach ${WORKER_TIMEOUT_MS} ms`);
    }, WORKER_TIMEOUT_MS);
    pending.set(id, { resolve: (reply) => resolve(reply as R), reject, timer });
    target.postMessage({ ...message, id }, transfer);
  });
}

/**
 * Tonwert-Anpassungen im Worker. Der Puffer von `imageData` wird übertragen
 * und ist danach im Hauptthread leer.
 * @returns null = kein Worker, Aufrufer rechnet selbst
 */
export async function adjustInWorker(
  imageData: ImageData,
  filters: FilterValues
): Promise<ImageData | null> {
  if (!isImageWorkerAvailable()) return null;
  const { width, height } = imageData;
  const buffer = imageData.data.buffer;
  try {
    const result = await dispatch<TonalReply>(
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
 * @param type z. B. image/jpeg
 * @param quality 0-1
 * @returns null = kein Worker oder Fehler
 */
export async function encodeInWorker(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  if (!isImageWorkerAvailable() || !canvas.width || !canvas.height) return null;
  try {
    const bitmap = await createImageBitmap(canvas);
    const result = await dispatch<EncodeReply>({ operation: 'encode', bitmap, type, quality }, [
      bitmap,
    ]);
    return result.blob;
  } catch (error) {
    logger.warn('[ImageWorker] Kodierung fehlgeschlagen:', error);
    return null;
  }
}

/** Nur für Tests: Worker beenden und Zustand zurücksetzen */
export function resetImageWorker(): void {
  rejectAll('Worker zurückgesetzt');
  worker?.terminate();
  worker = null;
  failed = false;
}
