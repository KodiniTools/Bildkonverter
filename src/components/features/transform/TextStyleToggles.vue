<template>
  <!-- Textstil: Fett / Kursiv -->
  <div class="control-group">
    <label>
      <AppIcon name="bold" :size="14" />
      {{ $t('textPanel.style', 'Stil') }}
    </label>
    <div class="style-toggle-row">
      <button
        type="button"
        class="style-toggle"
        :class="{ active: isBoldActive }"
        :disabled="fontIsBold"
        :title="
          fontIsBold
            ? $t('textPanel.boldInherent', 'Schriftart ist bereits fett')
            : $t('textPanel.bold', 'Fett')
        "
        @click="toggleBold"
      >
        <AppIcon name="bold" />
        <span>{{ $t('textPanel.bold', 'Fett') }}</span>
      </button>
      <button
        type="button"
        class="style-toggle"
        :class="{ active: isItalicActive }"
        :disabled="fontIsItalic"
        :title="
          fontIsItalic
            ? $t('textPanel.italicInherent', 'Schriftart ist bereits kursiv')
            : $t('textPanel.italic', 'Kursiv')
        "
        @click="toggleItalic"
      >
        <AppIcon name="italic" />
        <span>{{ $t('textPanel.italic', 'Kursiv') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useTextFontStyle } from '@/composables/text/useTextFontStyle';
import type { EditorText } from '@/composables/text/types';

const props = defineProps<{
  selectedText: EditorText;
}>();

const emit = defineEmits<{
  'update:text-bold': [value: boolean];
  'update:text-italic': [value: boolean];
  'save-text-history': [];
}>();

const { fontIsBold, fontIsItalic, isBoldActive, isItalicActive } = useTextFontStyle(
  toRef(props, 'selectedText')
);

function toggleBold() {
  if (fontIsBold.value) return;
  emit('update:text-bold', !props.selectedText?.bold);
  emit('save-text-history');
}

function toggleItalic() {
  if (fontIsItalic.value) return;
  emit('update:text-italic', !props.selectedText?.italic);
  emit('save-text-history');
}
</script>

<style scoped lang="scss">
@import './shared';

// Fett/Kursiv im UiSegmentedControl-Look
.style-toggle-row {
  display: flex;
  gap: 2px;
  padding: 2px;
  height: var(--ds-control-md);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);
}

.style-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-surface-1);
    border-color: var(--ds-border-strong);
    color: var(--ds-text);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}
</style>
