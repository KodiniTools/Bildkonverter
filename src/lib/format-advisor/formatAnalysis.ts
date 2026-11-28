import type { ImageInfo } from './formatRules';

/**
 * Prüft jedes vierte Pixel: Alpha unter 250 gilt als Transparenz, mehr als
 * 1500 unterschiedliche Farben (5 Bit je Kanal) gelten als Foto, sonst Grafik.
 */
export function classifyPixels(
  pixels: Uint8ClampedArray
): Pick<ImageInfo, 'hasTransparency' | 'isPhoto'> {
  let hasTransparency = false;
  const colours = new Set<number>();
  for (let i = 0; i < pixels.length; i += 16) {
    if ((pixels[i + 3] ?? 255) < 250) hasTransparency = true;
    colours.add(
      (((pixels[i] ?? 0) >> 3) << 10) |
        (((pixels[i + 1] ?? 0) >> 3) << 5) |
        ((pixels[i + 2] ?? 0) >> 3)
    );
  }
  return { hasTransparency, isPhoto: colours.size > 1500 };
}

/** Analysiertes Bild des Formatberaters (Vorschau als Objekt-URL, vom Aufrufer freizugeben). */
export interface AdvisorImage extends ImageInfo {
  preview: string;
  file: File;
}

/**
 * Liest ein Bild lokal ein und klassifiziert es auf einer höchstens 1024 px
 * großen Kopie. Es wird nichts hochgeladen.
 */
export async function prepareAdvisorImage(file: File): Promise<AdvisorImage> {
  const preview = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = preview;
    await image.decode();
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      preview,
      file,
      width: image.naturalWidth,
      height: image.naturalHeight,
      ...classifyPixels(context.getImageData(0, 0, canvas.width, canvas.height).data),
    };
  } catch (error) {
    URL.revokeObjectURL(preview);
    throw error;
  }
}
