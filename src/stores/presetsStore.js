import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Presets Store - Verwaltet Filter-Presets
 *
 * Dieser Store ermöglicht:
 * - Vordefinierte Standard-Presets
 * - Benutzerdefinierte Presets
 * - Import/Export von Presets
 * - Persistierung im LocalStorage
 */
export const usePresetsStore = defineStore('presets', () => {
  // ===== STATE =====

  const activePresetId = ref(null);

  // Standard-Presets (können nicht gelöscht werden)
  const defaultPresets = ref([
    {
      id: 'original',
      name: 'Original',
      icon: '🎯',
      description: 'Keine Filter',
      isDefault: true,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        sharpen: 0,
      },
    },
    {
      id: 'vibrant',
      name: 'Vibrant',
      icon: '🌈',
      description: 'Lebendige Farben',
      isDefault: true,
      filters: {
        brightness: 110,
        contrast: 120,
        saturation: 150,
        grayscale: 0,
        sepia: 0,
        sharpen: 20,
      },
    },
    {
      id: 'vintage',
      name: 'Vintage',
      icon: '📷',
      description: 'Retro-Look',
      isDefault: true,
      filters: {
        brightness: 95,
        contrast: 110,
        saturation: 80,
        grayscale: 0,
        sepia: 40,
        sharpen: 0,
      },
    },
    {
      id: 'bw',
      name: 'Schwarz/Weiß',
      icon: '⚫',
      description: 'Klassisch',
      isDefault: true,
      filters: {
        brightness: 100,
        contrast: 130,
        saturation: 100,
        grayscale: 100,
        sepia: 0,
        sharpen: 15,
      },
    },
    {
      id: 'dramatic',
      name: 'Dramatisch',
      icon: '⚡',
      description: 'Hoher Kontrast',
      isDefault: true,
      filters: {
        brightness: 90,
        contrast: 160,
        saturation: 120,
        grayscale: 0,
        sepia: 0,
        sharpen: 30,
      },
    },
    {
      id: 'soft',
      name: 'Soft',
      icon: '☁️',
      description: 'Weiche Töne',
      isDefault: true,
      filters: {
        brightness: 115,
        contrast: 80,
        saturation: 90,
        grayscale: 0,
        sepia: 0,
        sharpen: 0,
      },
    },
    {
      id: 'warm',
      name: 'Warm',
      icon: '🔥',
      description: 'Warme Töne',
      isDefault: true,
      filters: {
        brightness: 105,
        contrast: 105,
        saturation: 130,
        grayscale: 0,
        sepia: 25,
        sharpen: 10,
      },
    },
    {
      id: 'cool',
      name: 'Cool',
      icon: '❄️',
      description: 'Kühle Töne',
      isDefault: true,
      filters: {
        brightness: 100,
        contrast: 115,
        saturation: 110,
        grayscale: 0,
        sepia: 0,
        sharpen: 15,
      },
    },
  ]);

  // Benutzerdefinierte Presets
  const customPresets = ref([]);

  // ===== COMPUTED =====

  /**
   * Alle Presets (Standard + Custom)
   */
  const allPresets = computed(() => {
    return [...defaultPresets.value, ...customPresets.value];
  });

  /**
   * Aktives Preset
   */
  const activePreset = computed(() => {
    if (!activePresetId.value) return null;
    return allPresets.value.find((p) => p.id === activePresetId.value);
  });

  /**
   * Anzahl benutzerdefinierter Presets
   */
  const customPresetsCount = computed(() => customPresets.value.length);

  // ===== ACTIONS =====

  /**
   * Lädt Custom Presets aus dem LocalStorage
   */
  function loadPresetsFromStorage() {
    try {
      const stored = localStorage.getItem('bildkonverter_filterPresets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          customPresets.value = parsed;
          console.log(`✅ ${parsed.length} Custom Presets geladen`);
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Presets:', error);
      customPresets.value = [];
    }
  }

  /**
   * Speichert Custom Presets im LocalStorage
   */
  function savePresetsToStorage() {
    try {
      localStorage.setItem('bildkonverter_filterPresets', JSON.stringify(customPresets.value));
      console.log(`✅ ${customPresets.value.length} Custom Presets gespeichert`);
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Presets:', error);
      throw new Error('Fehler beim Speichern der Presets');
    }
  }

  /**
   * Findet ein Preset nach ID
   */
  function findPresetById(id) {
    return allPresets.value.find((p) => p.id === id);
  }

  /**
   * Setzt das aktive Preset
   */
  function setActivePreset(presetId) {
    const preset = findPresetById(presetId);
    if (preset) {
      activePresetId.value = presetId;
      return preset;
    }
    return null;
  }

  /**
   * Deaktiviert das aktive Preset
   */
  function clearActivePreset() {
    activePresetId.value = null;
  }

  /**
   * Erstellt ein neues Custom Preset
   */
  function createPreset(presetData) {
    // Validierung
    if (!presetData.name || !presetData.name.trim()) {
      throw new Error('Preset-Name darf nicht leer sein');
    }

    if (!presetData.filters) {
      throw new Error('Filter-Daten fehlen');
    }

    // Neues Preset erstellen
    const newPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: presetData.name.trim(),
      icon: presetData.icon || '⭐',
      description: presetData.description?.trim() || 'Benutzerdefiniert',
      isDefault: false,
      filters: { ...presetData.filters },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Hinzufügen und speichern
    customPresets.value.push(newPreset);
    savePresetsToStorage();

    return newPreset;
  }

  /**
   * Aktualisiert ein bestehendes Custom Preset
   */
  function updatePreset(presetId, updates) {
    const index = customPresets.value.findIndex((p) => p.id === presetId);

    if (index === -1) {
      throw new Error('Preset nicht gefunden');
    }

    const preset = customPresets.value[index];

    // Standard-Presets können nicht aktualisiert werden
    if (preset.isDefault) {
      throw new Error('Standard-Presets können nicht geändert werden');
    }

    // Aktualisieren
    Object.assign(preset, {
      ...updates,
      updatedAt: Date.now(),
    });

    savePresetsToStorage();

    return preset;
  }

  /**
   * Löscht ein Custom Preset
   */
  function deletePreset(presetId) {
    const index = customPresets.value.findIndex((p) => p.id === presetId);

    if (index === -1) {
      throw new Error('Preset nicht gefunden');
    }

    const preset = customPresets.value[index];

    // Standard-Presets können nicht gelöscht werden
    if (preset.isDefault) {
      throw new Error('Standard-Presets können nicht gelöscht werden');
    }

    // Löschen
    customPresets.value.splice(index, 1);

    // Aktives Preset zurücksetzen wenn nötig
    if (activePresetId.value === presetId) {
      clearActivePreset();
    }

    savePresetsToStorage();
  }

  /**
   * Dupliziert ein Preset
   */
  function duplicatePreset(presetId) {
    const original = findPresetById(presetId);

    if (!original) {
      throw new Error('Preset nicht gefunden');
    }

    return createPreset({
      name: `${original.name} (Kopie)`,
      icon: original.icon,
      description: original.description,
      filters: { ...original.filters },
    });
  }

  /**
   * Exportiert Custom Presets als JSON
   */
  function exportPresets() {
    if (customPresets.value.length === 0) {
      throw new Error('Keine benutzerdefinierten Presets vorhanden');
    }

    const data = {
      version: '1.0',
      exportedAt: Date.now(),
      presets: customPresets.value,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Importiert Presets aus JSON
   */
  function importPresets(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Validierung
      if (!data.presets || !Array.isArray(data.presets)) {
        throw new Error('Ungültiges Preset-Format');
      }

      // Presets hinzufügen
      let importedCount = 0;

      data.presets.forEach((preset) => {
        // Validierung jedes Presets
        if (!preset.name || !preset.filters) {
          console.warn('Ungültiges Preset übersprungen:', preset);
          return;
        }

        // Neue ID generieren um Duplikate zu vermeiden
        const importedPreset = {
          ...preset,
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isDefault: false,
          importedAt: Date.now(),
        };

        customPresets.value.push(importedPreset);
        importedCount++;
      });

      if (importedCount > 0) {
        savePresetsToStorage();
      }

      return importedCount;
    } catch (error) {
      console.error('❌ Import-Fehler:', error);
      throw new Error(`Import fehlgeschlagen: ${error.message}`);
    }
  }

  /**
   * Setzt alle Custom Presets zurück (löscht alle)
   */
  function resetCustomPresets() {
    customPresets.value = [];
    clearActivePreset();
    savePresetsToStorage();
  }

  /**
   * Sucht nach ähnlichen Presets
   */
  function findSimilarPreset(filters, threshold = 20) {
    // Berechnet die Ähnlichkeit zwischen aktuellen Filtern und einem Preset
    function calculateSimilarity(presetFilters) {
      let totalDiff = 0;
      let count = 0;

      Object.keys(filters).forEach((key) => {
        if (key === 'zoom') return; // Zoom ignorieren

        const diff = Math.abs(filters[key] - (presetFilters[key] || 100));
        totalDiff += diff;
        count++;
      });

      return count > 0 ? totalDiff / count : 0;
    }

    // Finde ähnlichstes Preset
    let closestPreset = null;
    let lowestDiff = Infinity;

    allPresets.value.forEach((preset) => {
      const diff = calculateSimilarity(preset.filters);
      if (diff < lowestDiff && diff < threshold) {
        lowestDiff = diff;
        closestPreset = preset;
      }
    });

    return closestPreset;
  }

  // ===== INITIALIZATION =====

  // Presets beim Start laden
  loadPresetsFromStorage();

  // ===== RETURN =====
  return {
    // State
    activePresetId,
    defaultPresets,
    customPresets,

    // Computed
    allPresets,
    activePreset,
    customPresetsCount,

    // Actions
    loadPresetsFromStorage,
    savePresetsToStorage,
    findPresetById,
    setActivePreset,
    clearActivePreset,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    exportPresets,
    importPresets,
    resetCustomPresets,
    findSimilarPreset,
  };
});
