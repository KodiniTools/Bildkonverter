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
      <div class="slider-track">
        <input
          v-model.number="background.opacity"
          type="range"
          min="0"
          max="100"
          class="modern-slider"
          :disabled="disabled"
          @input="$emit('render')"
        />
      </div>
    </div>

    <p v-if="disabled" class="hint-text">
      <i class="fas fa-info-circle"></i>
      {{ $t('editor.background.hint', 'Bild laden um Hintergrund anzupassen') }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  background: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['render']);
</script>
