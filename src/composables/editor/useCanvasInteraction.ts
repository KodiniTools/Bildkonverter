/**
 * useCanvasInteraction
 *
 * Kapselt die gesamte Zeiger-Interaktion auf dem Editor-Canvas:
 * Maus- und Touch-Handler (inkl. Pan, Pinch-Zoom, Text-Drag, Crop- und
 * Layer-Delegation), Hit-Testing für Text sowie die globalen Maus-Handler
 * für Drag/Resize außerhalb des Canvas. Ausgelagert aus EditorView.vue –
 * Verhalten unverändert.
 *
 * Abhängigkeiten: siehe CanvasInteractionDeps.
 */
import { buildTextFontString } from '@/utils/textRender';
import { findCornerAt, offsetForLocalPoint } from '@/utils/warpImage';
import { DISTORT_HANDLE_SIZE, type DistortGeometry } from '@/composables/useCanvasRenderer';
import type { Ref } from 'vue';
import type { Corner, Point, QuadCorners } from '@/utils/warpImage';
import type { StoreText } from '@/stores/image/types';
import type { useImageStore } from '@/stores/imageStore';
import type { CanvasTransform } from '@/types/transform';

type Pos = Point;

/** Maus-/Touch-Ereignis oder synthetisches Ereignis (Touch → Ebenen-Interaktion) */
export interface PointerLike {
  clientX: number;
  clientY: number;
  shiftKey: boolean;
  button?: number;
  preventDefault: () => void;
}

/** Was die Canvas-Interaktion von useTransform braucht */
export interface InteractionTransform extends CanvasTransform {
  canPan: Readonly<Ref<boolean>>;
  pan: (deltaX: number, deltaY: number) => void;
  setScale: (value: number) => void;
  setCornerOffset: (corner: Corner, offset: Point) => void;
}

/** Was die Canvas-Interaktion von useCrop braucht */
export interface InteractionCrop {
  cropMode: Ref<boolean>;
  isDragging: Ref<boolean>;
  isResizing: Ref<boolean>;
  isCreating: Ref<boolean>;
  handleMouseDown: (pos: Pos, displayScale?: number) => boolean;
  handleMouseMove: (pos: Pos) => boolean;
  handleMouseUp: () => boolean;
  getCursorForPosition: (x: number, y: number, displayScale?: number) => string;
  cancelDragResize: () => void;
}

/** Was die Canvas-Interaktion von useImageLayerInteraction braucht */
export interface InteractionLayers {
  isDragging: Ref<boolean>;
  isResizing: Ref<boolean>;
  handleMouseDown: (event: PointerLike) => void;
  handleMouseMove: (event: PointerLike) => void;
  handleMouseUp: () => void;
}

/** Was die Canvas-Interaktion von useShapeInteraction braucht */
export interface InteractionShapes {
  startDraw: (pos: Pos) => boolean;
  isDrawMode: () => boolean;
  startHandleDrag: (pos: Pos, touch?: boolean) => boolean;
  startBodyDrag: (pos: Pos, touch?: boolean) => boolean;
  moveDrag: (pos: Pos, shiftKey?: boolean) => unknown;
  endDrag: () => boolean;
  isDragging: () => boolean;
  cursorAt: (pos: Pos) => string | null;
  deselect: () => void;
  editTextAt?: (pos: Pos) => unknown;
}

export interface CanvasInteractionDeps {
  canvas: Ref<HTMLCanvasElement | null>;
  isSpacePressed: Ref<boolean>;
  isPanning: Ref<boolean>;
  panStart: Ref<Pos>;
  isCollageMode: Ref<boolean>;
  selectedTextId: Ref<StoreText['id'] | null>;
  isDraggingText: Ref<boolean>;
  dragOffset: Ref<Pos>;
  transform: InteractionTransform;
  crop: InteractionCrop;
  layerInteraction: InteractionLayers;
  imageStore: Pick<ReturnType<typeof useImageStore>, 'texts' | 'selectImageLayer'>;
  textModal: { openEditTextModal: (textId: StoreText['id']) => void };
  renderImage: () => void;
  handleFinishCrop: () => void;
  saveHistory: () => void;
  /** Eckpunkte des Bildes im Canvas-System (Renderer) */
  getDistortHandlePoints?: () => QuadCorners | null;
  /** Matrix + Zeichen-Rechteck des Bildes (Renderer) */
  getDistortGeometry?: () => DistortGeometry | null;
  /** useShapeInteraction()-Instanz (Formen) */
  shapeInteraction?: InteractionShapes | null;
  /** Pipette (Weißabgleich): ist sie aktiv, geht der nächste Klick an pick() */
  colorPicker?: { active: Ref<boolean>; pick: (pos: Pos) => void } | null;
}

/** Ereignis mit optionalen Touch-Listen (Maus, Touch oder synthetisch) */
type AnyPointerEvent = MouseEvent | TouchEvent | PointerLike;

// Zusätzlicher Trefferradius der Verzerr-Griffe in Bildschirm-Pixeln (Touch großzügiger)
const DISTORT_HIT_SLOP = 6;
const DISTORT_HIT_SLOP_TOUCH = 14;

export function useCanvasInteraction({
  canvas,
  isSpacePressed,
  isPanning,
  panStart,
  isCollageMode,
  selectedTextId,
  isDraggingText,
  dragOffset,
  transform,
  crop,
  layerInteraction,
  imageStore,
  textModal,
  renderImage,
  handleFinishCrop,
  saveHistory,
  getDistortHandlePoints = () => null,
  getDistortGeometry = () => null,
  shapeInteraction = null,
  colorPicker = null,
}: CanvasInteractionDeps) {
  // Formen sind optional (ältere Aufrufer ohne Formen funktionieren unverändert)
  const shapes: InteractionShapes = shapeInteraction ?? {
    startDraw: () => false,
    isDrawMode: () => false,
    startHandleDrag: () => false,
    startBodyDrag: () => false,
    moveDrag: () => false,
    endDrag: () => false,
    isDragging: () => false,
    cursorAt: () => null,
    deselect: () => {},
  };

  // Freies Verzerren: gerade gezogene Ecke (null = keine Verzerr-Interaktion)
  let distortCorner: Corner | null = null;

  // Handler laufen nur mit gemountetem Canvas; fehlt er, bricht es wie bisher ab
  function canvasEl(): HTMLCanvasElement {
    return canvas.value!;
  }

  function getMousePos(e: AnyPointerEvent): Pos {
    const cv = canvasEl();
    const rect = cv.getBoundingClientRect();

    const touches = (e as Partial<TouchEvent>).touches;
    const clientX = touches ? touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = touches ? touches[0].clientY : (e as MouseEvent).clientY;

    const scaleX = cv.width / rect.width;
    const scaleY = cv.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function getTouchClientPos(e: TouchEvent): { clientX: number; clientY: number } {
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
    return { clientX: touch?.clientX ?? 0, clientY: touch?.clientY ?? 0 };
  }

  // Gibt den Display-Skalierungsfaktor zurück (wie viel kleiner ist die Anzeige als das Canvas)
  function getDisplayScale(): number {
    if (!canvas.value) return 1;
    const rect = canvas.value.getBoundingClientRect();
    return rect.width / canvas.value.width;
  }

  // ===== FREIES VERZERREN (Eckpunkte ziehen) =====

  /** Ecke unter der Position (nur im Verzerr-Modus, nicht beim Zuschneiden). */
  function findDistortCorner(pos: Pos, touch = false): Corner | null {
    if (!transform.transforms.value.distortEnabled || crop.cropMode?.value) return null;
    const points = getDistortHandlePoints();
    if (!points) return null;
    const slop = touch ? DISTORT_HIT_SLOP_TOUCH : DISTORT_HIT_SLOP;
    const radius = (DISTORT_HANDLE_SIZE / 2 + slop) / getDisplayScale();
    return findCornerAt(pos, points, radius);
  }

  /** Startet das Ziehen einer Ecke; true, wenn eine Ecke getroffen wurde. */
  function startDistortDrag(pos: Pos, touch = false): boolean {
    const corner = findDistortCorner(pos, touch);
    if (!corner) return false;
    distortCorner = corner;
    selectedTextId.value = null;
    if (canvas.value) canvas.value.style.cursor = 'move';
    return true;
  }

  /** Versetzt die gezogene Ecke auf die (auf den Canvas geklemmte) Position. */
  function moveDistortCorner(pos: Pos): void {
    const geometry = getDistortGeometry();
    if (!distortCorner || !geometry || !canvas.value) return;
    const x = Math.max(0, Math.min(canvas.value.width, pos.x));
    const y = Math.max(0, Math.min(canvas.value.height, pos.y));
    const inverse = geometry.matrix.inverse();
    const local = inverse.transformPoint(new DOMPoint(x, y));
    // Nicht invertierbare Matrix (z.B. Neigung 45°/45°) → Eingabe ignorieren
    if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) return;
    transform.setCornerOffset(
      distortCorner,
      offsetForLocalPoint(geometry.rect, distortCorner, local)
    );
    renderImage();
  }

  /** Beendet das Ziehen einer Ecke; true, wenn eines aktiv war. */
  function endDistortDrag(): boolean {
    if (!distortCorner) return false;
    distortCorner = null;
    if (canvas.value) canvas.value.style.cursor = 'default';
    saveHistory();
    return true;
  }

  function onSelectTextFromPanel(textId: StoreText['id'] | null): void {
    selectedTextId.value = textId;
    renderImage();
  }

  function findTextAtPosition(x: number, y: number): StoreText | null {
    if (!imageStore.texts || imageStore.texts.length === 0) return null;

    const ctx = canvasEl().getContext('2d')!;

    // Von oben nach unten suchen (oberster Text hat Priorität)
    for (let i = imageStore.texts.length - 1; i >= 0; i--) {
      const text = imageStore.texts[i];
      const fontSize = text.fontSize || text.size || 32;
      const content = text.content || text.txt || '';

      ctx.font = buildTextFontString(text);
      // Number(): dieselbe Umwandlung wie zuvor beim Rechnen mit x/y
      const tx = Number(text.x);
      const ty = Number(text.y);
      const metrics = ctx.measureText(content);

      // Hit-Box: text.y ist Top-Koordinate (wegen textBaseline = 'top' in renderImage)
      // Etwas größere Hit-Box für bessere Bedienbarkeit
      const padding = 8;
      if (
        x >= tx - padding &&
        x <= tx + metrics.width + padding &&
        y >= ty - padding &&
        y <= ty + fontSize + padding
      ) {
        return text;
      }
    }
    return null;
  }

  function onCanvasMouseDown(e: MouseEvent): void {
    const pos = getMousePos(e);
    const displayScale = getDisplayScale();

    // Pipette hat Vorrang vor allen anderen Werkzeugen
    if (colorPicker?.active.value && e.button === 0) {
      e.preventDefault();
      colorPicker.pick(pos);
      return;
    }

    // Pan mit mittlerer Maustaste oder Leertaste + Linksklick
    const isMiddleButton = e.button === 1;
    const isPanGesture = isMiddleButton || (isSpacePressed.value && e.button === 0);

    if (isPanGesture && transform.canPan.value) {
      e.preventDefault();
      isPanning.value = true;
      panStart.value = { x: e.clientX, y: e.clientY };
      canvasEl().style.cursor = 'grabbing';
      return;
    }

    // Crop-Handler über Composable (hat Priorität)
    const cropHandled = crop.handleMouseDown(pos, displayScale);
    if (cropHandled) return;

    // Verzerr-Griffe (nur Einzelbild, Modus aktiv) liegen über Texten
    if (!isCollageMode.value && e.button === 0 && startDistortDrag(pos)) {
      renderImage();
      return;
    }

    // Zeichenmodus (Stift/Textmarker): jeder Linksklick beginnt einen Strich
    if (e.button === 0 && shapes.startDraw(pos)) {
      selectedTextId.value = null;
      if (isCollageMode.value) imageStore.selectImageLayer(null);
      return;
    }

    // Griffe der ausgewählten Form (Größe/Drehen) liegen über allem
    if (e.button === 0 && shapes.startHandleDrag(pos)) {
      selectedTextId.value = null;
      renderImage();
      return;
    }

    // Im Collage-Modus: Erst Text prüfen, dann Formen, dann Layer
    if (isCollageMode.value) {
      // Text hat Priorität (liegt visuell über Layern)
      const text = findTextAtPosition(pos.x, pos.y);
      if (text) {
        selectedTextId.value = text.id;
        shapes.deselect();
        isDraggingText.value = true;
        dragOffset.value = {
          x: pos.x - Number(text.x),
          y: pos.y - Number(text.y),
        };
        canvasEl().style.cursor = 'grabbing';
        // Layer-Auswahl aufheben
        imageStore.selectImageLayer(null);
        renderImage();
        return;
      }

      // Formen liegen über den Bild-Ebenen
      selectedTextId.value = null;
      if (e.button === 0 && shapes.startBodyDrag(pos)) {
        imageStore.selectImageLayer(null);
        renderImage();
        return;
      }

      // Weder Text noch Form getroffen, Layer-Interaktion
      shapes.deselect();
      layerInteraction.handleMouseDown(e);
      renderImage();
      return;
    }

    // Sonst Text-Interaktion (nicht Collage-Modus)
    const text = findTextAtPosition(pos.x, pos.y);

    if (text) {
      selectedTextId.value = text.id;
      shapes.deselect();
      isDraggingText.value = true;
      dragOffset.value = {
        x: pos.x - Number(text.x),
        y: pos.y - Number(text.y),
      };
      canvasEl().style.cursor = 'grabbing';
    } else {
      selectedTextId.value = null;
      if (!(e.button === 0 && shapes.startBodyDrag(pos))) shapes.deselect();
    }

    renderImage();
  }

  function onCanvasMouseMove(e: MouseEvent): void {
    const pos = getMousePos(e);

    // Pan-Handling (hat höchste Priorität wenn aktiv)
    if (isPanning.value) {
      const deltaX = e.clientX - panStart.value.x;
      const deltaY = e.clientY - panStart.value.y;
      panStart.value = { x: e.clientX, y: e.clientY };
      transform.pan(deltaX, deltaY);
      renderImage();
      return;
    }

    // Verzerr-Ecke ziehen
    if (distortCorner) {
      moveDistortCorner(pos);
      return;
    }

    // Form verschieben/skalieren/drehen
    if (shapes.isDragging()) {
      shapes.moveDrag(pos, e.shiftKey);
      return;
    }

    // Crop-Handler über Composable (hat Priorität)
    const cropHandled = crop.handleMouseMove(pos);
    if (cropHandled) return;

    // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
    if (isCollageMode.value) {
      // Text-Dragging hat Priorität
      if (isDraggingText.value && selectedTextId.value) {
        const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
        if (text) {
          text.x = pos.x - dragOffset.value.x;
          text.y = pos.y - dragOffset.value.y;
          renderImage();
        }
        return;
      }

      // Layer-Interaktion
      layerInteraction.handleMouseMove(e);
      if (layerInteraction.isDragging.value || layerInteraction.isResizing.value) {
        renderImage();
      }

      // Cursor für Text- und Formen-Hover im Collage-Modus
      if (!layerInteraction.isDragging.value && !layerInteraction.isResizing.value) {
        const text = shapes.isDrawMode() ? null : findTextAtPosition(pos.x, pos.y);
        const shapeCursor = text ? null : shapes.cursorAt(pos);
        if (text) {
          canvasEl().style.cursor = 'grab';
        } else if (shapeCursor) {
          canvasEl().style.cursor = shapeCursor;
        }
      }
      return;
    }

    // Sonst Text-Interaktion (nicht Collage-Modus)
    if (isDraggingText.value && selectedTextId.value) {
      const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
      if (text) {
        text.x = pos.x - dragOffset.value.x;
        text.y = pos.y - dragOffset.value.y;
        renderImage();
      }
    } else {
      const text = findTextAtPosition(pos.x, pos.y);
      // Cursor basierend auf Kontext anpassen
      let cursorStyle = 'default';
      if (isSpacePressed.value && transform.canPan.value) {
        cursorStyle = 'grab';
      } else if (crop.cropMode.value) {
        // Nutze den Cursor vom Crop-Composable mit Display-Skalierung
        const displayScale = getDisplayScale();
        cursorStyle = crop.getCursorForPosition(pos.x, pos.y, displayScale);
      } else if (shapes.isDrawMode()) {
        cursorStyle = 'crosshair';
      } else if (findDistortCorner(pos)) {
        cursorStyle = 'move';
      } else if (text) {
        cursorStyle = 'grab';
      } else {
        cursorStyle = shapes.cursorAt(pos) ?? 'default';
      }
      canvasEl().style.cursor = cursorStyle;
    }
  }

  function onCanvasMouseUp(): void {
    // Pan-Handling beenden
    if (isPanning.value) {
      isPanning.value = false;
      canvasEl().style.cursor = isSpacePressed.value && transform.canPan.value ? 'grab' : 'default';
      return;
    }

    // Verzerr-Ecke loslassen
    if (endDistortDrag()) {
      renderImage();
      return;
    }

    // Form-Aktion beenden (speichert die Historie)
    if (shapes.endDrag()) return;

    // Crop-Handler über Composable (hat Priorität)
    const cropHandled = crop.handleMouseUp();
    if (cropHandled) {
      handleFinishCrop();
      return;
    }

    // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
    if (isCollageMode.value) {
      // Text-Dragging beenden
      if (isDraggingText.value) {
        isDraggingText.value = false;
        canvasEl().style.cursor = 'default';
        renderImage();
        return;
      }

      // Layer-Interaktion beenden
      layerInteraction.handleMouseUp();
      renderImage();
      return;
    }

    // Sonst Text-Interaktion (nicht Collage-Modus)
    if (isDraggingText.value) {
      isDraggingText.value = false;
      canvasEl().style.cursor = 'default';
      saveHistory();
    }
  }

  function onCanvasDoubleClick(e: MouseEvent): void {
    const pos = getMousePos(e);
    const text = findTextAtPosition(pos.x, pos.y);

    if (text) {
      textModal.openEditTextModal(text.id);
      return;
    }
    // Doppelklick auf eine Form mit Textfeld: Texteingabe im Panel fokussieren
    shapes.editTextAt?.(pos);
  }

  // ===== TOUCH HANDLER =====

  let touchLongPressTimer: ReturnType<typeof setTimeout> | undefined;
  let lastTouchTime = 0;
  let lastTouchEndPos: Pos | null = null;
  let pinchStartDist = 0;

  function getPinchDistance(e: TouchEvent): number {
    const t = e.touches;
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onCanvasTouchStart(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch-to-zoom vorbereiten
      pinchStartDist = getPinchDistance(e);
      clearTimeout(touchLongPressTimer);
      return;
    }

    if (e.touches.length !== 1) return;

    const { clientX, clientY } = getTouchClientPos(e);
    const pos = getMousePos(e);

    // Pipette für den Weißabgleich hat Vorrang
    if (colorPicker?.active.value) {
      colorPicker.pick(pos);
      return;
    }

    // Pan mit zwei Fingern – hier noch Ein-Finger: prüfe ob Leertaste (nicht möglich auf Mobil)
    // Crop-Handler
    const displayScale = getDisplayScale();
    const cropHandled = crop.handleMouseDown(pos, displayScale);
    if (cropHandled) return;

    // Verzerr-Griffe (nur Einzelbild, Modus aktiv)
    if (!isCollageMode.value && startDistortDrag(pos, true)) {
      renderImage();
      return;
    }

    // Zeichenmodus (Stift/Textmarker)
    if (shapes.startDraw(pos)) {
      selectedTextId.value = null;
      if (isCollageMode.value) imageStore.selectImageLayer(null);
      return;
    }

    // Griffe der ausgewählten Form
    if (shapes.startHandleDrag(pos, true)) {
      selectedTextId.value = null;
      renderImage();
      return;
    }

    // Im Collage-Modus
    if (isCollageMode.value) {
      const text = findTextAtPosition(pos.x, pos.y);
      if (text) {
        selectedTextId.value = text.id;
        shapes.deselect();
        isDraggingText.value = true;
        dragOffset.value = { x: pos.x - Number(text.x), y: pos.y - Number(text.y) };
        if (canvas.value) canvas.value.style.cursor = 'grabbing';
        imageStore.selectImageLayer(null);
        renderImage();
      } else if (shapes.startBodyDrag(pos, true)) {
        selectedTextId.value = null;
        imageStore.selectImageLayer(null);
        renderImage();
      } else {
        selectedTextId.value = null;
        shapes.deselect();
        // Synthetisches Event für Layer-Interaktion
        const syntheticEvent: PointerLike = {
          clientX,
          clientY,
          preventDefault: () => {},
          shiftKey: false,
          button: 0,
        };
        layerInteraction.handleMouseDown(syntheticEvent);
        renderImage();
      }
      return;
    }

    // Text-Interaktion (normaler Modus)
    const text = findTextAtPosition(pos.x, pos.y);
    if (text) {
      selectedTextId.value = text.id;
      shapes.deselect();
      isDraggingText.value = true;
      dragOffset.value = { x: pos.x - Number(text.x), y: pos.y - Number(text.y) };
      if (canvas.value) canvas.value.style.cursor = 'grabbing';
    } else {
      selectedTextId.value = null;
      if (!shapes.startBodyDrag(pos, true)) shapes.deselect();
    }
    renderImage();

    // Long-Press für Text-Bearbeitung (600ms)
    if (text) {
      touchLongPressTimer = setTimeout(() => {
        isDraggingText.value = false;
        textModal.openEditTextModal(text.id);
      }, 600);
    }

    // Doppeltipp-Erkennung (350ms)
    const now = Date.now();
    if (lastTouchEndPos && now - lastTouchTime < 350) {
      const dx = Math.abs(clientX - lastTouchEndPos.x);
      const dy = Math.abs(clientY - lastTouchEndPos.y);
      if (dx < 40 && dy < 40) {
        clearTimeout(touchLongPressTimer);
        const doubleTapText = findTextAtPosition(pos.x, pos.y);
        if (doubleTapText) {
          textModal.openEditTextModal(doubleTapText.id);
        }
        lastTouchTime = 0;
      }
    }
  }

  function onCanvasTouchMove(e: TouchEvent): void {
    e.preventDefault();
    clearTimeout(touchLongPressTimer);

    if (e.touches.length === 2 && pinchStartDist > 0) {
      // Pinch-to-zoom
      const newDist = getPinchDistance(e);
      const scaleDelta = newDist / pinchStartDist;
      // Clamp Scale-Delta für sanfteres Zoomen
      const clampedDelta = Math.max(0.95, Math.min(1.05, scaleDelta));
      transform.setScale(
        Math.max(10, Math.min(200, (transform.transforms.value.scale ?? 100) * clampedDelta))
      );
      pinchStartDist = newDist;
      renderImage();
      return;
    }

    if (e.touches.length !== 1) return;

    const { clientX, clientY } = getTouchClientPos(e);
    const pos = getMousePos(e);

    // Verzerr-Ecke ziehen
    if (distortCorner) {
      moveDistortCorner(pos);
      return;
    }

    // Form verschieben/skalieren/drehen
    if (shapes.isDragging()) {
      shapes.moveDrag(pos);
      return;
    }

    // Crop-Handler
    const cropHandled = crop.handleMouseMove(pos);
    if (cropHandled) return;

    // Im Collage-Modus: Text-Dragging oder Layer
    if (isCollageMode.value) {
      if (isDraggingText.value && selectedTextId.value) {
        const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
        if (text) {
          text.x = pos.x - dragOffset.value.x;
          text.y = pos.y - dragOffset.value.y;
          renderImage();
        }
        return;
      }
      const syntheticEvent: PointerLike = {
        clientX,
        clientY,
        preventDefault: () => {},
        shiftKey: false,
      };
      layerInteraction.handleMouseMove(syntheticEvent);
      if (layerInteraction.isDragging.value || layerInteraction.isResizing.value) renderImage();
      return;
    }

    // Text-Dragging
    if (isDraggingText.value && selectedTextId.value) {
      const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
      if (text) {
        text.x = pos.x - dragOffset.value.x;
        text.y = pos.y - dragOffset.value.y;
        renderImage();
      }
    }
  }

  function onCanvasTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    clearTimeout(touchLongPressTimer);

    const { clientX, clientY } = getTouchClientPos(e);
    lastTouchTime = Date.now();
    lastTouchEndPos = { x: clientX, y: clientY };

    pinchStartDist = 0;

    // Verzerr-Ecke loslassen
    if (endDistortDrag()) {
      renderImage();
      return;
    }

    // Form-Aktion beenden
    if (shapes.endDrag()) return;

    // Crop-Handler
    const cropHandled = crop.handleMouseUp();
    if (cropHandled) {
      handleFinishCrop();
      return;
    }

    // Im Collage-Modus
    if (isCollageMode.value) {
      if (isDraggingText.value) {
        isDraggingText.value = false;
        if (canvas.value) canvas.value.style.cursor = 'default';
        renderImage();
        return;
      }
      layerInteraction.handleMouseUp();
      renderImage();
      return;
    }

    // Text-Dragging beenden
    if (isDraggingText.value) {
      isDraggingText.value = false;
      if (canvas.value) canvas.value.style.cursor = 'default';
      saveHistory();
    }
  }

  // Globaler MouseMove Handler für Crop Drag/Resize außerhalb des Canvas
  function handleGlobalMouseMove(e: MouseEvent): void {
    // Nur wenn wir gerade draggen, resizen, erstellen oder andere Aktionen ausführen
    const isCropActive = crop.isDragging.value || crop.isResizing.value || crop.isCreating.value;
    if (
      !isCropActive &&
      !isPanning.value &&
      !isDraggingText.value &&
      !distortCorner &&
      !shapes.isDragging()
    ) {
      return;
    }

    // Berechne Position relativ zum Canvas
    if (!canvas.value) return;
    const rect = canvas.value.getBoundingClientRect();

    // Konvertiere globale Mausposition zu Canvas-Koordinaten
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    const scaleX = canvas.value.width / rect.width;
    const scaleY = canvas.value.height / rect.height;

    const pos = {
      x: displayX * scaleX,
      y: displayY * scaleY,
    };

    // Crop-Handling (Dragging, Resizing oder Creating)
    if (isCropActive) {
      crop.handleMouseMove(pos);
      return;
    }

    // Verzerr-Ecke auch außerhalb des Canvas weiterziehen (wird geklemmt)
    if (distortCorner) {
      moveDistortCorner(pos);
      return;
    }

    // Form auch außerhalb des Canvas weiterziehen
    if (shapes.isDragging()) {
      shapes.moveDrag(pos, e.shiftKey);
      return;
    }

    // Pan-Handling
    if (isPanning.value) {
      const deltaX = e.clientX - panStart.value.x;
      const deltaY = e.clientY - panStart.value.y;
      panStart.value = { x: e.clientX, y: e.clientY };
      transform.pan(deltaX, deltaY);
      renderImage();
      return;
    }

    // Text-Dragging
    if (isDraggingText.value && selectedTextId.value) {
      const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
      if (text) {
        text.x = pos.x - dragOffset.value.x;
        text.y = pos.y - dragOffset.value.y;
        renderImage();
      }
    }
  }

  // Globaler MouseUp Handler für Crop Drag/Resize außerhalb des Canvas
  function handleGlobalMouseUp(): void {
    // Stoppe alle aktiven Crop-Operationen
    if (crop.isDragging.value || crop.isResizing.value || crop.isCreating.value) {
      crop.cancelDragResize();
    }
    // Verzerr-Ecke außerhalb des Canvas losgelassen
    if (endDistortDrag()) {
      renderImage();
    }
    // Form-Aktion außerhalb des Canvas beendet
    shapes.endDrag();
    // Stoppe auch Text-Dragging
    if (isDraggingText.value) {
      isDraggingText.value = false;
      if (canvas.value) {
        canvas.value.style.cursor = 'default';
      }
    }
    // Stoppe Panning
    if (isPanning.value) {
      isPanning.value = false;
      if (canvas.value) {
        canvas.value.style.cursor =
          isSpacePressed.value && transform.canPan.value ? 'grab' : 'default';
      }
    }
  }

  return {
    onSelectTextFromPanel,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasDoubleClick,
    onCanvasTouchStart,
    onCanvasTouchMove,
    onCanvasTouchEnd,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
  };
}
