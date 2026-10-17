/**
 * Web Worker für die rechenintensiven Schritte des Editors:
 *
 * - tonal:  Tonwert-Anpassungen (Belichtung, Helligkeit, Kontrast, Lichter,
 *           Schatten, Sättigung) auf rohen RGBA-Pixeldaten
 * - encode: Bildkodierung (PNG/JPEG/WebP) über OffscreenCanvas.convertToBlob
 *
 * Läuft in einem eigenen Thread und blockiert die Oberfläche nicht. Pixel-
 * puffer und ImageBitmaps werden übertragen (Transferable, ohne Kopie).
 */
import { applyTonalAdjustments } from '@/utils/tonalKernel';

function tonal({ id, buffer, width, height, filters }) {
  const data = new Uint8ClampedArray(buffer);
  applyTonalAdjustments(data, filters);
  self.postMessage({ id, buffer: data.buffer, width, height }, [data.buffer]);
}

async function encode({ id, bitmap, type, quality }) {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type, quality });
  self.postMessage({ id, blob });
}

self.onmessage = async (event) => {
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
        throw new Error(`Unbekannte Operation: ${request.operation}`);
    }
  } catch (error) {
    self.postMessage({ id: request.id, error: error?.message || String(error) });
  }
};
