<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.effects }">
    <h3 class="section-header" @click="sectionsOpen.effects = !sectionsOpen.effects">
      <i class="fas fa-magic section-icon"></i>
      {{ $t('editor.sidebar.effects', 'Effekte') }}
      <i
        :class="sectionsOpen.effects ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.effects" class="section-content">
      <FilterSlider
        v-model="filters.blur"
        :label="$t('editor.filters.blur')"
        :min="0"
        :max="20"
        :step="0.5"
        :default-value="0"
        unit="px"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.vignette"
        :label="$t('editor.filters.vignette', 'Vignette')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.grayscale"
        :label="$t('editor.filters.grayscale', 'Graustufen')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        :disabled="disabled"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        v-model="filters.invert"
        :label="$t('editor.filters.invert', 'Invertieren')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
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
