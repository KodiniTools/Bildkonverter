/**
 * useEditorKeyboard
 *
 * Kapselt die Tastatur-Shortcuts des Editors (Pan via Leertaste, Undo/Redo,
 * Spiegeln, Rotation, Text löschen). Ausgelagert aus EditorView.vue –
 * Verhalten unverändert. Eingabefelder (INPUT/TEXTAREA/SELECT) werden
 * weiterhin ignoriert, damit normales Tippen nicht abgefangen wird.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref} deps.selectedTextId
 * @param {import('vue').Ref} deps.isSpacePressed
 * @param {import('vue').Ref} deps.isPanning
 * @param {object}   deps.transform
 * @param {object}   deps.imageStore
 * @param {Function} deps.renderImage
 * @param {Function} deps.undo
 * @param {Function} deps.redo
 * @param {Function} deps.handleUndoTransform
 * @param {Function} deps.handleRedoTransform
 * @param {Function} deps.handleFlipHorizontal
 * @param {Function} deps.handleFlipVertical
 * @param {Function} deps.handleRotate90
 * @param {Function} deps.handleRotate90Counter
 * @param {Function} deps.handleRotate180
 * @param {Function} deps.t
 */
export function useEditorKeyboard({
  canvas,
  currentImage,
  selectedTextId,
  isSpacePressed,
  isPanning,
  transform,
  imageStore,
  renderImage,
  undo,
  redo,
  handleUndoTransform,
  handleRedoTransform,
  handleFlipHorizontal,
  handleFlipVertical,
  handleRotate90,
  handleRotate90Counter,
  handleRotate180,
  t,
}) {
  function handleKeydown(e) {
    // Ignoriere Shortcuts wenn Input/Textarea fokussiert ist
    const isInputFocused =
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      document.activeElement?.tagName === 'SELECT';

    // Leertaste für Pan-Modus (nur wenn Zoom > 100%)
    if (e.code === 'Space' && transform.canPan.value && !e.repeat) {
      if (!isInputFocused) {
        e.preventDefault();
        isSpacePressed.value = true;
        if (canvas.value) {
          canvas.value.style.cursor = 'grab';
        }
      }
    }

    // Ctrl/Cmd Shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Erst Transform-Undo versuchen, dann allgemeines Undo
        if (transform.canUndoTransform.value) {
          handleUndoTransform();
        } else {
          undo();
        }
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        // Erst Transform-Redo versuchen, dann allgemeines Redo
        if (transform.canRedoTransform.value) {
          handleRedoTransform();
        } else {
          redo();
        }
      }
      return;
    }

    // Nur wenn kein Bild geladen ist, keine weiteren Shortcuts
    if (!currentImage.value) return;

    // Nur wenn kein Input fokussiert ist
    if (isInputFocused) return;

    // Transform Shortcuts (nur wenn Bild geladen)
    switch (e.key) {
      // Spiegeln
      case 'h':
      case 'H':
        e.preventDefault();
        handleFlipHorizontal();
        break;
      case 'v':
      case 'V':
        e.preventDefault();
        handleFlipVertical();
        break;

      // Rotation mit Pfeiltasten
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          // Grobe Rotation: -15°
          transform.setRotation(transform.transforms.value.rotation - 15, true);
        } else {
          // Feine Rotation: -1°
          transform.setRotation(transform.transforms.value.rotation - 1, true);
        }
        renderImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          // Grobe Rotation: +15°
          transform.setRotation(transform.transforms.value.rotation + 15, true);
        } else {
          // Feine Rotation: +1°
          transform.setRotation(transform.transforms.value.rotation + 1, true);
        }
        renderImage();
        break;

      // Rotation zurücksetzen
      case 'r':
      case 'R':
        e.preventDefault();
        if (transform.transforms.value.rotation !== 0) {
          transform.setRotation(0, true);
          renderImage();
          if (window.$toast) {
            window.$toast.info(t('toast.transform.rotationReset', 'Rotation zurückgesetzt'));
          }
        }
        break;

      // Schnell-Rotationen mit Ziffern
      case '1':
        e.preventDefault();
        handleRotate90Counter();
        break;
      case '2':
        e.preventDefault();
        handleRotate180();
        break;
      case '3':
        e.preventDefault();
        handleRotate90();
        break;

      // Delete selected text
      case 'Delete':
      case 'Backspace':
        if (selectedTextId.value) {
          e.preventDefault();
          imageStore.deleteText(selectedTextId.value);
          selectedTextId.value = null;
        }
        break;
    }
  }

  function handleKeyup(e) {
    // Leertaste loslassen beendet Pan-Modus
    if (e.code === 'Space') {
      isSpacePressed.value = false;
      isPanning.value = false;
      if (canvas.value) {
        canvas.value.style.cursor = 'default';
      }
    }
  }

  return { handleKeydown, handleKeyup };
}
