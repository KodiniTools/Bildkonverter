<template>
  <div class="color-field">
    <div class="color-picker-row">
      <input
        type="color"
        class="color-input"
        :value="modelValue"
        :aria-label="label"
        @input="emit('update:modelValue', $event.target.value)"
        @change="commit($event.target.value)"
      />
      <input
        type="text"
        class="color-text"
        maxlength="7"
        :value="modelValue"
        :aria-label="label"
        @input="onText($event.target.value)"
        @change="commit(modelValue)"
      />
    </div>
    <div v-if="swatches.length" class="recent-colors" role="group" :aria-label="recentLabel">
      <button
        v-for="color in swatches"
        :key="color"
        type="button"
        class="recent-color"
        :class="{ active: color === current }"
        :style="{ backgroundColor: color }"
        :title="color"
        :aria-label="`${recentLabel}: ${color}`"
        :data-color="color"
        @click="pick(color)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Farbfeld (Farbwähler + Hex-Eingabe) mit den zuletzt verwendeten Farben.
 * `update:modelValue` bei jeder Änderung (Live-Vorschau), `commit` einmal bei
 * abgeschlossener Auswahl; dabei wird die Farbe in die Verlaufsliste
 * aufgenommen. Ein Klick auf ein Farbfeld übernimmt und committet direkt.
 */
import { computed } from 'vue';
import { useRecentColors } from '@/composables/useRecentColors';

const props = defineProps({
  modelValue: { type: String, default: '#000000' },
  label: { type: String, default: '' },
  /** Beschriftung der Verlaufsliste (übersetzt) */
  recentLabel: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'commit']);

const { recentColors, addRecentColor } = useRecentColors();
const swatches = computed(() => recentColors.value);
const current = computed(() => String(props.modelValue || '').toLowerCase());

function onText(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) emit('update:modelValue', value);
}

function commit(value) {
  addRecentColor(value);
  emit('commit', value);
}

function pick(color) {
  emit('update:modelValue', color);
  commit(color);
}
</script>

<style scoped lang="scss">
@import '../transform/shared';

.recent-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
}

.recent-color {
  width: 20px;
  height: 20px;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  transition:
    transform var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);

  &:hover {
    transform: scale(1.12);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    box-shadow:
      0 0 0 2px var(--ds-surface-1),
      0 0 0 3px var(--ds-accent);
  }
}
</style>
