<template>
  <div
    class="sidebar-section collapsible"
    :class="{ collapsed: !sectionsOpen.adjustments }"
  >
    <h3
      class="section-header"
      @click="sectionsOpen.adjustments = !sectionsOpen.adjustments"
    >
      <i class="fas fa-sliders-h section-icon"></i>
      {{ $t('editor.sidebar.adjustments') }}
      <i
        :class="sectionsOpen.adjustments ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.adjustments" class="section-content">
      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.brightness') }}</span>
          <span class="filter-value">{{ filters.brightness }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.brightness"
            type="range"
            min="0"
            max="200"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.contrast') }}</span>
          <span class="filter-value">{{ filters.contrast }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.contrast"
            type="range"
            min="0"
            max="200"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.saturation') }}</span>
          <span class="filter-value">{{ filters.saturation }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.saturation"
            type="range"
            min="0"
            max="200"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.exposure', 'Belichtung') }}</span>
          <span class="filter-value">{{ filters.exposure > 0 ? '+' : '' }}{{ filters.exposure }}</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.exposure"
            type="range"
            min="-50"
            max="50"
            class="modern-slider center-zero"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
