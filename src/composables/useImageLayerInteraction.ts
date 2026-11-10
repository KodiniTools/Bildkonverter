/**
 * useImageLayerInteraction.ts - Composable für Bild-Layer Interaktion
 * Ermöglicht Drag, Resize und Auswahl von Bild-Layern in der Collage
 */

import { ref, type Ref } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import type { ImageLayer } from '@/stores/image/types';
import type { PointerLike } from '@/composables/editor/useCanvasInteraction';

/** Resize-Griff eines Bild-Layers: Ecken und Kantenmitten */
export type LayerHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Position und Größe eines Layers */
export interface LayerBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasPoint {
  x: number;
  y: number;
}

/** Maus-, Touch- oder synthetisches Ereignis aus useCanvasInteraction */
export type LayerPointerEvent = PointerLike | MouseEvent | TouchEvent;

export function useImageLayerInteraction(canvasRef: Ref<HTMLCanvasElement | null>) {
  const imageStore = useImageStore();

  // Interaktionszustand
  const isDragging = ref(false);
  const isResizing = ref(false);
  const activeHandle = ref<LayerHandle | null>(null); // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
  const dragStart = ref<CanvasPoint>({ x: 0, y: 0 });
  const layerStart = ref<LayerBox>({ x: 0, y: 0, width: 0, height: 0 });

  // Handle-Größe für Hit-Detection
  const HANDLE_SIZE = 12;

  /**
   * Findet den Layer an einer bestimmten Position
   */
  function findLayerAtPosition(x: number, y: number): ImageLayer | null {
    // Von oben nach unten suchen (letzte Layer sind oben)
    for (let i = imageStore.imageLayers.length - 1; i >= 0; i--) {
      const layer = imageStore.imageLayers[i]!;
      if (!layer.visible || layer.locked) continue;

      if (isPointInLayer(x, y, layer)) {
        return layer;
      }
    }
    return null;
  }

  /**
   * Prüft ob ein Punkt innerhalb eines Layers liegt
   */
  function isPointInLayer(x: number, y: number, layer: LayerBox) {
    // TODO: Rotation berücksichtigen
    return (
      x >= layer.x && x <= layer.x + layer.width && y >= layer.y && y <= layer.y + layer.height
    );
  }

  /**
   * Findet den Resize-Handle an einer Position
   */
  function findHandleAtPosition(
    x: number,
    y: number,
    layer: LayerBox | null | undefined
  ): LayerHandle | null {
    if (!layer) return null;

    const handles = getHandlePositions(layer);

    for (const [name, pos] of Object.entries(handles) as [LayerHandle, CanvasPoint][]) {
      if (
        x >= pos.x - HANDLE_SIZE / 2 &&
        x <= pos.x + HANDLE_SIZE / 2 &&
        y >= pos.y - HANDLE_SIZE / 2 &&
        y <= pos.y + HANDLE_SIZE / 2
      ) {
        return name;
      }
    }

    return null;
  }

  /**
   * Gibt die Positionen aller Handles zurück
   */
  function getHandlePositions(layer: LayerBox): Record<LayerHandle, CanvasPoint> {
    return {
      nw: { x: layer.x, y: layer.y },
      n: { x: layer.x + layer.width / 2, y: layer.y },
      ne: { x: layer.x + layer.width, y: layer.y },
      e: { x: layer.x + layer.width, y: layer.y + layer.height / 2 },
      se: { x: layer.x + layer.width, y: layer.y + layer.height },
      s: { x: layer.x + layer.width / 2, y: layer.y + layer.height },
      sw: { x: layer.x, y: layer.y + layer.height },
      w: { x: layer.x, y: layer.y + layer.height / 2 },
    };
  }

  /**
   * Konvertiert Maus- oder Touch-Koordinaten zu Canvas-Koordinaten
   */
  function getCanvasCoords(event: LayerPointerEvent): CanvasPoint {
    if (!canvasRef.value) return { x: 0, y: 0 };

    const rect = canvasRef.value.getBoundingClientRect();
    const scaleX = canvasRef.value.width / rect.width;
    const scaleY = canvasRef.value.height / rect.height;

    const touches = (event as Partial<TouchEvent>).touches;
    const clientX = touches ? touches[0]!.clientX : (event as PointerLike).clientX;
    const clientY = touches ? touches[0]!.clientY : (event as PointerLike).clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  /**
   * Mouse-Down Handler
   */
  function handleMouseDown(event: LayerPointerEvent) {
    if (!canvasRef.value) return;

    const coords = getCanvasCoords(event);
    const selectedLayer = imageStore.selectedImageLayer;

    // Prüfe zuerst ob wir auf einem Handle sind
    if (selectedLayer) {
      const handle = findHandleAtPosition(coords.x, coords.y, selectedLayer);
      if (handle) {
        isResizing.value = true;
        activeHandle.value = handle;
        dragStart.value = coords;
        layerStart.value = {
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: selectedLayer.width,
          height: selectedLayer.height,
        };
        event.preventDefault();
        return;
      }
    }

    // Dann prüfe ob wir auf einem Layer sind
    const layer = findLayerAtPosition(coords.x, coords.y);

    if (layer) {
      imageStore.selectImageLayer(layer.id);
      isDragging.value = true;
      dragStart.value = coords;
      layerStart.value = {
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
      };
      event.preventDefault();
    } else {
      // Klick außerhalb - Auswahl aufheben
      imageStore.selectImageLayer(null);
    }
  }

  /**
   * Mouse-Move Handler
   */
  function handleMouseMove(event: LayerPointerEvent) {
    if (!canvasRef.value) return;

    const coords = getCanvasCoords(event);
    const selectedLayer = imageStore.selectedImageLayer;

    // Cursor aktualisieren
    if (selectedLayer && !isDragging.value && !isResizing.value) {
      const handle = findHandleAtPosition(coords.x, coords.y, selectedLayer);
      if (handle) {
        canvasRef.value.style.cursor = getHandleCursor(handle);
      } else if (isPointInLayer(coords.x, coords.y, selectedLayer)) {
        canvasRef.value.style.cursor = 'move';
      } else {
        canvasRef.value.style.cursor = 'default';
      }
    }

    // Dragging
    if (isDragging.value && selectedLayer) {
      const dx = coords.x - dragStart.value.x;
      const dy = coords.y - dragStart.value.y;

      imageStore.updateImageLayer(selectedLayer.id, {
        x: layerStart.value.x + dx,
        y: layerStart.value.y + dy,
      });
    }

    // Resizing
    if (isResizing.value && selectedLayer && activeHandle.value) {
      const dx = coords.x - dragStart.value.x;
      const dy = coords.y - dragStart.value.y;

      const updates = calculateResize(
        activeHandle.value,
        dx,
        dy,
        layerStart.value,
        event.shiftKey // Shift für proportionales Resize
      );

      imageStore.updateImageLayer(selectedLayer.id, updates);
    }
  }

  /**
   * Mouse-Up Handler
   */
  function handleMouseUp() {
    if (isDragging.value || isResizing.value) {
      // History speichern
      imageStore.saveState('Layer verschoben/skaliert');
    }

    isDragging.value = false;
    isResizing.value = false;
    activeHandle.value = null;

    if (canvasRef.value) {
      canvasRef.value.style.cursor = 'default';
    }
  }

  /**
   * Berechnet die neuen Dimensionen beim Resize
   */
  function calculateResize(
    handle: LayerHandle,
    dx: number,
    dy: number,
    start: LayerBox,
    proportional = false
  ): LayerBox {
    let { x, y, width, height } = start;
    const aspectRatio = start.width / start.height;

    switch (handle) {
      case 'se':
        width = Math.max(50, start.width + dx);
        height = proportional ? width / aspectRatio : Math.max(50, start.height + dy);
        break;
      case 'e':
        width = Math.max(50, start.width + dx);
        if (proportional) height = width / aspectRatio;
        break;
      case 's':
        height = Math.max(50, start.height + dy);
        if (proportional) width = height * aspectRatio;
        break;
      case 'nw':
        width = Math.max(50, start.width - dx);
        height = proportional ? width / aspectRatio : Math.max(50, start.height - dy);
        x = start.x + start.width - width;
        y = start.y + start.height - height;
        break;
      case 'ne':
        width = Math.max(50, start.width + dx);
        height = proportional ? width / aspectRatio : Math.max(50, start.height - dy);
        y = start.y + start.height - height;
        break;
      case 'sw':
        width = Math.max(50, start.width - dx);
        height = proportional ? width / aspectRatio : Math.max(50, start.height + dy);
        x = start.x + start.width - width;
        break;
      case 'n':
        height = Math.max(50, start.height - dy);
        if (proportional) width = height * aspectRatio;
        y = start.y + start.height - height;
        break;
      case 'w':
        width = Math.max(50, start.width - dx);
        if (proportional) height = width / aspectRatio;
        x = start.x + start.width - width;
        break;
    }

    return { x, y, width, height };
  }

  /**
   * Gibt den passenden Cursor für einen Handle zurück
   */
  function getHandleCursor(handle: LayerHandle) {
    const cursors: Record<LayerHandle, string> = {
      nw: 'nw-resize',
      n: 'n-resize',
      ne: 'ne-resize',
      e: 'e-resize',
      se: 'se-resize',
      s: 's-resize',
      sw: 'sw-resize',
      w: 'w-resize',
    };
    return cursors[handle] || 'default';
  }

  function handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    handleMouseDown(event);
  }

  function handleTouchMove(event: TouchEvent) {
    event.preventDefault();
    handleMouseMove(event);
  }

  function handleTouchEnd(event: TouchEvent) {
    event.preventDefault();
    handleMouseUp();
  }

  /**
   * Initialisiert die Event-Listener
   */
  function initListeners() {
    if (!canvasRef.value) return;

    canvasRef.value.addEventListener('mousedown', handleMouseDown);
    canvasRef.value.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }

  /**
   * Entfernt die Event-Listener
   */
  function removeListeners() {
    if (canvasRef.value) {
      canvasRef.value.removeEventListener('mousedown', handleMouseDown);
      canvasRef.value.removeEventListener('touchstart', handleTouchStart);
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  }

  return {
    // State
    isDragging,
    isResizing,
    activeHandle,

    // Methods
    findLayerAtPosition,
    findHandleAtPosition,
    getCanvasCoords,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    initListeners,
    removeListeners,
  };
}
