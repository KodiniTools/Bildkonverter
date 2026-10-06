<template>
  <div class="filter-presets">
    <div class="presets-header">
      <h3>{{ $t('presets.title') }}</h3>
      <div class="presets-actions">
        <button
          class="action-btn"
          :title="$t('presets.actions.save')"
          :aria-label="$t('presets.actions.save')"
          @click="showSaveDialog"
        >
          <AppIcon name="save" />
        </button>
        <button
          class="action-btn"
          :title="$t('presets.actions.import')"
          :aria-label="$t('presets.actions.import')"
          @click="importPresets"
        >
          <AppIcon name="file-import" />
        </button>
        <button
          class="action-btn"
          :title="$t('presets.actions.export')"
          :aria-label="$t('presets.actions.export')"
          @click="exportPresets"
        >
          <AppIcon name="file-export" />
        </button>
      </div>
    </div>

    <div class="presets-grid">
      <button
        v-for="preset in allPresets"
        :key="preset.id"
        class="preset-btn"
        :class="{ active: activePreset === preset.id }"
        :title="preset.description"
        @click="applyPreset(preset)"
      >
        <span class="preset-icon"><AppIcon :name="presetIconName(preset)" :size="20" /></span>
        <span class="preset-name">{{ $t(`presets.${preset.id}`, preset.name) }}</span>
        <button
          v-if="preset.custom"
          class="delete-btn"
          :title="$t('presets.actions.delete')"
          :aria-label="$t('presets.actions.delete')"
          @click.stop="deletePreset(preset.id)"
        >
          <AppIcon name="times" />
        </button>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import { logger } from '@/utils/logger';
import AppIcon from '@/components/ui/AppIcon.vue';

const { t } = useI18n({ useScope: 'global' });
const { confirm: confirmDialog } = useConfirm();

// Props
const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['apply-preset', 'filters-changed']);

// State
const activePreset = ref(null);
const customPresets = ref([]);

// Standard-Presets mit allen Foto-Effekten (inkl. neue Filter)
const defaultPresets = [
  {
    id: 'normal',
    name: 'Normal',
    icon: 'image',
    description: 'Original',
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
      sepia: 0,
      grayscale: 0,
      vignette: 0,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'history',
    description: 'Retro-Look',
    filters: {
      brightness: 110,
      contrast: 90,
      saturation: 70,
      blur: 0,
      hue: 0,
      sepia: 40,
      vignette: 30,
    },
  },
  {
    id: 'bw',
    name: 'Schwarz/Weiß',
    icon: 'circle-half-stroke',
    description: 'Klassisch',
    filters: { brightness: 100, contrast: 120, saturation: 0, blur: 0, hue: 0, grayscale: 100 },
  },
  {
    id: 'vivid',
    name: 'Lebendig',
    icon: 'palette',
    description: 'Kräftige Farben',
    filters: { brightness: 105, contrast: 120, saturation: 150, blur: 0, hue: 0, exposure: 5 },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: 'coffee',
    description: 'Nostalgischer Braun-Ton',
    filters: {
      brightness: 105,
      contrast: 95,
      saturation: 80,
      blur: 0,
      hue: 0,
      sepia: 70,
      vignette: 20,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramatisch',
    icon: 'bolt',
    description: 'Hoher Kontrast',
    filters: {
      brightness: 95,
      contrast: 150,
      saturation: 120,
      blur: 0,
      hue: 0,
      shadows: -20,
      highlights: 20,
      vignette: 25,
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    icon: 'cloud',
    description: 'Weiche Töne',
    filters: {
      brightness: 110,
      contrast: 85,
      saturation: 90,
      blur: 0.5,
      hue: 0,
      highlights: 15,
      exposure: 5,
    },
  },
  {
    id: 'hdr',
    name: 'HDR',
    icon: 'layer-group',
    description: 'Sehr hohe Dynamik',
    filters: {
      brightness: 105,
      contrast: 130,
      saturation: 140,
      blur: 0,
      hue: 0,
      highlights: 30,
      shadows: 30,
    },
  },
  {
    id: 'cold',
    name: 'Kalt',
    icon: 'moon',
    description: 'Kühle Töne',
    filters: {
      brightness: 100,
      contrast: 105,
      saturation: 90,
      blur: 0,
      hue: 200,
      sepia: 0,
      exposure: -5,
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: 'sun',
    description: 'Warme Töne',
    filters: {
      brightness: 105,
      contrast: 100,
      saturation: 110,
      blur: 0,
      hue: 15,
      sepia: 25,
      exposure: 5,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: 'paint-brush',
    description: 'Orange/Rosa Sonnenuntergang',
    filters: {
      brightness: 110,
      contrast: 105,
      saturation: 120,
      blur: 0,
      hue: 10,
      sepia: 30,
      vignette: 20,
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: 'wave-square',
    description: 'Blaue Meer-Stimmung',
    filters: { brightness: 100, contrast: 110, saturation: 115, blur: 0, hue: 195, exposure: -5 },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: 'tv',
    description: 'Film-Look',
    filters: {
      brightness: 95,
      contrast: 120,
      saturation: 95,
      blur: 0,
      hue: 5,
      vignette: 35,
      shadows: -15,
    },
  },
  {
    id: 'faded',
    name: 'Faded',
    icon: 'eye-slash',
    description: 'Verblasst',
    filters: { brightness: 115, contrast: 75, saturation: 70, blur: 0, hue: 0, exposure: 10 },
  },
  {
    id: 'noir',
    name: 'Noir',
    icon: 'circle',
    description: 'Film Noir Stil',
    filters: {
      brightness: 95,
      contrast: 140,
      saturation: 0,
      blur: 0,
      hue: 0,
      grayscale: 100,
      vignette: 45,
    },
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: 'magic',
    description: 'Verträumt',
    filters: {
      brightness: 115,
      contrast: 80,
      saturation: 85,
      blur: 1,
      hue: 0,
      highlights: 25,
      vignette: 15,
    },
  },
];

// Computed
const allPresets = computed(() => {
  return [...defaultPresets, ...customPresets.value];
});

// Methods
// Icon-Name des Presets (AppIcon); ältere eigene Presets tragen noch ein Emoji
function presetIconName(preset) {
  return /^[a-z-]+$/.test(preset.icon || '') ? preset.icon : 'sliders-h';
}

function applyPreset(preset) {
  activePreset.value = preset.id;
  emit('apply-preset', preset);

  if (window.$toast) {
    window.$toast.success(t('toast.presets.applied', { name: preset.name }));
  }
}

function showSaveDialog() {
  const name = prompt(t('presets.dialogs.saveName'), t('presets.dialogs.defaultName'));
  if (!name) return;

  const description = prompt(t('presets.dialogs.saveDescription'), '');

  const newPreset = {
    id: 'custom_' + Date.now(),
    name: name.trim(),
    icon: 'sliders-h',
    description: description?.trim() || t('presets.custom'),
    filters: { ...props.filters },
    custom: true,
  };

  customPresets.value.push(newPreset);
  savePresetsToStorage();

  if (window.$toast) {
    window.$toast.success(t('toast.presets.saved', { name: name.trim() }));
  }
}

async function deletePreset(presetId) {
  const confirmed = await confirmDialog(t('presets.dialogs.confirmDelete'), {
    title: t('presets.dialogs.deleteTitle', 'Preset löschen?'),
    confirmText: t('confirm.delete', 'Löschen'),
    cancelText: t('confirm.cancel', 'Abbrechen'),
    variant: 'danger',
  });
  if (!confirmed) return;

  const index = customPresets.value.findIndex((p) => p.id === presetId);
  if (index !== -1) {
    const preset = customPresets.value[index];
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

function importPresets() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!Array.isArray(imported)) {
        throw new Error(t('presets.errors.invalidFormat'));
      }

      // Füge importierte Presets hinzu
      customPresets.value = [...customPresets.value, ...imported];
      savePresetsToStorage();

      if (window.$toast) {
        window.$toast.success(t('toast.presets.imported', { count: imported.length }));
      }
    } catch (error) {
      logger.error('Import-Fehler:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.presets.importError'), error.message);
      }
    }
  };

  input.click();
}

function savePresetsToStorage() {
  try {
    localStorage.setItem('bildkonverter_filterPresets', JSON.stringify(customPresets.value));
  } catch (error) {
    logger.error('Fehler beim Speichern:', error);
  }
}

function loadPresetsFromStorage() {
  try {
    const stored = localStorage.getItem('bildkonverter_filterPresets');
    if (stored) {
      customPresets.value = JSON.parse(stored);
    }
  } catch (error) {
    logger.error('Fehler beim Laden:', error);
  }
}

// Lifecycle
onMounted(() => {
  loadPresetsFromStorage();
});

// Public method to reset active preset
function resetActivePreset() {
  activePreset.value = null;
}

defineExpose({
  resetActivePreset,
});
</script>

<style lang="scss" scoped>
/* Preset-Kacheln wie StylePresets im Collage Maker: Rahmen border-strong,
   Hover-Rahmen Akzent, ausgewählt = accent-soft + Akzent-Rahmen. */
.filter-presets {
  margin-top: var(--ds-space-4);
}

.presets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-3);

  h3 {
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
  }
}

.presets-actions {
  display: flex;
  gap: var(--ds-space-1);
}

/* UiIconButton ghost, Größe sm */
.action-btn {
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  background: transparent;
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--ds-space-2);
  max-height: 320px;
  overflow-y: auto;
  padding-right: var(--ds-space-1);
}

.preset-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  background: transparent;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  font: inherit;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
    color: var(--ds-text);

    .preset-icon {
      color: var(--ds-text);
    }
  }
}

.preset-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--ds-space-12);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
}

.preset-name {
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  text-align: center;
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  width: 100%;
  overflow: hidden;
  word-break: break-word;
  hyphens: auto;
}

/* Destruktiv textbasiert: UiIconButton sm mit Danger-Icon auf surface-1 */
.delete-btn {
  position: absolute;
  top: var(--ds-space-1);
  right: var(--ds-space-1);
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-1);
  color: var(--ds-danger);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition:
    opacity var(--ds-duration) var(--ds-ease),
    background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
  }

  &:focus-visible {
    opacity: 1;
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.preset-btn:hover .delete-btn,
.preset-btn:focus-within .delete-btn {
  opacity: 1;
}

@media (hover: none) {
  .delete-btn {
    opacity: 1;
  }
}
</style>
