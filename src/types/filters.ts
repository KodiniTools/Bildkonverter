/**
 * Filterwerte des Editors (Standardwerte: DEFAULT_FILTERS in useFilterManagement).
 * Alle Felder sind optional, weil die Kernels fehlende Werte mit ihrem
 * neutralen Standard ersetzen (z. B. brightness 100, exposure 0).
 */
export interface FilterValues {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  hue?: number;
  sepia?: number;
  grayscale?: number;
  invert?: number;
  exposure?: number;
  highlights?: number;
  shadows?: number;
  temperature?: number;
  tint?: number;
  /** Kurven als "x,y x,y …" (0..255); leer = linear (utils/curveKernel.ts) */
  curveRgb?: string;
  curveR?: string;
  curveG?: string;
  curveB?: string;
  sharpness?: number;
  clarity?: number;
  grain?: number;
  vignette?: number;
}

/** Pixeldaten, auf denen die Kernels arbeiten (ImageData.data oder Kopie). */
export type PixelData = Uint8ClampedArray;
