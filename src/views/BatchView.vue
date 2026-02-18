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
        accept="image/*,.tiff,.tif,.heic,.heif"
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
            <option value="tiff">TIFF</option>
            <option value="pdf">PDF</option>
            <option value="svg">SVG</option>
          </select>
        </div>

        <!-- PDF Options: shown when PDF format is selected -->
        <div v-if="settings.format === 'pdf'" class="setting-group">
          <label>{{ $t('batch.settings.pdfMode') }}</label>
          <div class="pdf-mode-options">
            <label class="radio-label">
              <input v-model="settings.pdfMode" type="radio" value="single" />
              {{ $t('batch.settings.pdfModeSingle') }}
            </label>
            <label class="radio-label">
              <input v-model="settings.pdfMode" type="radio" value="merged" />
              {{ $t('batch.settings.pdfModeMerged') }}
            </label>
          </div>
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
              @input="onWidthInput"
            />
            <span>×</span>
            <input
              v-model.number="settings.height"
              type="number"
              :placeholder="$t('batch.settings.height')"
              min="1"
              @input="onHeightInput"
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
          :disabled="isProcessing || !hasConvertableFiles"
          @click="startProcessing"
        >
          <i class="fas fa-play"></i>
          {{ isProcessing ? $t('batch.processing') : (hasCompletedFiles ? $t('batch.reconvert') : $t('batch.start')) }}
        </button>

        <button
          class="btn btn-download"
          :class="{ 'btn-download-ready': downloadReady }"
          :disabled="isProcessing || processedFiles.length === 0"
          @click="downloadAll"
        >
          <i class="fas fa-download"></i>
          {{ $t('batch.downloadAll') }}
        </button>

        <button
          class="btn btn-zip"
          :class="{ 'btn-zip-ready': downloadReady }"
          :disabled="isProcessing || processedFiles.length === 0"
          @click="downloadAsZip"
        >
          <i class="fas fa-file-archive"></i>
          {{ $t('batch.downloadZip') }}
        </button>

        <button
          class="btn btn-danger"
          :disabled="isProcessing"
          @click="clearAll"
        >
          <i class="fas fa-trash"></i>
          {{ $t('batch.clearAll') }}
        </button>

        <button
          v-if="hasCompletedFiles"
          class="btn btn-secondary"
          :disabled="isProcessing"
          @click="resetConversion"
        >
          <i class="fas fa-undo"></i>
          {{ $t('batch.resetConversion') }}
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
              <template v-if="file.status === 'completed' && file.processedSize">
                <br />→ {{ formatSize(file.processedSize) }} ({{ settings.format.toUpperCase() }})
              </template>
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FORMAT_INFO } from '@/utils/exportUtils'
import { ApiClient } from '@/api/api'

const { t } = useI18n({ useScope: 'global' })

// State
const fileInput = ref(null)
const isDragging = ref(false)
const files = ref([])
const processedFiles = ref([])
const isProcessing = ref(false)
const previewingFile = ref(null)
const downloadReady = ref(false)

const settings = ref({
  format: 'jpg',
  quality: 80,
  width: null,
  height: null,
  maintainAspect: true,
  prefix: '',
  pdfMode: 'single' // 'single' = each image as individual PDF, 'merged' = all in one PDF
})

// Computed: check if there are files that can be converted
const hasConvertableFiles = computed(() => {
  return files.value.some(f => f.status !== 'completed')
})

const hasCompletedFiles = computed(() => {
  return files.value.some(f => f.status === 'completed')
})

// Aspect ratio: use the first uploaded image as reference
const referenceAspectRatio = ref(null)
const isUpdatingDimension = ref(false)

function onWidthInput() {
  if (!settings.value.maintainAspect || isUpdatingDimension.value) return
  if (!settings.value.width || !referenceAspectRatio.value) return
  isUpdatingDimension.value = true
  settings.value.height = Math.max(1, Math.round(settings.value.width / referenceAspectRatio.value))
  isUpdatingDimension.value = false
}

function onHeightInput() {
  if (!settings.value.maintainAspect || isUpdatingDimension.value) return
  if (!settings.value.height || !referenceAspectRatio.value) return
  isUpdatingDimension.value = true
  settings.value.width = Math.max(1, Math.round(settings.value.height * referenceAspectRatio.value))
  isUpdatingDimension.value = false
}

// When maintainAspect is toggled on, recalculate height from current width
watch(() => settings.value.maintainAspect, (newVal) => {
  if (newVal && settings.value.width && referenceAspectRatio.value) {
    settings.value.height = Math.max(1, Math.round(settings.value.width / referenceAspectRatio.value))
  }
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

/**
 * Checks if a file format cannot be displayed natively in the browser
 */
function needsBackendPreview(file) {
  const unsupportedTypes = ['image/tiff', 'image/heic', 'image/heif']
  if (unsupportedTypes.includes(file.type)) return true
  return /\.(tiff?|heic|heif)$/i.test(file.name)
}

function isImageFile(file) {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg|tiff?|heic|heif)$/i.test(file.name)
}

async function addFiles(fileList) {
  const imageFiles = fileList.filter(f => isImageFile(f))

  if (imageFiles.length === 0) {
    window.$toast?.warning(t('toast.batch.noImages'))
    return
  }

  for (const file of imageFiles) {
    let preview
    if (needsBackendPreview(file)) {
      // Browser can't display TIFF/HEIC – convert to PNG via backend for preview
      const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {})
      preview = URL.createObjectURL(pngBlob)
    } else {
      preview = await createPreview(file)
    }
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
      processedBlob: null,
      processedSize: 0,
      error: null
    })
  }

  // Set reference aspect ratio from first image for maintain-aspect-ratio calculations
  if (!referenceAspectRatio.value && files.value.length > 0) {
    const first = files.value[0]
    if (first.width && first.height) {
      referenceAspectRatio.value = first.width / first.height
    }
  }

  window.$toast?.success(t('toast.batch.filesAdded', { count: imageFiles.length }))
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
  downloadReady.value = false

  // Reset all files to pending for re-conversion support (Schritt 4)
  files.value.forEach(f => {
    f.status = 'pending'
    f.progress = 0
    if (f.processedPreview && f.processedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(f.processedPreview)
    }
    f.processedBlob = null
    f.processedPreview = null
    f.processedSize = 0
    f.error = null
  })
  processedFiles.value = []

  const pendingFiles = files.value.filter(f => f.status !== 'completed')
  window.$toast?.info(t('toast.batch.processingStarted', { count: pendingFiles.length }))

  let errorCount = 0

  // For merged PDF mode, collect canvases first
  const isMergedPdf = settings.value.format === 'pdf' && settings.value.pdfMode === 'merged'
  const canvasesForMerge = []

  for (const file of files.value) {
    file.status = 'processing'
    file.progress = 0

    try {
      if (isMergedPdf) {
        // Prepare canvas but don't convert to PDF yet
        const canvas = await prepareCanvas(file)
        canvasesForMerge.push({ file, canvas })
        file.status = 'completed'
        file.progress = 100
      } else {
        await processFile(file)
        file.status = 'completed'
        file.progress = 100
        processedFiles.value.push(file)
      }
    } catch (error) {
      file.status = 'error'
      file.error = error.message
      errorCount++
      window.$toast?.error(t('toast.batch.fileError', { name: file.name, error: error.message }))
    }
  }

  // Merged PDF: combine all canvases into a single PDF
  if (isMergedPdf && canvasesForMerge.length > 0) {
    try {
      const mergedBlob = await convertToMergedPDF(canvasesForMerge.map(c => c.canvas))
      // Store the merged PDF in a virtual "merged" entry and in each file for download
      const mergedFile = {
        id: 'merged-pdf',
        name: t('batch.mergedPdfFilename'),
        processedBlob: mergedBlob,
        processedSize: mergedBlob.size,
        processedPreview: null,
        isMerged: true
      }
      processedFiles.value = [mergedFile]

      // Also set individual files as completed with reference to merged
      canvasesForMerge.forEach(({ file }) => {
        file.processedBlob = mergedBlob
        file.processedSize = mergedBlob.size
        file.processedPreview = file.preview
      })
    } catch (error) {
      window.$toast?.error(t('toast.batch.fileError', { name: 'PDF', error: error.message }))
      errorCount++
    }
  }

  isProcessing.value = false
  downloadReady.value = processedFiles.value.length > 0

  // Summary toast
  const successCount = isMergedPdf ? canvasesForMerge.length : processedFiles.value.length
  const totalCount = pendingFiles.length
  if (errorCount === 0) {
    window.$toast?.success(t('toast.batch.processingCompleteAll', { count: successCount }))
  } else {
    window.$toast?.warning(t('toast.batch.processingComplete', { success: successCount, total: totalCount }))
  }
}

/**
 * Loads an image element from a data URL
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = src
  })
}

/**
 * Converts a canvas to a Blob
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas-zu-Blob-Konvertierung fehlgeschlagen'))
      },
      mimeType,
      quality
    )
  })
}

/**
 * Prepares a canvas for a file (used in merged PDF mode)
 */
async function prepareCanvas(file) {
  const format = settings.value.format
  const targetWidth = settings.value.width
  const targetHeight = settings.value.height
  const maintainAspect = settings.value.maintainAspect

  file.progress = 10
  const img = await loadImage(file.preview)
  file.progress = 30

  let drawWidth = img.width
  let drawHeight = img.height

  if (targetWidth || targetHeight) {
    if (targetWidth && targetHeight && !maintainAspect) {
      drawWidth = targetWidth
      drawHeight = targetHeight
    } else if (targetWidth && targetHeight) {
      const ratio = Math.min(targetWidth / img.width, targetHeight / img.height)
      drawWidth = Math.round(img.width * ratio)
      drawHeight = Math.round(img.height * ratio)
    } else if (targetWidth) {
      const ratio = targetWidth / img.width
      drawWidth = targetWidth
      drawHeight = maintainAspect ? Math.round(img.height * ratio) : img.height
    } else if (targetHeight) {
      const ratio = targetHeight / img.height
      drawHeight = targetHeight
      drawWidth = maintainAspect ? Math.round(img.width * ratio) : img.width
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = drawWidth
  canvas.height = drawHeight
  const ctx = canvas.getContext('2d')

  if (format === 'jpg' || format === 'bmp' || format === 'pdf') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, drawWidth, drawHeight)
  }

  ctx.drawImage(img, 0, 0, drawWidth, drawHeight)
  file.progress = 80
  file.processedPreview = file.preview
  return canvas
}

/**
 * Converts multiple canvases into a single merged PDF (one image per page)
 */
async function convertToMergedPDF(canvases) {
  const { jsPDF } = await import('jspdf')
  const a4Width = 210
  const a4Height = 297

  let pdf = null

  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i]
    const aspectRatio = canvas.width / canvas.height
    let orientation, width, height, x, y

    if (aspectRatio > 1) {
      orientation = 'landscape'
      width = a4Height - 20
      height = width / aspectRatio
      x = 10
      y = (a4Width - height) / 2
    } else {
      orientation = 'portrait'
      width = a4Width - 20
      height = width / aspectRatio
      x = 10
      y = (a4Height - height) / 2
      if (height > a4Height - 20) {
        height = a4Height - 20
        width = height * aspectRatio
        x = (a4Width - width) / 2
        y = 10
      }
    }

    if (i === 0) {
      pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })
    } else {
      pdf.addPage('a4', orientation)
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', x, y, width, height, undefined, 'FAST')
  }

  return pdf.output('blob')
}

/**
 * Converts canvas to PDF using jsPDF (dynamic import)
 */
async function convertToPDF(canvas) {
  const { jsPDF } = await import('jspdf')
  const aspectRatio = canvas.width / canvas.height
  const a4Width = 210
  const a4Height = 297
  let orientation, width, height, x, y

  if (aspectRatio > 1) {
    orientation = 'landscape'
    width = a4Height - 20
    height = width / aspectRatio
    x = 10
    y = (a4Width - height) / 2
  } else {
    orientation = 'portrait'
    width = a4Width - 20
    height = width / aspectRatio
    x = 10
    y = (a4Height - height) / 2
    if (height > a4Height - 20) {
      height = a4Height - 20
      width = height * aspectRatio
      x = (a4Width - width) / 2
      y = 10
    }
  }

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  pdf.addImage(imgData, 'JPEG', x, y, width, height, undefined, 'FAST')
  return pdf.output('blob')
}

/**
 * Converts canvas to SVG (backend vectorization with client fallback)
 */
async function convertToSVG(canvas, filename) {
  // Try backend vectorization first
  try {
    const sourceBlob = await canvasToBlob(canvas, 'image/png', 1)
    const svgBlob = await ApiClient.convertImage(sourceBlob, 'svg', filename, {})
    if (svgBlob && svgBlob.size > 0) {
      return svgBlob
    }
  } catch (error) {
    console.warn('Backend-SVG nicht verfügbar, verwende Client-Fallback:', error.message)
  }

  // Fallback: SVG wrapper with embedded raster
  const dataURL = canvas.toDataURL('image/png')
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}"
     viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`
  return new Blob([svgContent], { type: 'image/svg+xml' })
}

/**
 * Real image conversion using Canvas API
 */
async function processFile(file) {
  const format = settings.value.format
  const quality = settings.value.quality / 100
  const targetWidth = settings.value.width
  const targetHeight = settings.value.height
  const maintainAspect = settings.value.maintainAspect

  file.progress = 10

  // Load source image onto canvas
  const img = await loadImage(file.preview)
  file.progress = 30

  // Calculate target dimensions
  let drawWidth = img.width
  let drawHeight = img.height

  if (targetWidth || targetHeight) {
    if (targetWidth && targetHeight && !maintainAspect) {
      drawWidth = targetWidth
      drawHeight = targetHeight
    } else if (targetWidth && targetHeight) {
      // Maintain aspect ratio, fit within the given bounds
      const ratio = Math.min(targetWidth / img.width, targetHeight / img.height)
      drawWidth = Math.round(img.width * ratio)
      drawHeight = Math.round(img.height * ratio)
    } else if (targetWidth) {
      const ratio = targetWidth / img.width
      drawWidth = targetWidth
      drawHeight = maintainAspect ? Math.round(img.height * ratio) : img.height
    } else if (targetHeight) {
      const ratio = targetHeight / img.height
      drawHeight = targetHeight
      drawWidth = maintainAspect ? Math.round(img.width * ratio) : img.width
    }
  }

  // Create canvas with target dimensions
  const canvas = document.createElement('canvas')
  canvas.width = drawWidth
  canvas.height = drawHeight
  const ctx = canvas.getContext('2d')

  // For JPEG/BMP/PDF: add white background (no transparency support)
  if (format === 'jpg' || format === 'bmp' || format === 'pdf') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, drawWidth, drawHeight)
  }

  // Draw the image
  ctx.drawImage(img, 0, 0, drawWidth, drawHeight)
  file.progress = 60

  // Format-specific conversion
  if (format === 'pdf') {
    // PDF conversion via jsPDF
    const blob = await convertToPDF(canvas)
    file.progress = 90
    file.processedBlob = blob
    file.processedSize = blob.size
    file.processedPreview = file.preview // Use original preview for PDF
  } else if (format === 'svg') {
    // SVG conversion (backend vectorization with client fallback)
    const blob = await convertToSVG(canvas, file.name)
    file.progress = 90
    file.processedBlob = blob
    file.processedSize = blob.size
    file.processedPreview = URL.createObjectURL(blob)
  } else {
    // Get format info
    const formatInfo = FORMAT_INFO[format]

    // Check if backend format is needed
    if (formatInfo && formatInfo.requiresBackend) {
      // Backend-based conversion (TIFF, GIF, HEIF)
      const sourceBlob = await canvasToBlob(canvas, 'image/png', 1)
      file.progress = 70
      const convertedBlob = await ApiClient.convertImage(sourceBlob, format, file.name, { quality })
      file.progress = 90

      file.processedBlob = convertedBlob
      file.processedSize = convertedBlob.size
      file.processedPreview = URL.createObjectURL(convertedBlob)
    } else {
      // Client-side conversion (PNG, JPG, WebP, BMP)
      let mimeType = 'image/png'
      if (format === 'jpg') mimeType = 'image/jpeg'
      else if (format === 'webp') mimeType = 'image/webp'
      else if (format === 'bmp') mimeType = 'image/bmp'

      const useQuality = (format === 'jpg' || format === 'webp') ? quality : undefined
      const blob = await canvasToBlob(canvas, mimeType, useQuality)
      file.progress = 90

      file.processedBlob = blob
      file.processedSize = blob.size
      file.processedPreview = URL.createObjectURL(blob)
    }
  }

  file.progress = 100
}

function removeFile(fileId) {
  const file = files.value.find(f => f.id === fileId)
  if (!file) return
  const fileName = file.name
  if (file.processedPreview && file.processedPreview.startsWith('blob:')) {
    URL.revokeObjectURL(file.processedPreview)
  }
  const index = files.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    files.value.splice(index, 1)
  }
  window.$toast?.info(t('toast.batch.fileRemoved', { name: fileName }))
}

function clearAll() {
  if (confirm(t('batch.confirmClear'))) {
    // Revoke all blob URLs
    files.value.forEach(f => {
      if (f.processedPreview && f.processedPreview.startsWith('blob:')) {
        URL.revokeObjectURL(f.processedPreview)
      }
    })
    files.value = []
    processedFiles.value = []
    referenceAspectRatio.value = null
    window.$toast?.info(t('toast.batch.cleared'))
  }
}

function getOutputFilename(file) {
  const prefix = settings.value.prefix || ''
  const format = settings.value.format
  const ext = FORMAT_INFO[format]?.extension || format
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return `${prefix}${baseName}.${ext}`
}

function downloadFile(file, showToast = true) {
  if (!file.processedBlob) return

  const url = URL.createObjectURL(file.processedBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.isMerged ? (settings.value.prefix || '') + 'merged.pdf' : getOutputFilename(file)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  // Reset download button color after download (Schritt 3)
  downloadReady.value = false

  if (showToast) {
    window.$toast?.success(t('toast.batch.downloadStarted'))
  }
}

function downloadAll() {
  const isMergedPdf = settings.value.format === 'pdf' && settings.value.pdfMode === 'merged'

  if (isMergedPdf && processedFiles.value.length === 1 && processedFiles.value[0].isMerged) {
    // Download the single merged PDF
    downloadFile(processedFiles.value[0])
    return
  }

  window.$toast?.info(t('toast.batch.downloadAllStarted', { count: processedFiles.value.length }))
  processedFiles.value.forEach((file, index) => {
    setTimeout(() => downloadFile(file, false), index * 200)
  })

  // Reset download button color after download (Schritt 3)
  downloadReady.value = false
}

/**
 * Downloads all processed files as a ZIP archive (Schritt 2)
 */
async function downloadAsZip() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  const isMergedPdf = settings.value.format === 'pdf' && settings.value.pdfMode === 'merged'

  if (isMergedPdf && processedFiles.value.length === 1 && processedFiles.value[0].isMerged) {
    zip.file((settings.value.prefix || '') + 'merged.pdf', processedFiles.value[0].processedBlob)
  } else {
    for (const file of processedFiles.value) {
      if (file.processedBlob) {
        const filename = file.isMerged ? (settings.value.prefix || '') + 'merged.pdf' : getOutputFilename(file)
        zip.file(filename, file.processedBlob)
      }
    }
  }

  window.$toast?.info(t('toast.batch.zipCreating'))

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = (settings.value.prefix || 'batch_') + 'images.zip'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  // Reset download button color after download (Schritt 3)
  downloadReady.value = false

  window.$toast?.success(t('toast.batch.zipDownloaded'))
}

/**
 * Resets conversion state but keeps uploaded files (Schritt 5)
 */
function resetConversion() {
  files.value.forEach(f => {
    if (f.processedPreview && f.processedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(f.processedPreview)
    }
    f.status = 'pending'
    f.progress = 0
    f.processedBlob = null
    f.processedPreview = null
    f.processedSize = 0
    f.error = null
  })
  processedFiles.value = []
  downloadReady.value = false
  window.$toast?.info(t('toast.batch.conversionReset'))
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

.pdf-mode-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-sm);

  input[type="radio"] {
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

.btn-download,
.btn-zip {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  transition: all 0.3s ease;
}

.btn-download-ready,
.btn-zip-ready {
  background: #28a745 !important;
  border-color: #28a745 !important;
  color: white !important;
  animation: pulse-green 1s ease-in-out 2;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(40, 167, 69, 0); }
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

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .batch-view {
    padding: var(--spacing-md);
  }

  .batch-header {
    margin-bottom: var(--spacing-lg);

    h1 {
      font-size: 1.8rem;
    }

    .batch-subtitle {
      font-size: 1rem;
    }
  }

  .upload-zone {
    padding: var(--spacing-xl);

    i {
      font-size: 2.5rem;
    }

    h3 {
      font-size: 1.2rem;
    }
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    button {
      min-width: 0;
      font-size: 0.85rem;
    }
  }

  .progress-summary .progress-bar {
    width: 120px;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }

  .remove-btn {
    width: 44px;
    height: 44px;

    i {
      font-size: 1rem;
    }
  }

  .btn-icon {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-modal {
    padding: var(--spacing-sm);
  }

  .modal-content {
    padding: var(--spacing-md);
    max-width: 95vw;
  }
}

@media (max-width: 480px) {
  .batch-header h1 {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;

    button {
      width: 100%;
    }
  }

  .files-grid {
    grid-template-columns: 1fr;
  }

  .progress-summary .progress-bar {
    width: 80px;
  }
}
</style>
