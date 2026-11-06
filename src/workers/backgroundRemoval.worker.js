/**
 * Web Worker für „Hintergrund entfernen“: lädt das Segmentierungsmodell
 * (ISNet, ONNX) einmal, hält die Sitzung und berechnet je Auftrag eine Maske.
 * Läuft komplett im Browser; das Bild verlässt das Gerät nicht.
 *
 * Nachrichten an den Worker:
 *   { type: 'run', id, modelUrl, pixels: ArrayBuffer (RGBA, MODEL_SIZE²) }
 * Antworten:
 *   { type: 'progress', id, phase: 'download' | 'init' | 'run', loaded?, total? }
 *   { type: 'result', id, mask: ArrayBuffer (MODEL_SIZE², 0..255), backend }
 *   { type: 'error', id, message }
 */
import * as ort from 'onnxruntime-web/webgpu';
import { MODEL_SIZE, toAlphaMask, toModelInput } from '@/lib/backgroundRemoval/segmentation';
// WebAssembly-Datei der Laufzeit ausdrücklich als Asset einbinden: Die
// automatische Auflösung über import.meta.url scheitert im Vite-Dev-Server.
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';

ort.env.wasm.wasmPaths = { wasm: ortWasmUrl };

/** Cache Storage: das Modell wird nur einmal heruntergeladen. */
const CACHE_NAME = 'bildkonverter-models-v1';

let sessionPromise = null;
let sessionUrl = null;
let backend = 'wasm';

/** Lädt das Modell (aus dem Cache oder per Download mit Fortschritt). */
async function loadModel(url, report) {
  let cache = null;
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
  let bytes;
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

async function createSession(url, report) {
  const model = await loadModel(url, report);
  report({ phase: 'init' });
  // Ohne Cross-Origin-Isolation sind keine Threads möglich
  ort.env.wasm.numThreads = self.crossOriginIsolated
    ? Math.min(4, self.navigator?.hardwareConcurrency || 1)
    : 1;
  const providers = self.navigator?.gpu ? ['webgpu', 'wasm'] : ['wasm'];
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

function getSession(url, report) {
  if (!sessionPromise || sessionUrl !== url) {
    sessionUrl = url;
    sessionPromise = createSession(url, report).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

async function run({ id, modelUrl, pixels }) {
  const report = (data) => self.postMessage({ type: 'progress', id, ...data });
  const session = await getSession(modelUrl, report);
  report({ phase: 'run' });
  const input = new ort.Tensor('float32', toModelInput(new Uint8ClampedArray(pixels)), [
    1,
    3,
    MODEL_SIZE,
    MODEL_SIZE,
  ]);
  const outputs = await session.run({ [session.inputNames[0]]: input });
  const output = outputs[session.outputNames[0]];
  const mask = toAlphaMask(output.data);
  input.dispose?.();
  output.dispose?.();
  self.postMessage({ type: 'result', id, mask: mask.buffer, backend }, [mask.buffer]);
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg?.type !== 'run') return;
  run(msg).catch((error) => {
    self.postMessage({ type: 'error', id: msg.id, message: String(error?.message || error) });
  });
};
