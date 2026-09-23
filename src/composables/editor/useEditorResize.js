/**
 * useEditorResize
 *
 * Größenänderung des Canvas im Editor: Live-Vorschau beim Tippen in die
 * Breite/Höhe-Felder, Größen-Presets (Dropdown) und die endgültige Übernahme
 * mit History-Eintrag über "Anwenden". Ausgelagert aus EditorView.vue,
 * Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {object}   deps.resizeManager   useResizeManager()-Instanz
 * @param {Function} deps.renderImage
 * @param {Function} deps.updateImageSize Dateigröße neu schätzen
 * @param {Function} deps.saveHistory
 * @param {Function} deps.t
 */
import { ref, watch } from 'vue';

/** Maximale Kantenlänge für Größenänderungen (identisch zur Live-Vorschau) */
export const MAX_RESIZE_DIMENSION = 10000;

export function useEditorResize({
  canvas,
  currentImage,
  resizeManager,
  renderImage,
  updateImageSize,
  saveHistory,
  t,
}) {
  const { resizeWidth, resizeHeight, naturalWidth, naturalHeight } = resizeManager;

  // Aktuell im Dropdown gewähltes Größen-Preset ('' = keines)
  const selectedPreset = ref('');

  // Live-Vorschau: Das Bild im Canvas reagiert schon während des Tippens auf die
  // Werte in den "Grösse ändern"-Feldern (Breite/Höhe) sowie auf Presets. Die
  // endgültige Übernahme (History + Toast) erfolgt weiterhin über "Anwenden".
  let resizePreviewTimer = null;

  /** Verwirft eine noch ausstehende Live-Vorschau (veralteter Feldwert) */
  function cancelResizePreview() {
    if (resizePreviewTimer) {
      clearTimeout(resizePreviewTimer);
      resizePreviewTimer = null;
    }
  }

  watch([resizeWidth, resizeHeight], ([newWidth, newHeight]) => {
    // Jede Änderung der Felder ersetzt die vorherige Eingabe. Eine dafür noch
    // ausstehende Vorschau darf den Canvas nicht mehr verändern – auch dann
    // nicht, wenn der neue Wert ungültig ist oder der aktuellen Größe entspricht
    // (z.B. "Ohne Preset" direkt nach dem Tippen).
    cancelResizePreview();

    if (!canvas.value || !currentImage.value) return;

    // Leere oder ungültige Eingaben ignorieren (z.B. während des Tippens)
    if (!newWidth || !newHeight) return;
    if (
      newWidth < 1 ||
      newHeight < 1 ||
      newWidth > MAX_RESIZE_DIMENSION ||
      newHeight > MAX_RESIZE_DIMENSION
    )
      return;

    // Keine Änderung gegenüber der aktuellen Canvas-Größe → nichts tun
    // (verhindert überflüssiges Neuzeichnen z.B. nach initFromDimensions)
    if (canvas.value.width === newWidth && canvas.value.height === newHeight) return;

    // Neuzeichnen leicht entprellen, damit schnelles Tippen den Canvas bei
    // großen Bildern nicht überlastet – fühlt sich trotzdem unmittelbar an.
    resizePreviewTimer = setTimeout(() => {
      resizePreviewTimer = null;
      if (!canvas.value || !currentImage.value) return;
      canvas.value.width = newWidth;
      canvas.value.height = newHeight;
      renderImage();
    }, 100);
  });

  // Die Preset-Auswahl gilt nur, solange die Maße auch wirklich zum Preset
  // passen. Manuelle Eingaben, Undo/Redo, Zuschnitt oder ein neues Bild setzen
  // das Dropdown daher automatisch auf "Preset wählen..." zurück.
  watch([resizeWidth, resizeHeight], ([newWidth, newHeight]) => {
    if (!selectedPreset.value) return;

    const preset = resizeManager.presetSizes[selectedPreset.value];
    if (!preset || preset.width !== newWidth || preset.height !== newHeight) {
      selectedPreset.value = '';
    }
  });

  function onResizeChange(dimension) {
    resizeManager.onDimensionChange(dimension);
  }

  /**
   * Übernimmt eine neue Bildgröße endgültig: Canvas anpassen, neu zeichnen,
   * Basiswerte aktualisieren und einen History-Eintrag schreiben (Undo/Redo).
   * @param {number} width - Neue Breite in Pixeln
   * @param {number} height - Neue Höhe in Pixeln
   */
  function commitResize(width, height) {
    if (!canvas.value || !currentImage.value) return;

    // Ausstehende Live-Vorschau verwerfen – die Größe wird jetzt direkt gesetzt
    cancelResizePreview();

    canvas.value.width = width;
    canvas.value.height = height;
    renderImage();
    updateImageSize(); // Dateigröße neu berechnen nach Resize

    // Basiswerte (u. a. Seitenverhältnis) auf die neue Größe setzen. Die
    // Originalgröße des Bildes bleibt erhalten, damit "Ohne Preset" weiterhin
    // dorthin zurückführt.
    resizeManager.initFromDimensions(width, height, { natural: false });

    saveHistory();

    if (window.$toast) {
      window.$toast.success(t('toast.editor.resizeSuccess', { width, height }));
    }
  }

  function applySocialPreset(presetName) {
    if (!canvas.value || !currentImage.value) return;

    // Platzhalter "Preset wählen..." → keine Änderung
    if (!presetName) {
      selectedPreset.value = '';
      return;
    }

    // "Ohne Preset" → zurück auf die Originalgröße des geladenen Bildes
    if (presetName === 'none') {
      selectedPreset.value = '';

      const width = naturalWidth.value;
      const height = naturalHeight.value;
      if (!width || !height) return;

      // Originalgröße ist bereits übernommen – nur die Eingabefelder angleichen
      if (
        resizeManager.originalWidth.value === width &&
        resizeManager.originalHeight.value === height &&
        canvas.value.width === width &&
        canvas.value.height === height
      ) {
        resizeManager.resetToOriginal();
        return;
      }

      commitResize(width, height);
      return;
    }

    const preset = resizeManager.presetSizes[presetName];
    if (!preset) return;

    selectedPreset.value = presetName;
    commitResize(preset.width, preset.height);
  }

  function applyResize() {
    if (!canvas.value || !currentImage.value) return;

    const width = Math.round(Number(resizeWidth.value));
    const height = Math.round(Number(resizeHeight.value));

    // Leere oder unsinnige Eingaben abfangen, bevor der Canvas zerstört wird
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > MAX_RESIZE_DIMENSION ||
      height > MAX_RESIZE_DIMENSION
    ) {
      if (window.$toast) {
        window.$toast.error(t('toast.editor.resizeInvalid', { max: MAX_RESIZE_DIMENSION }));
      }
      return;
    }

    // Größe ist bereits übernommen (z. B. direkt nach einem Preset) → keinen
    // zweiten, identischen History-Eintrag anlegen. Der Canvas wird bewusst
    // mitgeprüft, weil die Live-Vorschau ihn unabhängig verändert haben kann.
    if (
      width === resizeManager.originalWidth.value &&
      height === resizeManager.originalHeight.value &&
      canvas.value.width === width &&
      canvas.value.height === height
    ) {
      return;
    }

    commitResize(width, height);
  }

  return {
    selectedPreset,
    onResizeChange,
    commitResize,
    applySocialPreset,
    applyResize,
  };
}
