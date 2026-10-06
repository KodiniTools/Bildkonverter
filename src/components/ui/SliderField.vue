<template>
  <div class="slider-control" :class="{ 'slider-control--disabled': disabled }">
    <label v-if="label" class="slider-control__label" :for="inputId">
      <AppIcon v-if="icon" :name="icon" :size="14" />
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
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
import AppIcon from '@/components/ui/AppIcon.vue';

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
/* ControlSlider (Design-System v2): Label klein darüber, darunter eine Zeile
   Regler · Zahlenfeld · Reset (28-px-Platz dauerhaft reserviert). */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;

  &--disabled {
    opacity: 0.45;
  }
}

.slider-control__label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-regular);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.slider-field {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  width: 100%;
  min-width: 0;
}

/* Spur border-strong, Daumen Akzent (globaler Range-Stil); nur Farbton und
   Wärme behalten ihre Verlaufsspur, weil sie den Wert selbst zeigen. */
.slider-field__range {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  margin: 0;

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
    background: linear-gradient(
      90deg,
      var(--ds-info) 0%,
      var(--ds-border-strong) 50%,
      var(--ds-accent-hover) 100%
    );
  }
}

/* ResetButton = UiIconButton size sm (ghost) */
.slider-field__reset {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  svg {
    width: var(--ds-icon-sm);
    height: var(--ds-icon-sm);
  }

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
