/**
 * useFilterManagement Composable
 * Verwaltet Filter-State, Hintergrund-Einstellungen und Sidebar-Sektionen
 */
import { ref, computed } from 'vue';
import type { PresetFilters } from '@/composables/presets/defaultPresets';

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
  temperature: 0,
  tint: 0,
  // Kurven als "x,y x,y …" (0..255); leer = linear (utils/curveKernel.ts)
  curveRgb: '',
  curveR: '',
  curveG: '',
  curveB: '',
  sharpness: 0,
  clarity: 0,
  grain: 0,
  vignette: 0,
};

/** Vollständige Filterwerte des Editors (alle Felder gesetzt, siehe FilterValues) */
export type EditorFilters = typeof DEFAULT_FILTERS;
type FilterValue = EditorFilters[keyof EditorFilters];

export interface EditorBackground {
  color: string;
  /** 0-100 */
  opacity: number;
}

// Standard-Hintergrund
export const DEFAULT_BACKGROUND: EditorBackground = {
  color: '#ffffff',
  opacity: 100,
};

export interface SectionsOpen {
  adjustments: boolean;
  lightColor: boolean;
  curves: boolean;
  effects: boolean;
}

/** Zustand für die Editor-Historie (exportState/importState) */
export interface FilterState {
  filters: EditorFilters;
  background: EditorBackground;
  /** undefined nur, wenn ein importierter Zustand es so mitbringt */
  currentPreset: string | null | undefined;
}

export interface FilterManagementOptions {
  /** Callback bei Filter-Änderungen */
  onFilterChange?: () => void;
}

/** Werte aus Presets oder Auto-Verbessern landen ungeprüft im Filterobjekt (wie bisher) */
function asFilters(values: PresetFilters | Partial<EditorFilters>): EditorFilters {
  return values as EditorFilters;
}

/**
 * Composable für Filter-Management
 */
export function useFilterManagement(options: FilterManagementOptions = {}) {
  const { onFilterChange } = options;

  // Reaktive State
  const filters = ref<EditorFilters>({ ...DEFAULT_FILTERS });
  const background = ref<EditorBackground>({ ...DEFAULT_BACKGROUND });
  const currentPreset = ref<string | null | undefined>(null);

  // Sidebar-Sektionen (collapsible)
  const sectionsOpen = ref<SectionsOpen>({
    adjustments: true,
    lightColor: false,
    curves: false,
    effects: false,
  });

  // Computed: Prüft ob Filter vom Standard abweichen
  const hasActiveFilters = computed(() => {
    return (Object.keys(DEFAULT_FILTERS) as (keyof EditorFilters)[]).some(
      (key) => filters.value[key] !== DEFAULT_FILTERS[key]
    );
  });

  // Computed: Prüft ob Hintergrund aktiv ist
  const hasActiveBackground = computed(() => {
    return background.value.opacity > 0;
  });

  /**
   * Setzt alle Filter auf Standardwerte zurück
   */
  function resetFilters(): void {
    filters.value = { ...DEFAULT_FILTERS };
    currentPreset.value = null;

    if (onFilterChange) {
      onFilterChange();
    }
  }

  /**
   * Setzt Hintergrund auf Standardwerte zurück
   */
  function resetBackground(): void {
    background.value = { ...DEFAULT_BACKGROUND };

    if (onFilterChange) {
      onFilterChange();
    }
  }

  /**
   * Setzt alles zurück (Filter + Hintergrund)
   */
  function resetAll(): void {
    resetFilters();
    resetBackground();
  }

  /**
   * Wendet ein Preset an
   */
  function applyPreset(preset: { id: string; filters?: PresetFilters }): void {
    // Kombiniere Standard-Werte mit Preset-Werten
    filters.value = asFilters({ ...DEFAULT_FILTERS, ...preset.filters });
    currentPreset.value = preset.id;

    if (onFilterChange) {
      onFilterChange();
    }
  }

  /**
   * Setzt mehrere Filter auf einmal (z. B. Auto-Verbessern); unbekannte
   * Schlüssel werden ignoriert, die übrigen Filter bleiben erhalten.
   * @param values - Teilmenge der Filterwerte
   */
  function applyAdjustments(values: PresetFilters | Partial<EditorFilters>): void {
    const next: PresetFilters = { ...filters.value };
    for (const [key, value] of Object.entries(values)) {
      if (key in DEFAULT_FILTERS) next[key] = value;
    }
    filters.value = asFilters(next);
    currentPreset.value = null;

    if (onFilterChange) {
      onFilterChange();
    }
  }

  /**
   * Aktualisiert einen einzelnen Filter
   */
  function updateFilter(filterName: string, value: FilterValue): void {
    if (filterName in filters.value) {
      (filters.value as PresetFilters)[filterName] = value;
      currentPreset.value = null; // Preset wird ungültig bei manueller Änderung

      if (onFilterChange) {
        onFilterChange();
      }
    }
  }

  /**
   * Aktualisiert Hintergrund-Einstellung
   * @param property - 'color' oder 'opacity'
   */
  function updateBackground(property: string, value: string | number): void {
    if (property in background.value) {
      (background.value as EditorBackground & Record<string, string | number>)[property] = value;

      if (onFilterChange) {
        onFilterChange();
      }
    }
  }

  /**
   * Togglet eine Sidebar-Sektion
   */
  function toggleSection(sectionName: string): void {
    if (sectionName in sectionsOpen.value) {
      const key = sectionName as keyof SectionsOpen;
      sectionsOpen.value[key] = !sectionsOpen.value[key];
    }
  }

  /**
   * Generiert CSS-Filter-String für Canvas
   */
  function getFilterString(): string {
    const f = filters.value;
    const exposureAdjust = 100 + f.exposure;
    const highlightsAdjust = 100 + f.highlights * 0.5;
    const shadowsAdjust = 100 + f.shadows * 0.3;

    return `
      brightness(${f.brightness * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)
      contrast(${f.contrast * (shadowsAdjust / 100)}%)
      saturate(${f.saturation}%)
      blur(${f.blur}px)
      hue-rotate(${f.hue}deg)
      sepia(${f.sepia}%)
      grayscale(${f.grayscale}%)
      invert(${f.invert}%)
    `.trim();
  }

  /**
   * Exportiert aktuellen State (für History)
   */
  function exportState(): FilterState {
    return {
      filters: { ...filters.value },
      background: { ...background.value },
      currentPreset: currentPreset.value,
    };
  }

  /**
   * Importiert State (für History-Restore)
   */
  function importState(state: Partial<FilterState>): void {
    if (state.filters) {
      filters.value = { ...DEFAULT_FILTERS, ...state.filters };
    }
    if (state.background) {
      background.value = { ...DEFAULT_BACKGROUND, ...state.background };
    }
    if ('currentPreset' in state) {
      currentPreset.value = state.currentPreset;
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
    applyAdjustments,
    updateFilter,
    updateBackground,
    toggleSection,
    getFilterString,
    exportState,
    importState,

    // Konstanten
    DEFAULT_FILTERS,
    DEFAULT_BACKGROUND,
  };
}

export default useFilterManagement;
