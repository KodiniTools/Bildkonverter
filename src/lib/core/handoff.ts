import { logger } from '@/utils/logger';
import { context2d } from '@/utils/canvas2d';
/**
 * KodiniTools Cross-Tool Handoff Protocol
 *
 * Enables image transfer between tools on kodinitools.com via localStorage.
 * All tools share the same origin, so localStorage acts as the transfer channel.
 *
 * Flow:
 *   1. Sender calls `prepareHandoff()` -> serializes images -> writes to localStorage
 *   2. Sender navigates to target tool with `?handoff=kodinitools` param
 *   3. Receiver calls `checkHandoff()` on mount -> reads localStorage -> shows banner
 *   4. User accepts -> Receiver calls `consumeHandoff()` -> imports images -> cleans up
 *
 * Constraints:
 *   - localStorage limit: ~5 MB (conservative, varies by browser)
 *   - Images are compressed to JPEG 0.7 quality, max 1200px longest side
 *   - Max 20 images per handoff
 *   - Handoff expires after 5 minutes
 */

const STORAGE_KEY = 'kodinitools-handoff';
const MAX_IMAGES = 20;
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface HandoffImage {
  name: string;
  dataUrl: string;
  /** Beim Empfang nicht geprüft (nur name und dataUrl werden validiert) */
  width: number;
  height: number;
}

export interface HandoffPayload {
  id: string;
  source: string;
  target: string;
  timestamp: number;
  images: HandoffImage[];
}

export interface HandoffSource {
  name: string;
  canvas: HTMLCanvasElement;
}

const TARGET_URLS: Readonly<Record<string, string>> = {
  bildkonverter: '/bildkonverter/gallery',
  collagemaker: '/collagemaker/editor',
  'color-extractor': '/kodini-color-extractor/app',
  visualizer: '/visualizer/app',
};

/**
 * Downscale a canvas to fit within MAX_DIMENSION and return a compressed dataUrl.
 */
function compressCanvas(canvas: HTMLCanvasElement): Omit<HandoffImage, 'name'> {
  let { width, height } = canvas;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const tmp = document.createElement('canvas');
  tmp.width = width;
  tmp.height = height;
  const ctx = context2d(tmp);
  ctx.drawImage(canvas, 0, 0, width, height);

  return {
    dataUrl: tmp.toDataURL('image/jpeg', JPEG_QUALITY),
    width,
    height,
  };
}

/**
 * SENDER: Prepare and store a handoff payload, then return the target URL.
 *
 * @param target - Target tool key (e.g. 'bildkonverter', 'collagemaker')
 * @param source - Source tool identifier
 * @returns The full URL to navigate to, or null if handoff failed
 */
export function prepareHandoff(
  canvases: readonly HandoffSource[],
  target: string,
  source = 'unknown'
): string | null {
  const limited = canvases.slice(0, MAX_IMAGES);

  const images: HandoffImage[] = limited.map(({ name, canvas }) => {
    const { dataUrl, width, height } = compressCanvas(canvas);
    return { name, dataUrl, width, height };
  });

  const payload: HandoffPayload = {
    id: `hoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source,
    target,
    timestamp: Date.now(),
    images,
  };

  try {
    let json = JSON.stringify(payload);

    // Safety check: warn if payload is huge (> 4 MB)
    if (json.length > 4 * 1024 * 1024) {
      logger.warn('[Handoff] Payload too large, reducing image count');
      payload.images = images.slice(0, Math.max(1, Math.floor(images.length / 2)));
      json = JSON.stringify(payload);
    }

    localStorage.setItem(STORAGE_KEY, json);

    const targetPath = TARGET_URLS[target];
    if (!targetPath) {
      logger.error(`[Handoff] Unknown target: ${target}`);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const url = new URL(targetPath, window.location.origin);
    url.searchParams.set('handoff', 'kodinitools');
    return url.toString();
  } catch (e) {
    logger.error('[Handoff] Failed to store payload:', e);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp|gif);base64,/;

/**
 * Filtert die Bilder eines Payloads auf gültige Einträge mit Bild-Data-URL.
 */
function validImages(payload: unknown): HandoffImage[] {
  const raw = (payload as { images?: unknown } | null | undefined)?.images;
  const images: unknown[] = payload && Array.isArray(raw) ? raw : [];
  return images.filter((img): img is HandoffImage => {
    if (!img || typeof img !== 'object') return false;
    const candidate = img as { name?: unknown; dataUrl?: unknown };
    return (
      typeof candidate.name === 'string' &&
      typeof candidate.dataUrl === 'string' &&
      DATA_URL_PATTERN.test(candidate.dataUrl)
    );
  });
}

/**
 * RECEIVER: Check if a handoff is waiting in localStorage.
 * Checks localStorage directly — no URL query param required.
 * This makes the receiver robust regardless of how the sender navigates.
 *
 * @returns The handoff payload if valid and not expired, otherwise null
 */
export function checkHandoff(): HandoffPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);

    // Check expiry
    if (typeof payload.timestamp !== 'number' || Date.now() - payload.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Nur gültige Bild-Data-URLs annehmen; der Speicher ist für alle Tools der Domain beschreibbar
    const images = validImages(payload);
    if (images.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return { ...payload, images };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * RECEIVER: Consume (accept) the handoff and clean up.
 * @returns The images ready for import, or null on failure
 */
export function consumeHandoff(): HandoffImage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    localStorage.removeItem(STORAGE_KEY);
    cleanHandoffUrl();

    // Kein erneuter Ablauf-Check: der Nutzer hat das Banner bereits gesehen
    const images = validImages(payload);
    return images.length ? images : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * RECEIVER: Dismiss the handoff without importing.
 */
export function dismissHandoff(): void {
  localStorage.removeItem(STORAGE_KEY);
  cleanHandoffUrl();
}

/**
 * Remove the handoff query param from the URL if present.
 */
function cleanHandoffUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('handoff')) {
      url.searchParams.delete('handoff');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Ignore URL cleanup errors
  }
}

/**
 * Convert a HandoffImage dataUrl back to a canvas element.
 */
export function handoffImageToCanvas(
  img: Pick<HandoffImage, 'name' | 'dataUrl'>
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${img.name}`));
    image.src = img.dataUrl;
  });
}
