<template>
  <div class="gallery-view">
    <header class="gallery-header">
      <h1>{{ $t('gallery.title', 'Galerie') }}</h1>
      <p class="gallery-subtitle">{{ $t('gallery.subtitle', 'Verwalten Sie Ihre Bilder') }}</p>
    </header>

    <!-- Upload & Actions Bar -->
    <div class="actions-bar">
      <div class="left-actions">
        <button class="btn btn-primary" @click="triggerFileInput">
          <i class="fas fa-upload"></i>
          {{ $t('gallery.buttons.upload') }}
        </button>
        <input 
          ref="fileInput" 
          type="file" 
          accept="image/*" 
          multiple
          @change="handleFileSelect"
          style="display: none"
        >
        <button 
          v-if="galleryStore.images.length > 0" 
          class="btn btn-danger-outline" 
          @click="deleteAllImages"
          :title="$t('gallery.tooltips.deleteAll')"
        >
          <i class="fas fa-trash-alt"></i>
          {{ $t('gallery.buttons.deleteAll') }}
        </button>
        <span v-if="galleryStore.images.length > 0" class="image-count">
          {{ galleryStore.images.length }} {{ galleryStore.images.length === 1 ? $t('gallery.imageCount.single') : $t('gallery.imageCount.plural') }}
        </span>
      </div>

      <div class="right-actions" v-if="galleryStore.selectedImage()">
        <button class="btn btn-success" @click="openInEditor">
          <i class="fas fa-edit"></i>
          {{ $t('gallery.buttons.addToEditor') }}
        </button>
        <button class="btn btn-danger" @click="deleteSelected">
          <i class="fas fa-trash"></i>
          {{ $t('gallery.buttons.delete') }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="galleryStore.images.length === 0" class="empty-state">
      <i class="fas fa-images"></i>
      <h3>{{ $t('gallery.empty.title') }}</h3>
      <p>{{ $t('gallery.empty.description') }}</p>
    </div>

    <!-- Gallery Grid -->
    <div v-else class="gallery-grid">
      <div 
        v-for="image in galleryStore.images" 
        :key="image.id"
        class="gallery-item"
        :class="{ selected: galleryStore.selectedImageId === image.id }"
        @click="galleryStore.selectImage(image.id)"
      >
        <!-- Thumbnail -->
        <div class="thumbnail-wrapper">
          <img :src="image.thumbnail" :alt="image.name" class="thumbnail" />
          
          <!-- Selection Checkbox -->
          <div class="selection-indicator">
            <i class="fas" :class="galleryStore.selectedImageId === image.id ? 'fa-check-circle' : 'fa-circle'"></i>
          </div>

          <!-- Preview Button -->
          <button 
            class="preview-btn" 
            @click.stop="openPreview(image)"
            :title="$t('gallery.buttons.preview')"
          >
            <i class="fas fa-search-plus"></i>
          </button>
        </div>

        <!-- Image Info -->
        <div class="image-info">
          <div class="image-name" :title="image.name">{{ image.name }}</div>
          <div class="image-meta">
            <span>{{ image.width }} × {{ image.height }}px</span>
            <span>{{ formatSize(image.size) }}</span>
          </div>
          <div class="image-date">{{ formatDate(image.uploadedAt) }}</div>
        </div>
      </div>
    </div>

    <!-- Preview Overlay -->
    <Teleport to="body">
      <div v-if="previewImage" class="preview-overlay" @click="closePreview">
        <div class="preview-content" @click.stop>
          <button class="preview-close" @click="closePreview">
            <i class="fas fa-times"></i>
          </button>

          <div class="preview-image-container">
            <img :src="previewImage.url" :alt="previewImage.name" />
          </div>

          <div class="preview-info">
            <h3>{{ previewImage.name }}</h3>
            <div class="preview-meta">
              <span><i class="fas fa-ruler-combined"></i> {{ previewImage.width }} × {{ previewImage.height }}px</span>
              <span><i class="fas fa-file"></i> {{ formatSize(previewImage.size) }}</span>
              <span><i class="fas fa-calendar"></i> {{ formatDate(previewImage.uploadedAt) }}</span>
            </div>
          </div>

          <div class="preview-actions">
            <button class="btn btn-success" @click="openPreviewInEditor">
              <i class="fas fa-edit"></i>
              Zum Editor hinzufügen
            </button>
            <button class="btn btn-secondary" @click="downloadImage(previewImage)">
              <i class="fas fa-download"></i>
              Herunterladen
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGalleryStore } from '@/stores/galleryStore'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const galleryStore = useGalleryStore()

// Refs
const fileInput = ref(null)
const previewImage = ref(null)

// Methods
function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  console.log(`Lade ${files.length} Datei(en) hoch...`)

  for (const file of files) {
    try {
      await addImageToGallery(file)
    } catch (error) {
      console.error(`Fehler beim Laden von ${file.name}:`, error)
      alert(t('gallery.uploadError', { name: file.name }) + ': ' + error.message)
    }
  }

  // Reset input
  event.target.value = ''
}

async function addImageToGallery(file) {
  return new Promise((resolve, reject) => {
    // Validierung
    if (!file.type.startsWith('image/')) {
      reject(new Error('Datei ist kein Bild'))
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      reject(new Error('Datei zu groß (max. 50MB)'))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Erstelle Thumbnail
        const thumbnailUrl = createThumbnail(img, 300, 300)
        
        // Erstelle Galerie-Eintrag
        const imageEntry = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: e.target.result,
          thumbnail: thumbnailUrl,
          width: img.width,
          height: img.height,
          size: file.size,
          uploadedAt: new Date(),
          file: file
        }

        galleryStore.addImage(imageEntry)
        resolve(imageEntry)
      }

      img.onerror = () => {
        reject(new Error('Fehler beim Laden des Bildes'))
      }

      img.src = e.target.result
    }

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'))
    }

    reader.readAsDataURL(file)
  })
}

function createThumbnail(img, maxWidth, maxHeight) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let width = img.width
  let height = img.height

  // Berechne neue Dimensionen
  const ratio = Math.min(maxWidth / width, maxHeight / height)
  width *= ratio
  height *= ratio

  canvas.width = width
  canvas.height = height

  // Zeichne Bild
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.8)
}

function openPreview(image) {
  previewImage.value = image
}

function closePreview() {
  previewImage.value = null
}

async function openInEditor() {
  const selected = galleryStore.selectedImage()
  if (!selected) return

  try {
    // Navigiere zum Editor und übergebe die Bild-ID via Route-Parameter
    await router.push({
      path: '/editor',
      query: { galleryImageId: selected.id }
    })
    
    console.log('✅ Navigation zum Editor')
  } catch (error) {
    console.error('Fehler beim Öffnen im Editor:', error)
    alert('Fehler beim Öffnen im Editor: ' + error.message)
  }
}

async function openPreviewInEditor() {
  if (!previewImage.value) return

  try {
    await router.push({
      path: '/editor',
      query: { galleryImageId: previewImage.value.id }
    })
    closePreview()
  } catch (error) {
    console.error('Fehler beim Öffnen im Editor:', error)
    alert('Fehler beim Öffnen im Editor: ' + error.message)
  }
}

function deleteSelected() {
  const selected = galleryStore.selectedImage()
  if (!selected) return

  const confirmDelete = confirm(t('gallery.confirmDelete', { name: selected.name }))
  if (!confirmDelete) return

  galleryStore.removeImage(selected.id)
}

function deleteAllImages() {
  const imageCount = galleryStore.images.length
  if (imageCount === 0) return

  // i18n für Bestätigungsdialog
  const imageWord = imageCount === 1 
    ? t('gallery.imageCount.single') 
    : t('gallery.imageCount.plural')
  
  const confirmMessage = t('gallery.confirmDeleteAll', {
    count: imageCount,
    images: imageWord
  })
  
  const confirmDelete = confirm(confirmMessage)
  if (!confirmDelete) return

  // Lösche alle Bilder durch Iteration (rückwärts um Index-Probleme zu vermeiden)
  const imageIds = galleryStore.images.map(img => img.id)
  imageIds.forEach(id => {
    galleryStore.removeImage(id)
  })

  // Erfolgs-Log mit i18n
  console.log(t('gallery.deleteSuccess', {
    count: imageCount,
    images: imageWord
  }))
}

function downloadImage(image) {
  const link = document.createElement('a')
  link.href = image.url
  link.download = image.name
  link.click()
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style lang="scss" scoped>
.gallery-view {
  padding: 2rem;
  min-height: 100vh;
}

.gallery-header {
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .gallery-subtitle {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  gap: 1rem;

  .left-actions,
  .right-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .image-count {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  
  i {
    font-size: 5rem;
    color: var(--color-primary);
    opacity: 0.3;
    margin-bottom: 1.5rem;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--color-text-secondary);
    margin-bottom: 0;
  }
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  max-height: 640px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  /* Schöne Scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 10px;
    transition: background 0.3s ease;
    
    &:hover {
      background: var(--color-primary-dark, #3b82f6);
    }
  }
  
  /* Firefox Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) var(--color-bg-secondary);
}

.gallery-item {
  background: var(--color-bg-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    border-color: var(--color-primary);
  }

  &.selected {
    border-color: var(--color-success);
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);

    .selection-indicator i {
      color: var(--color-success);
    }
  }
}

.thumbnail-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  background: var(--color-bg);
  overflow: hidden;

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .selection-indicator {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    i {
      color: white;
      font-size: 1.2rem;
    }
  }

  .preview-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-primary);
      transform: scale(1.1);
    }
  }

  &:hover .preview-btn {
    opacity: 1;
  }
}

.image-info {
  padding: 1rem;

  .image-name {
    font-weight: 600;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
  }

  .image-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
}

// Preview Overlay
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
}

.preview-content {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-danger);
    transform: scale(1.1);
  }
}

.preview-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: auto;

  img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 8px;
  }
}

.preview-info {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);

  h3 {
    margin: 0 0 1rem 0;
  }

  .preview-meta {
    display: flex;
    gap: 2rem;
    font-size: 0.9rem;
    color: var(--color-text-secondary);

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        opacity: 0.7;
      }
    }
  }
}

.preview-actions {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  border-top: 1px solid var(--color-border);
}

// Zusätzlicher Button-Style für "Alle löschen"
.btn-danger-outline {
  background: transparent;
  color: var(--color-danger);
  border: 2px solid var(--color-danger);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  i {
    font-size: 1rem;
  }

  &:hover {
    background: var(--color-danger);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    max-height: 500px; // Kleinere Höhe für mobile Geräte
  }

  .actions-bar {
    flex-direction: column;
    align-items: stretch;

    .left-actions,
    .right-actions {
      justify-content: center;
    }
  }

  .preview-meta {
    flex-direction: column;
    gap: 0.5rem !important;
  }
}
</style>
