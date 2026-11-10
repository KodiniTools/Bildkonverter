/**
 * Transformationen des Einzelbildes im Editor (useTransform) und die
 * Schnittstelle, über die der Canvas-Renderer sie anwendet.
 */
import type { Ref } from 'vue';
import type { CornerOffsets, QuadCorners } from '@/utils/warpImage';

export interface TransformState {
  /** 0-100 % */
  opacity: number;
  /** -180 bis +180 Grad */
  rotation: number;
  /** 10-200 % */
  scale: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  /** 0-50 % (50 % = Kreis) */
  borderRadius: number;
  /** 0-20 px */
  borderWidth: number;
  borderColor: string;
  /** Pan-Offset in Pixeln (nur bei Zoom > 100 %) */
  panX: number;
  panY: number;
  shadowEnabled: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
  /** 0-100 % */
  shadowOpacity: number;
  /** -45 bis +45 Grad */
  skewX: number;
  skewY: number;
  /** Freies Verzerren aktiv (Eck-Griffe im Canvas) */
  distortEnabled: boolean;
  /** Normierte Eck-Versätze; null = unverzerrt */
  cornerOffsets: CornerOffsets | null;
  /** Umrissform nach „Verzerrung übernehmen“ (normiert 0..1); null = Rechteck */
  shapeQuad: QuadCorners | null;
}

/** Was der Canvas-Renderer von useTransform braucht */
export interface CanvasTransform {
  transforms: Ref<TransformState>;
  /**
   * Wendet die Transformationen auf den Kontext an; die zurückgegebene
   * Funktion nimmt sie wieder zurück (undefined ohne Canvas/Kontext).
   */
  applyToCanvas: (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ) => (() => void) | undefined;
}
