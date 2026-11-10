/**
 * useResizeManager Composable
 * Verwaltet Bildgrößen-Änderungen mit Seitenverhältnis-Beibehaltung
 */
import { ref, computed } from 'vue';

export interface Dimensions {
  width: number;
  height: number;
}

export interface ResizePresetSize extends Dimensions {
  name: string;
}

export interface ResizeManagerOptions {
  /** Liefert die aktuellen Dimensionen */
  getCurrentDimensions?: () => Dimensions;
  /** Callback bei Größenänderung */
  onResize?: (dimensions: Dimensions) => void;
}

/**
 * Composable für Resize-Management
 */
export function useResizeManager(options: ResizeManagerOptions = {}) {
  const { getCurrentDimensions, onResize } = options;

  // Reaktive State
  const resizeWidth = ref(0);
  const resizeHeight = ref(0);
  const maintainAspectRatio = ref(true);
  // Basiswerte der aktuellen Bildgröße (Referenz für Seitenverhältnis/hasChanges).
  // Werden bei jeder übernommenen Größenänderung aktualisiert.
  const originalWidth = ref(0);
  const originalHeight = ref(0);
  // Originalgröße des geladenen Bildes – bleibt bei Größenänderungen erhalten
  // und dient als Ziel für "Ohne Preset".
  const naturalWidth = ref(0);
  const naturalHeight = ref(0);

  // Computed
  const aspectRatio = computed(() => {
    if (originalHeight.value === 0) return 1;
    return originalWidth.value / originalHeight.value;
  });

  const hasChanges = computed(() => {
    return resizeWidth.value !== originalWidth.value || resizeHeight.value !== originalHeight.value;
  });

  const isValidSize = computed(() => {
    return (
      resizeWidth.value > 0 &&
      resizeHeight.value > 0 &&
      resizeWidth.value <= 10000 &&
      resizeHeight.value <= 10000
    );
  });

  /**
   * Initialisiert die Resize-Werte mit aktuellen Dimensionen
   * @param options.natural - Auch die Originalgröße des Bildes
   *   mitsetzen. `false` bei reinen Größenänderungen, damit "Ohne Preset"
   *   weiterhin die ursprüngliche Bildgröße wiederherstellen kann.
   */
  function initFromDimensions(
    width: number,
    height: number,
    { natural = true }: { natural?: boolean } = {}
  ): void {
    originalWidth.value = width;
    originalHeight.value = height;
    resizeWidth.value = width;
    resizeHeight.value = height;

    if (natural) {
      naturalWidth.value = width;
      naturalHeight.value = height;
    }
  }

  /**
   * Setzt die Originalgröße des Bildes explizit (z. B. beim Wiederherstellen
   * eines History-Eintrags).
   */
  function setNaturalSize(width: number, height: number): void {
    naturalWidth.value = width;
    naturalHeight.value = height;
  }

  /**
   * Aktualisiert bei Dimensionsänderung
   * Verwendet getCurrentDimensions wenn verfügbar
   */
  function syncWithCurrent(): void {
    if (getCurrentDimensions) {
      const { width, height } = getCurrentDimensions();
      initFromDimensions(width, height);
    }
  }

  /**
   * Behandelt Änderung der Breite
   */
  function onWidthChange(newWidth: number): void {
    // Rohwert übernehmen, damit das Feld während des Tippens frei editierbar
    // bleibt (Leeren/Teil­eingaben werden nicht auf 1 gezwungen). Die
    // Validierung erfolgt in der Live-Vorschau bzw. beim "Anwenden".
    resizeWidth.value = Math.round(newWidth);

    if (maintainAspectRatio.value && aspectRatio.value > 0 && resizeWidth.value > 0) {
      resizeHeight.value = Math.max(1, Math.round(resizeWidth.value / aspectRatio.value));
    }
  }

  /**
   * Behandelt Änderung der Höhe
   */
  function onHeightChange(newHeight: number): void {
    // Rohwert übernehmen, damit das Feld während des Tippens frei editierbar
    // bleibt (Leeren/Teil­eingaben werden nicht auf 1 gezwungen). Die
    // Validierung erfolgt in der Live-Vorschau bzw. beim "Anwenden".
    resizeHeight.value = Math.round(newHeight);

    if (maintainAspectRatio.value && aspectRatio.value > 0 && resizeHeight.value > 0) {
      resizeWidth.value = Math.max(1, Math.round(resizeHeight.value * aspectRatio.value));
    }
  }

  /**
   * Behandelt Änderung einer Dimension
   */
  function onDimensionChange(dimension: 'width' | 'height'): void {
    if (dimension === 'width') {
      onWidthChange(resizeWidth.value);
    } else {
      onHeightChange(resizeHeight.value);
    }
  }

  /**
   * Skaliert prozentual
   * @param percent - Prozentsatz (z.B. 50 für 50%)
   */
  function scaleByPercent(percent: number): void {
    const factor = percent / 100;
    resizeWidth.value = Math.max(1, Math.round(originalWidth.value * factor));
    resizeHeight.value = Math.max(1, Math.round(originalHeight.value * factor));
  }

  /**
   * Setzt auf Originalgrößen zurück
   */
  function resetToOriginal(): void {
    resizeWidth.value = originalWidth.value;
    resizeHeight.value = originalHeight.value;
  }

  /**
   * Wendet Resize an
   * @returns Neue Dimensionen oder null bei Fehler
   */
  function applyResize(): Dimensions | null {
    if (!isValidSize.value) {
      return null;
    }

    const newDimensions = {
      width: resizeWidth.value,
      height: resizeHeight.value,
    };

    if (onResize) {
      onResize(newDimensions);
    }

    // Aktualisiere Original-Werte nach erfolgreichem Resize
    originalWidth.value = resizeWidth.value;
    originalHeight.value = resizeHeight.value;

    return newDimensions;
  }

  /**
   * Berechnet Dimensionen für maximale Größe (Bounding Box)
   */
  function fitToBounds(maxWidth: number, maxHeight: number): Dimensions {
    let newWidth = originalWidth.value;
    let newHeight = originalHeight.value;

    // Skaliere herunter wenn nötig
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio.value);
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio.value);
    }

    resizeWidth.value = newWidth;
    resizeHeight.value = newHeight;

    return { width: newWidth, height: newHeight };
  }

  /**
   * Preset-Größen für Social Media etc.
   */
  const presetSizes: Readonly<Record<string, ResizePresetSize>> = {
    instagram: { width: 1080, height: 1080, name: 'Instagram Post' },
    instagramStory: { width: 1080, height: 1920, name: 'Instagram Story' },
    facebook: { width: 1200, height: 630, name: 'Facebook Post' },
    twitter: { width: 1200, height: 675, name: 'Twitter Post' },
    youtube: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
    hd: { width: 1920, height: 1080, name: 'Full HD' },
    '4k': { width: 3840, height: 2160, name: '4K UHD' },
  };

  /**
   * Wendet Preset-Größe an
   */
  function applyPreset(presetName: string): void {
    const preset = presetSizes[presetName];
    if (preset) {
      resizeWidth.value = preset.width;
      resizeHeight.value = preset.height;
    }
  }

  return {
    // State
    resizeWidth,
    resizeHeight,
    maintainAspectRatio,
    originalWidth,
    originalHeight,
    naturalWidth,
    naturalHeight,

    // Computed
    aspectRatio,
    hasChanges,
    isValidSize,

    // Methoden
    initFromDimensions,
    setNaturalSize,
    syncWithCurrent,
    onWidthChange,
    onHeightChange,
    onDimensionChange,
    scaleByPercent,
    resetToOriginal,
    applyResize,
    fitToBounds,
    applyPreset,

    // Konstanten
    presetSizes,
  };
}

export default useResizeManager;
