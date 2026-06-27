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
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.highlights"
              type="range"
              min="-100"
              max="100"
              class="modern-slider center-zero"
              :style="sliderStyleCenterZero(filters.highlights, -100, 100)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.highlights !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('highlights', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.shadows', 'Schatten') }}</span>
          <span class="filter-value">{{ filters.shadows > 0 ? '+' : '' }}{{ filters.shadows }}</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.shadows"
              type="range"
              min="-100"
              max="100"
              class="modern-slider center-zero"
              :style="sliderStyleCenterZero(filters.shadows, -100, 100)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.shadows !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('shadows', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.hue') }}</span>
          <span class="filter-value">{{ filters.hue }}°</span>
        </label>
        <div class="slider-row">
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
          <button
            v-if="filters.hue !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('hue', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.sepia', 'Wärme') }}</span>
          <span class="filter-value">{{ filters.sepia }}%</span>
        </label>
        <div class="slider-row">
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
          <button
            v-if="filters.sepia !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('sepia', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
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

const emit = defineEmits(['render', 'save-history']);

function sliderStyleCenterZero(value, min, max) {
  const centerPct = 50;
  const valuePct = ((value - min) / (max - min)) * 100;
  const leftPct = Math.min(centerPct, valuePct);
  const rightPct = Math.max(centerPct, valuePct);
  return {
    backgroundImage: `linear-gradient(to right, var(--color-border) 0%, var(--color-border) ${leftPct}%, var(--color-primary) ${leftPct}%, var(--color-primary) ${rightPct}%, var(--color-border) ${rightPct}%, var(--color-border) 100%)`,
  };
}

function resetFilter(key, defaultVal) {
  props.filters[key] = defaultVal;
  emit('render');
  emit('save-history');
}
</script>
