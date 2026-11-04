/**
 * Zustand und Aktionen des Formen-Panels (aus ShapesPanel ausgelagert).
 * Arbeitet direkt auf dem imageStore (shapes, selectedShapeId, drawTool); der
 * Editor zeichnet bei jeder Änderung neu (Watcher in EditorView). Ein
 * Historien-Eintrag pro abgeschlossener Änderung (commit).
 *
 * ShapesPanel ruft useShapeEditor auf und stellt das Ergebnis per provide
 * bereit; die Teil-Bausteine holen es mit useShapeEditorContext.
 */
import { computed, inject, onBeforeUnmount, provide, ref, watch, type InjectionKey } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import {
  FILL_TYPES,
  SHAPE_CATEGORIES,
  SHAPE_GALLERY,
  SHAPE_KIND,
  SHAPE_LIMITS,
  TEXT_SCALE_LIMITS,
  getDefaultDrawWidth,
  getShapeFontSize,
  getShapeKind,
  isDrawToolItem,
  isHeightless,
  supportsShapeText,
} from '@/utils/shapes';

/** Felder einer Form, die das Panel liest oder schreibt (siehe utils/shapes createShape) */
export interface Shape {
  id: string;
  type: string;
  galleryId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
  filled?: boolean;
  fillType?: string;
  fillColor?: string;
  fillColor2?: string;
  gradientAngle?: number;
  strokeWidth?: number;
  strokeColor?: string;
  dash?: string;
  shadowBlur?: number;
  shadowColor?: string;
  number?: number | string;
  markerStyle?: string;
  textColor?: string;
  emoji?: string;
  text?: string;
  fontFamily?: string;
  textAlign?: string;
  textScale?: number;
  effect?: string;
  region?: string;
  intensity?: number;
}

export type ShapePatch = Partial<Omit<Shape, 'id'>>;

export interface GalleryItem {
  id: string;
  type?: string;
  category?: string;
  tool?: string;
  aspect?: number;
  preset?: { textKey?: string };
}

export interface DrawStyle {
  color: string;
  opacity: number;
  width?: number;
}

export type ReorderDirection = 'up' | 'down';

/** Galerie mit der hier gelesenen Teilmenge der Felder */
const GALLERY = SHAPE_GALLERY as unknown as readonly GalleryItem[];

export interface ShapeEditorOptions {
  /** Canvas-Größe in px (0 = aus dem Store) */
  canvasWidth: () => number;
  canvasHeight: () => number;
  disabled: () => boolean;
  /** Übersetzung (für Sticker-Texte) */
  t: (key: string) => string;
}

/** Ohne Füllung muss eine Kontur sichtbar bleiben, sonst verschwindet die Form */
export function fallbackStrokeWidth(shape: Pick<Shape, 'width' | 'height'>): number {
  return Math.max(2, Math.round(Math.min(shape.width, shape.height) * 0.05));
}

export function useShapeEditor(options: ShapeEditorOptions) {
  const imageStore = useImageStore();

  const activeCategory = ref<string>(SHAPE_CATEGORIES[0]);
  const lockRatio = ref(false);

  const galleryItems = computed<GalleryItem[]>(() =>
    GALLERY.filter((item) => item.category === activeCategory.value)
  );

  const shapes = computed<Shape[]>(() => (imageStore.shapes as Shape[] | undefined) || []);
  // Oberste Form zuerst (wie in Ebenen-Listen üblich)
  const reversedShapes = computed(() => [...shapes.value].reverse());
  const selectedId = computed<string | null>(() => imageStore.selectedShapeId);
  const selectedShape = computed(() => (imageStore.selectedShape as Shape | null) ?? null);

  const selectedKind = computed(() => getShapeKind(selectedShape.value?.type));
  const isFillKind = computed(() => selectedKind.value === SHAPE_KIND.FILL);
  const isStrokeKind = computed(() => selectedKind.value === SHAPE_KIND.STROKE);
  const isMarker = computed(() => selectedKind.value === SHAPE_KIND.MARKER);
  const isEffect = computed(() => selectedKind.value === SHAPE_KIND.EFFECT);
  const isEmoji = computed(() => selectedKind.value === SHAPE_KIND.EMOJI);
  const fillType = computed<string>(() => {
    const type = selectedShape.value?.fillType;
    return type && (FILL_TYPES as readonly string[]).includes(type) ? type : 'solid';
  });
  const isGradient = computed(() => fillType.value !== 'solid');
  const heightless = computed(() => isHeightless(selectedShape.value?.type));
  const hasStroke = computed(() => (selectedShape.value?.strokeWidth || 0) > 0);
  const hasTextBox = computed(() => supportsShapeText(selectedShape.value?.type));
  const shapeIndex = computed(() => shapes.value.findIndex((s) => s.id === selectedId.value));
  const isTop = computed(() => shapeIndex.value === shapes.value.length - 1);
  const isBottom = computed(() => shapeIndex.value <= 0);

  function canvasSize() {
    return {
      width: options.canvasWidth() || 0,
      height: options.canvasHeight() || 0,
    };
  }

  // ===== Bearbeiten =====
  function commit() {
    imageStore.saveState('Form bearbeitet');
  }

  function update(patch: ShapePatch) {
    if (!selectedShape.value) return;
    imageStore.updateShape(selectedShape.value.id, patch);
  }

  function setAndCommit(patch: ShapePatch) {
    update(patch);
    commit();
  }

  function updateColor(key: 'shadowColor' | 'fillColor' | 'strokeColor', value: string) {
    if (/^#[0-9a-f]{6}$/i.test(value)) update({ [key]: value });
  }

  function swapGradient() {
    const shape = selectedShape.value;
    if (!shape) return;
    setAndCommit({ fillColor: shape.fillColor2 || '#ffffff', fillColor2: shape.fillColor });
  }

  function toggleFill(filled: boolean) {
    const shape = selectedShape.value;
    if (!shape) return;
    const patch: ShapePatch = { filled };
    if (!filled && !((shape.strokeWidth ?? 0) > 0)) patch.strokeWidth = fallbackStrokeWidth(shape);
    setAndCommit(patch);
  }

  function setWidth(width: number) {
    const shape = selectedShape.value;
    if (!shape) return;
    const patch: ShapePatch = { width };
    if (lockRatio.value && !heightless.value && shape.width > 0) {
      patch.height = Math.max(
        SHAPE_LIMITS.minSize,
        Math.round(width * (shape.height / shape.width))
      );
    }
    update(patch);
  }

  function setHeight(height: number) {
    const shape = selectedShape.value;
    if (!shape) return;
    const patch: ShapePatch = { height };
    if (lockRatio.value && shape.height > 0) {
      patch.width = Math.max(
        SHAPE_LIMITS.minSize,
        Math.round(height * (shape.width / shape.height))
      );
    }
    update(patch);
  }

  // Reglerbereich = Canvas; liegt die Form außerhalb, wird er erweitert
  const rangeX = computed(() => {
    const x = Math.round(selectedShape.value?.x || 0);
    return { min: Math.min(0, x), max: Math.max(1, canvasSize().width, x) };
  });
  const rangeY = computed(() => {
    const y = Math.round(selectedShape.value?.y || 0);
    return { min: Math.min(0, y), max: Math.max(1, canvasSize().height, y) };
  });

  function sizeMax(current: number) {
    const { width, height } = canvasSize();
    return Math.max(SHAPE_LIMITS.minSize + 1, Math.round(Math.max(width, height) * 2), current);
  }

  // ===== Text in Formen =====
  const minSide = computed(() =>
    Math.max(1, Math.min(selectedShape.value?.width || 1, selectedShape.value?.height || 1))
  );
  const fontSizePx = computed(() =>
    selectedShape.value ? Math.round(getShapeFontSize(selectedShape.value)) : 0
  );
  const fontSizeMax = computed(() =>
    Math.max(8, Math.round(minSide.value * TEXT_SCALE_LIMITS.max), fontSizePx.value)
  );

  /** Schriftgröße in px → textScale (Anteil an der Form, damit sie mitskaliert) */
  function setFontSize(px: number) {
    const scale = Number(px) / minSide.value;
    update({
      textScale:
        Math.round(
          Math.max(TEXT_SCALE_LIMITS.min, Math.min(TEXT_SCALE_LIMITS.max, scale)) * 10000
        ) / 10000,
    });
  }

  function setFont(fontFamily: string) {
    setAndCommit({ fontFamily });
    // Schrift laden; EditorView zeichnet nach 'loadingdone' neu
    document.fonts?.load?.(`32px "${fontFamily}"`).catch(() => {});
  }

  // ===== Zeichenwerkzeuge =====
  const drawTool = computed<string | null>(() => imageStore.drawTool ?? null);
  const drawStyle = computed<DrawStyle>(
    () =>
      (imageStore.drawSettings as unknown as Record<string, DrawStyle> | undefined)?.[
        drawTool.value ?? ''
      ] ?? {
        color: '#000000',
        opacity: 100,
      }
  );
  const drawWidth = computed<number>(() => {
    const { width, height } = canvasSize();
    return drawStyle.value.width ?? getDefaultDrawWidth(drawTool.value, width, height);
  });

  function setDrawTool(tool: string | null) {
    imageStore.setDrawTool?.(tool);
  }

  function setDrawSetting(patch: Partial<DrawStyle>) {
    if (drawTool.value) imageStore.updateDrawSettings?.(drawTool.value, patch);
  }

  // Zeichenmodus endet beim Verlassen des Reiters „Zeichnen“
  watch(activeCategory, (category) => {
    if (category !== 'draw' && drawTool.value) setDrawTool(null);
  });
  // Wird der Modus von außen beendet/gestartet (Esc), Reiter passend halten
  watch(drawTool, (tool) => {
    if (tool) activeCategory.value = 'draw';
  });
  onBeforeUnmount(() => {
    if (drawTool.value) setDrawTool(null);
  });

  // ===== Galerie und Liste =====
  function galleryItemFor(shape: Shape): GalleryItem {
    return (
      GALLERY.find((g) => g.id === shape.galleryId) ?? {
        id: shape.type,
        type: shape.type,
        aspect: shape.width / Math.max(1, shape.height),
      }
    );
  }

  /** Galerie-id der Form, falls bekannt (für den Listennamen) */
  function knownGalleryId(shape: Shape): string | null {
    return GALLERY.some((g) => g.id === shape.galleryId) ? (shape.galleryId ?? null) : null;
  }

  /** Sticker mit übersetzbarem Text (z. B. „Neu“) */
  function stickerText(item: GalleryItem | undefined): string | null {
    const key = item?.preset?.textKey;
    return key ? options.t(`shapes.stickerText.${key}`) : null;
  }

  function addShape(galleryId: string) {
    if (options.disabled()) return;
    const { width, height } = canvasSize();
    const shape = imageStore.addShape(galleryId, width, height) as Shape | null;
    if (!shape) return;
    const text = stickerText(GALLERY.find((g) => g.id === galleryId));
    if (text) imageStore.updateShape(shape.id, { text });
    commit();
  }

  function onTileClick(item: GalleryItem) {
    if (isDrawToolItem(item)) {
      if (options.disabled()) return;
      setDrawTool(drawTool.value === item.tool ? null : (item.tool ?? null));
      return;
    }
    setDrawTool(null);
    addShape(item.id);
  }

  function select(id: string | null) {
    if (id !== null && drawTool.value) setDrawTool(null);
    imageStore.selectShape(id);
  }

  function remove(id: string) {
    if (imageStore.deleteShape(id)) commit();
  }

  function duplicate() {
    if (selectedShape.value && imageStore.duplicateShape(selectedShape.value.id)) commit();
  }

  function reorder(direction: ReorderDirection) {
    if (selectedShape.value && imageStore.moveShapeOrder(selectedShape.value.id, direction)) {
      commit();
    }
  }

  return {
    disabled: computed(options.disabled),
    activeCategory,
    lockRatio,
    galleryItems,
    shapes,
    reversedShapes,
    selectedId,
    selectedShape,
    isFillKind,
    isStrokeKind,
    isMarker,
    isEffect,
    isEmoji,
    fillType,
    isGradient,
    heightless,
    hasStroke,
    hasTextBox,
    isTop,
    isBottom,
    rangeX,
    rangeY,
    sizeMax,
    fontSizePx,
    fontSizeMax,
    drawTool,
    drawStyle,
    drawWidth,
    commit,
    update,
    setAndCommit,
    updateColor,
    swapGradient,
    toggleFill,
    setWidth,
    setHeight,
    setFontSize,
    setFont,
    setDrawTool,
    setDrawSetting,
    galleryItemFor,
    knownGalleryId,
    stickerText,
    addShape,
    onTileClick,
    select,
    remove,
    duplicate,
    reorder,
  };
}

export type ShapeEditor = ReturnType<typeof useShapeEditor>;

const SHAPE_EDITOR_KEY: InjectionKey<ShapeEditor> = Symbol('shapeEditor');

export function provideShapeEditor(editor: ShapeEditor): void {
  provide(SHAPE_EDITOR_KEY, editor);
}

/** Zugriff der Teil-Bausteine auf den Zustand des umgebenden ShapesPanel */
export function useShapeEditorContext(): ShapeEditor {
  const editor = inject(SHAPE_EDITOR_KEY, null);
  if (!editor) throw new Error('useShapeEditorContext() braucht ein umgebendes ShapesPanel');
  return editor;
}
