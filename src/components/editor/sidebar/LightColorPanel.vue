<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.lightColor }">
    <h3 class="section-header" @click="sectionsOpen.lightColor = !sectionsOpen.lightColor">
      <i class="fas fa-sun section-icon"></i>
      {{ $t('editor.sidebar.lightColor', 'Licht & Farbe') }}
      <i
        :class="sectionsOpen.lightColor ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.lightColor" class="section-content">
      <FilterSlider
        v-model="filters.highlights"
        :label="$t('editor.filters.highlights', 'Lichter')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.shadows"
        :label="$t('editor.filters.shadows', 'Schatten')"
        :min="-100"
        :max="100"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.hue"
        :label="$t('editor.filters.hue')"
        :min="0"
        :max="360"
        :default-value="0"
        unit="°"
        track-class="hue-slider"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.sepia"
        :label="$t('editor.filters.sepia', 'Wärme')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        track-class="warm-slider"
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
