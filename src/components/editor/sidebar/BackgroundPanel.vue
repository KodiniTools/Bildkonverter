<template>
  <div class="sidebar-section" :class="{ 'disabled-section': disabled }">
    <h3>{{ $t('editor.sidebar.background', 'Hintergrund') }}</h3>

    <div class="filter-control">
      <label>
        <span class="filter-label">{{ $t('editor.background.color', 'Farbe') }}</span>
      </label>
      <div class="color-picker-row">
        <input
          :value="background.color"
          type="color"
          class="color-input"
          :disabled="disabled"
          @input="onColorInput"
          @change="$emit('save-history')"
        />
        <input
          :value="background.color"
          type="text"
          class="color-text-input"
          maxlength="7"
          :disabled="disabled"
          @input="onColorInput"
          @change="$emit('save-history')"
        />
      </div>
    </div>

    <FilterSlider
      :model-value="background.opacity"
      :label="$t('editor.background.opacity', 'Deckkraft')"
      :min="0"
      :max="100"
      :default-value="100"
      unit="%"
      :disabled="disabled"
      @update:model-value="$emit('update-background', 'opacity', $event)"
      @render="$emit('render')"
      @save-history="$emit('save-history')"
    />

    <p v-if="disabled" class="hint-text">
      <i class="fas fa-info-circle"></i>
      {{ $t('editor.background.hint', 'Bild laden um Hintergrund anzupassen') }}
    </p>
  </div>
</template>

<script setup>
import FilterSlider from './FilterSlider.vue';

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

// Props werden nicht verändert: Wertänderungen gehen als Ereignisse an den Editor
const emit = defineEmits(['update-background', 'render', 'save-history']);

function onColorInput(event) {
  emit('update-background', 'color', event.target.value);
  emit('render');
}
</script>
