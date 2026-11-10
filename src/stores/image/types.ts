import type { Ref, ShallowRef } from 'vue';
import type { DrawTool, Shape } from '@/utils/shapes';

/** Form-Objekt und Zeichenwerkzeuge: Modell in utils/shapes */
export type { DrawTool, Shape };

/** Text-Ebene; content/txt und fontSize/size werden synchron gehalten (alte Felder) */
export interface StoreText {
  id: string | number;
  content?: string;
  txt?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  size?: number;
  fontFamily?: string;
  color?: string;
  opacity?: number;
  rotation?: number;
  strokeWidth?: number;
  strokeColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
  [key: string]: unknown;
}

export interface DrawSetting {
  color: string;
  width: number | null;
  opacity: number;
}

/** Bild-Ebene im Collage-/Ebenen-Modus */
export interface ImageLayer {
  id: string | number;
  image: HTMLImageElement | null;
  url: string;
  thumbnail?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  filters: Record<'brightness' | 'contrast' | 'saturation' | 'grayscale', number> &
    Record<string, number>;
  border: { width: number; color: string; radius: number };
  shadow: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
  flipX: boolean;
  flipY: boolean;
}

/** Bild aus Galerie oder Handoff, aus dem eine Ebene entsteht */
export interface LayerSource {
  url: string;
  name?: string;
}

/** Von useEditorHistory registrierte Historie */
export interface HistoryHandlers {
  saveHistory: (description?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  historyIndex: Ref<number>;
  history: Ref<unknown[]>;
}

/** Gemeinsamer Zustand des Image-Stores, den die Teilmodule unter stores/image/ nutzen */
export interface ImageStoreContext {
  originalImage: Ref<HTMLImageElement | null>;
  workingUrl: Ref<string | null>;
  canvas: Ref<HTMLCanvasElement | null>;
  ctx: Ref<CanvasRenderingContext2D | null>;
  imageWidth: Ref<number>;
  imageHeight: Ref<number>;
  isImageLoaded: Ref<boolean>;
  texts: Ref<StoreText[]>;
  selectedTextId: Ref<string | number | null>;
  shapes: Ref<Shape[]>;
  selectedShapeId: Ref<string | null>;
  drawTool: Ref<DrawTool | null>;
  drawSettings: Ref<Record<DrawTool, DrawSetting>>;
  imageLayers: Ref<ImageLayer[]>;
  selectedLayerId: Ref<string | number | null>;
  historyHandlers: ShallowRef<HistoryHandlers | null>;
  /** Schnelle Zwischenansicht nach Store-Aktionen */
  draw: () => void;
}
