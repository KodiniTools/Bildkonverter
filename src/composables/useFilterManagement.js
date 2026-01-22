/**
 * useFilterManagement Composable
 * Verwaltet Filter-State, Hintergrund-Einstellungen und Sidebar-Sektionen
 */
import { ref, computed } from 'vue'

// Standard-Filterwerte
export const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vignette: 0
}

// Standard-Hintergrund
export const DEFAULT_BACKGROUND = {
  color: '#ffffff',
  opacity: 0
}

/**
 * Composable für Filter-Management
 * @param {Object} options - Optionen
 * @param {Function} options.onFilterChange - Callback bei Filter-Änderungen
 * @returns {Object} Filter-State und Methoden
 */
export function useFilterManagement(options = {}) {
  const { onFilterChange } = options

  // Reaktive State
  const filters = ref({ ...DEFAULT_FILTERS })
  const background = ref({ ...DEFAULT_BACKGROUND })
  const currentPreset = ref(null)

  // Sidebar-Sektionen (collapsible)
  const sectionsOpen = ref({
    adjustments: true,
    lightColor: false,
    effects: false
  })

  // Computed: Prüft ob Filter vom Standard abweichen
  const hasActiveFilters = computed(() => {
    return Object.keys(DEFAULT_FILTERS).some(
      key => filters.value[key] !== DEFAULT_FILTERS[key]
    )
  })

  // Computed: Prüft ob Hintergrund aktiv ist
  const hasActiveBackground = computed(() => {
    return background.value.opacity > 0
  })

  /**
   * Setzt alle Filter auf Standardwerte zurück
   */
  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    currentPreset.value = null

    if (onFilterChange) {
      onFilterChange()
    }
  }

  /**
   * Setzt Hintergrund auf Standardwerte zurück
   */
  function resetBackground() {
    background.value = { ...DEFAULT_BACKGROUND }

    if (onFilterChange) {
      onFilterChange()
    }
  }

  /**
   * Setzt alles zurück (Filter + Hintergrund)
   */
  function resetAll() {
    resetFilters()
    resetBackground()
  }

  /**
   * Wendet ein Preset an
   * @param {Object} preset - Preset-Objekt mit filters-Property
   */
  function applyPreset(preset) {
    // Kombiniere Standard-Werte mit Preset-Werten
    filters.value = { ...DEFAULT_FILTERS, ...preset.filters }
    currentPreset.value = preset.id

    if (onFilterChange) {
      onFilterChange()
    }
  }

  /**
   * Aktualisiert einen einzelnen Filter
   * @param {string} filterName - Name des Filters
   * @param {number} value - Neuer Wert
   */
  function updateFilter(filterName, value) {
    if (filterName in filters.value) {
      filters.value[filterName] = value
      currentPreset.value = null // Preset wird ungültig bei manueller Änderung

      if (onFilterChange) {
        onFilterChange()
      }
    }
  }

  /**
   * Aktualisiert Hintergrund-Einstellung
   * @param {string} property - 'color' oder 'opacity'
   * @param {string|number} value - Neuer Wert
   */
  function updateBackground(property, value) {
    if (property in background.value) {
      background.value[property] = value

      if (onFilterChange) {
        onFilterChange()
      }
    }
  }

  /**
   * Togglet eine Sidebar-Sektion
   * @param {string} sectionName - Name der Sektion
   */
  function toggleSection(sectionName) {
    if (sectionName in sectionsOpen.value) {
      sectionsOpen.value[sectionName] = !sectionsOpen.value[sectionName]
    }
  }

  /**
   * Generiert CSS-Filter-String für Canvas
   * @returns {string} CSS-Filter-String
   */
  function getFilterString() {
    const f = filters.value
    const exposureAdjust = 100 + f.exposure
    const highlightsAdjust = 100 + (f.highlights * 0.5)
    const shadowsAdjust = 100 + (f.shadows * 0.3)

    return `
      brightness(${f.brightness * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)
      contrast(${f.contrast * (shadowsAdjust / 100)}%)
      saturate(${f.saturation}%)
      blur(${f.blur}px)
      hue-rotate(${f.hue}deg)
      sepia(${f.sepia}%)
      grayscale(${f.grayscale}%)
      invert(${f.invert}%)
    `.trim()
  }

  /**
   * Exportiert aktuellen State (für History)
   * @returns {Object} Kopie des aktuellen States
   */
  function exportState() {
    return {
      filters: { ...filters.value },
      background: { ...background.value },
      currentPreset: currentPreset.value
    }
  }

  /**
   * Importiert State (für History-Restore)
   * @param {Object} state - Gespeicherter State
   */
  function importState(state) {
    if (state.filters) {
      filters.value = { ...DEFAULT_FILTERS, ...state.filters }
    }
    if (state.background) {
      background.value = { ...DEFAULT_BACKGROUND, ...state.background }
    }
    if ('currentPreset' in state) {
      currentPreset.value = state.currentPreset
    }
  }

  return {
    // State
    filters,
    background,
    currentPreset,
    sectionsOpen,

    // Computed
    hasActiveFilters,
    hasActiveBackground,

    // Methoden
    resetFilters,
    resetBackground,
    resetAll,
    applyPreset,
    updateFilter,
    updateBackground,
    toggleSection,
    getFilterString,
    exportState,
    importState,

    // Konstanten
    DEFAULT_FILTERS,
    DEFAULT_BACKGROUND
  }
}

export default useFilterManagement
