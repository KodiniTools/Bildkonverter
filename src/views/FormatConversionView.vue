<template>
  <div class="format-conversion-view">
    <section class="conversion-hero">
      <h1>{{ $t(`conversion.${pair}.title`) }}</h1>
      <p class="hero-description">{{ $t(`conversion.${pair}.description`) }}</p>
    </section>

    <!-- Conversion Tool Widget -->
    <section class="converter-widget">
      <div class="widget-container">
        <!-- Upload State -->
        <div
          v-if="!sourceFile"
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
            accept="image/*"
            @change="handleFileSelect"
            style="display: none"
          />
          <i class="fas fa-cloud-upload-alt"></i>
          <h3>{{ $t(`conversion.${pair}.cta`) }}</h3>
          <p>{{ conversionData.from }}-{{ $t('conversion.widget.dropHint') }}</p>
          <span class="upload-formats">{{ conversionData.from }} → {{ conversionData.to }}</span>
        </div>

        <!-- Processing State -->
        <div v-else-if="isConverting" class="processing-state">
          <div class="spinner-large"></div>
          <p>{{ $t('conversion.widget.converting') }}</p>
          <p class="processing-detail">{{ conversionData.from }} → {{ conversionData.to }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="conversionError" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ conversionError }}</p>
          <button class="btn btn-primary" @click="resetConverter">
            {{ $t('conversion.widget.tryAgain') }}
          </button>
        </div>

        <!-- Result State -->
        <div v-else-if="convertedUrl" class="result-state">
          <div class="result-preview">
            <div class="preview-comparison">
              <div class="preview-item">
                <span class="preview-label">{{ conversionData.from }}</span>
                <img :src="sourcePreview" :alt="sourceFile.name" />
                <span class="preview-size">{{ formatSize(sourceFile.size) }}</span>
              </div>
              <div class="preview-arrow">
                <i class="fas fa-arrow-right"></i>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ conversionData.to }}</span>
                <img :src="convertedUrl" :alt="outputFilename" />
                <span class="preview-size">{{ formatSize(convertedSize) }}</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn btn-primary btn-large" @click="downloadResult">
              <i class="fas fa-download"></i>
              {{ $t('conversion.widget.download') }} ({{ conversionData.to }})
            </button>
            <button class="btn btn-secondary btn-large" @click="resetConverter">
              <i class="fas fa-redo"></i>
              {{ $t('conversion.widget.convertAnother') }}
            </button>
          </div>
        </div>
      </div>

      <div class="widget-footer">
        <router-link :to="{ name: 'batch' }" class="batch-link">
          <i class="fas fa-images"></i>
          {{ $t('conversion.batchCta') }}
        </router-link>
      </div>
    </section>

    <section class="info-section">
      <div class="info-grid">
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-bolt"></i></div>
          <h3>{{ $t('conversion.benefits.fast.title') }}</h3>
          <p>{{ $t('conversion.benefits.fast.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-shield-alt"></i></div>
          <h3>{{ $t('conversion.benefits.privacy.title') }}</h3>
          <p>{{ $t('conversion.benefits.privacy.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-check-circle"></i></div>
          <h3>{{ $t('conversion.benefits.quality.title') }}</h3>
          <p>{{ $t('conversion.benefits.quality.description') }}</p>
        </div>
      </div>
    </section>

    <section class="format-details">
      <h2>{{ $t(`conversion.${pair}.whyTitle`) }}</h2>
      <div class="format-comparison">
        <div class="format-box source">
          <h3>{{ conversionData.from }}</h3>
          <p>{{ $t(`conversion.formats.${conversionData.from.toLowerCase()}.info`) }}</p>
        </div>
        <div class="conversion-arrow">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="format-box target">
          <h3>{{ conversionData.to }}</h3>
          <p>{{ $t(`conversion.formats.${conversionData.to.toLowerCase()}.info`) }}</p>
        </div>
      </div>
      <p class="advantage-text">{{ $t(`conversion.${pair}.advantage`) }}</p>
    </section>

    <section class="steps-section">
      <h2>{{ $t('conversion.howTo.title') }}</h2>
      <div class="steps-grid">
        <div class="step">
          <div class="step-number">1</div>
          <h3>{{ $t('conversion.howTo.step1.title') }}</h3>
          <p>{{ $t('conversion.howTo.step1.description') }}</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>{{ $t('conversion.howTo.step2.title') }}</h3>
          <p>{{ $t('conversion.howTo.step2.description') }}</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>{{ $t('conversion.howTo.step3.title') }}</h3>
          <p>{{ $t('conversion.howTo.step3.description') }}</p>
        </div>
      </div>
    </section>

    <section class="other-conversions">
      <h2>{{ $t('conversion.otherFormats.title') }}</h2>
      <div class="conversion-links">
        <router-link
          v-for="conv in otherConversions"
          :key="conv.pair"
          :to="{ name: 'format-conversion', params: { pair: conv.pair } }"
          class="conversion-link"
        >
          {{ conv.from }} &rarr; {{ conv.to }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatConversions } from '@/router/index.js'
import { FORMAT_INFO } from '@/utils/exportUtils'
import { ApiClient } from '@/api/api'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  pair: {
    type: String,
    required: true
  }
})

const conversionData = computed(() => {
  return formatConversions.find(f => f.pair === props.pair) || { from: '', to: '' }
})

const otherConversions = computed(() => {
  return formatConversions.filter(f => f.pair !== props.pair).slice(0, 6)
})

// Converter widget state
const fileInput = ref(null)
const isDragging = ref(false)
const sourceFile = ref(null)
const sourcePreview = ref(null)
const isConverting = ref(false)
const conversionError = ref(null)
const convertedUrl = ref(null)
const convertedBlob = ref(null)
const convertedSize = ref(0)

// Map format names to export keys
const FORMAT_MAP = {
  JPG: 'jpg',
  JPEG: 'jpg',
  PNG: 'png',
  WebP: 'webp',
  WEBP: 'webp',
  TIFF: 'tiff',
  GIF: 'gif',
  BMP: 'bmp',
  HEIC: 'heic',
  HEIF: 'heif',
  SVG: 'svg',
  PDF: 'pdf'
}

const outputFormat = computed(() => {
  return FORMAT_MAP[conversionData.value.to] || 'png'
})

// Extension map for special formats not in FORMAT_INFO
const EXT_MAP = { jpg: 'jpg', png: 'png', webp: 'webp', bmp: 'bmp', tiff: 'tiff', gif: 'gif', heic: 'heic', heif: 'heif', pdf: 'pdf', svg: 'svg' }

const outputFilename = computed(() => {
  if (!sourceFile.value) return ''
  const baseName = sourceFile.value.name.replace(/\.[^.]+$/, '')
  const fmt = outputFormat.value
  const ext = FORMAT_INFO[fmt]?.extension || EXT_MAP[fmt] || fmt
  return `${baseName}.${ext}`
})

// Reset when pair changes (navigation between conversion pages)
watch(() => props.pair, () => {
  resetConverter()
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) startConversion(file)
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    startConversion(file)
  } else if (file) {
    window.$toast?.warning(t('toast.batch.noImages'))
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = src
  })
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Konvertierung fehlgeschlagen'))
      },
      mimeType,
      quality
    )
  })
}

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

/**
 * Converts an image to PDF using jsPDF (dynamic import)
 */
async function convertToPDF(canvas, img) {
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
 * Converts raster image to SVG.
 * Tries backend vectorization (potrace/vtracer) first,
 * falls back to SVG wrapper with embedded raster image.
 */
async function convertToSVG(canvas, filename) {
  // Try backend vectorization first
  try {
    const sourceBlob = await canvasToBlob(canvas, 'image/png', 1)
    const svgBlob = await ApiClient.convertImage(sourceBlob, 'svg', filename, {})
    // Verify we got valid SVG back
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
 * Checks if a file format cannot be displayed natively in the browser
 */
function needsBackendPreview(file) {
  const unsupportedTypes = ['image/tiff', 'image/heic', 'image/heif']
  if (unsupportedTypes.includes(file.type)) return true
  // Fallback: check extension (some OS don't set MIME correctly)
  return /\.(tiff?|heic|heif)$/i.test(file.name)
}

async function startConversion(file) {
  sourceFile.value = file
  isConverting.value = true
  conversionError.value = null
  convertedUrl.value = null
  convertedBlob.value = null

  window.$toast?.info(t('toast.conversion.uploadReceived'))

  try {
    let previewUrl

    if (needsBackendPreview(file)) {
      // Browser can't display TIFF/HEIC natively – convert to PNG via backend
      const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {})
      previewUrl = URL.createObjectURL(pngBlob)
    } else {
      previewUrl = await readFileAsDataURL(file)
    }

    sourcePreview.value = previewUrl

    // Load image onto canvas
    const img = await loadImage(previewUrl)

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')

    const format = outputFormat.value

    // White background for formats without transparency
    if (format === 'jpg' || format === 'bmp' || format === 'pdf') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(img, 0, 0)

    const formatInfo = FORMAT_INFO[format]

    if (format === 'pdf') {
      // PDF conversion via jsPDF
      const blob = await convertToPDF(canvas, img)
      convertedBlob.value = blob
      convertedSize.value = blob.size
      convertedUrl.value = URL.createObjectURL(blob)
    } else if (format === 'svg') {
      // SVG conversion (backend vectorization with client fallback)
      const blob = await convertToSVG(canvas, file.name)
      convertedBlob.value = blob
      convertedSize.value = blob.size
      convertedUrl.value = URL.createObjectURL(blob)
    } else if (formatInfo && formatInfo.requiresBackend) {
      // Backend conversion (TIFF, GIF, HEIF)
      const sourceBlob = await canvasToBlob(canvas, 'image/png', 1)
      const resultBlob = await ApiClient.convertImage(sourceBlob, format, file.name, { quality: 0.92 })
      convertedBlob.value = resultBlob
      convertedSize.value = resultBlob.size
      convertedUrl.value = URL.createObjectURL(resultBlob)
    } else {
      // Client-side raster conversion (PNG, JPG, WebP, BMP)
      let mimeType = 'image/png'
      let quality = undefined
      if (format === 'jpg') { mimeType = 'image/jpeg'; quality = 0.92 }
      else if (format === 'webp') { mimeType = 'image/webp'; quality = 0.85 }
      else if (format === 'bmp') { mimeType = 'image/bmp' }

      const blob = await canvasToBlob(canvas, mimeType, quality)
      convertedBlob.value = blob
      convertedSize.value = blob.size
      convertedUrl.value = URL.createObjectURL(blob)
    }

    window.$toast?.success(t('toast.conversion.success', {
      from: conversionData.value.from,
      to: conversionData.value.to
    }))
  } catch (error) {
    conversionError.value = error.message || t('conversion.widget.converting')
    window.$toast?.error(t('toast.conversion.error', { error: error.message }))
  } finally {
    isConverting.value = false
  }
}

function downloadResult() {
  if (!convertedBlob.value) return
  const url = URL.createObjectURL(convertedBlob.value)
  const link = document.createElement('a')
  link.href = url
  link.download = outputFilename.value
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  window.$toast?.success(t('toast.conversion.downloadStarted', { filename: outputFilename.value }))
}

function resetConverter() {
  if (convertedUrl.value && convertedUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(convertedUrl.value)
  }
  sourceFile.value = null
  sourcePreview.value = null
  isConverting.value = false
  conversionError.value = null
  convertedUrl.value = null
  convertedBlob.value = null
  convertedSize.value = 0
  if (fileInput.value) fileInput.value.value = ''
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.format-conversion-view {
  min-height: 100vh;
}

.conversion-hero {
  text-align: center;
  padding: 4rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;

  h1 {
    font-size: 2.4rem;
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    line-height: 1.3;
  }

  .hero-description {
    font-size: 1.15rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
}

/* Converter Widget */
.converter-widget {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 2rem 3rem;
}

.widget-container {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.upload-zone {
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px dashed var(--color-border);
  border-radius: var(--border-radius-lg);
  margin: var(--spacing-lg);

  &:hover,
  &.drag-over {
    border-color: var(--color-primary);
    background: var(--color-light-blue, rgba(1, 79, 153, 0.05));
  }

  i {
    font-size: 3.5rem;
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
    display: block;
  }

  h3 {
    font-size: 1.3rem;
    margin-bottom: var(--spacing-sm);
    color: var(--color-primary);
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }

  .upload-formats {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-primary);
    color: #fff;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
    font-weight: 600;
  }
}

.processing-state {
  padding: var(--spacing-3xl);
  text-align: center;

  p {
    font-size: 1.1rem;
    margin-top: var(--spacing-lg);
    color: var(--color-text-primary);
  }

  .processing-detail {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }
}

.spinner-large {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  padding: var(--spacing-3xl);
  text-align: center;

  i {
    font-size: 3rem;
    color: var(--color-danger, #dc3545);
    margin-bottom: var(--spacing-md);
  }

  p {
    color: var(--color-danger, #dc3545);
    margin-bottom: var(--spacing-lg);
  }
}

.result-state {
  padding: var(--spacing-xl);
}

.preview-comparison {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xl);

  @media (max-width: 500px) {
    flex-direction: column;
  }
}

.preview-item {
  flex: 1;
  max-width: 250px;
  text-align: center;

  .preview-label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    font-size: 0.85rem;
    color: var(--color-primary);
    text-transform: uppercase;
  }

  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
    object-fit: contain;
    background: var(--color-bg-primary);
  }

  .preview-size {
    display: block;
    margin-top: var(--spacing-xs);
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
}

.preview-arrow {
  color: var(--color-primary);
  font-size: 1.5rem;

  @media (max-width: 500px) {
    transform: rotate(90deg);
  }
}

.result-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.widget-footer {
  text-align: center;
  margin-top: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
}

.batch-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;

  i {
    margin-right: var(--spacing-xs);
  }

  &:hover {
    color: var(--color-primary);
  }
}

/* Buttons */
.btn-large {
  padding: 0.75rem 1.75rem;
  font-size: 1rem;

  i {
    margin-right: var(--spacing-sm);
  }
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: var(--color-bg-tertiary, var(--color-bg-primary));
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

/* Info Section */
.info-section {
  padding: 3rem 2rem;
  background: var(--color-bg-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .info-icon {
    width: 50px;
    height: 50px;
    background: var(--color-light-blue);
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);

    i {
      font-size: 1.5rem;
      color: var(--color-primary);
    }
  }

  h3 {
    font-size: 1.15rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

/* Format Details */
.format-details {
  padding: 3rem 2rem;
  max-width: 900px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: var(--spacing-xl);
  }
}

.format-comparison {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-bottom: var(--spacing-xl);

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.format-box {
  flex: 1;
  max-width: 300px;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  text-align: center;

  h3 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  &.source {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
  }

  &.target {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.08));
    border: 1px solid var(--color-primary);
  }
}

.conversion-arrow {
  font-size: 1.5rem;
  color: var(--color-primary);

  @media (max-width: 600px) {
    transform: rotate(90deg);
  }
}

.advantage-text {
  text-align: center;
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: 1.05rem;
}

/* Steps */
.steps-section {
  padding: 3rem 2rem;
  background: var(--color-bg-primary);

  h2 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: var(--spacing-xl);
  }
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-xl);
  max-width: 900px;
  margin: 0 auto;
}

.step {
  text-align: center;
  padding: var(--spacing-lg);

  .step-number {
    width: 45px;
    height: 45px;
    background: var(--color-primary);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 auto var(--spacing-md);
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

/* Other Conversions */
.other-conversions {
  padding: 3rem 2rem;
  max-width: 900px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    margin-bottom: var(--spacing-xl);
  }
}

.conversion-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.conversion-link {
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.08));
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

@media (max-width: 768px) {
  .conversion-hero {
    padding: 2.5rem 1.5rem 1.5rem;

    h1 {
      font-size: 1.8rem;
    }
  }

  .converter-widget {
    padding: 0 1rem 2rem;
  }

  .format-details h2,
  .steps-section h2,
  .other-conversions h2 {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .conversion-hero h1 {
    font-size: 1.5rem;
  }

  .result-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
