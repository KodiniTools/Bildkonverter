<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.adjustments }">
    <h3 class="section-header" @click="sectionsOpen.adjustments = !sectionsOpen.adjustments">
      <i class="fas fa-sliders-h section-icon"></i>
      {{ $t('editor.sidebar.adjustments') }}
      <i
        :class="sectionsOpen.adjustments ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.adjustments" class="section-content">
      <FilterSlider
        v-model="filters.brightness"
        :label="$t('editor.filters.brightness')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.contrast"
        :label="$t('editor.filters.contrast')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.saturation"
        :label="$t('editor.filters.saturation')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.exposure"
        :label="$t('editor.filters.exposure', 'Belichtung')"
        :min="-50"
        :max="50"
        :default-value="0"
        center-zero
        :disabled="disabled"
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

defineEmits(['render', 'save-history']);
</script>
