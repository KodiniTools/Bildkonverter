/**
 * useEditorPreview
 *
 * Vorher/Nachher-Vorschau-Modal des Editors. Das "Nachher"-Bild wird ohne
 * Auswahl-Markierungen gerendert (wie beim Export). Ausgelagert aus
 * EditorView.vue, Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref} deps.originalImageDataUrl
 * @param {object}   deps.imageStore
 * @param {Function} deps.renderImage
 * @param {Function} deps.renderImageForExport
 */
import { ref } from 'vue';

export function useEditorPreview({
  canvas,
  currentImage,
  originalImageDataUrl,
  imageStore,
  renderImage,
  renderImageForExport,
}) {
  const showPreviewModal = ref(false);
  const originalPreviewSrc = ref('');
  const editedPreviewSrc = ref('');

  // Bearbeitetes Bild OHNE Auswahl-Markierung aufnehmen, damit der
  // Text-Auswahlrahmen nicht in der Vorschau erscheint; danach den
  // On-Screen-Canvas wieder mit Auswahl-Markierung herstellen.
  function captureEditedPreview() {
    if (!canvas.value) return;
    renderImageForExport();
    editedPreviewSrc.value = canvas.value.toDataURL('image/png');
    renderImage();
  }

  function openPreview() {
    if (!currentImage.value || !canvas.value) return;

    // Rendere die Canvas mit allen aktuellen Änderungen neu
    renderImage();

    // Warte kurz, damit das Rendering abgeschlossen ist, dann aktualisiere die Preview-Bilder
    setTimeout(() => {
      originalPreviewSrc.value = originalImageDataUrl.value || imageStore.workingUrl || '';
      captureEditedPreview();
      showPreviewModal.value = true;
    }, 100);
  }

  // Preview Handler für LayerControlPanel (Collage-Modus)
  function handleLayerPreview() {
    if (!canvas.value) return;

    renderImage();

    setTimeout(() => {
      // Im Collage-Modus: Erstes Layer-Bild als "Original" verwenden
      originalPreviewSrc.value =
        imageStore.imageLayers.length > 0 ? imageStore.imageLayers[0].url || '' : '';
      captureEditedPreview();
      showPreviewModal.value = true;
    }, 100);
  }

  function closePreview() {
    showPreviewModal.value = false;
  }

  return {
    showPreviewModal,
    originalPreviewSrc,
    editedPreviewSrc,
    openPreview,
    handleLayerPreview,
    closePreview,
  };
}
