/**
 * useShapeInteraction
 *
 * Zeiger-Interaktion mit Formen-Ebenen auf dem Editor-Canvas: Auswählen,
 * Verschieben, Größe über die Eck-Griffe (Shift = Seitenverhältnis halten)
 * und Drehen über den Drehgriff (Shift = 15°-Schritte). Wird von
 * useCanvasInteraction für Maus und Touch aufgerufen.
 *
 * Alle Positionen sind Canvas-Koordinaten; Griffgrößen werden über die
 * Anzeige-Skalierung in Bildschirm-Pixeln gehalten.
 *
 * @param {object} deps
 * @param {import('vue').Ref<HTMLCanvasElement>} deps.canvas
 * @param {object}   deps.imageStore   Pinia-Image-Store (shapes, selectedShapeId)
 * @param {Function} deps.renderImage
 * @param {Function} deps.saveHistory
 */
import {
  findShapeAt,
  findShapeHandleAt,
  resizeFromCorner,
  rotationFromPointer,
} from '@/utils/shapes';
import {
  getCanvasDisplayScale,
  SHAPE_HANDLE_SIZE,
  SHAPE_ROTATE_GAP,
  SHAPE_SELECTION_PAD,
} from '@/composables/useCanvasRenderer';

// Zusätzlicher Trefferradius in Bildschirm-Pixeln (Touch großzügiger)
const HIT_SLOP = 4;
const HIT_SLOP_TOUCH = 12;
const ROTATE_SNAP = 15;

// Cursor je Ecke (ohne Rotation; reicht als Hinweis)
const CORNER_CURSORS = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};

export function useShapeInteraction({ canvas, imageStore, renderImage, saveHistory }) {
  /** Laufende Aktion: { mode: 'move'|'resize'|'rotate', id, corner?, start, pointer } */
  let drag = null;

  function px() {
    return 1 / (getCanvasDisplayScale(canvas.value) || 1);
  }

  function selected() {
    const id = imageStore.selectedShapeId;
    return id ? imageStore.shapes.find((s) => s.id === id) || null : null;
  }

  /** Griff der ausgewählten Form unter der Position */
  function handleAt(pos, touch = false) {
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
  function shapeAt(pos, touch = false) {
    return findShapeAt(imageStore.shapes, pos.x, pos.y, (touch ? HIT_SLOP_TOUCH : HIT_SLOP) * px());
  }

  /**
   * Griffe der ausgewählten Form. Liegen über allen Ebenen und Texten.
   * @returns {boolean} true, wenn eine Aktion gestartet wurde
   */
  function startHandleDrag(pos, touch = false) {
    const hit = handleAt(pos, touch);
    if (!hit) return false;
    const shape = selected();
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
  function startBodyDrag(pos, touch = false) {
    const shape = shapeAt(pos, touch);
    if (!shape) return false;
    imageStore.selectShape(shape.id);
    drag = { mode: 'move', id: shape.id, start: { ...shape }, pointer: { ...pos } };
    if (canvas.value) canvas.value.style.cursor = 'grabbing';
    return true;
  }

  function isDragging() {
    return drag !== null;
  }

  /** Aktion fortsetzen. @param {boolean} shiftKey Verhältnis halten bzw. Winkel einrasten */
  function moveDrag(pos, shiftKey = false) {
    if (!drag) return false;
    const shape = imageStore.shapes.find((s) => s.id === drag.id);
    if (!shape) {
      drag = null;
      return false;
    }
    if (drag.mode === 'move') {
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
    if (!drag) return false;
    const shape = imageStore.shapes.find((s) => s.id === drag.id);
    const changed =
      shape &&
      ['x', 'y', 'width', 'height', 'rotation'].some((key) => shape[key] !== drag.start[key]);
    drag = null;
    if (canvas.value) canvas.value.style.cursor = 'default';
    if (changed) saveHistory();
    renderImage();
    return true;
  }

  /** Hover-Cursor (null = keine Form/kein Griff unter dem Zeiger) */
  function cursorAt(pos) {
    const hit = handleAt(pos);
    if (hit) return hit.mode === 'rotate' ? 'grab' : CORNER_CURSORS[hit.corner];
    return shapeAt(pos) ? 'move' : null;
  }

  /** Auswahl aufheben (Klick ins Leere) */
  function deselect() {
    if (imageStore.selectedShapeId !== null) imageStore.selectShape(null);
  }

  return {
    startHandleDrag,
    startBodyDrag,
    moveDrag,
    endDrag,
    isDragging,
    cursorAt,
    deselect,
  };
}
