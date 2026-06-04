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
      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.highlights', 'Lichter') }}</span>
          <span class="filter-value">{{ filters.highlights > 0 ? '+' : '' }}{{ filters.highlights }}</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.highlights"
            type="range"
            min="-100"
            max="100"
            class="modern-slider center-zero"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.shadows', 'Schatten') }}</span>
          <span class="filter-value">{{ filters.shadows > 0 ? '+' : '' }}{{ filters.shadows }}</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.shadows"
            type="range"
            min="-100"
            max="100"
            class="modern-slider center-zero"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.hue') }}</span>
          <span class="filter-value">{{ filters.hue }}°</span>
        </label>
        <div class="slider-track hue-slider">
          <input
            v-model.number="filters.hue"
            type="range"
            min="0"
            max="360"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.sepia', 'Wärme') }}</span>
          <span class="filter-value">{{ filters.sepia }}%</span>
        </label>
        <div class="slider-track warm-slider">
          <input
            v-model.number="filters.sepia"
            type="range"
            min="0"
            max="100"
            class="modern-slider"
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
