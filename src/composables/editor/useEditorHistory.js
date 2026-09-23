/**
 * useEditorHistory
 *
 * Die einzige Undo/Redo-Historie des Editors. Ein Snapshot umfasst Bild,
 * Canvas-Größe, Filter, Hintergrund, Transformationen, Texte, Crop-Zustand
 * sowie im Ebenen-/Collage-Modus die Bild-Ebenen, ihre Auswahl und den
 * Canvas-Hintergrund. Baut auf useImageHistory (Stack-Verwaltung) auf.
 *
 * Die Historie wird beim imageStore registriert, damit Composables ohne
 * Editor-Kontext (Ebenen-Panel, Text-Dialog, Ebenen-Interaktion) über
 * imageStore.saveState()/undo()/redo() dieselbe Historie nutzen.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref} deps.isCollageMode
 * @param {import('vue').Ref} deps.detachedFromBackground
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
  isCollageMode,
  detachedFromBackground,
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

  /**
   * Schreibt einen Snapshot des gesamten Editor-Zustands.
   * @param {string} [description] Kurzbeschreibung der Aktion (für Anzeige/Debugging)
   */
  function saveHistory(description = '') {
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
      description,
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
      // Ebenen-/Collage-Modus
      isCollageMode: !!isCollageMode?.value,
      detachedFromBackground: !!detachedFromBackground?.value,
      imageLayers: imageStore.serializeImageLayers ? imageStore.serializeImageLayers() : [],
      selectedLayerId: imageStore.selectedLayerId ?? null,
      canvasBackgroundColor: imageStore.canvasBackgroundColor ?? '#ffffff',
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

  /** Gemeinsamer Teil der Wiederherstellung (Canvas, Filter, Transform, Texte, Crop) */
  function applyEditorState(state) {
    canvas.value.width = state.width;
    canvas.value.height = state.height;
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
    // Ebenen-/Collage-Modus
    if (isCollageMode) isCollageMode.value = !!state.isCollageMode;
    if (detachedFromBackground) detachedFromBackground.value = !!state.detachedFromBackground;
    if (state.canvasBackgroundColor !== undefined) {
      imageStore.canvasBackgroundColor = state.canvasBackgroundColor;
    }
    updateImageInfo();
    renderImage();
  }

  async function restoreState(state) {
    if (state.isCollageMode) {
      // Ebenen samt Bildern neu laden; das Basisbild bleibt unverändert
      await imageStore.restoreImageLayers(state.imageLayers || [], state.selectedLayerId ?? null);
      applyEditorState(state);
      return;
    }

    // Einzelbild-Modus: eventuell vorhandene Ebenen verwerfen
    if (imageStore.clearImageLayers) imageStore.clearImageLayers();

    // rawImageSrc enthält das rohe Bild ohne gebackene Transforms → für renderImage() verwenden
    // imageData ist der gerenderte Canvas-Snapshot (Fallback)
    const srcToLoad = state.rawImageSrc || state.imageData;
    if (!srcToLoad) {
      currentImage.value = null;
      applyEditorState(state);
      return;
    }
    const img = new Image();
    img.onload = () => {
      currentImage.value = img;
      applyEditorState(state);
    };
    img.src = srcToLoad;
  }

  const api = {
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveHistory,
    undo,
    redo,
    resetHistory,
  };

  // Beim Store registrieren, damit Ebenen-Panel, Text-Dialog und
  // Ebenen-Interaktion dieselbe Historie nutzen
  if (typeof imageStore.registerHistory === 'function') {
    imageStore.registerHistory(api);
  }

  /** Registrierung beim Verlassen des Editors aufheben */
  function unregisterHistory() {
    if (typeof imageStore.registerHistory === 'function') {
      imageStore.registerHistory(null);
    }
  }

  return { ...api, unregisterHistory };
}
