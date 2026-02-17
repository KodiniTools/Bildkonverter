<template>
  <div class="image-upload">
    <div 
      class="dropzone"
      :class="{ 'dropzone-active': isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
    >
      <div class="dropzone-content">
        <i class="fas fa-cloud-upload-alt dropzone-icon"></i>
        <p class="dropzone-text">
          {{ isDragging ? $t('upload.dropzoneActive') : $t('upload.dropzone') }}
        </p>
        <button class="btn btn-primary" @click="openFileDialog">
          <i class="fas fa-folder-open"></i>
          {{ $t('upload.selectFile') }}
        </button>
        
        <div class="upload-info">
          <p class="text-muted">
            <strong>{{ $t('upload.supportedFormats') }}:</strong> 
            JPG, PNG, GIF, WebP, BMP, TIFF, HEIC
          </p>
          <p class="text-muted">
            <strong>{{ $t('upload.maxFileSize') }}:</strong> 
            50 MB
          </p>
        </div>
      </div>
      
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      >
    </div>
    
    <!-- URL Upload -->
    <div class="url-upload">
      <div class="url-input-group">
        <input
          v-model="imageUrl"
          type="url"
          :placeholder="$t('upload.urlPlaceholder')"
          class="url-input"
          @keyup.enter="loadFromUrl"
        >
        <button 
          class="btn btn-secondary"
          @click="loadFromUrl"
          :disabled="!imageUrl || isLoading"
        >
          <i class="fas fa-link"></i>
          {{ $t('upload.urlLoad') }}
        </button>
      </div>
    </div>
    
    <!-- Demo Image -->
    <div class="demo-section">
      <button class="btn btn-secondary btn-small" @click="loadDemoImage">
        <i class="fas fa-image"></i>
        {{ $t('upload.useDemo') }}
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
    
    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useImageStore } from '@/stores/imageStore'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['image-loaded'])

const imageStore = useImageStore()
const { t } = useI18n({ useScope: 'global' })

const fileInput = ref(null)
const isDragging = ref(false)
const imageUrl = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

function openFileDialog() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    await loadImage(file)
  }
}

async function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  
  if (file && file.type.startsWith('image/')) {
    await loadImage(file)
  } else {
    showError(t('errors.invalidImage'))
  }
}

async function loadImage(file) {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await imageStore.loadImageFromFile(file)
    
    // Speichere in Recent Images
    saveToRecentImages(file)
    
    emit('image-loaded')
  } catch (error) {
    console.error('Fehler beim Laden:', error)
    showError(error.message || t('errors.fileLoadError'))
  } finally {
    isLoading.value = false
  }
}

async function loadFromUrl() {
  if (!imageUrl.value) return
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await imageStore.loadImageFromUrl(imageUrl.value)
    emit('image-loaded')
    imageUrl.value = ''
  } catch (error) {
    console.error('Fehler beim Laden von URL:', error)
    showError(t('errors.networkError'))
  } finally {
    isLoading.value = false
  }
}

async function loadDemoImage() {
  // Lade ein Demo-Bild (kann von einem CDN oder lokalem Asset kommen)
  const demoUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await imageStore.loadImageFromUrl(demoUrl)
    emit('image-loaded')
  } catch (error) {
    console.error('Fehler beim Laden des Demo-Bildes:', error)
    showError(t('errors.networkError'))
  } finally {
    isLoading.value = false
  }
}

function saveToRecentImages(file) {
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      const recentImages = JSON.parse(localStorage.getItem('bildkonverter-recent-images') || '[]')
      
      const newImage = {
        id: Date.now(),
        name: file.name,
        url: e.target.result,
        thumbnail: e.target.result,
        timestamp: Date.now()
      }
      
      // Füge hinzu und behalte nur die letzten 10
      recentImages.unshift(newImage)
      if (recentImages.length > 10) {
        recentImages.pop()
      }
      
      localStorage.setItem('bildkonverter-recent-images', JSON.stringify(recentImages))
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.warn('Konnte nicht in Recent Images speichern:', error)
  }
}

function showError(message) {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.image-upload {
  max-width: 600px;
  margin: 0 auto;
}

.dropzone {
  border: 3px dashed var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  transition: all $transition-base;
  background: var(--color-bg-secondary);
  
  &:hover {
    border-color: var(--color-primary);
    background: var(--color-light-blue);
  }
  
  &-active {
    border-color: var(--color-success);
    background: rgba(80, 227, 194, 0.1);
    transform: scale(1.02);
  }
  
  &-content {
    pointer-events: none;
  }
  
  &-icon {
    font-size: 4rem;
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
    display: block;
  }
  
  &-text {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-lg);
    color: var(--color-text);
  }
  
  button {
    pointer-events: all;
  }
}

.upload-info {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  
  p {
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
}

.url-upload {
  margin-top: var(--spacing-lg);
}

.url-input-group {
  display: flex;
  gap: var(--spacing-sm);
  
  @include respond-to('sm') {
    flex-direction: column;
  }
}

.url-input {
  flex: 1;
}

.demo-section {
  margin-top: var(--spacing-lg);
  text-align: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

.error-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius-md);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  i {
    font-size: var(--font-size-lg);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
