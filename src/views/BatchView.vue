<template>
  <div class="batch-view">
    <header class="batch-header">
      <h1>{{ $t('batch.title') }}</h1>
      <p class="batch-subtitle">{{ $t('batch.subtitle') }}</p>
    </header>

    <!-- Upload Area -->
    <div 
      class="upload-zone"
      :class="{ 'drag-over': isDragging }"
      @drop="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <i class="fas fa-cloud-upload-alt"></i>
      <h3>{{ $t('batch.upload.title') }}</h3>
      <p>{{ $t('batch.upload.description') }}</p>
      <span class="upload-hint">{{ $t('batch.upload.hint') }}</span>
    </div>

    <!-- Settings Panel -->
    <div v-if="files.length > 0" class="settings-panel">
      <h3>
        <i class="fas fa-cog"></i>
        {{ $t('batch.settings.title') }}
      </h3>

      <div class="settings-grid">
        <div class="setting-group">
          <label>{{ $t('batch.settings.format') }}</label>
          <select v-model="settings.format">
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="gif">GIF</option>
            <option value="bmp">BMP</option>
          </select>
        </div>

        <div class="setting-group">
          <label>{{ $t('batch.settings.quality') }}</label>
          <div class="quality-control">
            <input 
              v-model.number="settings.quality"
              type="range"
              min="1"
              max="100"
              step="1"
            />
            <span class="quality-value">{{ settings.quality }}%</span>
          </div>
        </div>

        <div class="setting-group">
          <label>{{ $t('batch.settings.resize') }}</label>
          <div class="resize-options">
            <input 
              v-model.number="settings.width"
              type="number"
              :placeholder="$t('batch.settings.width')"
              min="1"
            />
            <span>×</span>
            <input 
              v-model.number="settings.height"
              type="number"
              :placeholder="$t('batch.settings.height')"
              min="1"
            />
            <label class="checkbox-label">
              <input v-model="settings.maintainAspect" type="checkbox" />
              {{ $t('batch.settings.maintainAspect') }}
            </label>
          </div>
        </div>

        <div class="setting-group">
          <label>{{ $t('batch.settings.prefix') }}</label>
          <input 
            v-model="settings.prefix"
            type="text"
            :placeholder="$t('batch.settings.prefixPlaceholder')"
          />
        </div>
      </div>

      <div class="action-buttons">
        <button 
          class="btn btn-primary"
          :disabled="isProcessing"
          @click="startProcessing"
        >
          <i class="fas fa-play"></i>
          {{ isProcessing ? $t('batch.processing') : $t('batch.start') }}
        </button>

        <button 
          class="btn btn-secondary"
          :disabled="isProcessing || processedFiles.length === 0"
          @click="downloadAll"
        >
          <i class="fas fa-download"></i>
          {{ $t('batch.downloadAll') }}
        </button>

        <button 
          class="btn btn-danger"
          :disabled="isProcessing"
          @click="clearAll"
        >
          <i class="fas fa-trash"></i>
          {{ $t('batch.clearAll') }}
        </button>
      </div>
    </div>

    <!-- Files List -->
    <div v-if="files.length > 0" class="files-list">
      <div class="list-header">
        <h3>
          {{ $t('batch.files.title') }}
          <span class="file-count">{{ files.length }}</span>
        </h3>
        
        <div class="progress-summary" v-if="isProcessing">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: overallProgress + '%' }"
            ></div>
          </div>
          <span>{{ processedCount }} / {{ files.length }}</span>
        </div>
      </div>

      <div class="files-grid">
        <div 
          v-for="file in files"
          :key="file.id"
          class="file-card"
          :class="{ 
            processing: file.status === 'processing',
            completed: file.status === 'completed',
            error: file.status === 'error'
          }"
        >
          <div class="file-preview">
            <img :src="file.preview" :alt="file.name" />
            
            <div v-if="file.status === 'processing'" class="processing-overlay">
              <div class="spinner"></div>
            </div>
            
            <div v-if="file.status === 'completed'" class="completed-overlay">
              <i class="fas fa-check-circle"></i>
            </div>
            
            <div v-if="file.status === 'error'" class="error-overlay">
              <i class="fas fa-exclamation-circle"></i>
            </div>
          </div>

          <div class="file-info">
            <h4>{{ file.name }}</h4>
            <p class="file-meta">
              {{ formatSize(file.size) }} • {{ file.width }}×{{ file.height }}
            </p>
            
            <div v-if="file.status === 'completed'" class="file-actions">
              <button 
                class="btn-icon"
                @click="downloadFile(file)"
                :title="$t('batch.files.download')"
              >
                <i class="fas fa-download"></i>
              </button>
              
              <button 
                class="btn-icon"
                @click="previewFile(file)"
                :title="$t('batch.files.preview')"
              >
                <i class="fas fa-eye"></i>
              </button>
            </div>
            
            <div v-if="file.status === 'error'" class="error-message">
              {{ file.error }}
            </div>
            
            <div v-if="file.status === 'processing'" class="progress-info">
              {{ file.progress }}%
            </div>
          </div>

          <button 
            class="remove-btn"
            @click="removeFile(file.id)"
            :disabled="file.status === 'processing'"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="previewingFile" class="preview-modal" @click="closePreview">
        <div class="modal-content" @click.stop>
          <button class="close-btn" @click="closePreview">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="comparison-view">
            <div class="comparison-item">
              <h4>{{ $t('batch.preview.original') }}</h4>
              <img :src="previewingFile.preview" :alt="previewingFile.name" />
            </div>
            
            <div class="comparison-divider"></div>
            
            <div class="comparison-item">
              <h4>{{ $t('batch.preview.processed') }}</h4>
              <img :src="previewingFile.processedPreview" :alt="previewingFile.name" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

// State
const fileInput = ref(null)
const isDragging = ref(false)
const files = ref([])
const processedFiles = ref([])
const isProcessing = ref(false)
const previewingFile = ref(null)

const settings = ref({
  format: 'jpg',
  quality: 80,
  width: null,
  height: null,
  maintainAspect: true,
  prefix: ''
})

// Computed
const overallProgress = computed(() => {
  if (files.value.length === 0) return 0
  const total = files.value.reduce((sum, file) => sum + (file.progress || 0), 0)
  return Math.round(total / files.value.length)
})

const processedCount = computed(() => {
  return files.value.filter(f => f.status === 'completed').length
})

// Methods
function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

async function addFiles(fileList) {
  const imageFiles = fileList.filter(f => f.type.startsWith('image/'))
  
  for (const file of imageFiles) {
    const preview = await createPreview(file)
    const dimensions = await getImageDimensions(preview)
    
    files.value.push({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      preview,
      width: dimensions.width,
      height: dimensions.height,
      status: 'pending',
      progress: 0,
      processedPreview: null,
      error: null
    })
  }
}

function createPreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.src = src
  })
}

async function startProcessing() {
  isProcessing.value = true
  processedFiles.value = []
  
  for (const file of files.value) {
    if (file.status === 'completed') continue
    
    file.status = 'processing'
    file.progress = 0
    
    try {
      await processFile(file)
      file.status = 'completed'
      file.progress = 100
      processedFiles.value.push(file)
    } catch (error) {
      file.status = 'error'
      file.error = error.message
    }
  }
  
  isProcessing.value = false
}

async function processFile(file) {
  // Simuliere Verarbeitung - In Produktion würde hier die echte Konvertierung stattfinden
  return new Promise((resolve) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      file.progress = Math.min(progress, 100)
      
      if (progress >= 100) {
        clearInterval(interval)
        file.processedPreview = file.preview // Placeholder
        resolve()
      }
    }, 100)
  })
}

function removeFile(fileId) {
  const index = files.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    files.value.splice(index, 1)
  }
}

function clearAll() {
  if (confirm(t('batch.confirmClear'))) {
    files.value = []
    processedFiles.value = []
  }
}

function downloadFile(file) {
  const link = document.createElement('a')
  link.href = file.processedPreview || file.preview
  link.download = (settings.value.prefix || '') + file.name
  link.click()
}

function downloadAll() {
  processedFiles.value.forEach(file => {
    setTimeout(() => downloadFile(file), 100)
  })
}

function previewFile(file) {
  previewingFile.value = file
}

function closePreview() {
  previewingFile.value = null
}

function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.batch-view {
  padding: var(--spacing-xl);
  min-height: 100vh;
}

.batch-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-sm);
  }
  
  .batch-subtitle {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }
}

.upload-zone {
  border: 3px dashed var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-3xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: var(--spacing-2xl);
  
  &:hover,
  &.drag-over {
    border-color: var(--color-primary);
    background: var(--color-light-blue);
  }
  
  i {
    font-size: 4rem;
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }
  
  .upload-hint {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

.settings-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  
  h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-lg);
    
    i {
      color: var(--color-primary);
    }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.setting-group {
  label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
    font-size: var(--font-size-sm);
  }
  
  select,
  input[type="text"],
  input[type="number"] {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

.quality-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  
  input[type="range"] {
    flex: 1;
  }
  
  .quality-value {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 45px;
  }
}

.resize-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  
  > div:first-child {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    span {
      color: var(--color-text-secondary);
    }
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  
  input[type="checkbox"] {
    width: auto;
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  
  button {
    flex: 1;
    min-width: 150px;
    
    i {
      margin-right: var(--spacing-xs);
    }
  }
}

.files-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-md);
    
    h3 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      .file-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 30px;
        height: 30px;
        background: var(--color-primary);
        color: white;
        border-radius: 50%;
        font-size: var(--font-size-sm);
        font-weight: 600;
      }
    }
  }
  
  .progress-summary {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    
    .progress-bar {
      width: 200px;
      height: 8px;
      background: var(--color-bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
      }
    }
    
    span {
      font-weight: 600;
      color: var(--color-primary);
    }
  }
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.file-card {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }
  
  &.processing {
    border: 2px solid var(--color-primary);
  }
  
  &.completed {
    border: 2px solid var(--color-success);
  }
  
  &.error {
    border: 2px solid var(--color-danger);
  }
}

.file-preview {
  position: relative;
  width: 100%;
  padding-top: 75%;
  overflow: hidden;
  background: var(--color-bg-primary);
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.processing-overlay,
.completed-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.completed-overlay i,
.error-overlay i {
  font-size: 3rem;
  color: white;
}

.file-info {
  padding: var(--spacing-md);
  
  h4 {
    margin-bottom: var(--spacing-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .file-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
  
  .error-message {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-danger-light);
    color: var(--color-danger);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
  }
  
  .progress-info {
    font-weight: 600;
    color: var(--color-primary);
  }
}

.remove-btn {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-danger);
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-icon {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

// Preview Modal
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--spacing-xl);
}

.modal-content {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.close-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  
  &:hover {
    background: darken(#dc3545, 10%);
  }
}

.comparison-view {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-xl);
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    
    .comparison-divider {
      display: none;
    }
  }
}

.comparison-item {
  text-align: center;
  
  h4 {
    margin-bottom: var(--spacing-md);
  }
  
  img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
  }
}

.comparison-divider {
  width: 2px;
  height: 400px;
  background: var(--color-border);
}
</style>
