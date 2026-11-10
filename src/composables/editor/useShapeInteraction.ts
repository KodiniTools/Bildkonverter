/**
 * useShapeInteraction
 *
 * Zeiger-Interaktion mit Formen-Ebenen auf dem Editor-Canvas: Auswählen,
 * Verschieben, Größe über die Eck-Griffe (Shift = Seitenverhältnis halten)
 * und Drehen über den Drehgriff (Shift = 15°-Schritte). Im Zeichenmodus
 * (imageStore.drawTool) entsteht pro Strich eine Freihand-Form. Wird von
 * useCanvasInteraction für Maus und Touch aufgerufen.
 *
 * Alle Positionen sind Canvas-Koordinaten; Griffgrößen werden über die
 * Anzeige-Skalierung in Bildschirm-Pixeln gehalten.
 */
import { nextTick, type Ref } from 'vue';
import {
  findShapeAt,
  findShapeHandleAt,
  fitFreehandPoints,
  getDefaultDrawWidth,
  supportsShapeText,
  resizeFromCorner,
  rotationFromPointer,
  type LocalPoint,
  type Shape,
  type ShapeCorner,
} from '@/utils/shapes';
import type { useImageStore } from '@/stores/imageStore';
import {
  getCanvasDisplayScale,
  SHAPE_HANDLE_SIZE,
  SHAPE_ROTATE_GAP,
  SHAPE_SELECTION_PAD,
} from '@/composables/useCanvasRenderer';

type ImageStore = ReturnType<typeof useImageStore>;

/** Teil des imageStore, den die Formen-Interaktion nutzt */
export type ShapeInteractionStore = Pick<
  ImageStore,
  'shapes' | 'selectedShapeId' | 'selectShape' | 'drawTool'
> &
  Partial<Pick<ImageStore, 'drawSettings' | 'updateDrawSettings' | 'addFreehandShape'>>;

export interface ShapeInteractionDeps {
  canvas: Ref<HTMLCanvasElement | null>;
  imageStore: ShapeInteractionStore;
  renderImage: () => void;
  saveHistory: () => void;
}

interface DragBase {
  id: string;
  start: Shape;
  pointer: LocalPoint;
}

/** Laufende Zeiger-Aktion auf einer Form */
type ShapeDrag =
  | (DragBase & { mode: 'move' | 'rotate' })
  | (DragBase & { mode: 'resize'; corner: ShapeCorner })
  | { mode: 'draw'; id: string; points: LocalPoint[] };

/** Felder, deren Änderung einen Historien-Eintrag auslöst */
const TRACKED_KEYS = ['x', 'y', 'width', 'height', 'rotation'] as const;

// Zusätzlicher Trefferradius in Bildschirm-Pixeln (Touch großzügiger)
const HIT_SLOP = 4;
const HIT_SLOP_TOUCH = 12;
const ROTATE_SNAP = 15;
// Mindestabstand zwischen zwei Freihand-Punkten in Bildschirm-Pixeln
const DRAW_MIN_DISTANCE = 2;

// Cursor je Ecke (ohne Rotation; reicht als Hinweis)
const CORNER_CURSORS: Record<ShapeCorner, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};

export function useShapeInteraction({
  canvas,
  imageStore,
  renderImage,
  saveHistory,
}: ShapeInteractionDeps) {
  /**
   * Laufende Aktion: { mode: 'move'|'resize'|'rotate', id, corner?, start, pointer }
   * bzw. { mode: 'draw', id, points } beim Freihand-Zeichnen.
   */
  let drag: ShapeDrag | null = null;

  function px() {
    return 1 / (getCanvasDisplayScale(canvas.value) || 1);
  }

  function selected(): Shape | null {
    const id = imageStore.selectedShapeId;
    return id ? imageStore.shapes.find((s) => s.id === id) || null : null;
  }

  /** Griff der ausgewählten Form unter der Position */
  function handleAt(pos: LocalPoint, touch = false) {
    const shape = selected();
    if (!shape) return null;
    const unit = px();
    return findShapeHandleAt(shape, pos.x, pos.y, {
      pad: SHAPE_SELECTION_PAD * unit,
      rotateGap: SHAPE_ROTATE_GAP * unit,
      radius: (SHAPE_HANDLE_SIZE / 2 + (touch ? HIT_SLOP_TOUCH : HIT_SLOP)) * unit,
    });
  }

  /** Form unter der Position (oberste zuerst) */
  function shapeAt(pos: LocalPoint, touch = false) {
    return findShapeAt(imageStore.shapes, pos.x, pos.y, (touch ? HIT_SLOP_TOUCH : HIT_SLOP) * px());
  }

  /**
   * Griffe der ausgewählten Form. Liegen über allen Ebenen und Texten.
   * @returns {boolean} true, wenn eine Aktion gestartet wurde
   */
  function startHandleDrag(pos: LocalPoint, touch = false) {
    const hit = handleAt(pos, touch);
    if (!hit) return false;
    // handleAt liefert nur mit ausgewählter Form einen Treffer
    const shape = selected()!;
    drag = { ...hit, id: shape.id, start: { ...shape }, pointer: { ...pos } };
    if (canvas.value) {
      canvas.value.style.cursor = hit.mode === 'rotate' ? 'grabbing' : CORNER_CURSORS[hit.corner];
    }
    return true;
  }

  /**
   * Klick auf eine Form: auswählen und Verschieben beginnen.
   * @returns {boolean} true, wenn eine Form getroffen wurde
   */
  function startBodyDrag(pos: LocalPoint, touch = false) {
    const shape = shapeAt(pos, touch);
    if (!shape) return false;
    imageStore.selectShape(shape.id);
    drag = { mode: 'move', id: shape.id, start: { ...shape }, pointer: { ...pos } };
    if (canvas.value) canvas.value.style.cursor = 'grabbing';
    return true;
  }

  function isDrawMode() {
    return !!imageStore.drawTool;
  }

  /**
   * Zeichenmodus aktiv: neuen Strich an der Position beginnen.
   * @returns {boolean} true, wenn ein Strich gestartet wurde
   */
  function startDraw(pos: LocalPoint) {
    const tool = imageStore.drawTool;
    if (!tool || typeof imageStore.addFreehandShape !== 'function') return false;
    if (imageStore.drawSettings?.[tool]?.width == null && canvas.value) {
      imageStore.updateDrawSettings?.(tool, {
        width: getDefaultDrawWidth(tool, canvas.value.width, canvas.value.height),
      });
    }
    if (imageStore.selectedShapeId !== null) imageStore.selectShape(null);
    const points = [{ x: pos.x, y: pos.y }];
    const shape = imageStore.addFreehandShape(points, tool);
    if (!shape) return false;
    drag = { mode: 'draw', id: shape.id, points };
    renderImage();
    return true;
  }

  function isDragging() {
    return drag !== null;
  }

  /** Aktion fortsetzen. @param {boolean} shiftKey Verhältnis halten bzw. Winkel einrasten */
  function moveDrag(pos: LocalPoint, shiftKey = false) {
    if (!drag) return false;
    const id = drag.id;
    const shape = imageStore.shapes.find((s) => s.id === id);
    if (!shape) {
      drag = null;
      return false;
    }
    if (drag.mode === 'draw') {
      const last = drag.points[drag.points.length - 1]!;
      if (Math.hypot(pos.x - last.x, pos.y - last.y) < DRAW_MIN_DISTANCE * px()) return true;
      drag.points.push({ x: pos.x, y: pos.y });
      Object.assign(shape, fitFreehandPoints(drag.points));
    } else if (drag.mode === 'move') {
      shape.x = Math.round(drag.start.x + pos.x - drag.pointer.x);
      shape.y = Math.round(drag.start.y + pos.y - drag.pointer.y);
    } else if (drag.mode === 'resize') {
      const next = resizeFromCorner(drag.start, drag.corner, pos, shiftKey);
      shape.x = Math.round(next.x * 10) / 10;
      shape.y = Math.round(next.y * 10) / 10;
      shape.width = Math.round(next.width);
      shape.height = Math.round(next.height);
    } else if (drag.mode === 'rotate') {
      shape.rotation = rotationFromPointer(shape, pos, shiftKey ? ROTATE_SNAP : 0);
    }
    renderImage();
    return true;
  }

  /** Aktion beenden; schreibt einen Historien-Eintrag, wenn sich etwas geändert hat. */
  function endDrag() {
    const current = drag;
    if (!current) return false;
    const shape = imageStore.shapes.find((s) => s.id === current.id);
    const changed =
      current.mode === 'draw'
        ? !!shape
        : shape && TRACKED_KEYS.some((key) => shape[key] !== current.start[key]);
    drag = null;
    if (canvas.value) canvas.value.style.cursor = isDrawMode() ? 'crosshair' : 'default';
    if (changed) saveHistory();
    renderImage();
    return true;
  }

  /** Hover-Cursor (null = keine Form/kein Griff unter dem Zeiger) */
  function cursorAt(pos: LocalPoint) {
    if (isDrawMode()) return 'crosshair';
    const hit = handleAt(pos);
    if (hit) return hit.mode === 'rotate' ? 'grab' : CORNER_CURSORS[hit.corner];
    return shapeAt(pos) ? 'move' : null;
  }

  /**
   * Doppelklick: Form mit Textfeld auswählen und die Texteingabe im Panel
   * fokussieren. @returns {boolean} true, wenn eine Textform getroffen wurde
   */
  function editTextAt(pos: LocalPoint) {
    if (isDrawMode()) return false;
    const shape = shapeAt(pos);
    if (!shape || !supportsShapeText(shape.type)) return false;
    imageStore.selectShape(shape.id);
    nextTick(() => {
      if (typeof document === 'undefined') return;
      const input = [
        ...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.shape-text-input'),
      ].find((el) => el.offsetParent !== null);
      if (input) {
        input.focus();
        input.select?.();
      }
    });
    return true;
  }

  /** Auswahl aufheben (Klick ins Leere) */
  function deselect() {
    if (imageStore.selectedShapeId !== null) imageStore.selectShape(null);
  }

  return {
    startDraw,
    isDrawMode,
    startHandleDrag,
    startBodyDrag,
    moveDrag,
    endDrag,
    isDragging,
    cursorAt,
    editTextAt,
    deselect,
  };
}
