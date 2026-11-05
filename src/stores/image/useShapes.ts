import { computed } from 'vue';
import { createFreehandShape, createShape, DRAW_TOOLS, nextMarkerNumber } from '@/utils/shapes';
import type { DrawSetting, DrawTool, ImageStoreContext, Shape } from './types';

const isDrawTool = (tool: unknown): tool is DrawTool =>
  (DRAW_TOOLS as readonly unknown[]).includes(tool);

/**
 * Formen & Symbole (Overlay-Ebenen unter den Texten) und das Zeichenwerkzeug.
 * Gezeichnet wird vom Editor (useCanvasRenderer), der shapes beobachtet.
 */
export function useShapes({
  shapes,
  selectedShapeId,
  selectedTextId,
  selectedLayerId,
  drawTool,
  drawSettings,
}: ImageStoreContext) {
  const selectedShape = computed(
    () => shapes.value.find((s) => s.id === selectedShapeId.value) || null
  );

  /** Auswahl setzen; hebt Text- und Ebenen-Auswahl auf (es ist immer nur eins aktiv) */
  function selectShape(shapeId: string | null) {
    if (shapeId !== null && !shapes.value.some((s) => s.id === shapeId)) return;
    selectedShapeId.value = shapeId;
    if (shapeId !== null) {
      selectedTextId.value = null;
      selectedLayerId.value = null;
    }
  }

  /**
   * Fügt eine Form aus der Galerie hinzu und wählt sie aus.
   * @returns die neue Form (null bei unbekanntem Galerie-Eintrag)
   */
  function addShape(galleryId: string, canvasWidth: number, canvasHeight: number) {
    const shape = createShape(galleryId, canvasWidth, canvasHeight) as Shape | null;
    if (!shape) return null;
    // Marker zählen automatisch weiter
    if (shape.type === 'marker') shape.number = nextMarkerNumber(shapes.value);
    shapes.value.push(shape);
    selectShape(shape.id);
    return shapes.value[shapes.value.length - 1]!;
  }

  function updateShape(shapeId: string, updates: Partial<Shape>) {
    const shape = shapes.value.find((s) => s.id === shapeId);
    if (!shape) return false;
    Object.assign(shape, updates);
    return true;
  }

  function deleteShape(shapeId: string) {
    const index = shapes.value.findIndex((s) => s.id === shapeId);
    if (index === -1) return false;
    shapes.value.splice(index, 1);
    if (selectedShapeId.value === shapeId) selectedShapeId.value = null;
    return true;
  }

  /** Kopie leicht versetzt darüberlegen und auswählen */
  function duplicateShape(shapeId: string) {
    const source = shapes.value.find((s) => s.id === shapeId);
    if (!source) return null;
    const copy = createShape(source.type, 1, 1) as Shape;
    const offset = Math.max(10, Math.round(Math.min(source.width, source.height) * 0.1));
    Object.assign(copy, JSON.parse(JSON.stringify(source)), {
      id: copy.id,
      x: source.x + offset,
      y: source.y + offset,
    });
    if (copy.type === 'marker') copy.number = nextMarkerNumber(shapes.value);
    const index = shapes.value.indexOf(source);
    shapes.value.splice(index + 1, 0, copy);
    selectShape(copy.id);
    return copy;
  }

  /** Reihenfolge ändern: 'up' = eine Ebene nach vorn, 'down' = nach hinten */
  function moveShapeOrder(shapeId: string, direction: 'up' | 'down') {
    const index = shapes.value.findIndex((s) => s.id === shapeId);
    if (index === -1) return false;
    const target = direction === 'up' ? index + 1 : index - 1;
    if (target < 0 || target >= shapes.value.length) return false;
    const [shape] = shapes.value.splice(index, 1);
    shapes.value.splice(target, 0, shape!);
    return true;
  }

  function clearShapes() {
    shapes.value = [];
    selectedShapeId.value = null;
    drawTool.value = null;
  }

  /** Zeichenwerkzeug ein-/ausschalten; beim Einschalten wird die Auswahl aufgehoben */
  function setDrawTool(tool: string | null) {
    drawTool.value = isDrawTool(tool) ? tool : null;
    if (drawTool.value) selectShape(null);
  }

  function updateDrawSettings(tool: string, patch: Partial<DrawSetting>) {
    if (!isDrawTool(tool)) return;
    drawSettings.value[tool] = { ...drawSettings.value[tool], ...patch };
  }

  /**
   * Fügt einen gezeichneten Strich als Form hinzu (ohne ihn auszuwählen, damit
   * direkt weitergezeichnet werden kann).
   */
  function addFreehandShape(
    canvasPoints: { x: number; y: number }[],
    tool: string | null = drawTool.value
  ) {
    const settings =
      (isDrawTool(tool) ? drawSettings.value[tool] : undefined) ?? drawSettings.value.pen;
    const shape = createFreehandShape(canvasPoints, {
      tool,
      ...settings,
    } as Parameters<typeof createFreehandShape>[1]) as Shape | null;
    if (!shape) return null;
    shapes.value.push(shape);
    return shapes.value[shapes.value.length - 1]!;
  }

  return {
    selectedShape,
    addShape,
    updateShape,
    deleteShape,
    duplicateShape,
    moveShapeOrder,
    selectShape,
    clearShapes,
    setDrawTool,
    updateDrawSettings,
    addFreehandShape,
  };
}
