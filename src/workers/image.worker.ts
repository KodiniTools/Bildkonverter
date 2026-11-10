/**
 * Web Worker für die rechenintensiven Schritte des Editors:
 *
 * - tonal:  Tonwert-Anpassungen (Belichtung, Helligkeit, Kontrast, Lichter,
 *           Schatten, Sättigung), danach Detail-Anpassungen (Schärfen,
 *           Klarheit, Körnung) auf rohen RGBA-Pixeldaten
 * - encode: Bildkodierung (PNG/JPEG/WebP) über OffscreenCanvas.convertToBlob
 *
 * Läuft in einem eigenen Thread und blockiert die Oberfläche nicht. Pixel-
 * puffer und ImageBitmaps werden übertragen (Transferable, ohne Kopie).
 */
import { applyTonalAdjustments } from '@/utils/tonalKernel';
import { applyDetailAdjustments } from '@/utils/detailKernel';
import type {
  EncodeRequest,
  ImageWorkerReply,
  ImageWorkerRequest,
  TonalRequest,
} from '@/types/workerMessages';

/** Worker-Kontext (läuft mit der WebWorker-Lib, siehe tsconfig.worker.json) */
declare const self: DedicatedWorkerGlobalScope;

function reply(message: ImageWorkerReply, transfer: Transferable[] = []): void {
  self.postMessage(message, transfer);
}

function tonal({ id, buffer, width, height, filters }: TonalRequest): void {
  const data = new Uint8ClampedArray(buffer);
  applyTonalAdjustments(data, filters);
  applyDetailAdjustments(data, width, height, filters);
  reply({ id, buffer: data.buffer, width, height }, [data.buffer]);
}

async function encode({ id, bitmap, type, quality }: EncodeRequest): Promise<void> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas-2D-Kontext nicht verfügbar');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type, quality });
  reply({ id, blob });
}

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const request = event.data;
  try {
    switch (request.operation) {
      case 'tonal':
        tonal(request);
        break;
      case 'encode':
        await encode(request);
        break;
      default:
        throw new Error(`Unbekannte Operation: ${(request as { operation?: unknown }).operation}`);
    }
  } catch (error) {
    reply({ id: request.id, error: (error as Error | undefined)?.message || String(error) });
  }
};
