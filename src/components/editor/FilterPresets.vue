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
      <PresetTile
        v-for="preset in allPresets"
        :key="preset.id"
        :preset="preset"
        :active="activePreset === preset.id"
        @apply="applyPreset(preset)"
        @delete="deletePreset(preset.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import AppIcon from '@/components/ui/AppIcon.vue';
import PresetTile from '@/components/editor/presets/PresetTile.vue';
import { useFilterPresets } from '@/composables/presets/useFilterPresets';
import type { FilterPreset, PresetFilters } from '@/composables/presets/defaultPresets';

const props = defineProps<{
  filters: PresetFilters;
}>();

const emit = defineEmits<{
  'apply-preset': [preset: FilterPreset];
  'filters-changed': [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { confirm: confirmDialog } = useConfirm();

const {
  activePreset,
  allPresets,
  applyPreset,
  showSaveDialog,
  deletePreset,
  exportPresets,
  importPresets,
  resetActivePreset,
} = useFilterPresets({
  getFilters: () => props.filters,
  onApply: (preset) => emit('apply-preset', preset),
  confirm: confirmDialog,
  t,
});

defineExpose({
  resetActivePreset,
});
</script>

<style lang="scss" scoped>
// Kopfzeile mit Aktionen und Raster der Preset-Kacheln (PresetTile)
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
</style>
