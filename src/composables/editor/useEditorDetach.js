/**
 * useEditorDetach
 *
 * "Bild vom Hintergrund lösen": wandelt das fest im Canvas verankerte
 * Basisbild in eine frei bewegliche Ebene um (nutzt das Ebenen-/Collage-System)
 * und wieder zurück. Ausgelagert aus EditorView.vue, Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref} deps.originalImage
 * @param {import('vue').Ref} deps.isCollageMode
 * @param {import('vue').Ref} [deps.detachedFromBackground] Zustand "abgelöst"; wird vom Editor
 *   geteilt, damit die Historie ihn mitsichern kann (fehlt er, wird er hier angelegt)
 * @param {import('vue').Ref} deps.background       background-Ref aus useFilterManagement
 * @param {import('vue').Ref} deps.currentFileName
 * @param {object}   deps.imageStore
 * @param {object}   deps.filterManagement
 * @param {object}   deps.transform
 * @param {object}   deps.resizeManager
 * @param {Function} deps.renderImage
 * @param {Function} deps.renderImageForExport
 * @param {Function} deps.updateImageInfo
 * @param {Function} deps.saveHistory
 * @param {Function} deps.t
 */
import { ref, watch } from 'vue';
import { loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

export function useEditorDetach({
  canvas,
  currentImage,
  originalImage,
  isCollageMode,
  detachedFromBackground: sharedDetached,
  background,
  currentFileName,
  imageStore,
  filterManagement,
  transform,
  resizeManager,
  renderImage,
  renderImageForExport,
  updateImageInfo,
  saveHistory,
  t,
}) {
  // true, wenn das Basisbild als frei bewegliche Ebene "abgelöst" wurde
  const detachedFromBackground = sharedDetached || ref(false);

  // Hintergrundfarbe des Canvas mit dem Hintergrund-Panel synchronisieren, damit
  // der Collage-Renderer denselben Hintergrund zeigt.
  function syncCanvasBackground() {
    imageStore.canvasBackgroundColor =
      background.value.opacity > 0 ? background.value.color : 'transparent';
  }

  async function detachImageFromBackground() {
    if (!canvas.value || !currentImage.value || isCollageMode.value) return;

    const canvasW = canvas.value.width;
    const canvasH = canvas.value.height;

    // Aktuell bearbeitetes Basisbild (mit Filtern/Transformationen, ohne Text) auf
    // transparentem Grund in eine Data-URL "backen".
    renderImageForExport(true, false);
    const bakedUrl = canvas.value.toDataURL('image/png');

    syncCanvasBackground();

    // Store-Canvas initialisieren (für Layer-Interaktion & Store-History)
    imageStore.initCanvas(canvas.value);

    try {
      // Bild als frei bewegliche Ebene hinzufügen und exakt über den Canvas legen
      const layer = await imageStore.addImageLayer({
        url: bakedUrl,
        name: currentFileName.value || t('editor.detach.layerName', 'Bild'),
      });
      imageStore.updateImageLayer(layer.id, {
        x: 0,
        y: 0,
        width: canvasW,
        height: canvasH,
        originalWidth: canvasW,
        originalHeight: canvasH,
      });
      imageStore.selectImageLayer(layer.id);
    } catch (error) {
      logger.error('❌ Ablösen vom Hintergrund fehlgeschlagen:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.editor.detachFailed', 'Ablösen fehlgeschlagen'));
      }
      return;
    }

    // Filter/Transformationen sind nun in der Ebene eingebacken → Basiswerte
    // neutralisieren (Hintergrund bleibt als Canvas-Backdrop erhalten)
    filterManagement.resetFilters();
    transform.resetTransforms();

    detachedFromBackground.value = true;
    isCollageMode.value = true;

    renderImage();
    updateImageInfo();
    saveHistory();

    if (window.$toast) {
      window.$toast.success(
        t('toast.editor.imageDetached', 'Bild vom Hintergrund gelöst – jetzt frei verschiebbar')
      );
    }
  }

  async function reattachImageToBackground() {
    if (!canvas.value) return;

    const canvasW = canvas.value.width;
    const canvasH = canvas.value.height;

    // Aktuelle Ebene(n) ohne Text-Overlays transparent in eine Data-URL backen.
    // Text bleibt als eigene, editierbare Ebene erhalten.
    renderImageForExport(true, false);
    const flatUrl = canvas.value.toDataURL('image/png');

    let img;
    try {
      img = await loadImage(flatUrl);
    } catch (error) {
      logger.error('❌ Zurückverbinden mit dem Hintergrund fehlgeschlagen:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.editor.reattachFailed', 'Verbinden fehlgeschlagen'));
      }
      return;
    }

    // Ebenen entfernen und zurück in den Einzelbild-Modus wechseln
    imageStore.clearImageLayers();
    imageStore.selectImageLayer(null);
    detachedFromBackground.value = false;
    isCollageMode.value = false;

    currentImage.value = img;
    originalImage.value = originalImage.value || img;
    canvas.value.width = canvasW;
    canvas.value.height = canvasH;
    resizeManager.initFromDimensions(canvasW, canvasH);

    renderImage();
    updateImageInfo();
    saveHistory();

    if (window.$toast) {
      window.$toast.success(
        t('toast.editor.imageReattached', 'Bild wieder mit dem Hintergrund verbunden')
      );
    }
  }

  function handleToggleDetach() {
    if (detachedFromBackground.value) {
      reattachImageToBackground();
    } else {
      detachImageFromBackground();
    }
  }

  // Live-Hintergrund im abgelösten Zustand: Änderungen im Hintergrund-Panel wirken
  // sich auch im Ebenen-Modus auf den Canvas-Hintergrund aus.
  watch(
    () => [background.value.color, background.value.opacity],
    () => {
      if (!detachedFromBackground.value) return;
      syncCanvasBackground();
      renderImage();
    }
  );

  return {
    detachedFromBackground,
    handleToggleDetach,
    detachImageFromBackground,
    reattachImageToBackground,
  };
}
