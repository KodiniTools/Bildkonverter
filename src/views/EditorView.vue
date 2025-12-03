<template>
  <div class="editor-view">
    <div class="editor-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-section">
          <button class="btn btn-primary" @click="triggerFileInput">
            <i class="fas fa-file-upload"></i>
            {{ $t('editor.toolbar.upload') }}
          </button>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            @change="handleFileSelect"
            style="display: none"
          >
        </div>

        <div class="toolbar-section">
          <button 
            class="btn btn-secondary" 
            @click="addText"
            :disabled="!currentImage"
          >
            <i class="fas fa-font"></i>
            Text
          </button>
          <button 
            class="btn btn-secondary" 
            @click="openPreview"
            :disabled="!currentImage"
          >
            <i class="fas fa-eye"></i>
            {{ $t('editor.toolbar.preview', 'Vorschau') }}
          </button>
          <button 
            class="btn btn-secondary" 
            @click="resetFilters"
            :disabled="!currentImage"
          >
            <i class="fas fa-undo"></i>
            {{ $t('editor.toolbar.reset') }}
          </button>
          <button 
            class="btn btn-danger" 
            @click="clearImage"
            :disabled="!currentImage"
            :title="$t('editor.toolbar.clearImage', 'Bild entfernen')"
          >
            <i class="fas fa-trash"></i>
            {{ $t('editor.toolbar.clearImage', 'Löschen') }}
          </button>
          <button 
            class="btn btn-success" 
            @click="downloadImage"
            :disabled="!currentImage || isExporting"
          >
            <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
            {{ isExporting ? 'Exportiere...' : $t('editor.toolbar.download') }}
          </button>
        </div>
      </div>

      <!-- Main Editor -->
      <div class="editor-main">
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Format Selection -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.format') }}</h3>
            
            <!-- Format Dropdown -->
            <select v-model="outputFormat" class="form-select">
              <option v-for="format in formats" :key="format" :value="format">
                {{ FORMAT_INFO[format]?.icon }} {{ format.toUpperCase() }}
              </option>
            </select>
            
            <!-- Format Info -->
            <div v-if="currentFormatInfo" class="format-info">
              <p class="format-description">
                {{ currentFormatInfo.description }}
              </p>
              <span class="format-badge">
                {{ currentFormatInfo.recommended }}
              </span>
              <span v-if="requiresBackend" class="backend-badge" :title="'Benötigt Backend-API'">
                🌐 Backend
              </span>
            </div>
            
            <!-- Quality Slider (nur für Formate mit Quality-Support) -->
            <div v-if="supportsQuality" class="filter-control">
              <label>{{ $t('editor.export.quality', 'Qualität') }}</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                v-model.number="exportQuality"
              >
              <span>{{ exportQuality }}%</span>
            </div>
          </div>

          <!-- Background -->
          <div class="sidebar-section" :class="{ 'disabled-section': !currentImage }">
            <h3>{{ $t('editor.sidebar.background', 'Hintergrund') }}</h3>

            <div class="filter-control">
              <label>{{ $t('editor.background.color', 'Farbe') }}</label>
              <div class="color-picker-row">
                <input
                  type="color"
                  v-model="background.color"
                  @input="renderImage"
                  class="color-input"
                  :disabled="!currentImage"
                >
                <input
                  type="text"
                  v-model="background.color"
                  @input="renderImage"
                  class="color-text-input"
                  maxlength="7"
                  :disabled="!currentImage"
                >
              </div>
            </div>

            <div class="filter-control">
              <label>{{ $t('editor.background.opacity', 'Deckkraft') }}</label>
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="background.opacity"
                @input="renderImage"
                :disabled="!currentImage"
              >
              <span>{{ background.opacity }}%</span>
            </div>

            <p v-if="!currentImage" class="hint-text">
              <i class="fas fa-info-circle"></i>
              {{ $t('editor.background.hint', 'Bild laden um Hintergrund anzupassen') }}
            </p>
          </div>

          <!-- Adjustments -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.adjustments') }}</h3>

            <div class="filter-control">
              <label>{{ $t('editor.filters.brightness') }}</label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                v-model.number="filters.brightness"
                @input="renderImage"
              >
              <span>{{ filters.brightness }}%</span>
            </div>

            <div class="filter-control">
              <label>{{ $t('editor.filters.contrast') }}</label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                v-model.number="filters.contrast"
                @input="renderImage"
              >
              <span>{{ filters.contrast }}%</span>
            </div>

            <div class="filter-control">
              <label>{{ $t('editor.filters.saturation') }}</label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                v-model.number="filters.saturation"
                @input="renderImage"
              >
              <span>{{ filters.saturation }}%</span>
            </div>

            <div class="filter-control">
              <label>{{ $t('editor.filters.blur') }}</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                v-model.number="filters.blur"
                @input="renderImage"
              >
              <span>{{ filters.blur }}px</span>
            </div>

            <div class="filter-control">
              <label>{{ $t('editor.filters.hue') }}</label>
              <input 
                type="range" 
                min="0" 
                max="360" 
                v-model.number="filters.hue"
                @input="renderImage"
              >
              <span>{{ filters.hue }}°</span>
            </div>
          </div>

          <!-- Presets -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.presets') }}</h3>
            <FilterPresets 
              :filters="filters" 
              @apply-preset="handlePresetApply"
            />
          </div>

          <!-- Resize -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.resize') }}</h3>
            <div class="resize-controls">
              <div class="resize-input">
                <label>{{ $t('editor.resize.width') }}</label>
                <input 
                  type="number" 
                  v-model.number="resizeWidth"
                  :disabled="!currentImage"
                  @change="onResizeChange('width')"
                >
              </div>
              <div class="resize-input">
                <label>{{ $t('editor.resize.height') }}</label>
                <input 
                  type="number" 
                  v-model.number="resizeHeight"
                  :disabled="!currentImage"
                  @change="onResizeChange('height')"
                >
              </div>
              <label class="checkbox-label">
                <input type="checkbox" v-model="maintainAspectRatio">
                {{ $t('editor.resize.maintainAspect') }}
              </label>
              <button 
                class="btn btn-primary" 
                @click="applyResize"
                :disabled="!currentImage"
              >
                {{ $t('editor.resize.apply') }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Canvas Area -->
        <div class="canvas-area">
          <div v-if="!currentImage" class="empty-canvas">
            <i class="fas fa-image"></i>
            <h2>{{ $t('editor.canvas.empty.title') }}</h2>
            <p>{{ $t('editor.canvas.empty.description') }}</p>
            <button class="btn btn-primary btn-large" @click="triggerFileInput">
              <i class="fas fa-file-upload"></i>
              {{ $t('editor.canvas.empty.button') }}
            </button>
          </div>

          <div v-else class="canvas-container">
            <canvas
              ref="canvas"
              class="main-canvas"
              :style="{ cursor: crop.cropMode.value ? 'crosshair' : 'default' }"
              @mousedown="onCanvasMouseDown"
              @mousemove="onCanvasMouseMove"
              @mouseup="onCanvasMouseUp"
              @dblclick="onCanvasDoubleClick"
            ></canvas>
            <!-- Crop Overlay -->
            <div 
              v-if="crop.cropping.value && scaledCropOverlayStyle"
              class="crop-overlay"
              :style="scaledCropOverlayStyle"
            ></div>
            <div class="canvas-info">
              <span><i class="fas fa-expand-arrows-alt"></i> {{ imageWidth }} × {{ imageHeight }}px</span>
              <span><i class="fas fa-file"></i> {{ formatSize(imageSize) }}</span>
              <span><i class="fas fa-image"></i> {{ currentImageFormat.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Rechte Spalte: TransformPanel (Text + Crop + Transform Features) -->
        <TransformPanel
          v-if="currentImage"
          :crop-mode="crop.cropMode.value"
          :has-cropped="crop.hasCropped.value"
          :transforms="transform.transforms.value"
          :has-transforms="transform.hasTransforms.value"
          :can-pan="transform.canPan.value"
          :has-pan="transform.hasPan.value"
          :selected-text="selectedTextObject"
          :has-texts="imageStore.texts && imageStore.texts.length > 0"
          @toggle-crop="handleToggleCrop"
          @undo-crop="handleUndoCrop"
          @update:opacity="handleOpacityUpdate"
          @update:rotation="handleRotationUpdate"
          @update:scale="handleScaleUpdate"
          @update:border-radius="handleBorderRadiusUpdate"
          @update:border-width="handleBorderWidthUpdate"
          @update:border-color="handleBorderColorUpdate"
          @rotate-90="handleRotate90"
          @rotate-90-counter="handleRotate90Counter"
          @rotate-180="handleRotate180"
          @flip-horizontal="handleFlipHorizontal"
          @flip-vertical="handleFlipVertical"
          @apply-transforms="handleApplyTransforms"
          @reset-transforms="handleResetTransforms"
          @reset-pan="handleResetPan"
          @update:text-content="handleTextContentUpdate"
          @update:text-font-size="handleTextFontSizeUpdate"
          @update:text-font-family="handleTextFontFamilyUpdate"
          @update:text-color="handleTextColorUpdate"
          @delete-text="handleDeleteText"
          @deselect-text="handleDeselectText"
        />
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreviewModal" class="preview-modal-overlay" @click="closePreview">
        <div class="preview-modal-content" @click.stop>
          <button class="preview-close-btn" @click="closePreview">
            <i class="fas fa-times"></i>
          </button>
          
          <h2 class="preview-title">Vorher / Nachher Vergleich</h2>
          
          <div class="preview-comparison">
            <div class="preview-item">
              <h3>Vorher (Original)</h3>
              <img v-if="originalPreviewSrc" :src="originalPreviewSrc" alt="Original" />
              <div v-else class="preview-placeholder">Kein Original verfügbar</div>
            </div>
            
            <div class="preview-divider"></div>
            
            <div class="preview-item">
              <h3>Nachher (Bearbeitet)</h3>
              <img v-if="editedPreviewSrc" :src="editedPreviewSrc" alt="Bearbeitet" />
              <div v-else class="preview-placeholder">Keine Bearbeitung verfügbar</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useImageStore } from '@/stores/imageStore'
import { useTextModal } from '@/composables/useTextModal'
import { useCrop } from '@/composables/useCrop'
import { useTransform } from '@/composables/useTransform'
import TransformPanel from '@/components/features/TransformPanel.vue'
import FilterPresets from '@/components/editor/FilterPresets.vue'

// ===== NEU: Export Utils Import =====
import { exportImage, FORMAT_INFO, SUPPORTED_FORMATS, getFormatInfo } from '@/utils/exportUtils'

const { t } = useI18n()
const route = useRoute()
const imageStore = useImageStore()
const textModal = useTextModal()

// Refs
const fileInput = ref(null)
const canvas = ref(null)
const currentImage = ref(null)
const originalImage = ref(null)
const originalImageDataUrl = ref('') // Speichert das Original als Data URL
const history = ref([])
const historyIndex = ref(-1)
const outputFormat = ref('png')
const currentImageFormat = ref('') // Format des hochgeladenen Bildes
const currentPreset = ref(null)
const maintainAspectRatio = ref(true)
const resizeWidth = ref(null)
const resizeHeight = ref(null)

// ===== NEU: Export-spezifische Refs =====
const exportQuality = ref(92) // Quality-Wert (0-100)
const isExporting = ref(false) // Loading-State beim Export

// Text interaction state
const selectedTextId = ref(null)
const isDraggingText = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Pan interaction state
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const isSpacePressed = ref(false)

// Crop Composable (ersetzt alle Crop-State-Variablen)
const crop = useCrop()

// Transform Composable (für Rotation, Deckkraft, etc.)
const transform = useTransform()

// Preview Modal state
const showPreviewModal = ref(false)
const originalPreviewSrc = ref('') // Als ref statt computed
const editedPreviewSrc = ref('') // Als ref statt computed
const previewUpdateTrigger = ref(0) // Trigger für manuelle Updates

const filters = ref({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  hue: 0
})

// Hintergrund-Einstellungen
const background = ref({
  color: '#ffffff',
  opacity: 0
})

// ===== NEU: Verwende SUPPORTED_FORMATS aus exportUtils =====
const formats = SUPPORTED_FORMATS

// Computed
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// Aktuell ausgewählter Text als Objekt
const selectedTextObject = computed(() => {
  if (!selectedTextId.value || !imageStore.texts) return null
  return imageStore.texts.find(t => t.id === selectedTextId.value) || null
})

// ===== NEU: Format-Info Computed Properties =====
const currentFormatInfo = computed(() => {
  return getFormatInfo(outputFormat.value)
})

const supportsQuality = computed(() => {
  return currentFormatInfo.value?.supportsQuality || false
})

const requiresBackend = computed(() => {
  return currentFormatInfo.value?.requiresBackend || false
})

// Crop-Overlay-Style: Konvertiere Canvas-Koordinaten zu Display-Koordinaten
const scaledCropOverlayStyle = computed(() => {
  if (!crop.cropOverlayStyle.value || !canvas.value) return null
  
  const canvasRect = canvas.value.getBoundingClientRect()
  const containerRect = canvas.value.parentElement.getBoundingClientRect()
  
  // Skalierungsfaktoren
  const scaleX = canvasRect.width / canvas.value.width
  const scaleY = canvasRect.height / canvas.value.height
  
  // Offset vom Canvas innerhalb des Containers
  const offsetX = canvasRect.left - containerRect.left
  const offsetY = canvasRect.top - containerRect.top
  
  const originalStyle = crop.cropOverlayStyle.value
  
  // Parse die Pixel-Werte und skaliere sie
  const parsePixels = (str) => parseFloat(str) || 0
  
  return {
    left: `${offsetX + parsePixels(originalStyle.left) * scaleX}px`,
    top: `${offsetY + parsePixels(originalStyle.top) * scaleY}px`,
    width: `${parsePixels(originalStyle.width) * scaleX}px`,
    height: `${parsePixels(originalStyle.height) * scaleY}px`
  }
})

// Image info (reactive refs statt computed für bessere Kontrolle)
const imageWidth = ref(0)
const imageHeight = ref(0)
const imageSize = ref(0)

// Schnelle Funktion: nur Dimensionen aktualisieren (wird bei jedem renderImage() aufgerufen)
function updateImageDimensions() {
  if (!canvas.value) {
    imageWidth.value = 0
    imageHeight.value = 0
    return
  }
  
  imageWidth.value = canvas.value.width
  imageHeight.value = canvas.value.height
}

// Langsame Funktion: Dateigröße berechnen (nur bei Bedarf aufrufen!)
function updateImageSize() {
  if (!canvas.value) {
    imageSize.value = 0
    return
  }
  
  try {
    const dataUrl = canvas.value.toDataURL(`image/${outputFormat.value}`, 0.92)
    const base64String = dataUrl.split(',')[1]
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0
    const bytes = (base64String.length * 3 / 4) - padding
    imageSize.value = Math.round(bytes)
  } catch (error) {
    imageSize.value = Math.round(canvas.value.toDataURL().length * 0.75)
  }
}

// Komplette Update-Funktion (nur bei Load/Resize/Format-Wechsel)
function updateImageInfo() {
  updateImageDimensions()
  updateImageSize()
}

// Watch outputFormat changes to update image size
watch(outputFormat, () => {
  updateImageSize()
})

// Methods
function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // Erkenne Format des hochgeladenen Bildes
  const fileType = file.type.split('/')[1] // z.B. 'image/jpeg' -> 'jpeg'
  currentImageFormat.value = fileType === 'jpeg' ? 'jpg' : fileType

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = async () => {
      // Speichere das Original-Bild als Data URL für die Vorschau
      originalImageDataUrl.value = e.target.result
      
      await loadImage(img)
      // Speichere auch im Store für Persistenz
      try {
        await imageStore.loadImageFromFile(file)
      } catch (err) {
        console.warn('Store save failed:', err)
      }
    }
    img.src = e.target.result
    originalImage.value = img
  }
  reader.readAsDataURL(file)
}

async function loadImage(img) {
  currentImage.value = img
  
  // Reset Crop-Zustand über Composable
  crop.resetCropState()
  
  // Reset Transform-Zustand über Composable
  transform.resetTransforms()
  
  // Warte bis Vue das Canvas gerendert hat
  await nextTick()
  
  // Prüfe ob canvas bereit ist
  if (!canvas.value) {
    console.warn('⚠️ Canvas noch nicht initialisiert, warte...')
    setTimeout(() => loadImage(img), 50)
    return
  }
  
  // Set canvas size
  const maxWidth = 1200
  const maxHeight = 800
  let width = img.width
  let height = img.height

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }

  canvas.value.width = width
  canvas.value.height = height
  
  resizeWidth.value = width
  resizeHeight.value = height

  renderImage()
  updateImageInfo()
  saveHistory()
}

function renderImage() {
  if (!canvas.value || !currentImage.value) return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Hintergrund zeichnen (unterste Ebene)
  if (background.value.opacity > 0) {
    ctx.save()
    ctx.globalAlpha = background.value.opacity / 100
    ctx.fillStyle = background.value.color
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.restore()
  }

  // Wende Transformationen an (temporär für Vorschau)
  const restoreTransform = transform.applyToCanvas(canvas.value, ctx)

  // Apply filters
  const filterString = `
    brightness(${filters.value.brightness}%)
    contrast(${filters.value.contrast}%)
    saturate(${filters.value.saturation}%)
    blur(${filters.value.blur}px)
    hue-rotate(${filters.value.hue}deg)
  `
  
  ctx.filter = filterString
  
  // Border Radius (abgerundete Ecken)
  if (transform.transforms.value.borderRadius > 0) {
    ctx.save()
    roundedRect(ctx, 0, 0, canvas.value.width, canvas.value.height, transform.transforms.value.borderRadius)
    ctx.clip()
  }
  
  ctx.drawImage(currentImage.value, 0, 0, canvas.value.width, canvas.value.height)
  
  // Border zeichnen
  if (transform.transforms.value.borderWidth > 0) {
    ctx.strokeStyle = transform.transforms.value.borderColor
    ctx.lineWidth = transform.transforms.value.borderWidth
    if (transform.transforms.value.borderRadius > 0) {
      roundedRect(ctx, 0, 0, canvas.value.width, canvas.value.height, transform.transforms.value.borderRadius)
      ctx.stroke()
    } else {
      ctx.strokeRect(0, 0, canvas.value.width, canvas.value.height)
    }
  }
  
  if (transform.transforms.value.borderRadius > 0) {
    ctx.restore()
  }
  
  // Reset filter for texts
  ctx.filter = 'none'
  
  // Restore Transform
  if (restoreTransform) {
    restoreTransform()
  }
  
  // Draw texts from imageStore (ohne Auswahl-Markierung für sauberen Export)
  if (imageStore.texts && imageStore.texts.length > 0) {
    imageStore.texts.forEach(text => {
      ctx.save()
      ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`
      ctx.fillStyle = text.color || '#000000'
      ctx.textBaseline = 'top'
      ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0)
      ctx.restore()
    })
  }

  // Update nur Dimensionen (schnell), nicht Dateigröße
  updateImageDimensions()

  // Text-Auswahl separat zeichnen (nur für Vorschau, nicht auf Canvas für Export)
  drawTextSelection()
}

// Zeichnet Text-Auswahl als Overlay (nur visuell, nicht Teil des exportierten Bildes)
function drawTextSelection() {
  if (!canvas.value || !selectedTextId.value) return

  const ctx = canvas.value.getContext('2d')
  const text = imageStore.texts?.find(t => t.id === selectedTextId.value)
  if (!text) return

  ctx.save()
  ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`
  const metrics = ctx.measureText(text.content || text.txt || '')
  ctx.strokeStyle = '#0066ff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(text.x - 4, text.y - 4, metrics.width + 8, (text.fontSize || text.size || 32) + 8)
  ctx.setLineDash([])
  ctx.restore()
}

// Rendert Bild ohne Auswahl-Markierung (für Export)
function renderImageForExport() {
  if (!canvas.value || !currentImage.value) return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Hintergrund zeichnen
  if (background.value.opacity > 0) {
    ctx.save()
    ctx.globalAlpha = background.value.opacity / 100
    ctx.fillStyle = background.value.color
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.restore()
  }

  // Transformationen
  const restoreTransform = transform.applyToCanvas(canvas.value, ctx)

  // Filter
  const filterString = `
    brightness(${filters.value.brightness}%)
    contrast(${filters.value.contrast}%)
    saturate(${filters.value.saturation}%)
    blur(${filters.value.blur}px)
    hue-rotate(${filters.value.hue}deg)
  `
  ctx.filter = filterString

  // Border Radius
  if (transform.transforms.value.borderRadius > 0) {
    ctx.save()
    roundedRect(ctx, 0, 0, canvas.value.width, canvas.value.height, transform.transforms.value.borderRadius)
    ctx.clip()
  }

  ctx.drawImage(currentImage.value, 0, 0, canvas.value.width, canvas.value.height)

  // Border
  if (transform.transforms.value.borderWidth > 0) {
    ctx.strokeStyle = transform.transforms.value.borderColor
    ctx.lineWidth = transform.transforms.value.borderWidth
    if (transform.transforms.value.borderRadius > 0) {
      roundedRect(ctx, 0, 0, canvas.value.width, canvas.value.height, transform.transforms.value.borderRadius)
      ctx.stroke()
    } else {
      ctx.strokeRect(0, 0, canvas.value.width, canvas.value.height)
    }
  }

  if (transform.transforms.value.borderRadius > 0) {
    ctx.restore()
  }

  ctx.filter = 'none'

  if (restoreTransform) {
    restoreTransform()
  }

  // Texte OHNE Auswahl-Markierung
  if (imageStore.texts && imageStore.texts.length > 0) {
    imageStore.texts.forEach(text => {
      ctx.save()
      ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`
      ctx.fillStyle = text.color || '#000000'
      ctx.textBaseline = 'top'
      ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0)
      ctx.restore()
    })
  }
}

function resetFilters() {
  filters.value = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0
  }
  currentPreset.value = null
  
  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState()
  console.log('Crop-Modus deaktiviert')
  
  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms()
  console.log('Transform-Zustand zurückgesetzt')
  
  renderImage()
  saveHistory()
}

function clearImage() {
  if (!currentImage.value) return
  
  // Bestätigung vom Benutzer
  const confirmDelete = confirm('Möchten Sie das Bild wirklich entfernen? Alle Änderungen gehen verloren.')
  if (!confirmDelete) return
  
  // Bild und Daten zurücksetzen
  currentImage.value = null
  originalImage.value = null
  originalImageDataUrl.value = '' // Original-Bild Data URL zurücksetzen
  currentImageFormat.value = '' // Format zurücksetzen
  
  // Image-Info zurücksetzen
  imageWidth.value = 0
  imageHeight.value = 0
  imageSize.value = 0
  
  // Canvas leeren
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d')
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    canvas.value.width = 0
    canvas.value.height = 0
  }
  
  // Filter zurücksetzen
  filters.value = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0
  }
  currentPreset.value = null
  
  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState()
  
  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms()
  
  // History zurücksetzen
  history.value = []
  historyIndex.value = -1
  
  // Resize-Werte zurücksetzen
  resizeWidth.value = null
  resizeHeight.value = null
  
  // Text-Elemente zurücksetzen (falls Methode existiert)
  if (textModal && typeof textModal.clearAllTexts === 'function') {
    textModal.clearAllTexts()
  }
  selectedTextId.value = null
  
  // ImageStore zurücksetzen (falls Methode existiert)
  if (imageStore && typeof imageStore.clearImage === 'function') {
    imageStore.clearImage()
  }
  
  // File Input zurücksetzen
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  console.log('🗑️ Bild erfolgreich gelöscht')
  if (window.$toast) {
    window.$toast.success(t('toast.editor.imageDeleted'))
  }
}

function handlePresetApply(preset) {
  // Wende Filter an
  filters.value = { ...preset.filters }
  
  // Setze aktuelles Preset
  currentPreset.value = preset.id
  
  // Render Image neu
  renderImage()
  
  // Speichere in History
  saveHistory()
}

function onResizeChange(dimension) {
  if (!maintainAspectRatio.value || !canvas.value) return
  
  if (dimension === 'width') {
    const ratio = resizeWidth.value / canvas.value.width
    resizeHeight.value = Math.round(canvas.value.height * ratio)
  } else {
    const ratio = resizeHeight.value / canvas.value.height
    resizeWidth.value = Math.round(canvas.value.width * ratio)
  }
}

function applyResize() {
  if (!canvas.value || !currentImage.value) return
  
  canvas.value.width = resizeWidth.value
  canvas.value.height = resizeHeight.value
  renderImage()
  updateImageSize() // Dateigröße neu berechnen nach Resize
  saveHistory()
  
  // Toast-Benachrichtigung
  if (window.$toast) {
    window.$toast.success(t('toast.editor.resizeSuccess', {
      width: resizeWidth.value,
      height: resizeHeight.value
    }))
  }
}

// ===== NEU: Aktualisierte downloadImage Funktion mit neuer Export-Architektur =====
async function downloadImage() {
  if (!canvas.value) return

  isExporting.value = true

  try {
    const filename = `image-${Date.now()}`

    // ✨ FIX: Rendere ohne Auswahl-Markierung vor dem Export
    renderImageForExport()

    // Export mit neuer Export-Utils
    const result = await exportImage(
      canvas.value,
      outputFormat.value,
      filename,
      {
        quality: exportQuality.value / 100, // Konvertiere 0-100 zu 0-1
        texts: imageStore.texts || [] // Texte aus dem Store
      }
    )

    console.log('✅ Export erfolgreich:', result)

    // Optional: Success-Toast anzeigen
    if (window.$toast) {
      window.$toast.success(
        `Bild erfolgreich als ${result.format.toUpperCase()} exportiert` +
        (result.size ? ` (${result.size})` : '')
      )
    }

  } catch (error) {
    console.error('❌ Export fehlgeschlagen:', error)

    // Error-Toast anzeigen
    if (window.$toast) {
      window.$toast.error(`Export fehlgeschlagen: ${error.message}`)
    } else {
      alert(`Export fehlgeschlagen: ${error.message}`)
    }
  } finally {
    isExporting.value = false

    // ✨ FIX: Stelle Auswahl-Markierung nach dem Export wieder her
    renderImage()
  }
}

function saveHistory() {
  if (!canvas.value) return
  
  // Remove any states after current index
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  
  // Save current state
  history.value.push({
    imageData: canvas.value.toDataURL(),
    filters: { ...filters.value },
    width: canvas.value.width,
    height: canvas.value.height
  })
  
  historyIndex.value = history.value.length - 1
  
  // Limit history size
  if (history.value.length > 30) {
    history.value.shift()
    historyIndex.value--
  }
}

function undo() {
  if (!canUndo.value) return
  historyIndex.value--
  restoreState(history.value[historyIndex.value])
}

function redo() {
  if (!canRedo.value) return
  historyIndex.value++
  restoreState(history.value[historyIndex.value])
}

function restoreState(state) {
  const img = new Image()
  img.onload = () => {
    canvas.value.width = state.width
    canvas.value.height = state.height
    filters.value = { ...state.filters }
    const ctx = canvas.value.getContext('2d')
    ctx.drawImage(img, 0, 0)
    updateImageInfo() // Image-Info aktualisieren nach Restore
  }
  img.src = state.imageData
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// ===== CROP FUNCTIONS (jetzt über useCrop Composable) =====

function handleToggleCrop() {
  const result = crop.toggleCropMode()
  if (result === 'finish') {
    handleFinishCrop()
  }
}

function handleFinishCrop() {
  crop.finishCrop({
    canvas,
    currentImage,
    filters,
    imageStore,
    onCropComplete: (img, width, height) => {
      currentImage.value = img
      canvas.value.width = width
      canvas.value.height = height
      resizeWidth.value = width
      resizeHeight.value = height
      renderImage()
      updateImageSize() // Dateigröße neu berechnen nach Crop
      saveHistory()
    }
  })
}

function handleUndoCrop() {
  crop.undoCrop({
    imageStore,
    onUndoComplete: (img, beforeCropData) => {
      currentImage.value = img
      canvas.value.width = beforeCropData.width
      canvas.value.height = beforeCropData.height
      resizeWidth.value = beforeCropData.width
      resizeHeight.value = beforeCropData.height
      filters.value = { ...beforeCropData.filters }
      renderImage()
      updateImageSize() // Dateigröße neu berechnen nach Undo
      saveHistory()
    }
  })
}

// ===== TRANSFORM FUNCTIONS =====

// Wrapper für Regler (mit Live-Vorschau)
function handleOpacityUpdate(value) {
  transform.setOpacity(value)
  renderImage()
}

function handleRotationUpdate(value) {
  transform.setRotation(value)
  renderImage()
}

function handleScaleUpdate(value) {
  transform.setScale(value)
  renderImage()
}

function handleBorderRadiusUpdate(value) {
  transform.setBorderRadius(value)
  renderImage()
}

function handleBorderWidthUpdate(value) {
  transform.setBorderWidth(value)
  renderImage()
}

function handleBorderColorUpdate(color) {
  transform.setBorderColor(color)
  renderImage()
}

// Button-Handler
function handleRotate90() {
  transform.rotate90()
  renderImage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.transform.rotated90'))
  }
}

function handleRotate90Counter() {
  transform.rotate90Counter()
  renderImage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.transform.rotated90'))
  }
}

function handleRotate180() {
  transform.rotate180()
  renderImage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.transform.rotated180'))
  }
}

function handleFlipHorizontal() {
  transform.flipHorizontal()
  renderImage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.transform.flippedHorizontal'))
  }
}

function handleFlipVertical() {
  transform.flipVertical()
  renderImage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.transform.flippedVertical'))
  }
}

async function handleApplyTransforms() {
  if (!currentImage.value || !canvas.value) return
  
  try {
    console.log('Wende Transformationen permanent an...')
    
    const result = await transform.applyPermanently(currentImage.value, canvas.value)
    
    if (result) {
      currentImage.value = result.img
      canvas.value.width = result.width
      canvas.value.height = result.height
      resizeWidth.value = result.width
      resizeHeight.value = result.height
      
      renderImage()
      updateImageSize() // Dateigröße neu berechnen nach Transform
      saveHistory()
      
      // Reset transforms nach Anwendung
      transform.resetTransforms()
      
      console.log('✅ Transformationen erfolgreich angewendet')
      if (window.$toast) {
        window.$toast.success(t('toast.editor.transformApplied'))
      }
    }
  } catch (error) {
    console.error('Fehler beim Anwenden der Transformationen:', error)
    if (window.$toast) {
      window.$toast.error(t('toast.editor.transformError'), error.message)
    }
  }
}

function handleResetPan() {
  transform.resetPan()
  renderImage()

  if (window.$toast) {
    window.$toast.info(t('toast.transform.panReset', 'Ansicht zurückgesetzt'))
  }
}

function handleResetTransforms() {
  transform.resetTransforms()
  renderImage()

  if (window.$toast) {
    window.$toast.info(t('toast.transform.reset'))
  }
}

// Helper-Funktion für abgerundete Rechtecke
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// ===== TEXT FUNCTIONS =====

function addText() {
  if (!currentImage.value) return

  // Direkt neuen Text hinzufügen (ohne Modal)
  const newText = {
    id: Date.now(),
    content: 'Neuer Text',
    x: Math.floor(canvas.value.width / 2) - 50,
    y: Math.floor(canvas.value.height / 2),
    fontSize: 32,
    fontFamily: 'Satoshi Regular',
    color: '#000000'
  }

  imageStore.texts.push(newText)
  selectedTextId.value = newText.id
  renderImage()
}

// ===== Text Event Handler =====
function handleTextContentUpdate(content) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.content = content
    text.txt = content
    renderImage()
  }
}

function handleTextFontSizeUpdate(fontSize) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.fontSize = fontSize
    text.size = fontSize
    renderImage()
  }
}

function handleTextFontFamilyUpdate(fontFamily) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.fontFamily = fontFamily
    renderImage()
  }
}

function handleTextColorUpdate(color) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.color = color
    renderImage()
  }
}

function handleDeleteText() {
  if (!selectedTextId.value) return
  const index = imageStore.texts.findIndex(t => t.id === selectedTextId.value)
  if (index !== -1) {
    imageStore.texts.splice(index, 1)
    selectedTextId.value = null
    renderImage()
  }
}

function handleDeselectText() {
  selectedTextId.value = null
  renderImage()
}

function getMousePos(e) {
  const rect = canvas.value.getBoundingClientRect()
  
  // Maus-Position relativ zum Canvas-Element (in Display-Pixeln)
  const displayX = e.clientX - rect.left
  const displayY = e.clientY - rect.top
  
  // Skalierungsfaktor zwischen Display-Größe und Canvas-Größe
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  
  // Konvertiere zu Canvas-Koordinaten
  return {
    x: displayX * scaleX,
    y: displayY * scaleY
  }
}

function findTextAtPosition(x, y) {
  if (!imageStore.texts || imageStore.texts.length === 0) return null

  const ctx = canvas.value.getContext('2d')

  // Von oben nach unten suchen (oberster Text hat Priorität)
  for (let i = imageStore.texts.length - 1; i >= 0; i--) {
    const text = imageStore.texts[i]
    const fontSize = text.fontSize || text.size || 32
    const content = text.content || text.txt || ''

    ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`
    const metrics = ctx.measureText(content)

    // Hit-Box: text.y ist Top-Koordinate (wegen textBaseline = 'top' in renderImage)
    // Etwas größere Hit-Box für bessere Bedienbarkeit
    const padding = 8
    if (x >= text.x - padding && x <= text.x + metrics.width + padding &&
        y >= text.y - padding && y <= text.y + fontSize + padding) {
      return text
    }
  }
  return null
}

function onCanvasMouseDown(e) {
  const pos = getMousePos(e)

  // Pan mit mittlerer Maustaste oder Leertaste + Linksklick
  const isMiddleButton = e.button === 1
  const isPanGesture = isMiddleButton || (isSpacePressed.value && e.button === 0)

  if (isPanGesture && transform.canPan.value) {
    e.preventDefault()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    canvas.value.style.cursor = 'grabbing'
    return
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseDown(pos)
  if (cropHandled) return

  // Sonst Text-Interaktion
  const text = findTextAtPosition(pos.x, pos.y)

  if (text) {
    selectedTextId.value = text.id
    isDraggingText.value = true
    dragOffset.value = {
      x: pos.x - text.x,
      y: pos.y - text.y
    }
    canvas.value.style.cursor = 'grabbing'
  } else {
    selectedTextId.value = null
  }

  renderImage()
}

function onCanvasMouseMove(e) {
  const pos = getMousePos(e)

  // Pan-Handling (hat höchste Priorität wenn aktiv)
  if (isPanning.value) {
    const deltaX = e.clientX - panStart.value.x
    const deltaY = e.clientY - panStart.value.y
    panStart.value = { x: e.clientX, y: e.clientY }
    transform.pan(deltaX, deltaY)
    renderImage()
    return
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseMove(pos)
  if (cropHandled) return

  // Sonst Text-Interaktion
  if (isDraggingText.value && selectedTextId.value) {
    const text = imageStore.texts.find(t => t.id === selectedTextId.value)
    if (text) {
      text.x = pos.x - dragOffset.value.x
      text.y = pos.y - dragOffset.value.y
      renderImage()
    }
  } else {
    const text = findTextAtPosition(pos.x, pos.y)
    // Cursor basierend auf Kontext anpassen
    let cursorStyle = 'default'
    if (isSpacePressed.value && transform.canPan.value) {
      cursorStyle = 'grab'
    } else if (text) {
      cursorStyle = 'grab'
    } else if (crop.cropMode.value) {
      cursorStyle = 'crosshair'
    }
    canvas.value.style.cursor = cursorStyle
  }
}

function onCanvasMouseUp() {
  // Pan-Handling beenden
  if (isPanning.value) {
    isPanning.value = false
    canvas.value.style.cursor = isSpacePressed.value && transform.canPan.value ? 'grab' : 'default'
    return
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseUp()
  if (cropHandled) {
    handleFinishCrop()
    return
  }

  // Sonst Text-Interaktion
  if (isDraggingText.value) {
    isDraggingText.value = false
    canvas.value.style.cursor = 'default'
    saveHistory()
  }
}

function onCanvasDoubleClick(e) {
  const pos = getMousePos(e)
  const text = findTextAtPosition(pos.x, pos.y)
  
  if (text) {
    textModal.openEditTextModal(text.id)
  }
}

// Watch texts
watch(() => imageStore.texts, () => {
  renderImage()
}, { deep: true })

// ===== PREVIEW FUNCTIONS =====

function openPreview() {
  if (!currentImage.value || !canvas.value) return
  
  // Rendere die Canvas mit allen aktuellen Änderungen neu
  renderImage()
  
  // Warte kurz, damit das Rendering abgeschlossen ist, dann aktualisiere die Preview-Bilder
  setTimeout(() => {
    // Aktualisiere Original-Preview
    originalPreviewSrc.value = originalImageDataUrl.value || imageStore.workingUrl || ''
    
    // Aktualisiere bearbeitetes Preview mit der AKTUELLEN Canvas
    if (canvas.value) {
      editedPreviewSrc.value = canvas.value.toDataURL('image/png')
    }
    
    // Trigger Update
    previewUpdateTrigger.value++
    
    // Öffne das Modal
    showPreviewModal.value = true
    
    console.log('🖼️ Preview aktualisiert:', {
      hasOriginal: !!originalPreviewSrc.value,
      hasEdited: !!editedPreviewSrc.value,
      trigger: previewUpdateTrigger.value
    })
  }, 100)
}

function closePreview() {
  showPreviewModal.value = false
}

// ===========================

// Lifecycle
// Keyboard shortcuts und Initial Load
// ===== GALLERY IMAGE LOADING =====

async function loadGalleryImage(galleryImageId) {
  if (!galleryImageId) return false
  
  try {
    const { useGalleryStore } = await import('@/stores/galleryStore')
    const galleryStore = useGalleryStore()
    const galleryImage = galleryStore.getImage(Number(galleryImageId))
    
    if (galleryImage) {
      console.log('Lade Bild aus Galerie:', galleryImage.name)
      const img = new Image()
      img.onload = async () => {
        // ✨ FIX: Speichere das Original-Bild für die Vorschau-Vergleichsfunktion
        originalImageDataUrl.value = galleryImage.url
        originalImage.value = img
        
        // Erkenne Format des Bildes
        const formatMatch = galleryImage.name.match(/\.(\w+)$/)
        if (formatMatch) {
          const ext = formatMatch[1].toLowerCase()
          currentImageFormat.value = ext === 'jpeg' ? 'jpg' : ext
        }
        
        await loadImage(img)
        console.log('✅ Bild aus Galerie geladen (inkl. Original für Vorschau)')
        if (window.$toast) {
          window.$toast.success(t('toast.editor.galleryLoaded'))
        }
      }
      img.src = galleryImage.url
      return true
    }
  } catch (error) {
    console.error('Fehler beim Laden aus Galerie:', error)
    if (window.$toast) {
      window.$toast.error(t('toast.editor.galleryError'), error.message)
    }
  }
  
  return false
}

// ===== LIFECYCLE HOOKS =====

onMounted(async () => {
  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)

  await nextTick()

  // Prüfe ob Bild aus Galerie geladen werden soll
  const loaded = await loadGalleryImage(route.query.galleryImageId)

  // Wenn kein Galerie-Bild geladen wurde und ein Bild im Store ist, lade es
  if (!loaded && imageStore.hasImage && imageStore.originalImage) {
    currentImage.value = imageStore.originalImage
    await nextTick()
    if (canvas.value) {
      loadImage(imageStore.originalImage)
    }
  }
})

// Watch für Galerie-Navigation: Lädt Bild neu wenn galleryImageId sich ändert
watch(() => route.query.galleryImageId, async (newId, oldId) => {
  // Nur laden wenn sich die ID geändert hat und eine neue ID vorhanden ist
  if (newId && newId !== oldId) {
    console.log('🔄 Galerie-Bild-ID geändert:', newId)
    await loadGalleryImage(newId)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
})

function handleKeydown(e) {
  // Leertaste für Pan-Modus (nur wenn Zoom > 100%)
  if (e.code === 'Space' && transform.canPan.value && !e.repeat) {
    // Nur aktivieren wenn kein Input-Element fokussiert ist
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault()
      isSpacePressed.value = true
      if (canvas.value) {
        canvas.value.style.cursor = 'grab'
      }
    }
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault()
      undo()
    } else if (e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }

  // Delete selected text
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTextId.value) {
    // Nur wenn kein Input-Element fokussiert ist
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault()
      imageStore.deleteText(selectedTextId.value)
      selectedTextId.value = null
    }
  }
}

function handleKeyup(e) {
  // Leertaste loslassen beendet Pan-Modus
  if (e.code === 'Space') {
    isSpacePressed.value = false
    isPanning.value = false
    if (canvas.value) {
      canvas.value.style.cursor = 'default'
    }
  }
}
</script>

<style lang="scss" scoped>
.editor-view {
  height: calc(100vh - 80px);
  overflow: hidden;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-section {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  i {
    font-size: 0.9rem;
  }
}

.btn-primary {
  background: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.9);
  }
}

.btn-secondary {
  background: var(--color-secondary, #6c757d);
  color: white;

  &:hover:not(:disabled) {
    background: rgba(108, 117, 125, 0.9);
  }
}

.btn-success {
  background: var(--color-success);
  color: white;

  &:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.9);
  }
}

.btn-danger {
  background: var(--color-danger, #dc3545);
  color: white;

  &:hover:not(:disabled) {
    background: rgba(220, 53, 69, 0.9);
  }
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 280px; // ✨ Schmaler für mehr Platz
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 1rem 1rem 1rem 1.25rem; // ✨ Kompaktere Padding
  
  /* Moderne Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

/* Crop Overlay (bleibt in EditorView) */
.crop-overlay {
  position: absolute;
  border: 2px dashed #4ade80;
  background: rgba(74, 222, 128, 0.1);
  pointer-events: none;
  z-index: 100;
}

.sidebar-section {
  margin-bottom: 1.5rem; // ✨ Kompakter

  h3 {
    font-size: 0.75rem; // ✨ Kleiner und subtiler
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem; // ✨ Weniger Abstand
    color: var(--color-text-secondary); // ✨ Gedämpfte Farbe
    opacity: 0.8;
  }
}

.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem; // ✨ Kompakter
  border: 1px solid var(--color-border);
  border-radius: 6px; // ✨ Weniger rund
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 0.85rem; // ✨ Kleinere Schrift
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.filter-control {
  margin-bottom: 1rem; // ✨ Kompakter

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem; // ✨ Kleiner
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary); // ✨ Primäre Farbe für bessere Lesbarkeit
  }

  input[type="range"] {
    width: 100%;
    height: 4px; // ✨ Dünner Slider
    margin: 0.25rem 0;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
    transition: background 0.2s ease;
    
    // ✨ FIX: Track-Hover entfernt für besseren Kontrast mit Thumb
    
    // Chrome, Safari, Edge
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      border: 2px solid transparent; // ✨ Vorbereitung für Hover-Border
      
      &:hover {
        transform: scale(1.3); // ✨ Etwas größer für bessere Sichtbarkeit
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        border: 2px solid white; // ✨ Weißer Ring für starken Kontrast
        background: var(--color-primary);
      }
    }
    
    // Firefox
    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      background: var(--color-primary);
      border: 2px solid transparent; // ✨ Vorbereitung für Hover-Border
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      
      &:hover {
        transform: scale(1.3); // ✨ Etwas größer für bessere Sichtbarkeit
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        border: 2px solid white; // ✨ Weißer Ring für starken Kontrast
        background: var(--color-primary);
      }
    }
    
    // Firefox Track
    &::-moz-range-track {
      background: var(--color-border);
      border-radius: 2px;
      height: 4px;
    }
  }

  span {
    font-size: 0.75rem; // ✨ Kleiner
    font-weight: 600;
    color: var(--color-text-secondary);
    min-width: 45px;
    text-align: right;
  }
}

// Color Picker für Hintergrund
.color-picker-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .color-input {
    width: 40px;
    height: 32px;
    padding: 2px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    background: var(--color-bg);

    &::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    &::-webkit-color-swatch {
      border-radius: 2px;
      border: none;
    }
  }

  .color-text-input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    font-family: monospace;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text-primary);
    text-transform: uppercase;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

// Disabled Section Style (nur visuell, nicht interaktiv blockiert)
.disabled-section {
  input:disabled,
  select:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: var(--color-bg-secondary);
  }
}

// Hint Text in Sidebar
.sidebar .hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 4px;

  i {
    color: var(--color-primary);
  }
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem; // ✨ Kompakter
}

.preset-btn {
  padding: 0.65rem; // ✨ Kompakter
  background: var(--color-bg);
  border: 1.5px solid var(--color-border); // ✨ Dünnerer Border
  border-radius: 6px; // ✨ Weniger rund
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem; // ✨ Kompakter
  color: var(--color-text-primary); // ✨ FIX: Dark-Mode Textfarbe

  &:hover {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.05); // ✨ Subtiler Hover
    transform: translateY(-1px); // ✨ Leichtes Anheben
  }

  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); // ✨ Shadow bei Active
  }

  .preset-icon {
    font-size: 1.25rem; // ✨ Etwas kleiner
    opacity: 0.9;
  }

  .preset-name {
    font-size: 0.75rem; // ✨ Kleiner und kompakter
    font-weight: 500;
    text-align: center;
  }
}

.resize-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem; // ✨ Kompakter

  .resize-input {
    display: flex;
    flex-direction: column;
    gap: 0.4rem; // ✨ Kompakter

    label {
      font-size: 0.8rem; // ✨ Kleiner
      font-weight: 500;
      color: var(--color-text-primary); // ✨ Primäre Farbe
    }

    input {
      padding: 0.5rem 0.75rem; // ✨ Kompakter
      border: 1px solid var(--color-border);
      border-radius: 6px; // ✨ Weniger rund
      background: var(--color-bg);
      color: var(--color-text-primary);
      font-size: 0.85rem; // ✨ Kleinere Schrift
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--color-primary);
      }
      
      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem; // ✨ Kleiner
    font-weight: 500;
    color: var(--color-text-primary);
    margin-top: 0.25rem;
    
    input[type="checkbox"] {
      width: 16px; // ✨ Feste Größe
      height: 16px;
      cursor: pointer;
      accent-color: var(--color-primary); // ✨ Moderne Checkbox-Farbe
    }
  }
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: auto;
  background: var(--color-bg);
}

.empty-canvas {
  text-align: center;
  color: var(--color-text-secondary);

  i {
    font-size: 5rem;
    opacity: 0.3;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin-bottom: 1.5rem;
  }

  .btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}

.canvas-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-canvas {
  max-width: 100%;
  max-height: calc(100vh - 250px);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
}

.canvas-info {
  margin-top: 1rem;
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

@media (max-width: 768px) {
  .editor-main {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
}

// Preview Modal Styles
.preview-modal-overlay {
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

.preview-modal-content {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  max-width: 95vw;
  max-height: 90vh;
  overflow: auto;
}

.preview-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    background: #c82333;
    transform: scale(1.1);
  }
}

.preview-title {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--color-text-primary);
}

.preview-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    
    .preview-divider {
      display: none;
    }
  }
}

.preview-item {
  text-align: center;
  
  h3 {
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }
  
  img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    object-fit: contain;
  }
  
  .preview-placeholder {
    padding: 3rem;
    background: var(--color-bg);
    border-radius: 8px;
    color: var(--color-text-secondary);
    font-style: italic;
  }
}

.preview-divider {
  width: 2px;
  height: 400px;
  background: var(--color-border);
  
  @media (max-width: 1024px) {
    display: none;
  }
}

// ===== NEU: Format Info Styles =====
.format-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #f5f5f5);
  border-radius: 4px;
  font-size: 0.85rem;
}

.format-description {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-secondary, #666);
}

.format-badge,
.backend-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.25rem;
}

.format-badge {
  background: var(--color-primary-light, #e3f2fd);
  color: var(--color-primary, #1976d2);
}

.backend-badge {
  background: var(--color-warning-light, #fff3e0);
  color: var(--color-warning, #f57c00);
}

// Dark Mode
.dark-mode {
  .format-info {
    background: var(--color-bg-tertiary, #2a2a2a);
  }
  
  .format-description {
    color: var(--color-text-secondary, #aaa);
  }
}
</style>
