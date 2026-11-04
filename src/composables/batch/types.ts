import type { SelectOption } from '@/components/ui/types';

/** Zielformate der Batch-Konvertierung */
export const BATCH_FORMAT_OPTIONS: SelectOption[] = [
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'gif', label: 'GIF' },
  { value: 'bmp', label: 'BMP' },
  { value: 'tiff', label: 'TIFF' },
  { value: 'pdf', label: 'PDF' },
  { value: 'svg', label: 'SVG' },
];

export interface BatchSettings {
  format: string;
  /** 1–100 */
  quality: number;
  width: number | null;
  height: number | null;
  maintainAspect: boolean;
  /** Präfix für Dateinamen */
  prefix: string;
  /** 'single' = jedes Bild als eigenes PDF, 'merged' = alle in einem PDF */
  pdfMode: 'single' | 'merged';
  /** EXIF der Originale übernehmen (Standard: entfernen) */
  keepExif: boolean;
}

export type BatchFileStatus = 'pending' | 'processing' | 'completed' | 'error';

/** Datei in der Batch-Liste (siehe useBatchConversion.addFiles) */
export interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  width: number;
  height: number;
  status: BatchFileStatus;
  /** 0–100 */
  progress: number;
  processedPreview: string | null;
  processedBlob: Blob | null;
  processedSize: number;
  error: string | null;
}

export function defaultBatchSettings(): BatchSettings {
  return {
    format: 'jpg',
    quality: 80,
    width: null,
    height: null,
    maintainAspect: true,
    prefix: '',
    pdfMode: 'single',
    keepExif: false,
  };
}
