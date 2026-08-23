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
        :disabled="disabled || modelValue >= max"
        @pointerdown="startHold(1, $event)"
      >
        <i class="fas fa-caret-up"></i>
      </button>
      <button
        type="button"
        class="spinner-btn spinner-down"
        tabindex="-1"
        :title="$t('common.decrease')"
        :disabled="disabled || modelValue <= min"
        @pointerdown="startHold(-1, $event)"
      >
        <i class="fas fa-caret-down"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue';

// Verzögerung bis der Dauerlauf startet und Intervall zwischen den Schritten
const HOLD_DELAY = 400;
const HOLD_INTERVAL = 120;

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

// Einzelner Schritt ohne Commit (Commit erfolgt beim Loslassen)
function doStep(direction) {
  const next = clamp(roundToStep(props.modelValue + direction * props.step));
  if (next === props.modelValue) return false;
  emit('update:modelValue', next);
  return true;
}

// Klicken-und-Halten: erster Schritt sofort, danach Dauerlauf
let holdTimeout = null;
let holdInterval = null;
let holdChanged = false;

function startHold(direction, event) {
  if (props.disabled) return;
  if (event) {
    if (event.button !== undefined && event.button !== 0) return; // nur linke Taste
    event.preventDefault();
  }
  stopHold();

  holdChanged = doStep(direction);

  holdTimeout = setTimeout(() => {
    holdInterval = setInterval(() => {
      if (doStep(direction)) {
        holdChanged = true;
      } else {
        stopHold(); // Grenze erreicht → anhalten
      }
    }, HOLD_INTERVAL);
  }, HOLD_DELAY);

  window.addEventListener('pointerup', stopHold);
  window.addEventListener('pointercancel', stopHold);
}

function stopHold() {
  if (holdTimeout) {
    clearTimeout(holdTimeout);
    holdTimeout = null;
  }
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
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
.number-spinner {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 22px;
  background: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 4px;
  padding: 0 1px 0 0;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #014f99);
  }

  &:focus-within {
    border-color: var(--color-primary, #014f99);
    box-shadow: 0 0 0 2px rgba(1, 79, 153, 0.12);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .spinner-value {
    width: 34px;
    padding: 0 1px 0 5px;
    border: none;
    background: transparent;
    font-size: 0.7rem;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: var(--color-primary, #014f99);
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
    font-size: 0.6rem;
    font-weight: 500;
    color: var(--color-text-light);
    margin-right: 1px;
    pointer-events: none;
  }

  .spinner-buttons {
    display: flex;
    flex-direction: column;
    margin-left: 2px;
    border-left: 1px solid var(--color-border, #d1d5db);
  }

  .spinner-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 10px;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-text-light);
    transition:
      color 0.15s ease,
      background 0.15s ease;

    i {
      font-size: 0.6rem;
      line-height: 1;
    }

    &:hover:not(:disabled) {
      color: var(--color-primary, #014f99);
      background: rgba(1, 79, 153, 0.1);
    }

    &:disabled {
      opacity: 0.35;
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

// Dark Mode
:root[data-theme='dark'] .number-spinner {
  background: var(--color-card-bg, var(--color-bg));
  border-color: rgba(255, 255, 255, 0.15);

  .spinner-value {
    color: #60a5fa;
  }

  .spinner-buttons {
    border-left-color: rgba(255, 255, 255, 0.15);
  }

  .spinner-btn:hover:not(:disabled) {
    color: #60a5fa;
    background: rgba(96, 165, 250, 0.15);
  }
}
</style>
