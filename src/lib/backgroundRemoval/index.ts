/**
 * Hintergrund entfernen, komplett im Browser: Das Bild wird auf 1024 × 1024
 * verkleinert, im Worker segmentiert (ISNet über ONNX Runtime Web), und die
 * Maske wird geglättet auf die Originalgröße hochskaliert und als Alpha
 * angewendet. Bild und Modell verlassen das Gerät nicht.
 */
import { MODEL_SIZE, maskToRgba } from './segmentation';
import { logger } from '@/utils/logger';

/** Modell im Ordner public/models (wird mit der App ausgeliefert). */
export const MODEL_URL = `${import.meta.env.BASE_URL}models/isnet-general-use-fp16.onnx`;
/** Ungefähre Downloadgröße für Hinweise in der Oberfläche. */
export const MODEL_SIZE_MB = 90;

export type RemovalPhase = 'download' | 'init' | 'run';
export interface RemovalProgress {
  phase: RemovalPhase;
  /** 0..1 beim Download, sonst undefined */
  fraction?: number;
}

interface WorkerReply {
  type: 'progress' | 'result' | 'error';
  id: number;
  phase?: RemovalPhase;
  loaded?: number;
  total?: number;
  mask?: ArrayBuffer;
  backend?: string;
  message?: string;
}

let worker: Worker | null = null;
let nextId = 0;

/** Läuft das im Browser (Worker und WebAssembly vorhanden)? */
export function isBackgroundRemovalSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
}

/**
 * Der Worker wird eingebettet und per Blob-URL gestartet (wie der Bild-Worker):
 * Die Seite ist per Cross-Origin-Embedder-Policy isoliert, eine separate
 * Worker-Datei ohne eigenen COEP-Header würde der Browser blockieren.
 * Blob-Worker erben die Policy der Seite. Der Code (~120 KB) wird erst beim
 * ersten Aufruf nachgeladen.
 */
let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import('@/workers/backgroundRemoval.worker.js?worker&inline')
      .then(({ default: BackgroundRemovalWorker }) => {
        worker = new BackgroundRemovalWorker();
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }
  return workerPromise;
}

/** Beendet den Worker (gibt Modell und Speicher frei). */
export function disposeBackgroundRemoval(): void {
  worker?.terminate();
  worker = null;
  workerPromise = null;
}

function sourceSize(image: CanvasImageSource): { width: number; height: number } {
  const img = image as HTMLImageElement;
  const width = img.naturalWidth || (image as HTMLCanvasElement).width;
  const height = img.naturalHeight || (image as HTMLCanvasElement).height;
  return { width, height };
}

/** Bild auf MODEL_SIZE² verkleinert als RGBA-Puffer (wird an den Worker übertragen). */
function modelPixels(image: CanvasImageSource): ArrayBuffer {
  const input = document.createElement('canvas');
  input.width = MODEL_SIZE;
  input.height = MODEL_SIZE;
  const ctx = input.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas nicht verfügbar');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, MODEL_SIZE, MODEL_SIZE);
  return ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data.buffer;
}

/** Der Worker selbst ist abgestürzt (kein Fehler, den er noch melden konnte). */
export class WorkerCrashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerCrashError';
  }
}

/** Nach einem Absturz nur noch WebAssembly verwenden (bis zum Neuladen). */
let wasmOnly = false;

function crashMessage(event: Event): string {
  const e = event as ErrorEvent;
  const where = e.filename ? ` (${e.filename}:${e.lineno ?? 0})` : '';
  return `Worker abgestürzt: ${e.message || event.type || 'unbekannter Fehler'}${where}`;
}

async function runInWorker(
  pixels: ArrayBuffer,
  onProgress: ((p: RemovalProgress) => void) | undefined,
  modelUrl: string
): Promise<{ mask: Uint8ClampedArray; backend: string }> {
  const id = ++nextId;
  const target = await getWorker();
  // Absolut, weil relative Adressen in einem Blob-Worker nicht auflösbar sind
  const absoluteModelUrl = new URL(modelUrl, self.location.href).href;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener('message', onMessage);
      target.removeEventListener('error', onError);
      target.removeEventListener('messageerror', onError);
    };
    const onMessage = (event: MessageEvent<WorkerReply>) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.type === 'progress' && msg.phase) {
        onProgress?.({
          phase: msg.phase,
          fraction:
            msg.phase === 'download' && msg.total ? (msg.loaded ?? 0) / msg.total : undefined,
        });
      } else if (msg.type === 'result' && msg.mask) {
        cleanup();
        resolve({ mask: new Uint8ClampedArray(msg.mask), backend: msg.backend ?? 'wasm' });
      } else if (msg.type === 'error') {
        cleanup();
        reject(new Error(msg.message || 'Hintergrund entfernen fehlgeschlagen'));
      }
    };
    const onError = (event: Event) => {
      event.preventDefault();
      cleanup();
      disposeBackgroundRemoval();
      reject(new WorkerCrashError(crashMessage(event)));
    };
    target.addEventListener('message', onMessage);
    target.addEventListener('error', onError);
    target.addEventListener('messageerror', onError);
    target.postMessage({ type: 'run', id, modelUrl: absoluteModelUrl, pixels, wasmOnly }, [pixels]);
  });
}

/**
 * Maske (MODEL_SIZE²) für ein Bild aus dem Worker. Stürzt der Worker ab
 * (etwa im GPU-Treiber), wird einmal ohne WebGPU neu gerechnet.
 */
export async function segment(
  image: CanvasImageSource,
  onProgress?: (p: RemovalProgress) => void,
  modelUrl: string = MODEL_URL
): Promise<{ mask: Uint8ClampedArray; backend: string }> {
  try {
    return await runInWorker(modelPixels(image), onProgress, modelUrl);
  } catch (error) {
    if (!(error instanceof WorkerCrashError) || wasmOnly) throw error;
    logger.warn('[Hintergrund entfernen] Worker abgestürzt, neuer Versuch ohne WebGPU:', error);
    wasmOnly = true;
    return runInWorker(modelPixels(image), onProgress, modelUrl);
  }
}

/** Nur für Tests: Zustand nach einem Absturz zurücksetzen. */
export function resetBackgroundRemovalForTests(): void {
  wasmOnly = false;
  disposeBackgroundRemoval();
}

/**
 * Wendet eine Maske (MODEL_SIZE²) als Alpha auf das Bild in Originalgröße an.
 * Vorhandene Transparenz bleibt erhalten (Alpha wird multipliziert).
 */
export function applyMask(image: CanvasImageSource, mask: Uint8ClampedArray): HTMLCanvasElement {
  const { width, height } = sourceSize(image);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = MODEL_SIZE;
  maskCanvas.height = MODEL_SIZE;
  maskCanvas
    .getContext('2d')!
    .putImageData(new ImageData(maskToRgba(mask), MODEL_SIZE, MODEL_SIZE), 0, 0);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(maskCanvas, 0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

/** Entfernt den Hintergrund und liefert ein Canvas in Originalgröße mit Transparenz. */
export async function removeBackground(
  image: CanvasImageSource,
  onProgress?: (p: RemovalProgress) => void,
  modelUrl: string = MODEL_URL
): Promise<HTMLCanvasElement> {
  const { mask } = await segment(image, onProgress, modelUrl);
  return applyMask(image, mask);
}
