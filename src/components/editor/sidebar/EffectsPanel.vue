<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.effects }">
    <h3 class="section-header" @click="$emit('toggle-section', 'effects')">
      <i class="fas fa-magic section-icon"></i>
      {{ $t('editor.sidebar.effects', 'Effekte') }}
      <i
        :class="sectionsOpen.effects ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
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
