/**
 * useEditorHistory
 *
 * Gemeinsame Undo/Redo-Historie des Editors. Ein Snapshot umfasst Bild,
 * Canvas-Größe, Filter, Hintergrund, Transformationen, Texte und Crop-Zustand.
 * Baut auf useImageHistory (Stack-Verwaltung) auf und liefert die Editor-
 * spezifischen saveHistory()/restoreState()-Funktionen. Ausgelagert aus
 * EditorView.vue, Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref} deps.selectedTextId
 * @param {import('vue').Ref} deps.filters          filters-Ref aus useFilterManagement
 * @param {import('vue').Ref} deps.background       background-Ref aus useFilterManagement
 * @param {object}   deps.imageStore
 * @param {object}   deps.filterManagement
 * @param {object}   deps.transform                  useTransform()-Instanz
 * @param {object}   deps.resizeManager              useResizeManager()-Instanz
 * @param {object}   deps.crop                       useCrop()-Instanz
 * @param {Function} deps.renderImage
 * @param {Function} deps.updateImageInfo
 */
import { useImageHistory } from '@/composables/useImageHistory';

export function useEditorHistory({
  canvas,
  currentImage,
  selectedTextId,
  filters,
  background,
  imageStore,
  filterManagement,
  transform,
  resizeManager,
  crop,
  renderImage,
  updateImageInfo,
}) {
  const imageHistory = useImageHistory({
    maxHistorySize: 50,
    onRestore: (state) => restoreState(state),
  });
  const { history, historyIndex, canUndo, canRedo } = imageHistory;

  function saveHistory() {
    if (!canvas.value) return;

    // Das rohe Bild (ohne Transforms) für verlässliches Undo/Redo speichern
    let rawImageSrc = null;
    if (currentImage.value) {
      if (currentImage.value.src && currentImage.value.src.startsWith('data:')) {
        rawImageSrc = currentImage.value.src;
      } else {
        // Blob-URL o.ä.: als Data-URL über Hilfs-Canvas sichern
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = canvas.value.width;
        tmpCanvas.height = canvas.value.height;
        tmpCanvas
          .getContext('2d')
          .drawImage(currentImage.value, 0, 0, tmpCanvas.width, tmpCanvas.height);
        rawImageSrc = tmpCanvas.toDataURL('image/png');
      }
    }

    imageHistory.saveState({
      imageData: canvas.value.toDataURL(),
      rawImageSrc,
      filters: { ...filters.value },
      background: { ...background.value },
      transforms: { ...transform.transforms.value },
      // Texte in die gemeinsame Historie aufnehmen, damit Undo/Redo den
      // gesamten Editor-Zustand umfasst (nicht nur Bild/Filter/Transform)
      texts: JSON.parse(JSON.stringify(imageStore.texts || [])),
      selectedTextId: selectedTextId.value,
      width: canvas.value.width,
      height: canvas.value.height,
      // Originalgröße des Bildes mitsichern, damit "Ohne Preset" auch nach
      // Undo/Redo das richtige Ziel hat
      naturalWidth: resizeManager.naturalWidth.value,
      naturalHeight: resizeManager.naturalHeight.value,
      hasCropped: crop.hasCropped.value,
    });
  }

  function undo() {
    imageHistory.undo();
  }

  function redo() {
    imageHistory.redo();
  }

  /** Leert die Historie (z.B. bei neuem Bild oder Reset); der nächste saveHistory() ist der neue Startpunkt */
  function resetHistory() {
    imageHistory.clearHistory();
  }

  function restoreState(state) {
    // rawImageSrc enthält das rohe Bild ohne gebackene Transforms → für renderImage() verwenden
    // imageData ist der gerenderte Canvas-Snapshot (Fallback)
    const srcToLoad = state.rawImageSrc || state.imageData;
    const img = new Image();
    img.onload = () => {
      canvas.value.width = state.width;
      canvas.value.height = state.height;
      currentImage.value = img;
      resizeManager.initFromDimensions(state.width, state.height, { natural: false });
      resizeManager.setNaturalSize(
        state.naturalWidth || state.width,
        state.naturalHeight || state.height
      );
      // Verwende filterManagement für konsistenten State
      if (state.filters) {
        filterManagement.importState({
          filters: state.filters,
          background: state.background,
        });
      }
      // Transform-State wiederherstellen (inkl. borderRadius für Kreis-Zuschnitt)
      if (state.transforms) {
        transform.transforms.value = { ...state.transforms };
      }
      // Texte wiederherstellen (gemeinsame Historie)
      if (state.texts) {
        imageStore.texts = JSON.parse(JSON.stringify(state.texts));
      }
      selectedTextId.value = state.selectedTextId ?? null;
      // Crop-State zurücksetzen wenn der gespeicherte State kein Zuschnitt war
      if (!state.hasCropped) {
        crop.resetCropState();
      }
      updateImageInfo();
      renderImage();
    };
    img.src = srcToLoad;
  }

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveHistory,
    undo,
    redo,
    resetHistory,
  };
}
