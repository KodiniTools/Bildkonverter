<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.adjustments }">
    <h3 class="section-header" @click="$emit('toggle-section', 'adjustments')">
      <i class="fas fa-sliders-h section-icon"></i>
      {{ $t('editor.sidebar.adjustments') }}
      <i
        :class="sectionsOpen.adjustments ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.adjustments" class="section-content">
      <FilterSlider
        :model-value="filters.brightness"
        :label="$t('editor.filters.brightness')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'brightness', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.contrast"
        :label="$t('editor.filters.contrast')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'contrast', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.saturation"
        :label="$t('editor.filters.saturation')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'saturation', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.exposure"
        :label="$t('editor.filters.exposure', 'Belichtung')"
        :min="-50"
        :max="50"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'exposure', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />
    </div>
  </div>
</template>

<script setup>
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
});

// Props werden nicht verändert: Wertänderungen gehen als Ereignisse an den Editor
defineEmits(['update-filter', 'toggle-section', 'render', 'save-history']);
</script>
