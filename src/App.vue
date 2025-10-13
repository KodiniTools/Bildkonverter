<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import StatusBar from '@/components/StatusBar.vue'
import DropZone from '@/components/DropZone.vue'
import ImageGrid from '@/components/ImageGrid.vue'
import LoadingIndicator from '@/components/LoadingIndicator.vue'
import ImageEditor from '@/components/ImageEditor.vue'
import ExportSettingsModal from '@/components/ExportSettingsModal.vue'
import { useImageStore } from '@/stores/imageStore'
import type { ImageObject } from '@/lib/core/types'
import { exportMultipleImagesAsPdf } from '@/lib/features/export-pdf'
import { exportImagesAsZip } from '@/lib/features/export-zip'

const imageStore = useImageStore()
const theme = ref<'light' | 'dark'>('light')

const isEditorOpen = ref(false)
const editingImage = ref<ImageObject | null>(null)

const isExportModalOpen = ref(false)
const exportMode = ref<'pdf-all' | 'pdf-selected' | 'zip' | 'save' | null>(null)

const exportImageCount = computed(() => {
  if (exportMode.value === 'pdf-all' || exportMode.value === 'zip') {
    return imageStore.imageCount
  } else if (exportMode.value === 'pdf-selected' || exportMode.value === 'save') {
    return imageStore.selectedCount
  }
  return 0
})

function openEditor(image: ImageObject) {
  editingImage.value = image
  isEditorOpen.value = true
}

function closeEditor() {
  isEditorOpen.value = false
  editingImage.value = null
}

function saveEditorChanges(image: ImageObject) {
  // Update the image in store which triggers re-render
  imageStore.updateImage(image)
}

// Export-Funktionen
function handleExportPdf(mode: 'all' | 'selected') {
  const images = mode === 'all' 
    ? imageStore.images 
    : imageStore.images.filter(img => img.selected)
  
  if (images.length === 0) {
    alert('Keine Bilder zum Exportieren ausgewählt')
    return
  }

  exportMode.value = mode === 'all' ? 'pdf-all' : 'pdf-selected'
  isExportModalOpen.value = true
}

function handleExportZip() {
  if (imageStore.imageCount === 0) {
    alert('Keine Bilder zum Exportieren vorhanden')
    return
  }

  exportMode.value = 'zip'
  isExportModalOpen.value = true
}

function closeExportModal() {
  isExportModalOpen.value = false
  exportMode.value = null
}

async function handleExportConfirm(settings: any) {
  // KRITISCHER FIX: Export-Modus VORHER speichern, bevor Modal geschlossen wird!
  const currentMode = exportMode.value
  
  closeExportModal()

  try {
    if (currentMode === 'pdf-all' || currentMode === 'pdf-selected') {
      const images = currentMode === 'pdf-all'
        ? imageStore.images
        : imageStore.images.filter(img => img.selected)

      // Kommentarbild zu Base64 konvertieren wenn vorhanden
      let commentImageData = null
      if (settings.includeCommentPage && settings.commentImage) {
        commentImageData = await fileToBase64(settings.commentImage)
      }

      await exportMultipleImagesAsPdf(images, {
        title: settings.title,
        author: settings.author,
        includeTitlePage: settings.includeTitlePage,
        includeCommentPage: settings.includeCommentPage,
        commentText: settings.commentText,
        commentImageData: commentImageData,
        hasCommentImage: !!settings.commentImage,
        includeFileName: settings.includeFileName,
        optimizeSize: settings.optimizeSize,
        orientation: settings.orientation
      })

      console.log(`PDF-Export erfolgreich: ${images.length} Bilder`)
      
    } else if (currentMode === 'zip') {
      await exportImagesAsZip(
        imageStore.images, 
        settings.zipName,
        settings.format,
        settings.quality
      )
      console.log(`ZIP-Export erfolgreich: ${imageStore.imageCount} Bilder`)
      
    } else if (currentMode === 'save') {
      const images = imageStore.images.filter(img => img.selected)
      
      // Einzelne Bilder nacheinander downloaden mit Einstellungen
      for (const image of images) {
        await downloadSingleImage(image, settings.format, settings.quality / 100)
        // Kleine Verzögerung zwischen Downloads
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      console.log(`${images.length} Bilder erfolgreich gespeichert`)
    }
  } catch (error) {
    console.error('Export fehlgeschlagen:', error)
    alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.')
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleSaveImages() {
  const images = imageStore.images.filter(img => img.selected)
  
  if (images.length === 0) {
    alert('Keine Bilder zum Speichern ausgewählt')
    return
  }

  exportMode.value = 'save'
  isExportModalOpen.value = true
}

function downloadSingleImage(image: ImageObject, format?: string, quality?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const exportFormat = format || image.exportFormat || 'png'
      const exportQuality = quality !== undefined ? quality : (image.quality || 0.92)
      const mimeType = `image/${exportFormat === 'jpg' ? 'jpeg' : exportFormat}`
      
      image.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Blob-Konvertierung fehlgeschlagen'))
          return
        }
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // Dateiname mit richtiger Endung
        let fileName = image.outputName || `bild_${Date.now()}`
        if (!fileName.includes('.')) {
          fileName += `.${exportFormat}`
        } else {
          // Endung ersetzen
          fileName = fileName.replace(/\.[^.]+$/, `.${exportFormat}`)
        }
        
        link.download = fileName
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setTimeout(() => {
          URL.revokeObjectURL(url)
          resolve()
        }, 100)
      }, mimeType, exportQuality)
    } catch (error) {
      reject(error)
    }
  })
}

const applyTheme = (newTheme: 'light' | 'dark') => {
  theme.value = newTheme
  document.documentElement.dataset.theme = newTheme
  localStorage.setItem('theme', newTheme)
}

const toggleTheme = () => {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'))
})
</script>

<template>
  <div class="app">
    <AppHeader :theme="theme" @toggle-theme="toggleTheme" />
    
    <main class="container">
      <StatusBar 
        v-if="imageStore.hasImages"
        @export-pdf="handleExportPdf"
        @export-zip="handleExportZip"
        @save-images="handleSaveImages"
      />
      
      <DropZone />
      
      <div v-if="!imageStore.hasImages" class="empty-state">
        <div style="font-size:34px">
          <i class="fa-regular fa-image"></i>
        </div>
        <div>
          <strong>{{ $t('emptyState.title') }}</strong>
          <span>{{ $t('emptyState.text') }}</span>
        </div>
      </div>
      
      <ImageGrid v-else @open-editor="openEditor" />
      
      <section class="faq-section">
        <h2>{{ $t('faq.title') }}</h2>
        
        <div class="privacy-notice">
          <i class="fa-solid fa-shield-halved"></i>
          <div>
            <strong>{{ $t('faq.privacy.title') }}</strong>
            <p>{{ $t('faq.privacy.text') }}</p>
          </div>
        </div>
        
        <div class="faq-list">
          <details v-for="i in 8" :key="i">
            <summary>{{ $t(`faq.q${i}.question`) }}</summary>
            <p v-html="$t(`faq.q${i}.answer`)"></p>
          </details>
        </div>
      </section>
    </main>
    
    <LoadingIndicator />
    
    <ImageEditor
      :image="editingImage"
      :is-open="isEditorOpen"
      @close="closeEditor"
      @save="saveEditorChanges"
    />

    <ExportSettingsModal
      :is-open="isExportModalOpen"
      :mode="exportMode"
      :image-count="exportImageCount"
      @close="closeExportModal"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
  margin-top: var(--space-7);
  flex: 1;
  width: 100%;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: var(--space-4);
  text-align: center;
  color: var(--muted);
  padding: var(--space-6);
  border: 2px dashed color-mix(in oklab, var(--border-color) 40%, transparent);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--panel) 30%, transparent) 0%,
    color-mix(in oklab, var(--panel) 10%, transparent) 100%);
  margin-bottom: var(--space-7);
}

.faq-section {
  margin-top: var(--space-6);
  padding: var(--space-6);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  position: relative;
  overflow: hidden;
}

.faq-section h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: var(--space-5);
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text), var(--accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--accent) 8%, transparent) 0%,
    color-mix(in oklab, var(--green) 6%, transparent) 100%);
  border-radius: var(--radius-2xl);
  border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
  margin-bottom: var(--space-5);
}

.privacy-notice i {
  font-size: 2rem;
  color: var(--accent);
  margin-top: 4px;
}

.privacy-notice strong {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text);
  font-size: 1.1rem;
}

.privacy-notice p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.faq-list details {
  border-bottom: 1px solid var(--glass-border);
  padding: var(--space-4) 0;
  transition: all 0.3s var(--ease-smooth);
}

.faq-list details:first-of-type {
  border-top: 1px solid var(--glass-border);
}

.faq-list summary {
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all 0.3s var(--ease-smooth);
}

.faq-list summary::after {
  content: '+';
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--accent);
  transition: all 0.3s var(--ease-spring);
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in oklab, var(--accent) 10%, transparent);
}

.faq-list details[open] summary::after {
  transform: rotate(45deg);
  background: var(--accent);
  color: white;
}

.faq-list p {
  margin-top: var(--space-4);
  color: var(--muted);
  line-height: 1.7;
  padding-left: var(--space-4);
  border-left: 3px solid color-mix(in oklab, var(--accent) 20%, transparent);
}

@media (max-width: 768px) {
  .container {
    padding: var(--space-4) var(--space-3);
  }
  
  .faq-section {
    padding: var(--space-4);
  }
  
  .privacy-notice {
    flex-direction: column;
    text-align: center;
  }
}
</style>
