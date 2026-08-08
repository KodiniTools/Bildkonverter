import { ref, watch } from 'vue';

/**
 * useImageInfo
 *
 * Verwaltet die Anzeige-Infos zum aktuellen Canvas: Breite, Höhe und
 * geschätzte Dateigröße sowie deren Aktualisierung sund Formatierung.
 * Ausgelagert aus EditorView.vue – Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas        Canvas-Element-Ref
 * @param {import('vue').Ref} deps.outputFormat  Aktuelles Export-Format
 */
export function useImageInfo({ canvas, outputFormat }) {
  const imageWidth = ref(0);
  const imageHeight = ref(0);
  const imageSize = ref(0);

  // Schnelle Funktion: nur Dimensionen aktualisieren (wird bei jedem renderImage() aufgerufen)
  function updateImageDimensions() {
    if (!canvas.value) {
      imageWidth.value = 0;
      imageHeight.value = 0;
      return;
    }

    imageWidth.value = canvas.value.width;
    imageHeight.value = canvas.value.height;
  }

  // Langsame Funktion: Dateigröße berechnen (nur bei Bedarf aufrufen!)
  function updateImageSize() {
    if (!canvas.value) {
      imageSize.value = 0;
      return;
    }

    try {
      const dataUrl = canvas.value.toDataURL(`image/${outputFormat.value}`, 0.92);
      const base64String = dataUrl.split(',')[1];
      const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
      const bytes = (base64String.length * 3) / 4 - padding;
      imageSize.value = Math.round(bytes);
    } catch (error) {
      imageSize.value = Math.round(canvas.value.toDataURL().length * 0.75);
    }
  }

  // Komplette Update-Funktion (nur bei Load/Resize/Format-Wechsel)
  function updateImageInfo() {
    updateImageDimensions();
    updateImageSize();
  }

  // Bei Formatwechsel die geschätzte Dateigröße neu berechnen
  watch(outputFormat, () => {
    updateImageSize();
  });

  function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  return {
    imageWidth,
    imageHeight,
    imageSize,
    updateImageDimensions,
    updateImageSize,
    updateImageInfo,
    formatSize,
  };
}
