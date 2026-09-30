<template>
  <button
    type="button"
    role="switch"
    class="toggle-switch"
    :class="{ active: modelValue }"
    :aria-checked="modelValue"
    :aria-label="label || undefined"
    :title="title || undefined"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="toggle-switch-knob"></span>
  </button>
</template>

<script setup>
/**
 * Einheitlicher, kompakter Schiebeschalter (32×18) für alle An/Aus-Optionen
 * des Editors. v-model-fähig: emittiert `update:modelValue` mit dem neuen Wert.
 */
defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  // Barrierefreier Name, falls kein sichtbares <label> den Schalter beschreibt
  label: { type: String, default: '' },
  title: { type: String, default: '' },
});

defineEmits(['update:modelValue']);
</script>

<style scoped lang="scss">
.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 9px;
  background: var(--color-border, #d1d5db);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &.active {
    background: var(--color-primary, #014f99);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, #014f99);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.toggle-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
  pointer-events: none;

  .toggle-switch.active & {
    transform: translateX(14px);
  }
}
</style>
