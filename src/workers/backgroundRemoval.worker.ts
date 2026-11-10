/**
 * Web Worker für „Hintergrund entfernen“: lädt das Segmentierungsmodell
 * (ISNet, ONNX) einmal, hält die Sitzung und berechnet je Auftrag eine Maske.
 * Läuft komplett im Browser; das Bild verlässt das Gerät nicht.
 *
 * Nachrichten an den Worker:
 *   { type: 'run', id, modelUrl, pixels: ArrayBuffer (RGBA, MODEL_SIZE²), wasmOnly? }
 * Antworten:
 *   { type: 'progress', id, phase: 'download' | 'init' | 'run', loaded?, total? }
 *   { type: 'result', id, mask: ArrayBuffer (MODEL_SIZE², 0..255), backend }
 *   { type: 'error', id, message }
 */
import * as ort from 'onnxruntime-web/webgpu';
import { MODEL_SIZE, toAlphaMask, toModelInput } from '@/lib/backgroundRemoval/segmentation';
import { logger } from '@/utils/logger';
// WebAssembly-Datei der Laufzeit ausdrücklich als Asset einbinden: Die
// automatische Auflösung über import.meta.url scheitert im Vite-Dev-Server.
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';
import type { RemovalPhase, RemovalReply, RemovalRunRequest } from '@/types/workerMessages';

/** Worker-Kontext (läuft mit der WebWorker-Lib, siehe tsconfig.worker.json) */
declare const self: DedicatedWorkerGlobalScope;

type ExecutionProvider = 'webgpu' | 'wasm';
interface ProgressData {
  phase: RemovalPhase;
  loaded?: number;
  total?: number;
}
type Report = (data: ProgressData) => void;

function reply(message: RemovalReply, transfer: Transferable[] = []): void {
  self.postMessage(message, transfer);
}

function errorMessage(error: unknown): string {
  return String((error as Error | undefined)?.message || error);
}

// Absolut machen: Der Worker läuft als Blob-URL, relativ dazu lässt sich
// nichts auflösen. Der Ursprung einer Blob-URL ist der der Seite.
ort.env.wasm.wasmPaths = { wasm: new URL(ortWasmUrl, self.location.origin).href };

/** Cache Storage: das Modell wird nur einmal heruntergeladen. */
const CACHE_NAME = 'bildkonverter-models-v1';

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let sessionKey: string | null = null;
let backend: ExecutionProvider = 'wasm';
/** Laufender Auftrag, damit auch unerwartete Fehler zugeordnet werden */
let activeId: number | null = null;

/** Lädt das Modell (aus dem Cache oder per Download mit Fortschritt). */
async function loadModel(url: string, report: Report): Promise<Uint8Array<ArrayBuffer>> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  } catch {
    // Cache Storage nicht verfügbar (z. B. privater Modus): ohne Cache weiter
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Modell nicht geladen (HTTP ${response.status})`);
  const total = Number(response.headers.get('content-length')) || 0;
  let bytes: Uint8Array<ArrayBuffer>;
  if (response.body && total) {
    const reader = response.body.getReader();
    bytes = new Uint8Array(total);
    let loaded = 0;
    let lastPercent = -1;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (loaded + value.length > bytes.length) {
        // Server liefert mehr als angekündigt (z. B. komprimiert): Puffer vergrößern
        const grown = new Uint8Array(Math.max(bytes.length * 2, loaded + value.length));
        grown.set(bytes.subarray(0, loaded));
        bytes = grown;
      }
      bytes.set(value, loaded);
      loaded += value.length;
      // Höchstens eine Meldung je Prozent
      const percent = Math.floor((loaded / total) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        report({ phase: 'download', loaded, total });
      }
    }
    bytes = bytes.subarray(0, loaded);
  } else {
    bytes = new Uint8Array(await response.arrayBuffer());
    report({ phase: 'download', loaded: bytes.length, total: bytes.length });
  }

  if (cache) {
    try {
      await cache.put(
        url,
        new Response(bytes, { headers: { 'content-type': 'application/octet-stream' } })
      );
    } catch {
      // Speicher voll o. Ä.: beim nächsten Mal eben neu laden
    }
  }
  return bytes;
}

async function createSession(
  url: string,
  wasmOnly: boolean,
  report: Report
): Promise<ort.InferenceSession> {
  const model = await loadModel(url, report);
  report({ phase: 'init' });
  // Ein Thread: Als Blob-Worker kann die Laufzeit keine eigenen Thread-Worker
  // starten (sie bliebe auf isolierten Seiten hängen). WebGPU ist ohnehin schneller.
  ort.env.wasm.numThreads = 1;
  const providers: ExecutionProvider[] =
    !wasmOnly && (self.navigator as { gpu?: unknown } | undefined)?.gpu
      ? ['webgpu', 'wasm']
      : ['wasm'];
  for (const provider of providers) {
    try {
      const session = await ort.InferenceSession.create(model, {
        executionProviders: [provider],
        graphOptimizationLevel: 'all',
      });
      backend = provider;
      return session;
    } catch (error) {
      if (provider === providers[providers.length - 1]) throw error;
    }
  }
  throw new Error('Kein Backend verfügbar');
}

function getSession(url: string, wasmOnly: boolean, report: Report): Promise<ort.InferenceSession> {
  const key = `${wasmOnly ? 'wasm' : 'auto'}|${url}`;
  if (!sessionPromise || sessionKey !== key) {
    sessionKey = key;
    sessionPromise = createSession(url, wasmOnly, report).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

async function infer(
  session: ort.InferenceSession,
  pixels: ArrayBuffer
): Promise<Uint8ClampedArray<ArrayBuffer>> {
  const input = new ort.Tensor('float32', toModelInput(new Uint8ClampedArray(pixels)), [
    1,
    3,
    MODEL_SIZE,
    MODEL_SIZE,
  ]);
  try {
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const output = outputs[session.outputNames[0]];
    const mask = toAlphaMask(output.data as Float32Array);
    output.dispose?.();
    return mask;
  } finally {
    input.dispose?.();
  }
}

async function run({ id, modelUrl, pixels, wasmOnly = false }: RemovalRunRequest): Promise<void> {
  const report: Report = (data) => reply({ type: 'progress', id, ...data });
  let session = await getSession(modelUrl, wasmOnly, report);
  report({ phase: 'run' });
  let mask: Uint8ClampedArray<ArrayBuffer>;
  try {
    mask = await infer(session, pixels);
  } catch (error) {
    // WebGPU kann erst beim Rechnen scheitern (Treiber, Speicher): einmal mit
    // WebAssembly wiederholen und künftig dabei bleiben.
    if (backend !== 'webgpu') throw error;
    logger.warn('[Hintergrund entfernen] WebGPU fehlgeschlagen, nutze WebAssembly:', error);
    sessionPromise = null;
    session = await getSession(modelUrl, true, report);
    report({ phase: 'run' });
    mask = await infer(session, pixels);
  }
  reply({ type: 'result', id, mask: mask.buffer, backend }, [mask.buffer]);
}

/** Unerwartete Fehler (z. B. aus GPU-Callbacks) dem laufenden Auftrag melden */
function reportUnexpected(error: unknown): void {
  if (activeId === null) return;
  reply({ type: 'error', id: activeId, message: errorMessage(error) });
}
self.addEventListener('unhandledrejection', (event) => reportUnexpected(event.reason));

self.onmessage = (event: MessageEvent<RemovalRunRequest | null | undefined>) => {
  const msg = event.data;
  if (msg?.type !== 'run') return;
  activeId = msg.id;
  run(msg)
    .catch((error) => {
      reply({ type: 'error', id: msg.id, message: errorMessage(error) });
    })
    .finally(() => {
      if (activeId === msg.id) activeId = null;
    });
};
