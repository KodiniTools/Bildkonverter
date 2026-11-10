import { ref, watch, type Ref } from 'vue';
import { formatSize } from '@/utils/fileUtils';

/**
 * useImageInfo
 *
 * Verwaltet die Anzeige-Infos zum aktuellen Canvas: Breite, Höhe und
 * geschätzte Dateigröße sowie deren Aktualisierung sund Formatierung.
 * Ausgelagert aus EditorView.vue – Verhalten unverändert.
 */
export interface ImageInfoDeps {
  /** Canvas-Element-Ref */
  canvas: Ref<HTMLCanvasElement | null>;
  /** Aktuelles Export-Format */
  outputFormat: Ref<string>;
}

export function useImageInfo({ canvas, outputFormat }: ImageInfoDeps) {
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
      // Wie bisher: ohne Komma-Teil wirft endsWith und der catch-Zweig schätzt
      const base64String = dataUrl.split(',')[1]!;
      const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
      const bytes = (base64String.length * 3) / 4 - padding;
      imageSize.value = Math.round(bytes);
    } catch {
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
