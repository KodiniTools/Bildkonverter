<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.effects }">
    <h3 class="section-header" @click="$emit('toggle-section', 'effects')">
      <AppIcon name="magic" class="section-icon" />
      {{ $t('editor.sidebar.effects', 'Effekte') }}
      <AppIcon :name="sectionsOpen.effects ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
    </h3>

    <div v-show="sectionsOpen.effects" class="section-content">
      <FilterSlider
        :model-value="filters.blur"
        :label="$t('editor.filters.blur')"
        :min="0"
        :max="20"
        :step="0.5"
        :default-value="0"
        unit="px"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'blur', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.sharpness ?? 0"
        :label="$t('editor.filters.sharpness')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'sharpness', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.clarity ?? 0"
        :label="$t('editor.filters.clarity')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'clarity', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.grain ?? 0"
        :label="$t('editor.filters.grain')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'grain', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.vignette"
        :label="$t('editor.filters.vignette', 'Vignette')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'vignette', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.grayscale"
        :label="$t('editor.filters.grayscale', 'Graustufen')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'grayscale', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.invert"
        :label="$t('editor.filters.invert', 'Invertieren')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'invert', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';
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
