<template>
  <Teleport to="#overlay-root">
    <div v-if="open" class="export-dialog-overlay" @click.self="emit('close')">
      <div class="export-dialog">
        <h3 class="export-dialog__title">
          {{ mode === 'share' ? $t('editor.toolbar.share') : $t('editor.toolbar.download') }}
        </h3>
        <template v-if="hasShareFile">
          <p class="export-dialog__text">{{ $t('editor.share.ready') }}</p>
          <div class="export-dialog__actions">
            <button class="export-dialog__btn export-dialog__btn--cancel" @click="emit('close')">
              {{ $t('common.cancel', 'Abbrechen') }}
            </button>
            <button
              class="export-dialog__btn export-dialog__btn--confirm"
              @click="emit('share-now')"
            >
              <AppIcon name="share" />
              {{ $t('editor.share.now') }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="export-dialog__input-row">
            <input
              v-model="filename"
              class="export-dialog__input"
              type="text"
              :placeholder="$t('editor.toolbar.download')"
              :disabled="isExporting"
              autofocus
              @keydown.enter="emit('confirm')"
              @keydown.escape="emit('close')"
            />
            <span class="export-dialog__ext">.{{ extension }}</span>
          </div>
          <p v-if="mode === 'share'" class="export-dialog__text">
            {{ $t('editor.share.privacy') }}
          </p>
          <p v-else class="export-dialog__text">
            {{ savePickerAvailable ? $t('save.hintPicker') : $t('save.hintFallback') }}
          </p>
          <div class="export-dialog__actions">
            <button class="export-dialog__btn export-dialog__btn--cancel" @click="emit('close')">
              {{ $t('common.cancel', 'Abbrechen') }}
            </button>
            <button
              class="export-dialog__btn export-dialog__btn--confirm"
              :disabled="isExporting"
              @click="emit('confirm')"
            >
              <AppIcon :name="confirmIcon" />
              {{ mode === 'share' ? $t('editor.toolbar.share') : $t('editor.toolbar.download') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Export-Dialog (Download oder Teilen) des Editors, aus EditorView ausgelagert.
 * Dateiname per v-model:filename; Bestätigen, Teilen und Schließen als Ereignisse.
 */
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { supportsSavePicker } from '@/utils/saveFile';

export type ExportDialogMode = 'download' | 'share';

const props = defineProps<{
  open: boolean;
  mode: ExportDialogMode;
  /** Datei liegt bereit, Teilen braucht nur noch einen Klick (Nutzergeste) */
  hasShareFile: boolean;
  /** Dateiendung ohne Punkt (Ausgabeformat) */
  extension: string;
  isExporting: boolean;
}>();

const filename = defineModel<string>('filename', { required: true });

const emit = defineEmits<{
  close: [];
  confirm: [];
  'share-now': [];
}>();

// Chrome/Edge: Speicherort und Name folgen im Systemdialog, sonst legt der Browser den Ort fest
const savePickerAvailable = supportsSavePicker();

const confirmIcon = computed(() => {
  if (props.isExporting) return 'spinner fa-spin';
  return props.mode === 'share' ? 'share' : 'download';
});
</script>

<style scoped lang="scss">
// ===== Export Dialog (UiDialog) =====
.export-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-4);
  z-index: var(--ds-z-backdrop);
}

.export-dialog {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-5);
  min-width: 320px;
  max-width: 440px;
  width: 100%;
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-overlay);
  animation: editor-dialog-in var(--ds-duration-slow) var(--ds-ease);

  &__title {
    margin: 0 0 var(--ds-space-4);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
  }

  &__input-row {
    display: flex;
    align-items: center;
    height: var(--ds-control-lg);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    overflow: hidden;
    margin-bottom: var(--ds-space-5);
    transition: border-color var(--ds-duration) var(--ds-ease);

    &:focus-within {
      border-color: var(--ds-accent);
      box-shadow: var(--ds-focus-ring);
    }
  }

  &__input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    padding: 0 var(--ds-space-3);
    background: transparent;
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    min-width: 0;

    &:focus,
    &:focus-visible {
      outline: none;
      border: none;
      box-shadow: none;
    }
  }

  &__ext {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--ds-space-3);
    background: var(--ds-surface-1);
    color: var(--ds-text-2);
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-sm);
    white-space: nowrap;
    border-left: var(--ds-border-width) solid var(--ds-border);
  }

  &__text {
    margin: calc(-1 * var(--ds-space-2)) 0 var(--ds-space-5);
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-space-2);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-4);
    border: var(--ds-border-width) solid transparent;
    border-radius: var(--ds-radius-md);
    font: inherit;
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    line-height: 1;
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }

    &--cancel {
      background: var(--ds-surface-2);
      border-color: var(--ds-border-strong);
      color: var(--ds-text);

      &:hover {
        background: var(--ds-surface-3);
      }
    }

    &--confirm {
      background: var(--ds-accent);
      color: var(--ds-on-accent);
      font-weight: var(--ds-weight-semibold);

      &:hover:not(:disabled) {
        background: var(--ds-accent-hover);
      }
    }
  }
}

/* Eingang: nur Einblenden + 8 px */
@keyframes editor-dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
