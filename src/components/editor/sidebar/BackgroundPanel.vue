<template>
  <div class="sidebar-section" :class="{ 'disabled-section': disabled }">
    <h3>{{ $t('editor.sidebar.background', 'Hintergrund') }}</h3>

    <div class="filter-control">
      <label>
        <span class="filter-label">{{ $t('editor.background.color', 'Farbe') }}</span>
      </label>
      <div class="color-picker-row">
        <input
          v-model="background.color"
          type="color"
          class="color-input"
          :disabled="disabled"
          @input="$emit('render')"
        />
        <input
          v-model="background.color"
          type="text"
          class="color-text-input"
          maxlength="7"
          :disabled="disabled"
          @input="$emit('render')"
        />
      </div>
    </div>

    <div class="filter-control">
      <label>
        <span class="filter-label">{{ $t('editor.background.opacity', 'Deckkraft') }}</span>
        <span class="filter-value">{{ background.opacity }}%</span>
      </label>
      <div class="slider-row">
        <div class="slider-track">
          <input
            v-model.number="background.opacity"
            type="range"
            min="0"
            max="100"
            class="modern-slider"
            :style="sliderStyle(background.opacity, 0, 100)"
            :disabled="disabled"
            @input="$emit('render')"
          />
        </div>
        <button
          v-if="background.opacity !== 100"
          class="reset-btn"
          title="Zurücksetzen"
          @click="resetOpacity"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <p v-if="disabled" class="hint-text">
      <i class="fas fa-info-circle"></i>
      {{ $t('editor.background.hint', 'Bild laden um Hintergrund anzupassen') }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  background: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['render']);

function sliderStyle(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
  };
}

function resetOpacity() {
  props.background.opacity = 100;
  emit('render');
}
</script>
