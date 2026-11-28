import type { ImageInfo, Use } from './formatRules';

/** Editor-Einstellungen, die der Formatberater beim Öffnen im Editor setzt. */
export interface EditorPreset {
  /** Schlüssel aus FORMAT_INFO */
  format: 'webp' | 'png' | 'jpg' | 'tiff';
  /** Exportqualität 1–100, nur für verlustbehaftete Formate */
  quality?: number;
  /** Zielbreite in px; nur gesetzt, wenn das Bild breiter ist (es wird nie vergrößert) */
  width?: number;
  /** EXIF-Daten der Originaldatei übernehmen (wirkt bei PNG, JPG und WebP) */
  keepExif: boolean;
  /** Transparenz beim PNG-Export erhalten */
  transparent: boolean;
}

/** Breite nur setzen, wenn verkleinert wird. */
function capWidth(width: number, cap: number): number | undefined {
  return width > cap ? cap : undefined;
}

/**
 * Übersetzt die Empfehlung in Werte, die der Editor tatsächlich kann.
 * Muss zu recommendFormat/recommendFormatDe passen (Test prüft das Format).
 */
export function editorPresetFor(use: Use, img: ImageInfo): EditorPreset {
  const t = img.hasTransparency;
  switch (use) {
    case 'website':
      return {
        format: 'webp',
        quality: img.isPhoto ? 80 : 100,
        width: capWidth(img.width, 1920),
        keepExif: false,
        transparent: t,
      };
    case 'shop':
      return t
        ? { format: 'png', width: capWidth(img.width, 2000), keepExif: false, transparent: true }
        : {
            format: 'webp',
            quality: 85,
            width: capWidth(img.width, 2000),
            keepExif: false,
            transparent: false,
          };
    case 'logo':
      return { format: 'png', width: capWidth(img.width, 1024), keepExif: false, transparent: t };
    case 'social':
      // Zuschnitt auf 1080 × 1080 bzw. 1080 × 1350 wählt der Nutzer selbst (sonst verzerrt)
      return { format: 'jpg', quality: 90, keepExif: false, transparent: false };
    case 'email':
      return t
        ? { format: 'png', width: capWidth(img.width, 1600), keepExif: false, transparent: true }
        : {
            format: 'jpg',
            quality: 80,
            width: capWidth(img.width, 1600),
            keepExif: false,
            transparent: false,
          };
    case 'print':
      return { format: 'tiff', keepExif: false, transparent: false };
    case 'archive':
      return img.isPhoto
        ? { format: 'tiff', keepExif: false, transparent: false }
        : { format: 'png', keepExif: true, transparent: t };
  }
}
