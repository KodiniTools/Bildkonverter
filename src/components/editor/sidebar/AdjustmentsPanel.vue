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
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.brightness"
              type="range"
              min="0"
              max="200"
              class="modern-slider"
              :style="sliderStyle(filters.brightness, 0, 200)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.brightness !== 100"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('brightness', 100)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.contrast') }}</span>
          <span class="filter-value">{{ filters.contrast }}%</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.contrast"
              type="range"
              min="0"
              max="200"
              class="modern-slider"
              :style="sliderStyle(filters.contrast, 0, 200)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.contrast !== 100"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('contrast', 100)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.saturation') }}</span>
          <span class="filter-value">{{ filters.saturation }}%</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.saturation"
              type="range"
              min="0"
              max="200"
              class="modern-slider"
              :style="sliderStyle(filters.saturation, 0, 200)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.saturation !== 100"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('saturation', 100)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.exposure', 'Belichtung') }}</span>
          <span class="filter-value">{{ filters.exposure > 0 ? '+' : '' }}{{ filters.exposure }}</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.exposure"
              type="range"
              min="-50"
              max="50"
              class="modern-slider center-zero"
              :style="sliderStyleCenterZero(filters.exposure, -50, 50)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.exposure !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('exposure', 0)"
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

function sliderStyle(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
  };
}

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
