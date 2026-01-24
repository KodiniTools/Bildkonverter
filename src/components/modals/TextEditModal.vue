<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ modalMode === 'edit' ? $t('textModal.editTitle') : $t('textModal.addTitle') }}</h3>
        <div class="history-controls">
          <button
            @click.prevent="undo"
            class="btn-icon"
            :disabled="!canUndo"
            :title="$t('textModal.undo')"
          >
            <i class="fas fa-undo"></i>
          </button>
          <button
            @click.prevent="redo"
            class="btn-icon"
            :disabled="!canRedo"
            :title="$t('textModal.redo')"
          >
            <i class="fas fa-redo"></i>
          </button>
        </div>
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
        <input
          v-model.number="localText.fontSize"
          type="number"
          min="8"
          max="200"
          @change="saveToHistory"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.color') }}:</label>
        <input
          v-model="localText.color"
          type="color"
          @change="saveToHistory"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('textModal.fontFamily') }}:</label>
        <select
          v-model="localText.fontFamily"
          class="font-select"
          @change="saveToHistory"
        >
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
        <button
          v-if="modalMode === 'edit'"
          @click.prevent="handleDelete"
          class="btn-danger"
        >
          {{ $t('textModal.delete') }}
        </button>
        <div class="spacer"></div>
        <button @click.prevent="save" class="btn-primary">
          {{ modalMode === 'edit' ? $t('textModal.update') : $t('textModal.add') }}
        </button>
        <button @click.prevent="close" class="btn-secondary">
          {{ $t('textModal.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { availableFonts } from '@/assets/fonts/fontList.js'
import { useTextModal } from '@/composables/useTextModal'

const { editingText, modalMode, saveText, deleteText, closeModal } = useTextModal()

// Maximum history steps
const MAX_HISTORY_SIZE = 50

// History state
const history = ref([])
const historyIndex = ref(-1)
const isUndoRedoAction = ref(false)

// Local text state
const localText = ref({
  content: '',
  fontSize: 32,
  color: '#000000',
  fontFamily: 'Arial',
  x: 50,
  y: 50
})

// Computed properties for undo/redo availability
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// Create a snapshot of current text state
function createSnapshot() {
  return {
    content: localText.value.content,
    fontSize: localText.value.fontSize,
    color: localText.value.color,
    fontFamily: localText.value.fontFamily
  }
}

// Save current state to history
function saveToHistory() {
  if (isUndoRedoAction.value) return

  const snapshot = createSnapshot()

  // Remove any redo states if we're not at the end
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  // Add new state
  history.value.push(snapshot)

  // Limit history size
  if (history.value.length > MAX_HISTORY_SIZE) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

// Initialize history with current state
function initHistory() {
  history.value = [createSnapshot()]
  historyIndex.value = 0
}

// Undo action
function undo() {
  if (!canUndo.value) return

  isUndoRedoAction.value = true
  historyIndex.value--

  const snapshot = history.value[historyIndex.value]
  localText.value.content = snapshot.content
  localText.value.fontSize = snapshot.fontSize
  localText.value.color = snapshot.color
  localText.value.fontFamily = snapshot.fontFamily

  // Use nextTick to reset flag after Vue updates
  setTimeout(() => {
    isUndoRedoAction.value = false
  }, 0)
}

// Redo action
function redo() {
  if (!canRedo.value) return

  isUndoRedoAction.value = true
  historyIndex.value++

  const snapshot = history.value[historyIndex.value]
  localText.value.content = snapshot.content
  localText.value.fontSize = snapshot.fontSize
  localText.value.color = snapshot.color
  localText.value.fontFamily = snapshot.fontFamily

  // Use nextTick to reset flag after Vue updates
  setTimeout(() => {
    isUndoRedoAction.value = false
  }, 0)
}

watch(editingText, (newText) => {
  if (newText) {
    localText.value = {
      content: newText.content || '',
      fontSize: newText.fontSize || 32,
      color: newText.color || '#000000',
      fontFamily: newText.fontFamily || 'Arial',
      x: newText.x || 50,
      y: newText.y || 50,
      id: newText.id
    }
  } else {
    localText.value = {
      content: '',
      fontSize: 32,
      color: '#000000',
      fontFamily: 'Arial',
      x: 50,
      y: 50
    }
  }
  // Initialize history when modal opens
  initHistory()
}, { immediate: true })

function save() {
  const dataToSave = {
    content: localText.value.content,
    fontSize: localText.value.fontSize,
    color: localText.value.color,
    fontFamily: localText.value.fontFamily,
    x: localText.value.x,
    y: localText.value.y
  }

  // Direkt useTextModal.saveText() verwenden - KEIN Event emittieren!
  saveText(dataToSave)
}

function handleDelete() {
  if (localText.value.id) {
    deleteText(localText.value.id)
  }
}

function close() {
  closeModal()
}
</script>

<style scoped>
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
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-primary, white);
  color: var(--color-text-primary, #333);
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
}

.history-controls {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary, #f5f5f5);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-primary, #333);
  transition: all 0.2s ease;
}

.btn-icon:hover:not(:disabled) {
  background: var(--color-primary, #0066ff);
  color: white;
  border-color: var(--color-primary, #0066ff);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon i {
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  background: var(--color-bg-secondary, white);
  color: var(--color-text-primary, #333);
}

.form-group input[type="color"] {
  height: 40px;
  padding: 4px;
  cursor: pointer;
}

/* Font-Select mit Preview */
.font-select {
  max-height: 300px;
  font-size: 14px;
}

.font-select option {
  padding: 8px;
  font-size: 14px;
}

.modal-actions {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.spacer {
  flex: 1;
}

.btn-danger {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary, #0066ff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0052cc;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--color-bg-secondary, #f0f0f0);
  color: var(--color-text-primary, #333);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary, #e0e0e0);
}
</style>
