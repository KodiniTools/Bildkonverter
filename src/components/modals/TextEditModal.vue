<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content" @click.stop>
      <h3>{{ modalMode === 'edit' ? $t('textModal.editTitle') : $t('textModal.addTitle') }}</h3>
      
      <div class="form-group">
        <label>{{ $t('textModal.text') }}:</label>
        <input 
          v-model="localText.content" 
          type="text" 
          :placeholder="$t('textModal.textPlaceholder')"
        />
      </div>
      
      <div class="form-group">
        <label>{{ $t('textModal.fontSize') }}:</label>
        <input v-model.number="localText.fontSize" type="number" min="8" max="200" />
      </div>
      
      <div class="form-group">
        <label>{{ $t('textModal.color') }}:</label>
        <input v-model="localText.color" type="color" />
      </div>
      
      <div class="form-group">
        <label>{{ $t('textModal.fontFamily') }}:</label>
        <select v-model="localText.fontFamily" class="font-select">
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
import { ref, watch } from 'vue'
import { availableFonts } from '@/assets/fonts/fontList.js'
import { useTextModal } from '@/composables/useTextModal'

const { editingText, modalMode, saveText, deleteText, closeModal } = useTextModal()

const localText = ref({
  content: '',
  fontSize: 32,
  color: '#000000',
  fontFamily: 'Arial',
  x: 50,
  y: 50
})

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
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
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
  border: 1px solid #ddd;
  border-radius: 4px;
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
  background: #0066ff;
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
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
