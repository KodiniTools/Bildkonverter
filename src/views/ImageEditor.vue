<template>
  <div class="image-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-section">
        <button 
          class="btn btn-primary"
          :disabled="!imageStore.hasImage"
          @click="handleAddTextClick"
          title="Text hinzufügen (T)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4h12M10 4v12M7 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Text hinzufügen</span>
        </button>
        
        <button
          class="btn"
          :disabled="!imageStore.selectedTextId"
          @click="handleEditTextClick"
          title="Text bearbeiten (E)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14 4l2 2-8 8H6v-2l8-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Bearbeiten</span>
        </button>
        
        <button
          class="btn"
          :disabled="!imageStore.selectedTextId"
          @click="handleDuplicateText"
          title="Text duplizieren (Ctrl+D)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="5" y="5" width="10" height="10" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M7 3h8a2 2 0 0 1 2 2v8" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <span>Duplizieren</span>
        </button>
        
        <button
          class="btn btn-danger"
          :disabled="!imageStore.selectedTextId"
          @click="handleDeleteText"
          title="Text löschen (Delete)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Löschen</span>
        </button>
      </div>
      
      <div class="toolbar-section">
        <button
          class="btn"
          :disabled="!imageStore.hasTexts"
          @click="handleClearAllTexts"
          title="Alle Texte löschen"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Alle löschen</span>
        </button>
        
        <div class="text-count" v-if="imageStore.hasTexts">
          {{ imageStore.textCount }} Text{{ imageStore.textCount !== 1 ? 'e' : '' }}
        </div>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="canvas-wrapper">
      <div v-if="!imageStore.hasImage" class="canvas-placeholder">
        <div class="placeholder-content">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
            <circle cx="28" cy="34" r="4" fill="currentColor"/>
            <path d="M10 52l15-15 10 10 15-15 20 13" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <p>Bild hochladen, um zu beginnen</p>
        </div>
      </div>
      
      <canvas
        v-else
        ref="canvasRef"
        class="image-canvas"
        :class="{ 'interacting': textInteraction.isInteracting }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      />
    </div>

    <!-- Text Info Panel (wenn Text selektiert) -->
    <transition name="slide-up">
      <div v-if="imageStore.selectedText" class="text-info-panel">
        <div class="panel-header">
          <h3>Selektierter Text</h3>
          <button class="btn-close" @click="imageStore.selectedTextId = null">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        
        <div class="panel-content">
          <div class="text-preview" :style="selectedTextPreviewStyle">
            {{ imageStore.selectedText.content || imageStore.selectedText.txt }}
          </div>
          
          <div class="text-details">
            <div class="detail-row">
              <span class="label">Schrift:</span>
              <span class="value">{{ imageStore.selectedText.fontFamily || 'Arial' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Größe:</span>
              <span class="value">{{ imageStore.selectedText.fontSize || imageStore.selectedText.size }}px</span>
            </div>
            <div class="detail-row">
              <span class="label">Farbe:</span>
              <div class="color-preview" :style="{ background: imageStore.selectedText.color }"></div>
            </div>
            <div class="detail-row">
              <span class="label">Position:</span>
              <span class="value">
                X: {{ Math.round(imageStore.selectedText.x) }}, 
                Y: {{ Math.round(imageStore.selectedText.y) }}
              </span>
            </div>
          </div>
          
          <div class="panel-actions">
            <button class="btn btn-sm" @click="handleEditTextClick">
              Bearbeiten
            </button>
            <button class="btn btn-sm" @click="handleDuplicateText">
              Duplizieren
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Text Edit Modal -->
    <TextEditModal
      v-model="textModal.isModalOpen.value"
      :text="textModal.editingText.value"
      @save="textModal.saveText"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useImageStore } from '@/stores/imageStore'
import { useTextInteraction } from '@/composables/useTextInteraction'
import { useTextModal } from '@/composables/useTextModal'
import TextEditModal from '@/components/modals/TextEditModal.vue'

// Stores & Composables
const imageStore = useImageStore()
const textInteraction = useTextInteraction(imageStore)
const textModal = useTextModal()

// Refs
const canvasRef = ref(null)

// Computed
const selectedTextPreviewStyle = computed(() => {
  if (!imageStore.selectedText) return {}
  
  const text = imageStore.selectedText
  return {
    fontFamily: text.fontFamily || 'Arial',
    fontSize: `${Math.min(text.fontSize || text.size || 24, 32)}px`,
    color: text.color || '#000000',
    fontWeight: text.bold ? 'bold' : 'normal',
    fontStyle: text.italic ? 'italic' : 'normal',
    textDecoration: text.underline ? 'underline' : 'none'
  }
})

// Canvas Position berechnen
function getCanvasPosition(event) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = imageStore.imageWidth / rect.width
  const scaleY = imageStore.imageHeight / rect.height
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  }
}

// Event Handlers - Mouse
function onMouseDown(event) {
  const pos = getCanvasPosition(event)
  const result = textInteraction.handleMouseDown(pos.x, pos.y)
  
  // Wenn Doppelklick zum Bearbeiten erkannt wurde
  if (result && result.action === 'edit') {
    textModal.openEditTextModal(result.textId)
  }
}

function onMouseMove(event) {
  const pos = getCanvasPosition(event)
  textInteraction.handleMouseMove(pos.x, pos.y)
}

function onMouseUp() {
  textInteraction.handleMouseUp()
}

// Event Handlers - Keyboard
function onKeyDown(event) {
  // Nur wenn nicht in Input-Feld
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  
  // T - Text hinzufügen
  if (event.key === 't' || event.key === 'T') {
    if (imageStore.hasImage) {
      event.preventDefault()
      handleAddTextClick()
    }
  }
  
  // E - Text bearbeiten
  if ((event.key === 'e' || event.key === 'E') && imageStore.selectedTextId) {
    event.preventDefault()
    handleEditTextClick()
  }
  
  // Ctrl+D - Duplizieren
  if (event.ctrlKey && event.key === 'd' && imageStore.selectedTextId) {
    event.preventDefault()
    handleDuplicateText()
  }
  
  // Sonstige Keyboard-Events an Interaction-Handler
  textInteraction.handleKeyDown(event)
}

// Toolbar Actions
function handleAddTextClick() {
  if (!imageStore.hasImage) return
  
  // Öffne Modal mit Zentrumsposition
  textModal.openAddTextModal({
    x: imageStore.imageWidth / 2,
    y: imageStore.imageHeight / 2
  })
}

function handleEditTextClick() {
  if (!imageStore.selectedTextId) return
  textModal.openEditTextModal(imageStore.selectedTextId)
}

function handleDuplicateText() {
  if (!imageStore.selectedTextId) {
    return
  }
  
  const duplicate = imageStore.duplicateText(imageStore.selectedTextId)
  if (duplicate) {
    console.log('Text dupliziert:', duplicate)
  }
}

function handleDeleteText() {
  if (!imageStore.selectedTextId) return
  
  if (confirm('Text wirklich löschen?')) {
    imageStore.deleteText(imageStore.selectedTextId)
  }
}

function handleClearAllTexts() {
  if (!imageStore.hasTexts) return
  
  if (confirm(`Wirklich alle ${imageStore.textCount} Texte löschen?`)) {
    imageStore.clearTexts()
  }
}

// Lifecycle
onMounted(() => {
  // Canvas initialisieren
  if (canvasRef.value) {
    imageStore.initCanvas(canvasRef.value)
  }
  
  // Keyboard Listener
  window.addEventListener('keydown', onKeyDown)
  
  console.log('✅ Image Editor mounted')
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 12px;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-count {
  padding: 0.5rem 1rem;
  background: var(--color-primary, #014f99);
  color: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border, #d1d5db);
  background: white;
  color: var(--color-text, #111827);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  background: var(--color-bg-secondary, #f3f4f6);
  border-color: var(--color-primary, #014f99);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #014f99);
  color: #F5F4D6;
  border-color: var(--color-primary, #014f99);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #003971);
}

.btn-danger {
  color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #dc2626;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.btn svg {
  flex-shrink: 0;
}

/* Canvas */
.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
  position: relative;
}

.canvas-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.placeholder-content {
  text-align: center;
  color: var(--color-text-secondary, #6b7280);
}

.placeholder-content svg {
  margin-bottom: 1rem;
  stroke: currentColor;
}

.placeholder-content p {
  margin: 0;
  font-size: 1.125rem;
}

.image-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 2px solid var(--color-border, #e5e7eb);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.image-canvas.interacting {
  user-select: none;
  -webkit-user-select: none;
}

/* Text Info Panel */
.text-info-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary, #6b7280);
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text, #111827);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-preview {
  padding: 1rem;
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 8px;
  text-align: center;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
}

.value {
  color: var(--color-text, #111827);
  font-size: 0.875rem;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--color-border, #d1d5db);
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.panel-actions .btn {
  flex: 1;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-section {
    width: 100%;
    justify-content: space-between;
  }
  
  .btn span {
    display: none;
  }
  
  .btn {
    flex: 1;
    justify-content: center;
  }
}

/* Dark Mode */
.dark-mode .btn {
  background: var(--color-bg-secondary, #374151);
  border-color: var(--color-border, #4b5563);
  color: var(--color-text, #f9fafb);
}

.dark-mode .btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary, #4b5563);
}

.dark-mode .image-canvas {
  background: #1f2937;
  border-color: #374151;
}

.dark-mode .text-info-panel {
  background: #1f2937;
}

.dark-mode .text-preview {
  background: #111827;
}
</style>
