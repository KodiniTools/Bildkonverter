<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ modalMode === 'edit' ? $t('textModal.editTitle') : $t('textModal.addTitle') }}</h3>
        <HistoryActions
          compact
          :can-undo="canUndo"
          :can-redo="canRedo"
          :undo-title="$t('textModal.undo')"
          :redo-title="$t('textModal.redo')"
          @undo="undo"
          @redo="redo"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.text') }}:</label>
        <input
          v-model="localText.content"
          type="text"
          :placeholder="$t('textModal.textPlaceholder')"
          @input="saveToHistory"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.fontSize') }}:</label>
        <SliderField
          v-model="localText.fontSize"
          :min="8"
          :max="200"
          unit="px"
          :default-value="32"
          @commit="saveToHistory"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.color') }}:</label>
        <ColorField
          v-model="localText.color"
          class="form-color"
          :label="$t('textModal.color')"
          @change="saveToHistory"
        />
      </div>

      <div class="form-group">
        <UiSelect
          v-model="localText.fontFamily"
          :label="`${$t('textModal.fontFamily')}:`"
          :options="FONT_OPTIONS"
          @change="saveToHistory"
        />
      </div>

      <div class="modal-actions">
        <button v-if="modalMode === 'edit'" class="btn-danger" @click.prevent="handleDelete">
          {{ $t('textModal.delete') }}
        </button>
        <div class="spacer"></div>
        <button class="btn-primary" @click.prevent="save">
          {{ modalMode === 'edit' ? $t('textModal.update') : $t('textModal.add') }}
        </button>
        <button class="btn-secondary" @click.prevent="close">
          {{ $t('textModal.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { availableFonts } from '@/assets/fonts/fontList.js';
import ColorField from '@/components/ui/ColorField.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import { fontOptions } from '@/utils/fontOptions';
import { useTextModal } from '@/composables/useTextModal';
import { useTextEditForm, type EditingText } from '@/composables/text/useTextEditForm';
import type { Ref } from 'vue';

const { editingText, modalMode, saveText, deleteText, closeModal } = useTextModal();

const FONT_OPTIONS = fontOptions(availableFonts);

const { localText, canUndo, canRedo, saveToHistory, undo, redo, savePayload } = useTextEditForm(
  editingText as Readonly<Ref<EditingText>>
);

function save() {
  // Direkt useTextModal.saveText() verwenden - KEIN Event emittieren!
  saveText(savePayload());
}

function handleDelete() {
  if (localText.value.id) {
    deleteText(localText.value.id);
  }
}

function close() {
  closeModal();
}
</script>

<style scoped>
/* UiDialog (Design-System v2), Größe md: 440 px, surface-1, radius-lg,
   Padding 20, Overlay-Schatten, Backdrop ohne Blur. Buttons = UiButton md. */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--ds-space-4);
  z-index: 1000;
  animation: text-modal-fade var(--ds-duration-slow) var(--ds-ease);
}

.modal-content {
  box-sizing: border-box;
  width: min(440px, 100%);
  max-height: calc(100vh - 2 * var(--ds-space-4));
  overflow-y: auto;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-overlay);
  animation: text-modal-in var(--ds-duration-slow) var(--ds-ease);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
}

.form-group {
  margin-bottom: var(--ds-space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

/* UiTextField */
.form-group input {
  box-sizing: border-box;
  width: 100%;
  height: var(--ds-control-lg);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  transition: border-color var(--ds-duration) var(--ds-ease);
}

.form-group input:focus {
  outline: none;
}

.form-group input:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

/* ColorField: Swatch in voller Feldbreite wie zuvor das native Farbfeld */
.form-group .form-color {
  width: 100%;
  height: var(--ds-control-lg);
  border-radius: var(--ds-radius-md);
}

.modal-actions {
  margin-top: var(--ds-space-6);
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
}

.spacer {
  flex: 1;
}

/* UiButton md: danger (textbasiert), primary (Gold), secondary */
.btn-danger,
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);
}

.btn-danger:focus-visible,
.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.btn-danger {
  background: transparent;
  color: var(--ds-danger);
}

.btn-danger:hover {
  background: var(--ds-surface-2);
}

.btn-primary {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);
}

.btn-primary:hover {
  background: var(--ds-accent-hover);
}

.btn-secondary {
  background: var(--ds-surface-2);
  color: var(--ds-text);
  border-color: var(--ds-border-strong);
}

.btn-secondary:hover {
  background: var(--ds-surface-3);
}

@keyframes text-modal-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes text-modal-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile: Felder 16 px gegen Auto-Zoom, Touch-Ziele 44 px */
@media (max-width: 640px) {
  .modal-content {
    padding: var(--ds-space-4);
  }

  .form-group input,
  .form-group :deep(select) {
    height: var(--ds-row-height);
    font-size: var(--ds-text-lg);
  }

  .modal-actions {
    flex-wrap: wrap;
  }

  .btn-danger,
  .btn-primary,
  .btn-secondary {
    min-height: var(--ds-row-height);
  }
}
</style>
