<template>
  <UiDialog
    :open="state.visible"
    :title="t('save.title')"
    :description="t('save.hintFallback')"
    :close-label="t('common.close')"
    @close="cancel"
  >
    <form id="save-as-form" class="save-as" @submit.prevent="ok">
      <label class="save-as__label" for="save-as-input">{{ t('save.label') }}</label>
      <div class="save-as__row">
        <input
          id="save-as-input"
          ref="inputRef"
          v-model="baseName"
          class="save-as__input"
          type="text"
          autocomplete="off"
          spellcheck="false"
        />
        <span v-if="extension" class="save-as__ext">.{{ extension }}</span>
      </div>
    </form>
    <template #footer>
      <UiButton variant="secondary" @click="cancel">{{ t('common.cancel') }}</UiButton>
      <UiButton variant="primary" type="submit" form="save-as-form">
        {{ t('save.confirm') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSavePrompt } from '@/composables/useSavePrompt';
import { extensionOf } from '@/utils/saveFile';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';

/**
 * Globale Dateinamen-Abfrage für `useSavePrompt().prompt(name)`, nur in
 * Browsern ohne Speichern-unter-Dialog (Firefox, Safari). Aufbau wie
 * ConfirmDialog; die Endung ist fest, damit Name und Format zusammenpassen.
 * Escape, Hintergrund und Schließen-Button brechen ab.
 */
const { t } = useI18n();
const { state, respond } = useSavePrompt();

const baseName = ref('');
const extension = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => state.value.visible,
  async (visible) => {
    if (!visible) return;
    const name = state.value.filename;
    extension.value = extensionOf(name);
    baseName.value = extension.value ? name.slice(0, -(extension.value.length + 1)) : name;
    // Nach dem Fokus-Sprung von UiDialog auf das Panel ins Eingabefeld
    await nextTick();
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
);

function ok(): void {
  const name = baseName.value.trim();
  respond(name && extension.value ? `${name}.${extension.value}` : name);
}

function cancel(): void {
  respond(null);
}
</script>

<style scoped>
.save-as {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.save-as__label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
}

/* Eingabe mit fester Endung wie im Export-Dialog des Editors */
.save-as__row {
  display: flex;
  align-items: center;
  height: var(--ds-control-lg);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  overflow: hidden;
  transition: border-color var(--ds-duration) var(--ds-ease);
}

.save-as__row:focus-within {
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

.save-as__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 var(--ds-space-3);
  border: none;
  outline: none;
  background: transparent;
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
}

.save-as__input:focus,
.save-as__input:focus-visible {
  outline: none;
  border: none;
  box-shadow: none;
}

.save-as__ext {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 var(--ds-space-3);
  border-left: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-1);
  color: var(--ds-text-2);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-sm);
  white-space: nowrap;
}
</style>
