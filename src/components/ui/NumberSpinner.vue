<template>
  <div class="number-spinner" :class="{ disabled }">
    <input
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="spinner-value"
      :disabled="disabled"
      @input="onInput"
      @change="emit('commit')"
    />
    <span v-if="unit" class="spinner-unit">{{ unit }}</span>
    <div class="spinner-buttons">
      <button
        type="button"
        class="spinner-btn spinner-up"
        tabindex="-1"
        :title="$t('common.increase')"
        :aria-label="$t('common.increase')"
        :disabled="disabled || modelValue >= max"
        @pointerdown="startHold(1, $event)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        class="spinner-btn spinner-down"
        tabindex="-1"
        :title="$t('common.decrease')"
        :aria-label="$t('common.decrease')"
        :disabled="disabled || modelValue <= min"
        @pointerdown="startHold(-1, $event)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue';

// Klicken-und-Halten: ein Schritt sofort, nach HOLD_DELAY ein Dauerlauf, der
// langsam (für feines Nachjustieren) beginnt und immer schneller wird.
const HOLD_DELAY = 400;
const HOLD_PHASES = [
  { until: 5, interval: 140, factor: 1 },
  { until: 15, interval: 70, factor: 1 },
  { until: 30, interval: 40, factor: 1 },
  { until: Infinity, interval: 40, factor: 5 },
];

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});

// update:modelValue = fortlaufende Wertänderung (treibt die Live-Vorschau)
// commit           = Wert steht fest (für History: Loslassen / Enter / Blur)
const emit = defineEmits(['update:modelValue', 'commit']);

// Rundet auf die durch step vorgegebene Genauigkeit (vermeidet Float-Drift)
function roundToStep(v) {
  return Number(v.toFixed(4));
}

function clamp(v) {
  if (Number.isNaN(v)) return props.modelValue;
  return Math.min(props.max, Math.max(props.min, v));
}

function onInput(e) {
  emit('update:modelValue', clamp(Number(e.target.value)));
}

// Schritt um `factor` Schritte ohne Commit (Commit erfolgt beim Loslassen)
function doStep(direction, factor = 1) {
  const next = clamp(roundToStep(props.modelValue + direction * props.step * factor));
  if (next === props.modelValue) return false;
  emit('update:modelValue', next);
  return true;
}

let holdTimer = null;
let holdTicks = 0;
let holdChanged = false;

function repeatHold(direction) {
  holdTicks += 1;
  const phase = HOLD_PHASES.find((p) => holdTicks <= p.until);
  if (!doStep(direction, phase.factor)) {
    stopHold(); // Grenze erreicht → anhalten
    return;
  }
  holdChanged = true;
  holdTimer = setTimeout(() => repeatHold(direction), phase.interval);
}

function startHold(direction, event) {
  if (props.disabled) return;
  if (event) {
    if (event.button !== undefined && event.button !== 0) return; // nur linke Taste
    event.preventDefault();
  }
  stopHold();

  holdChanged = doStep(direction);
  holdTimer = setTimeout(() => repeatHold(direction), HOLD_DELAY);

  window.addEventListener('pointerup', stopHold);
  window.addEventListener('pointercancel', stopHold);
}

function stopHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  holdTicks = 0;
  window.removeEventListener('pointerup', stopHold);
  window.removeEventListener('pointercancel', stopHold);

  // Nach dem Loslassen genau einen History-Eintrag setzen
  if (holdChanged) {
    holdChanged = false;
    emit('commit');
  }
}

onBeforeUnmount(stopHold);
</script>

<style scoped lang="scss">
/* Kompaktes Zahlenfeld im Visualizer-Stil: 22px hoch, umrandet, Monospace.
   Eigene Pfeile statt der nativen, weil sie das langsam→schnell tragen. */
.number-spinner {
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 66px;
  height: 22px;
  padding: 0 0 0 4px;
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 4px;
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: var(--color-accent);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .spinner-value {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: 0.66rem;
    font-weight: 600;
    line-height: 1.3;
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
    }
  }

  .spinner-unit {
    flex: none;
    margin-left: 1px;
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    color: var(--control-muted);
    pointer-events: none;
  }

  .spinner-buttons {
    flex: none;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    margin-left: 2px;
    border-left: 1px solid var(--control-border);
  }

  .spinner-btn {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    min-height: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--control-muted);
    cursor: pointer;
    touch-action: none;
    transition:
      color 0.15s ease,
      background 0.15s ease;

    svg {
      width: 8px;
      height: 8px;
      fill: none;
      stroke: currentColor;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &:hover:not(:disabled) {
      color: var(--color-accent);
      background: var(--color-light-gold);
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
  }

  .spinner-up {
    border-top-right-radius: 3px;
  }

  .spinner-down {
    border-bottom-right-radius: 3px;
  }
}

/* Touch: höheres Feld, damit die Pfeile treffbar bleiben */
@media (max-width: 768px) {
  .number-spinner {
    width: 72px;
    height: 28px;

    .spinner-value {
      font-size: 0.75rem;
    }

    .spinner-btn {
      width: 18px;
    }
  }
}
</style>
