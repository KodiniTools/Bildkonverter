import { computed, onMounted, ref } from 'vue';
import { logger } from '@/utils/logger';
import { DEFAULT_PRESETS, type FilterPreset, type PresetFilters } from './defaultPresets';

/** localStorage-Schlüssel der eigenen Presets */
export const PRESETS_STORAGE_KEY = 'bildkonverter_filterPresets';

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: string;
}

export interface FilterPresetsOptions {
  /** Aktuelle Editor-Filter (für „Preset speichern“) */
  getFilters: () => PresetFilters;
  onApply: (preset: FilterPreset) => void;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  t: (key: string, fallbackOrParams?: string | Record<string, unknown>) => string;
}

/**
 * Standard- und eigene Filter-Presets: anwenden, speichern (prompt),
 * löschen (Bestätigung), als JSON ex-/importieren und in localStorage halten.
 */
export function useFilterPresets({ getFilters, onApply, confirm, t }: FilterPresetsOptions) {
  const activePreset = ref<string | null>(null);
  const customPresets = ref<FilterPreset[]>([]);

  const allPresets = computed(() => [...DEFAULT_PRESETS, ...customPresets.value]);

  function applyPreset(preset: FilterPreset) {
    activePreset.value = preset.id;
    onApply(preset);

    if (window.$toast) {
      window.$toast.success(t('toast.presets.applied', { name: preset.name }));
    }
  }

  function showSaveDialog() {
    const name = prompt(t('presets.dialogs.saveName'), t('presets.dialogs.defaultName'));
    if (!name) return;

    const description = prompt(t('presets.dialogs.saveDescription'), '');

    const newPreset: FilterPreset = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      icon: 'sliders-h',
      description: description?.trim() || t('presets.custom'),
      filters: { ...getFilters() },
      custom: true,
    };

    customPresets.value.push(newPreset);
    savePresetsToStorage();

    if (window.$toast) {
      window.$toast.success(t('toast.presets.saved', { name: name.trim() }));
    }
  }

  async function deletePreset(presetId: string) {
    const confirmed = await confirm(t('presets.dialogs.confirmDelete'), {
      title: t('presets.dialogs.deleteTitle', 'Preset löschen?'),
      confirmText: t('confirm.delete', 'Löschen'),
      cancelText: t('confirm.cancel', 'Abbrechen'),
      variant: 'danger',
    });
    if (!confirmed) return;

    const index = customPresets.value.findIndex((p) => p.id === presetId);
    if (index !== -1) {
      const preset = customPresets.value[index]!;
      customPresets.value.splice(index, 1);
      savePresetsToStorage();

      if (activePreset.value === presetId) {
        activePreset.value = null;
      }

      if (window.$toast) {
        window.$toast.success(t('toast.presets.deleted', { name: preset.name }));
      }
    }
  }

  function exportPresets() {
    if (customPresets.value.length === 0) {
      if (window.$toast) {
        window.$toast.warning(t('toast.presets.noCustomPresets'));
      }
      return;
    }

    const json = JSON.stringify(customPresets.value, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'filter-presets.json';
    a.click();

    URL.revokeObjectURL(url);

    if (window.$toast) {
      window.$toast.success(t('toast.presets.exported', { count: customPresets.value.length }));
    }
  }

  /** Liest eine JSON-Datei mit Preset-Liste ein und hängt sie an die eigenen an */
  async function importPresetFile(file: File) {
    try {
      const text = await file.text();
      const imported: unknown = JSON.parse(text);

      if (!Array.isArray(imported)) {
        throw new Error(t('presets.errors.invalidFormat'));
      }

      // Füge importierte Presets hinzu
      customPresets.value = [...customPresets.value, ...(imported as FilterPreset[])];
      savePresetsToStorage();

      if (window.$toast) {
        window.$toast.success(t('toast.presets.imported', { count: imported.length }));
      }
    } catch (error) {
      logger.error('Import-Fehler:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.presets.importError') + ': ' + (error as Error).message);
      }
    }
  }

  function importPresets() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await importPresetFile(file);
    };

    input.click();
  }

  function savePresetsToStorage() {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customPresets.value));
    } catch (error) {
      logger.error('Fehler beim Speichern:', error);
    }
  }

  function loadPresetsFromStorage() {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        customPresets.value = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Fehler beim Laden:', error);
    }
  }

  onMounted(() => {
    loadPresetsFromStorage();
  });

  // Public method to reset active preset
  function resetActivePreset() {
    activePreset.value = null;
  }

  return {
    activePreset,
    customPresets,
    allPresets,
    applyPreset,
    showSaveDialog,
    deletePreset,
    exportPresets,
    importPresets,
    importPresetFile,
    loadPresetsFromStorage,
    resetActivePreset,
  };
}
