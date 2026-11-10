/**
 * Nachrichtenprotokoll zwischen Hauptthread und Web Workern.
 * Wird von beiden Seiten importiert (nur Typen, kein Laufzeitcode).
 */
import type { FilterValues } from './filters';

// ---------------------------------------------------------------------------
// Bild-Worker (src/workers/image.worker.ts, Client: src/lib/imageWorker.ts)
// ---------------------------------------------------------------------------

/** Tonwert- und Detail-Anpassungen auf rohen RGBA-Pixeln (Puffer wird übertragen) */
export interface TonalRequest {
  operation: 'tonal';
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  filters: FilterValues;
}

/** Kodierung über OffscreenCanvas.convertToBlob (Bitmap wird übertragen) */
export interface EncodeRequest {
  operation: 'encode';
  id: number;
  bitmap: ImageBitmap;
  type: string;
  quality?: number;
}

export type ImageWorkerRequest = TonalRequest | EncodeRequest;

/** Auftrag ohne id (die vergibt der Client) */
export type ImageWorkerJob = Omit<TonalRequest, 'id'> | Omit<EncodeRequest, 'id'>;

export interface TonalReply {
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

export interface EncodeReply {
  id: number;
  blob: Blob;
}

export interface ImageWorkerError {
  id: number;
  error: string;
}

export type ImageWorkerReply = TonalReply | EncodeReply | ImageWorkerError;

// ---------------------------------------------------------------------------
// Hintergrund entfernen (src/workers/backgroundRemoval.worker.ts,
// Client: src/lib/backgroundRemoval/index.ts)
// ---------------------------------------------------------------------------

export type RemovalPhase = 'download' | 'init' | 'run';

export interface RemovalRunRequest {
  type: 'run';
  id: number;
  /** Absolute URL (relative Adressen sind im Blob-Worker nicht auflösbar) */
  modelUrl: string;
  /** RGBA, MODEL_SIZE² */
  pixels: ArrayBuffer;
  wasmOnly?: boolean;
}

/** Antwort des Workers; `type` bestimmt, welche Felder gesetzt sind */
export interface RemovalReply {
  type: 'progress' | 'result' | 'error';
  id: number;
  phase?: RemovalPhase;
  loaded?: number;
  total?: number;
  /** MODEL_SIZE², 0..255 */
  mask?: ArrayBuffer;
  backend?: string;
  message?: string;
}
