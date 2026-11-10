<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.lightColor }">
    <h3 class="section-header" @click="$emit('toggle-section', 'lightColor')">
      <AppIcon name="sun" class="section-icon" />
      {{ $t('editor.sidebar.lightColor', 'Licht & Farbe') }}
      <AppIcon
        :name="sectionsOpen.lightColor ? 'chevron-up' : 'chevron-down'"
        class="toggle-icon"
      />
    </h3>

    <div v-show="sectionsOpen.lightColor" class="section-content">
      <FilterSlider
        :model-value="filters.highlights"
        :label="$t('editor.filters.highlights', 'Lichter')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'highlights', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.shadows"
        :label="$t('editor.filters.shadows', 'Schatten')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'shadows', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.hue"
        :label="$t('editor.filters.hue')"
        :min="0"
        :max="360"
        :default-value="0"
        unit="°"
        track-class="hue-slider"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'hue', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.sepia"
        :label="$t('editor.filters.sepia', 'Wärme')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        track-class="warm-slider"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'sepia', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <!-- Weißabgleich: Temperatur/Tönung als Kanal-Gains, Pipette setzt beide -->
      <FilterSlider
        :model-value="filters.temperature ?? 0"
        :label="$t('editor.filters.temperature')"
        :min="-100"
        :max="100"
        :default-value="0"
        track-class="warm-slider"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'temperature', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.tint ?? 0"
        :label="$t('editor.filters.tint')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'tint', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <UiButton
        size="sm"
        block
        :variant="pickingWhite ? 'primary' : 'secondary'"
        :disabled="disabled"
        :aria-pressed="pickingWhite ? 'true' : 'false'"
        :title="$t('editor.whiteBalance.pickHint')"
        data-testid="pick-white"
        @click="$emit('toggle-pick-white')"
      >
        <template #icon><AppIcon name="eye-dropper" :size="16" /></template>
        {{ pickingWhite ? $t('editor.whiteBalance.pickActive') : $t('editor.whiteBalance.pick') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import FilterSlider from './FilterSlider.vue';

defineProps({
  filters: {
    type: Object,
    required: true,
  },
  sectionsOpen: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** Pipette aktiv: der nächste Klick auf die Leinwand setzt den Graupunkt */
  pickingWhite: {
    type: Boolean,
    default: false,
  },
});

// Props werden nicht verändert: Wertänderungen gehen als Ereignisse an den Editor
defineEmits(['update-filter', 'toggle-section', 'render', 'save-history', 'toggle-pick-white']);
</script>
