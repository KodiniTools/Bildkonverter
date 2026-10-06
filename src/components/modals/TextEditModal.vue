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
        <input v-model="localText.color" type="color" @change="saveToHistory" />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.fontFamily') }}:</label>
        <select v-model="localText.fontFamily" class="font-select" @change="saveToHistory">
          <option
            v-for="font in availableFonts"
            :key="font"
            :value="font"
            :style="{ fontFamily: font }"
          >
            {{ font }}
          </option>
        </select>
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

<script setup>
import { ref, watch, computed } from 'vue';
import { availableFonts } from '@/assets/fonts/fontList.js';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import SliderField from '@/components/ui/SliderField.vue';
import { useTextModal } from '@/composables/useTextModal';

const { editingText, modalMode, saveText, deleteText, closeModal } = useTextModal();

// Maximum history steps
const MAX_HISTORY_SIZE = 50;

// History state
const history = ref([]);
const historyIndex = ref(-1);
const isUndoRedoAction = ref(false);

// Local text state
const localText = ref({
  content: '',
  fontSize: 32,
  color: '#000000',
  fontFamily: 'Arial',
  x: 50,
  y: 50,
});

// Computed properties for undo/redo availability
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

// Create a snapshot of current text state
function createSnapshot() {
  return {
    content: localText.value.content,
    fontSize: localText.value.fontSize,
    color: localText.value.color,
    fontFamily: localText.value.fontFamily,
  };
}

// Save current state to history
function saveToHistory() {
  if (isUndoRedoAction.value) return;

  const snapshot = createSnapshot();

  // Remove any redo states if we're not at the end
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  // Add new state
  history.value.push(snapshot);

  // Limit history size
  if (history.value.length > MAX_HISTORY_SIZE) {
    history.value.shift();
  } else {
    historyIndex.value++;
  }
}

// Initialize history with current state
function initHistory() {
  history.value = [createSnapshot()];
  historyIndex.value = 0;
}

// Undo action
function undo() {
  if (!canUndo.value) return;

  isUndoRedoAction.value = true;
  historyIndex.value--;

  const snapshot = history.value[historyIndex.value];
  localText.value.content = snapshot.content;
  localText.value.fontSize = snapshot.fontSize;
  localText.value.color = snapshot.color;
  localText.value.fontFamily = snapshot.fontFamily;

  // Use nextTick to reset flag after Vue updates
  setTimeout(() => {
    isUndoRedoAction.value = false;
  }, 0);
}

// Redo action
function redo() {
  if (!canRedo.value) return;

  isUndoRedoAction.value = true;
  historyIndex.value++;

  const snapshot = history.value[historyIndex.value];
  localText.value.content = snapshot.content;
  localText.value.fontSize = snapshot.fontSize;
  localText.value.color = snapshot.color;
  localText.value.fontFamily = snapshot.fontFamily;

  // Use nextTick to reset flag after Vue updates
  setTimeout(() => {
    isUndoRedoAction.value = false;
  }, 0);
}

watch(
  editingText,
  (newText) => {
    if (newText) {
      localText.value = {
        content: newText.content || '',
        fontSize: newText.fontSize || 32,
        color: newText.color || '#000000',
        fontFamily: newText.fontFamily || 'Arial',
        x: newText.x || 50,
        y: newText.y || 50,
        id: newText.id,
      };
    } else {
      localText.value = {
        content: '',
        fontSize: 32,
        color: '#000000',
        fontFamily: 'Arial',
        x: 50,
        y: 50,
      };
    }
    // Initialize history when modal opens
    initHistory();
  },
  { immediate: true }
);

function save() {
  const dataToSave = {
    content: localText.value.content,
    fontSize: localText.value.fontSize,
    color: localText.value.color,
    fontFamily: localText.value.fontFamily,
    x: localText.value.x,
    y: localText.value.y,
  };

  // Direkt useTextModal.saveText() verwenden - KEIN Event emittieren!
  saveText(dataToSave);
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

/* UiTextField / UiSelect */
.form-group input,
.form-group select {
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

.form-group input:focus,
.form-group select:focus {
  outline: none;
}

.form-group input:focus-visible,
.form-group select:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

.form-group input[type='color'] {
  height: var(--ds-control-lg);
  padding: var(--ds-space-1);
  cursor: pointer;
}

/* Font-Select mit Preview */
.font-select {
  max-height: 300px;
  font-size: var(--ds-text-md);
}

.font-select option {
  padding: var(--ds-space-2);
  font-size: var(--ds-text-md);
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
  .form-group select,
  .font-select {
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
