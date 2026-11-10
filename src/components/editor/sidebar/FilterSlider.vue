<template>
  <SliderField
    class="filter-slider"
    :model-value="modelValue"
    :label="label"
    :min="min"
    :max="max"
    :step="step"
    :unit="unit"
    :default-value="defaultValue"
    :variant="variant"
    :disabled="disabled"
    @update:model-value="onUpdate"
    @commit="emit('save-history')"
  />
</template>

<script setup lang="ts">
/**
 * Filter-Regler der Editor-Sidebar. Hülle um SliderField, die dessen Events in
 * die Sprache der Panels übersetzt: jede Wertänderung löst `render` aus, jeder
 * abgeschlossene Schritt `save-history`.
 */
import { computed } from 'vue';
import SliderField, { type SliderVariant } from '@/components/ui/SliderField.vue';

const props = defineProps({
  modelValue: { type: Number, required: true },
  label: { type: String, default: '' },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  defaultValue: { type: Number, default: 0 },
  centerZero: { type: Boolean, default: false },
  /** 'hue-slider' | 'warm-slider' – farbige Spur für Farbton/Wärme. */
  trackClass: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'render', 'save-history']);

const TRACK_VARIANTS: Partial<Record<string, SliderVariant>> = {
  'hue-slider': 'hue',
  'warm-slider': 'warm',
};

const variant = computed((): SliderVariant => {
  const track = TRACK_VARIANTS[props.trackClass];
  if (track) return track;
  return props.centerZero ? 'center' : 'default';
});

function onUpdate(value: number) {
  emit('update:modelValue', value);
  emit('render');
}
</script>

<style scoped>
/* Abstand zwischen den Reglern einer Sidebar-Sektion */
.filter-slider {
  margin-bottom: var(--ds-space-3);
}
</style>
