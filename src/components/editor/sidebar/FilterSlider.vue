<template>
  <div class="filter-control">
    <label>
      <span class="filter-label">{{ label }}</span>
    </label>
    <div class="slider-row">
      <div class="slider-track" :class="trackClass">
        <input
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue"
          class="modern-slider"
          :class="{ 'center-zero': centerZero }"
          :style="fillStyle"
          :disabled="disabled"
          @input="onRangeInput"
          @change="emit('save-history')"
        />
      </div>

      <!-- Zahlen-Spinner: direkte Eingabe + Schrittpfeile -->
      <div class="number-spinner" :class="{ disabled }">
        <input
          type="number"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue"
          class="spinner-value"
          :disabled="disabled"
          @input="onNumberInput"
          @change="emit('save-history')"
        />
        <span v-if="unit" class="spinner-unit">{{ unit }}</span>
        <div class="spinner-buttons">
          <button
            type="button"
            class="spinner-btn spinner-up"
            tabindex="-1"
            title="Erhöhen"
            :disabled="disabled || modelValue >= max"
            @click="stepValue(1)"
          >
            <i class="fas fa-caret-up"></i>
          </button>
          <button
            type="button"
            class="spinner-btn spinner-down"
            tabindex="-1"
            title="Verringern"
            :disabled="disabled || modelValue <= min"
            @click="stepValue(-1)"
          >
            <i class="fas fa-caret-down"></i>
          </button>
        </div>
      </div>

      <button
        v-if="modelValue !== defaultValue"
        class="reset-btn"
        title="Zurücksetzen"
        :disabled="disabled"
        @click="onReset"
      >
        <i class="fas fa-undo-alt"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Number, required: true },
  label: { type: String, default: '' },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  defaultValue: { type: Number, default: 0 },
  centerZero: { type: Boolean, default: false },
  trackClass: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'render', 'save-history']);

// Rundet auf die durch step vorgegebene Genauigkeit (vermeidet Float-Drift)
function roundToStep(v) {
  return Number(v.toFixed(4));
}

function clamp(v) {
  if (Number.isNaN(v)) return props.modelValue;
  return Math.min(props.max, Math.max(props.min, v));
}

function onRangeInput(e) {
  emit('update:modelValue', Number(e.target.value));
  emit('render');
}

function onNumberInput(e) {
  emit('update:modelValue', clamp(Number(e.target.value)));
  emit('render');
}

function stepValue(direction) {
  const next = clamp(roundToStep(props.modelValue + direction * props.step));
  if (next === props.modelValue) return;
  emit('update:modelValue', next);
  emit('render');
  emit('save-history');
}

function onReset() {
  emit('update:modelValue', props.defaultValue);
  emit('render');
  emit('save-history');
}

// Fortschritts-Füllung nur bei Standard-Slidern; hue-/warm-Slider nutzen
// eigene Farbverläufe (::before) und einen transparenten Track.
const fillStyle = computed(() => {
  if (props.trackClass) return {};
  const { modelValue: v, min, max, centerZero } = props;
  const valuePct = ((v - min) / (max - min)) * 100;

  if (centerZero) {
    const leftPct = Math.min(50, valuePct);
    const rightPct = Math.max(50, valuePct);
    return {
      backgroundImage: `linear-gradient(to right, var(--color-border) 0%, var(--color-border) ${leftPct}%, var(--color-primary) ${leftPct}%, var(--color-primary) ${rightPct}%, var(--color-border) ${rightPct}%, var(--color-border) 100%)`,
    };
  }

  return {
    backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${valuePct}%, var(--color-border) ${valuePct}%, var(--color-border) 100%)`,
  };
});
</script>
