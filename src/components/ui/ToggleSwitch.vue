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
/* Umschalter: „an“ zeigt die Primärfarbe (Gold), „aus“ border-strong.
   Hover ändert nur Farbe, Fokus ist der System-Ring. */
.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: var(--ds-radius-full);
  background: var(--ds-border-strong);
  cursor: pointer;
  transition: background-color var(--ds-duration) var(--ds-ease);

  &.active {
    background: var(--ds-accent);
  }

  &:hover:not(:disabled):not(.active) {
    background: var(--ds-text-3);
  }

  &.active:hover:not(:disabled) {
    background: var(--ds-accent-hover);
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

.toggle-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform var(--ds-duration) var(--ds-ease);
  pointer-events: none;

  .toggle-switch.active & {
    transform: translateX(14px);
  }
}
</style>
