<template>
  <div class="slider-control" :class="{ 'slider-control--disabled': disabled }">
    <label v-if="label" class="slider-control__label" :for="inputId">
      <i v-if="icon" :class="icon" aria-hidden="true"></i>
      {{ label }}
    </label>
    <div class="slider-field">
      <input
        :id="inputId"
        type="range"
        class="slider-field__range"
        :class="trackClass"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="label || undefined"
        @input="onRangeInput"
        @change="emit('commit')"
      />
      <NumberSpinner
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
        @commit="emit('commit')"
      />
      <button
        v-if="hasDefault"
        type="button"
        class="slider-field__reset"
        :title="`${$t('common.reset')} (${defaultValue}${unit})`"
        :aria-label="`${$t('common.reset')} (${defaultValue}${unit})`"
        :disabled="disabled || isAtDefault"
        @click="reset"
      >
        ↺
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * SliderField – eine Zeile aus Regler, Zahlen-Spinner und Reset-Button
 * (Muster aus dem Visualizer). Das Label steht klein darüber.
 *
 * Events:
 * - `update:modelValue` (number) – live bei jeder Änderung
 * - `commit` – Wert steht fest (Regler losgelassen, Spinner fertig, Reset);
 *   genau ein History-Eintrag pro Interaktion
 * - `reset` – nach einem Klick auf den Reset-Button
 */
import { computed } from 'vue';
import NumberSpinner from '@/components/ui/NumberSpinner.vue';

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  /** Wert für den Reset-Button. Ohne Angabe gibt es keinen Reset-Button. */
  defaultValue: { type: Number, default: undefined },
  label: { type: String, default: '' },
  /** Optionale FontAwesome-Klasse vor dem Label. */
  icon: { type: String, default: '' },
  /** id des Reglers (für `<label for>` und Tests). */
  inputId: { type: String, default: undefined },
  /**
   * Spur-Variante: 'default' | 'center' (Nullpunkt mittig) | 'hue' | 'warm'.
   * 'default' wird bei Bereichen um null automatisch zu 'center'.
   */
  variant: { type: String, default: 'default' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'commit', 'reset']);

const hasDefault = computed(() => typeof props.defaultValue === 'number');
const isAtDefault = computed(() => hasDefault.value && props.modelValue === props.defaultValue);
// Bereiche um null (z. B. −180…180) zeigen den Nullpunkt mittig.
const trackClass = computed(() => {
  const spansZero = props.min < 0 && props.max > 0;
  const variant = props.variant === 'default' && spansZero ? 'center' : props.variant;
  return variant === 'default' ? null : `slider-field__range--${variant}`;
});

function onRangeInput(event) {
  const value = Number(event.target.value);
  if (Number.isFinite(value)) emit('update:modelValue', value);
}

function reset() {
  if (!hasDefault.value || isAtDefault.value) return;
  emit('update:modelValue', props.defaultValue);
  emit('reset');
  emit('commit');
}
</script>

<style scoped lang="scss">
/* Label oben, darunter eine Zeile: Regler · Spinner · Reset (Visualizer-Layout) */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  &--disabled {
    opacity: 0.55;
  }
}

.slider-control__label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--control-muted);

  i {
    font-size: 0.65rem;
    opacity: 0.85;
  }
}

.slider-field {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

/* Dünne Verlaufsspur, kleiner Thumb mit weißem Rand */
.slider-field__range {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  height: 3px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--slider-track-from) 0%, var(--slider-track-to) 100%);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;

  &--center {
    background: linear-gradient(
      90deg,
      var(--slider-track-to) 0%,
      var(--slider-track-from) 50%,
      var(--slider-track-to) 100%
    );
  }

  &--hue {
    background: linear-gradient(
      to right,
      hsl(0, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(240, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(360, 100%, 50%)
    );
  }

  &--warm {
    background: linear-gradient(90deg, var(--slider-track-from) 0%, #d4a574 50%, #8b5a2b 100%);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--slider-thumb);
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border-radius: 50%;
    background: var(--slider-thumb);
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  &::-moz-range-track {
    background: transparent;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(201, 152, 77, 0.3);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.slider-field__reset {
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 4px;
  color: var(--control-muted);
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}

/* Touch: größerer Thumb und Reset */
@media (max-width: 768px) {
  .slider-field__range {
    &::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
    }
  }

  .slider-field__reset {
    width: 28px;
    height: 28px;
    font-size: 0.95rem;
  }
}
</style>
