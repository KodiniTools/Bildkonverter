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
      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.blur') }}</span>
          <span class="filter-value">{{ filters.blur }}px</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.blur"
              type="range"
              min="0"
              max="20"
              step="0.5"
              class="modern-slider"
              :style="sliderStyle(filters.blur, 0, 20)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.blur !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('blur', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.vignette', 'Vignette') }}</span>
          <span class="filter-value">{{ filters.vignette }}%</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.vignette"
              type="range"
              min="0"
              max="100"
              class="modern-slider"
              :style="sliderStyle(filters.vignette, 0, 100)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.vignette !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('vignette', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.grayscale', 'Graustufen') }}</span>
          <span class="filter-value">{{ filters.grayscale }}%</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.grayscale"
              type="range"
              min="0"
              max="100"
              class="modern-slider"
              :style="sliderStyle(filters.grayscale, 0, 100)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.grayscale !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('grayscale', 0)"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.invert', 'Invertieren') }}</span>
          <span class="filter-value">{{ filters.invert }}%</span>
        </label>
        <div class="slider-row">
          <div class="slider-track">
            <input
              v-model.number="filters.invert"
              type="range"
              min="0"
              max="100"
              class="modern-slider"
              :style="sliderStyle(filters.invert, 0, 100)"
              :disabled="disabled"
              @input="$emit('render')"
              @change="$emit('save-history')"
            />
          </div>
          <button
            v-if="filters.invert !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="resetFilter('invert', 0)"
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

function resetFilter(key, defaultVal) {
  props.filters[key] = defaultVal;
  emit('render');
  emit('save-history');
}
</script>
