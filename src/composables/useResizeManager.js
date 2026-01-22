/**
 * useResizeManager Composable
 * Verwaltet Bildgrößen-Änderungen mit Seitenverhältnis-Beibehaltung
 */
import { ref, computed, watch } from 'vue'

/**
 * Composable für Resize-Management
 * @param {Object} options - Optionen
 * @param {Function} options.getCurrentDimensions - Funktion die aktuelle Dimensionen zurückgibt
 * @param {Function} options.onResize - Callback bei Größenänderung
 * @returns {Object} Resize-State und Methoden
 */
export function useResizeManager(options = {}) {
  const { getCurrentDimensions, onResize } = options

  // Reaktive State
  const resizeWidth = ref(0)
  const resizeHeight = ref(0)
  const maintainAspectRatio = ref(true)
  const originalWidth = ref(0)
  const originalHeight = ref(0)

  // Computed
  const aspectRatio = computed(() => {
    if (originalHeight.value === 0) return 1
    return originalWidth.value / originalHeight.value
  })

  const hasChanges = computed(() => {
    return resizeWidth.value !== originalWidth.value ||
           resizeHeight.value !== originalHeight.value
  })

  const isValidSize = computed(() => {
    return resizeWidth.value > 0 &&
           resizeHeight.value > 0 &&
           resizeWidth.value <= 10000 &&
           resizeHeight.value <= 10000
  })

  /**
   * Initialisiert die Resize-Werte mit aktuellen Dimensionen
   * @param {number} width - Aktuelle Breite
   * @param {number} height - Aktuelle Höhe
   */
  function initFromDimensions(width, height) {
    originalWidth.value = width
    originalHeight.value = height
    resizeWidth.value = width
    resizeHeight.value = height
  }

  /**
   * Aktualisiert bei Dimensionsänderung
   * Verwendet getCurrentDimensions wenn verfügbar
   */
  function syncWithCurrent() {
    if (getCurrentDimensions) {
      const { width, height } = getCurrentDimensions()
      initFromDimensions(width, height)
    }
  }

  /**
   * Behandelt Änderung der Breite
   * @param {number} newWidth - Neue Breite
   */
  function onWidthChange(newWidth) {
    resizeWidth.value = Math.max(1, Math.round(newWidth))

    if (maintainAspectRatio.value && aspectRatio.value > 0) {
      resizeHeight.value = Math.max(1, Math.round(resizeWidth.value / aspectRatio.value))
    }
  }

  /**
   * Behandelt Änderung der Höhe
   * @param {number} newHeight - Neue Höhe
   */
  function onHeightChange(newHeight) {
    resizeHeight.value = Math.max(1, Math.round(newHeight))

    if (maintainAspectRatio.value && aspectRatio.value > 0) {
      resizeWidth.value = Math.max(1, Math.round(resizeHeight.value * aspectRatio.value))
    }
  }

  /**
   * Behandelt Änderung einer Dimension
   * @param {'width'|'height'} dimension - Geänderte Dimension
   */
  function onDimensionChange(dimension) {
    if (dimension === 'width') {
      onWidthChange(resizeWidth.value)
    } else {
      onHeightChange(resizeHeight.value)
    }
  }

  /**
   * Skaliert prozentual
   * @param {number} percent - Prozentsatz (z.B. 50 für 50%)
   */
  function scaleByPercent(percent) {
    const factor = percent / 100
    resizeWidth.value = Math.max(1, Math.round(originalWidth.value * factor))
    resizeHeight.value = Math.max(1, Math.round(originalHeight.value * factor))
  }

  /**
   * Setzt auf Originalgrößen zurück
   */
  function resetToOriginal() {
    resizeWidth.value = originalWidth.value
    resizeHeight.value = originalHeight.value
  }

  /**
   * Wendet Resize an
   * @returns {Object|null} Neue Dimensionen oder null bei Fehler
   */
  function applyResize() {
    if (!isValidSize.value) {
      return null
    }

    const newDimensions = {
      width: resizeWidth.value,
      height: resizeHeight.value
    }

    if (onResize) {
      onResize(newDimensions)
    }

    // Aktualisiere Original-Werte nach erfolgreichem Resize
    originalWidth.value = resizeWidth.value
    originalHeight.value = resizeHeight.value

    return newDimensions
  }

  /**
   * Berechnet Dimensionen für maximale Größe (Bounding Box)
   * @param {number} maxWidth - Maximale Breite
   * @param {number} maxHeight - Maximale Höhe
   * @returns {Object} Berechnete Dimensionen
   */
  function fitToBounds(maxWidth, maxHeight) {
    let newWidth = originalWidth.value
    let newHeight = originalHeight.value

    // Skaliere herunter wenn nötig
    if (newWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(newWidth / aspectRatio.value)
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = Math.round(newHeight * aspectRatio.value)
    }

    resizeWidth.value = newWidth
    resizeHeight.value = newHeight

    return { width: newWidth, height: newHeight }
  }

  /**
   * Preset-Größen für Social Media etc.
   */
  const presetSizes = {
    instagram: { width: 1080, height: 1080, name: 'Instagram Post' },
    instagramStory: { width: 1080, height: 1920, name: 'Instagram Story' },
    facebook: { width: 1200, height: 630, name: 'Facebook Post' },
    twitter: { width: 1200, height: 675, name: 'Twitter Post' },
    youtube: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
    hd: { width: 1920, height: 1080, name: 'Full HD' },
    '4k': { width: 3840, height: 2160, name: '4K UHD' }
  }

  /**
   * Wendet Preset-Größe an
   * @param {string} presetName - Name des Presets
   */
  function applyPreset(presetName) {
    const preset = presetSizes[presetName]
    if (preset) {
      resizeWidth.value = preset.width
      resizeHeight.value = preset.height
    }
  }

  return {
    // State
    resizeWidth,
    resizeHeight,
    maintainAspectRatio,
    originalWidth,
    originalHeight,

    // Computed
    aspectRatio,
    hasChanges,
    isValidSize,

    // Methoden
    initFromDimensions,
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
    presetSizes
  }
}

export default useResizeManager
