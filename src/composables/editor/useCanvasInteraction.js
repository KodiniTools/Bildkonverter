/**
 * useCanvasInteraction
 *
 * Kapselt die gesamte Zeiger-Interaktion auf dem Editor-Canvas:
 * Maus- und Touch-Handler (inkl. Pan, Pinch-Zoom, Text-Drag, Crop- und
 * Layer-Delegation), Hit-Testing für Text sowie die globalen Maus-Handler
 * für Drag/Resize außerhalb des Canvas. Ausgelagert aus EditorView.vue –
 * Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.isSpacePressed
 * @param {import('vue').Ref} deps.isPanning
 * @param {import('vue').Ref} deps.panStart
 * @param {import('vue').Ref} deps.isCollageMode
 * @param {import('vue').Ref} deps.selectedTextId
 * @param {import('vue').Ref} deps.isDraggingText
 * @param {import('vue').Ref} deps.dragOffset
 * @param {object}   deps.transform         useTransform()-Instanz
 * @param {object}   deps.crop              useCrop()-Instanz
 * @param {object}   deps.layerInteraction  useImageLayerInteraction()-Instanz
 * @param {object}   deps.imageStore        Pinia-Image-Store
 * @param {object}   deps.textModal         useTextModal()-Instanz
 * @param {Function} deps.renderImage
 * @param {Function} deps.handleFinishCrop
 * @param {Function} deps.saveHistory
 */
import { buildTextFontString } from '@/utils/textRender';

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
}) {
  function getMousePos(e) {
    const rect = canvas.value.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.value.width / rect.width;
    const scaleY = canvas.value.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function getTouchClientPos(e) {
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
    return { clientX: touch?.clientX ?? 0, clientY: touch?.clientY ?? 0 };
  }

  // Gibt den Display-Skalierungsfaktor zurück (wie viel kleiner ist die Anzeige als das Canvas)
  function getDisplayScale() {
    if (!canvas.value) return 1;
    const rect = canvas.value.getBoundingClientRect();
    return rect.width / canvas.value.width;
  }

  function onSelectTextFromPanel(textId) {
    selectedTextId.value = textId;
    renderImage();
  }

  function findTextAtPosition(x, y) {
    if (!imageStore.texts || imageStore.texts.length === 0) return null;

    const ctx = canvas.value.getContext('2d');

    // Von oben nach unten suchen (oberster Text hat Priorität)
    for (let i = imageStore.texts.length - 1; i >= 0; i--) {
      const text = imageStore.texts[i];
      const fontSize = text.fontSize || text.size || 32;
      const content = text.content || text.txt || '';

      ctx.font = buildTextFontString(text);
      const metrics = ctx.measureText(content);

      // Hit-Box: text.y ist Top-Koordinate (wegen textBaseline = 'top' in renderImage)
      // Etwas größere Hit-Box für bessere Bedienbarkeit
      const padding = 8;
      if (
        x >= text.x - padding &&
        x <= text.x + metrics.width + padding &&
        y >= text.y - padding &&
        y <= text.y + fontSize + padding
      ) {
        return text;
      }
    }
    return null;
  }

  function onCanvasMouseDown(e) {
    const pos = getMousePos(e);
    const displayScale = getDisplayScale();

    // Pan mit mittlerer Maustaste oder Leertaste + Linksklick
    const isMiddleButton = e.button === 1;
    const isPanGesture = isMiddleButton || (isSpacePressed.value && e.button === 0);

    if (isPanGesture && transform.canPan.value) {
      e.preventDefault();
      isPanning.value = true;
      panStart.value = { x: e.clientX, y: e.clientY };
      canvas.value.style.cursor = 'grabbing';
      return;
    }

    // Crop-Handler über Composable (hat Priorität)
    const cropHandled = crop.handleMouseDown(pos, displayScale);
    if (cropHandled) return;

    // Im Collage-Modus: Erst Text prüfen, dann Layer
    if (isCollageMode.value) {
      // Text hat Priorität (liegt visuell über Layern)
      const text = findTextAtPosition(pos.x, pos.y);
      if (text) {
        selectedTextId.value = text.id;
        isDraggingText.value = true;
        dragOffset.value = {
          x: pos.x - text.x,
          y: pos.y - text.y,
        };
        canvas.value.style.cursor = 'grabbing';
        // Layer-Auswahl aufheben
        imageStore.selectImageLayer(null);
        renderImage();
        return;
      }

      // Kein Text getroffen, Layer-Interaktion
      selectedTextId.value = null;
      layerInteraction.handleMouseDown(e);
      renderImage();
      return;
    }

    // Sonst Text-Interaktion (nicht Collage-Modus)
    const text = findTextAtPosition(pos.x, pos.y);

    if (text) {
      selectedTextId.value = text.id;
      isDraggingText.value = true;
      dragOffset.value = {
        x: pos.x - text.x,
        y: pos.y - text.y,
      };
      canvas.value.style.cursor = 'grabbing';
    } else {
      selectedTextId.value = null;
    }

    renderImage();
  }

  function onCanvasMouseMove(e) {
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

      // Cursor für Text-Hover im Collage-Modus
      if (!layerInteraction.isDragging.value && !layerInteraction.isResizing.value) {
        const text = findTextAtPosition(pos.x, pos.y);
        if (text) {
          canvas.value.style.cursor = 'grab';
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
      } else if (text) {
        cursorStyle = 'grab';
      }
      canvas.value.style.cursor = cursorStyle;
    }
  }

  function onCanvasMouseUp() {
    // Pan-Handling beenden
    if (isPanning.value) {
      isPanning.value = false;
      canvas.value.style.cursor =
        isSpacePressed.value && transform.canPan.value ? 'grab' : 'default';
      return;
    }

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
        canvas.value.style.cursor = 'default';
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
      canvas.value.style.cursor = 'default';
      saveHistory();
    }
  }

  function onCanvasDoubleClick(e) {
    const pos = getMousePos(e);
    const text = findTextAtPosition(pos.x, pos.y);

    if (text) {
      textModal.openEditTextModal(text.id);
    }
  }

  // ===== TOUCH HANDLER =====

  let touchLongPressTimer = null;
  let lastTouchTime = 0;
  let lastTouchEndPos = null;
  let activeTouchCount = 0;
  let pinchStartDist = 0;

  function getPinchDistance(e) {
    const t = e.touches;
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onCanvasTouchStart(e) {
    e.preventDefault();
    activeTouchCount = e.touches.length;

    if (e.touches.length === 2) {
      // Pinch-to-zoom vorbereiten
      pinchStartDist = getPinchDistance(e);
      clearTimeout(touchLongPressTimer);
      return;
    }

    if (e.touches.length !== 1) return;

    const { clientX, clientY } = getTouchClientPos(e);
    const pos = getMousePos(e);

    // Pan mit zwei Fingern – hier noch Ein-Finger: prüfe ob Leertaste (nicht möglich auf Mobil)
    // Crop-Handler
    const displayScale = getDisplayScale();
    const cropHandled = crop.handleMouseDown(pos, displayScale);
    if (cropHandled) return;

    // Im Collage-Modus
    if (isCollageMode.value) {
      const text = findTextAtPosition(pos.x, pos.y);
      if (text) {
        selectedTextId.value = text.id;
        isDraggingText.value = true;
        dragOffset.value = { x: pos.x - text.x, y: pos.y - text.y };
        if (canvas.value) canvas.value.style.cursor = 'grabbing';
        imageStore.selectImageLayer(null);
        renderImage();
      } else {
        selectedTextId.value = null;
        // Synthetisches Event für Layer-Interaktion
        const syntheticEvent = {
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
      isDraggingText.value = true;
      dragOffset.value = { x: pos.x - text.x, y: pos.y - text.y };
      if (canvas.value) canvas.value.style.cursor = 'grabbing';
    } else {
      selectedTextId.value = null;
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

  function onCanvasTouchMove(e) {
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
      const syntheticEvent = { clientX, clientY, preventDefault: () => {}, shiftKey: false };
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

  function onCanvasTouchEnd(e) {
    e.preventDefault();
    clearTimeout(touchLongPressTimer);

    const { clientX, clientY } = getTouchClientPos(e);
    lastTouchTime = Date.now();
    lastTouchEndPos = { x: clientX, y: clientY };

    pinchStartDist = 0;
    activeTouchCount = 0;

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
  function handleGlobalMouseMove(e) {
    // Nur wenn wir gerade draggen, resizen, erstellen oder andere Aktionen ausführen
    const isCropActive = crop.isDragging.value || crop.isResizing.value || crop.isCreating.value;
    if (!isCropActive && !isPanning.value && !isDraggingText.value) {
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
  function handleGlobalMouseUp() {
    // Stoppe alle aktiven Crop-Operationen
    if (crop.isDragging.value || crop.isResizing.value || crop.isCreating.value) {
      crop.cancelDragResize();
    }
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
