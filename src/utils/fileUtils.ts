/**
 * fileUtils - Datei- und Bild-Helfer für Upload, Vorschau und Anzeige
 *
 * Einzige Quelle für die Listen der unterstützten Bild-Endungen. Wird von
 * Editor (useImageLoader), Batch-Konverter und Format-Landingpages genutzt.
 */

/** RAW-Formate, die nur über das Backend verarbeitet werden können */
export const RAW_EXTENSIONS = [
  'cr2',
  'cr3',
  'nef',
  'arw',
  'dng',
  'raf',
  'orf',
  'rw2',
  'pef',
  'x3f',
];

/** Formate, die der Browser nicht nativ anzeigen kann (Vorschau über Backend) */
export const BACKEND_PREVIEW_EXTENSIONS = ['tif', 'tiff', 'heic', 'heif', ...RAW_EXTENSIONS];

/** Alle akzeptierten Bild-Endungen */
export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  ...BACKEND_PREVIEW_EXTENSIONS,
];

const BACKEND_PREVIEW_MIME_TYPES = ['image/tiff', 'image/heic', 'image/heif'];

/** Datei-Angaben, die die Prüfungen brauchen (File oder File-ähnliches Objekt) */
export type FileLike = Pick<File, 'name' | 'type'>;

function hasExtension(filename: string | undefined, extensions: readonly string[]): boolean {
  const ext = (filename || '').split('.').pop()!.toLowerCase();
  return extensions.includes(ext);
}

/**
 * Prüft, ob eine Datei ein Bild ist. Fallback auf die Endung, wenn der
 * MIME-Typ fehlt (häufig bei TIFF, HEIC und RAW).
 */
export function isImageFile(file: FileLike): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  return hasExtension(file.name, IMAGE_EXTENSIONS);
}

/**
 * Prüft, ob der Browser das Format nicht nativ darstellen kann und die
 * Vorschau über das Backend (PNG) erzeugt werden muss.
 */
export function needsBackendPreview(file: FileLike): boolean {
  if (BACKEND_PREVIEW_MIME_TYPES.includes(file.type)) return true;
  return hasExtension(file.name, BACKEND_PREVIEW_EXTENSIONS);
}

/** Liest eine Datei als Data-URL */
export function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL liefert immer einen String
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsDataURL(file);
  });
}

/** Lädt ein Image-Element aus einer URL (Data-URL oder Blob-URL) */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = src;
  });
}

/** Ermittelt Breite und Höhe eines Bildes aus einer URL */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.width, height: img.height };
}

/**
 * Formatiert Bytes als lesbare Größe (z.B. "1.5 MB")
 */
export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}
