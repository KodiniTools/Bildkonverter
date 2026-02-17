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
            accept="image/*,.tiff,.tif,.heic,.heif"
            @change="handleFileSelect"
            style="display: none"
          >
        </div>

        <div class="toolbar-section">
          <!-- Undo/Redo Buttons -->
          <button
            class="btn btn-secondary"
            @click="undo"
            :disabled="!canUndo"
            :title="$t('editor.toolbar.undo', 'Rückgängig')"
          >
            <i class="fas fa-undo"></i>
          </button>
          <button
            class="btn btn-secondary"
            @click="redo"
            :disabled="!canRedo"
            :title="$t('editor.toolbar.redo', 'Wiederholen')"
          >
            <i class="fas fa-redo"></i>
          </button>
          <span class="toolbar-divider"></span>
          <button
            class="btn btn-secondary"
            @click="addText"
            :disabled="!currentImage && !isCollageMode"
          >
            <i class="fas fa-font"></i>
            Text
          </button>
          <button
            class="btn btn-secondary"
            @click="openPreview"
            :disabled="!currentImage && !isCollageMode"
          >
            <i class="fas fa-eye"></i>
            {{ $t('editor.toolbar.preview', 'Vorschau') }}
          </button>
          <button
            class="btn btn-secondary"
            @click="resetFilters"
            :disabled="!currentImage && !isCollageMode"
          >
            <i class="fas fa-sync-alt"></i>
            {{ $t('editor.toolbar.reset') }}
          </button>
          <button
            class="btn btn-danger"
            @click="clearImage"
            :disabled="!currentImage && !isCollageMode"
            :title="$t('editor.toolbar.clearImage', 'Bild entfernen')"
          >
            <i class="fas fa-trash"></i>
            {{ $t('editor.toolbar.clearImage', 'Löschen') }}
          </button>
          <button
            class="btn btn-success"
            @click="downloadImage"
            :disabled="(!currentImage && !isCollageMode) || isExporting"
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

            <!-- Transparenter Hintergrund (für PNG) -->
            <div v-if="outputFormat === 'png'" class="filter-control checkbox-control">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="exportTransparent"
                >
                <span>{{ $t('editor.export.transparentBackground', 'Transparenter Hintergrund') }}</span>
              </label>
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

          <!-- Adjustments - Basis -->
          <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.adjustments }">
            <h3 @click="sectionsOpen.adjustments = !sectionsOpen.adjustments" class="section-header">
              <i class="fas fa-sliders-h section-icon"></i>
              {{ $t('editor.sidebar.adjustments') }}
              <i :class="sectionsOpen.adjustments ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
            </h3>

            <div class="section-content" v-show="sectionsOpen.adjustments">
              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.brightness') }}</span>
                  <span class="filter-value">{{ filters.brightness }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    v-model.number="filters.brightness"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.contrast') }}</span>
                  <span class="filter-value">{{ filters.contrast }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    v-model.number="filters.contrast"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.saturation') }}</span>
                  <span class="filter-value">{{ filters.saturation }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    v-model.number="filters.saturation"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.exposure', 'Belichtung') }}</span>
                  <span class="filter-value">{{ filters.exposure > 0 ? '+' : '' }}{{ filters.exposure }}</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    v-model.number="filters.exposure"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider center-zero"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Light & Color - Erweitert -->
          <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.lightColor }">
            <h3 @click="sectionsOpen.lightColor = !sectionsOpen.lightColor" class="section-header">
              <i class="fas fa-sun section-icon"></i>
              {{ $t('editor.sidebar.lightColor', 'Licht & Farbe') }}
              <i :class="sectionsOpen.lightColor ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
            </h3>

            <div class="section-content" v-show="sectionsOpen.lightColor">
              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.highlights', 'Lichter') }}</span>
                  <span class="filter-value">{{ filters.highlights > 0 ? '+' : '' }}{{ filters.highlights }}</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    v-model.number="filters.highlights"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider center-zero"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.shadows', 'Schatten') }}</span>
                  <span class="filter-value">{{ filters.shadows > 0 ? '+' : '' }}{{ filters.shadows }}</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    v-model.number="filters.shadows"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider center-zero"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.hue') }}</span>
                  <span class="filter-value">{{ filters.hue }}°</span>
                </label>
                <div class="slider-track hue-slider">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    v-model.number="filters.hue"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.sepia', 'Wärme') }}</span>
                  <span class="filter-value">{{ filters.sepia }}%</span>
                </label>
                <div class="slider-track warm-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    v-model.number="filters.sepia"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Effects - Effekte -->
          <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.effects }">
            <h3 @click="sectionsOpen.effects = !sectionsOpen.effects" class="section-header">
              <i class="fas fa-magic section-icon"></i>
              {{ $t('editor.sidebar.effects', 'Effekte') }}
              <i :class="sectionsOpen.effects ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
            </h3>

            <div class="section-content" v-show="sectionsOpen.effects">
              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.blur') }}</span>
                  <span class="filter-value">{{ filters.blur }}px</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    v-model.number="filters.blur"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.vignette', 'Vignette') }}</span>
                  <span class="filter-value">{{ filters.vignette }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    v-model.number="filters.vignette"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.grayscale', 'Graustufen') }}</span>
                  <span class="filter-value">{{ filters.grayscale }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    v-model.number="filters.grayscale"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>

              <div class="filter-control">
                <label>
                  <span class="filter-label">{{ $t('editor.filters.invert', 'Invertieren') }}</span>
                  <span class="filter-value">{{ filters.invert }}%</span>
                </label>
                <div class="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    v-model.number="filters.invert"
                    @input="renderImage"
                    @change="saveHistory"
                    class="modern-slider"
                  >
                </div>
              </div>
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
              <!-- Social Media Presets -->
              <div class="resize-presets">
                <label>{{ $t('editor.resize.presets', 'Presets') }}</label>
                <select
                  class="form-select form-select-sm"
                  @change="applySocialPreset($event.target.value); $event.target.value = ''"
                  :disabled="!currentImage"
                >
                  <option value="">{{ $t('editor.resize.selectPreset', 'Preset wählen...') }}</option>
                  <option value="instagram">📷 Instagram Post (1080×1080)</option>
                  <option value="instagramStory">📱 Instagram Story (1080×1920)</option>
                  <option value="facebook">👤 Facebook Post (1200×630)</option>
                  <option value="twitter">🐦 Twitter Post (1200×675)</option>
                  <option value="youtube">▶️ YouTube Thumbnail (1280×720)</option>
                  <option value="hd">🖥️ Full HD (1920×1080)</option>
                  <option value="4k">📺 4K UHD (3840×2160)</option>
                </select>
              </div>
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
        <div
          class="canvas-area"
          :class="{ 'drag-over': isDraggingFile }"
          @dragenter.prevent="isDraggingFile = true"
          @dragover.prevent="isDraggingFile = true"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleFileDrop"
        >
          <div v-if="!currentImage && !isCollageMode" class="empty-canvas">
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
            <!-- Crop Overlay mit Resize-Handles -->
            <div
              v-if="crop.cropping.value && scaledCropOverlayStyle"
              class="crop-overlay"
              :class="{ 'dragging': crop.isDragging.value, 'resizing': crop.isResizing.value }"
              :style="scaledCropOverlayStyle"
            >
              <!-- Resize Handles -->
              <div class="resize-handle handle-nw"></div>
              <div class="resize-handle handle-n"></div>
              <div class="resize-handle handle-ne"></div>
              <div class="resize-handle handle-e"></div>
              <div class="resize-handle handle-se"></div>
              <div class="resize-handle handle-s"></div>
              <div class="resize-handle handle-sw"></div>
              <div class="resize-handle handle-w"></div>
              <!-- Center Move Indicator -->
              <div class="move-indicator">
                <i class="fas fa-arrows-alt"></i>
              </div>
            </div>
            <div class="canvas-info">
              <span><i class="fas fa-expand-arrows-alt"></i> {{ imageWidth }} × {{ imageHeight }}px</span>
              <span><i class="fas fa-file"></i> {{ formatSize(imageSize) }}</span>
              <span><i class="fas fa-image"></i> {{ currentImageFormat.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Rechte Spalte: LayerControlPanel im Collage-Modus -->
        <LayerControlPanel
          v-if="isCollageMode"
          :canvas-selected-text-id="selectedTextId"
          @render="renderImage"
          @select-text="onSelectTextFromPanel"
          @preview="handleLayerPreview"
        />

        <!-- Rechte Spalte: TransformPanel (Text + Crop + Transform Features) - Normaler Modus -->
        <TransformPanel
          v-else-if="currentImage"
          :crop-mode="crop.cropMode.value"
          :has-cropped="crop.hasCropped.value"
          :selected-aspect-ratio="crop.selectedAspectRatio.value"
          :aspect-ratio-presets="ASPECT_RATIO_PRESETS"
          :transforms="transform.transforms.value"
          :can-pan="transform.canPan.value"
          :has-pan="transform.hasPan.value"
          :selected-text="selectedTextObject"
          :has-texts="imageStore.texts && imageStore.texts.length > 0"
          :can-undo-text="canUndoText"
          :can-redo-text="canRedoText"
          :can-undo-transform="transform.canUndoTransform.value"
          :can-redo-transform="transform.canRedoTransform.value"
          @toggle-crop="handleToggleCrop"
          @undo-crop="handleUndoCrop"
          @set-aspect-ratio="handleSetAspectRatio"
          @update:opacity="handleOpacityUpdate"
          @update:rotation="handleRotationUpdate"
          @update:scale="handleScaleUpdate"
          @update:border-radius="handleBorderRadiusUpdate"
          @update:border-width="handleBorderWidthUpdate"
          @update:border-color="handleBorderColorUpdate"
          @update:shadow-enabled="handleShadowEnabledUpdate"
          @update:shadow-offset-x="handleShadowOffsetXUpdate"
          @update:shadow-offset-y="handleShadowOffsetYUpdate"
          @update:shadow-blur="handleShadowBlurUpdate"
          @update:shadow-color="handleShadowColorUpdate"
          @update:shadow-opacity="handleShadowOpacityUpdate"
          @update:skew-x="handleSkewXUpdate"
          @update:skew-y="handleSkewYUpdate"
          @rotate-90="handleRotate90"
          @rotate-90-counter="handleRotate90Counter"
          @rotate-180="handleRotate180"
          @flip-horizontal="handleFlipHorizontal"
          @flip-vertical="handleFlipVertical"
          @reset-pan="handleResetPan"
          @undo-transform="handleUndoTransform"
          @redo-transform="handleRedoTransform"
          @commit-transform="handleCommitTransform"
          @update:text-content="handleTextContentUpdate"
          @update:text-font-size="handleTextFontSizeUpdate"
          @update:text-font-family="handleTextFontFamilyUpdate"
          @update:text-color="handleTextColorUpdate"
          @update:text-rotation="handleTextRotationUpdate"
          @update:text-opacity="handleTextOpacityUpdate"
          @update:text-stroke-width="handleTextStrokeWidthUpdate"
          @update:text-stroke-color="handleTextStrokeColorUpdate"
          @update:text-shadow-blur="handleTextShadowBlurUpdate"
          @update:text-shadow-offset-x="handleTextShadowOffsetXUpdate"
          @update:text-shadow-offset-y="handleTextShadowOffsetYUpdate"
          @update:text-shadow-color="handleTextShadowColorUpdate"
          @save-text-history="handleSaveTextHistory"
          @undo-text="handleUndoText"
          @redo-text="handleRedoText"
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

          <div class="preview-comparison">
            <div class="preview-item">
              <h3>{{ $t('editor.preview.before', 'Before (Original)') }}</h3>
              <img v-if="originalPreviewSrc" :src="originalPreviewSrc" alt="Original" />
              <div v-else class="preview-placeholder">{{ $t('editor.preview.noOriginal', 'No original available') }}</div>
            </div>

            <div class="preview-divider"></div>

            <div class="preview-item">
              <h3>{{ $t('editor.preview.after', 'After (Edited)') }}</h3>
              <img v-if="editedPreviewSrc" :src="editedPreviewSrc" alt="Edited" />
              <div v-else class="preview-placeholder">{{ $t('editor.preview.noEdited', 'No edits available') }}</div>
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
import { useCrop, ASPECT_RATIO_PRESETS } from '@/composables/useCrop'
import { useTransform } from '@/composables/useTransform'
import { useFilterManagement, DEFAULT_FILTERS, DEFAULT_BACKGROUND } from '@/composables/useFilterManagement'
import { useImageHistory } from '@/composables/useImageHistory'
import { useTextHistory } from '@/composables/useTextHistory'
import { useResizeManager } from '@/composables/useResizeManager'
import { useGalleryIntegration } from '@/composables/useGalleryIntegration'
import { useImageLayerInteraction } from '@/composables/useImageLayerInteraction'
import TransformPanel from '@/components/features/TransformPanel.vue'
import LayerControlPanel from '@/components/features/LayerControlPanel.vue'
import FilterPresets from '@/components/editor/FilterPresets.vue'

// ===== NEU: Export Utils Import =====
import { exportImage, FORMAT_INFO, SUPPORTED_FORMATS, getFormatInfo } from '@/utils/exportUtils'
import { ApiClient } from '@/api/api'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const imageStore = useImageStore()
const textModal = useTextModal()

// ===== CORE REFS =====
const fileInput = ref(null)
const canvas = ref(null)
const currentImage = ref(null)
const originalImage = ref(null)
const originalImageDataUrl = ref('') // Speichert das Original als Data URL
const outputFormat = ref('png')
const currentImageFormat = ref('') // Format des hochgeladenen Bildes

// ===== EXPORT STATE =====
const exportQuality = ref(92) // Quality-Wert (0-100)
const isExporting = ref(false) // Loading-State beim Export
const exportTransparent = ref(false) // Transparenter Hintergrund beim PNG-Export

// ===== TEXT INTERACTION STATE =====
const selectedTextId = ref(null)
const isDraggingText = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// ===== PAN INTERACTION STATE =====
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const isSpacePressed = ref(false)

// ===== PREVIEW MODAL STATE =====
const showPreviewModal = ref(false)
const originalPreviewSrc = ref('')
const editedPreviewSrc = ref('')
const previewUpdateTrigger = ref(0)

// ===== COLLAGE MODE STATE =====
const isCollageMode = ref(false)

// ===== DRAG & DROP STATE =====
const isDraggingFile = ref(false)

// ===== COMPOSABLES =====

// Crop Composable
const crop = useCrop()

// Transform Composable
const transform = useTransform()

// Filter Management Composable
const filterManagement = useFilterManagement({
  onFilterChange: () => renderImage()
})
const { filters, background, sectionsOpen, currentPreset } = filterManagement

// Image History Composable
const imageHistory = useImageHistory({
  maxHistorySize: 50,
  onRestore: (state) => restoreState(state)
})
const { history, historyIndex, canUndo, canRedo } = imageHistory

// Text History Composable (separate History für Text mit 50 Schritten)
const textHistory = useTextHistory({
  getTexts: () => imageStore.texts,
  setTexts: (texts) => { imageStore.texts = texts },
  getSelectedTextId: () => selectedTextId.value,
  setSelectedTextId: (id) => { selectedTextId.value = id }
})
const { canUndoText, canRedoText, saveTextHistory, initTextHistory, undoText, redoText } = textHistory

// Resize Manager Composable
const resizeManager = useResizeManager({
  getCurrentDimensions: () => ({
    width: canvas.value?.width || 0,
    height: canvas.value?.height || 0
  }),
  onResize: (dimensions) => {
    // Resize wird in applyResize() gehandhabt
  }
})
const { resizeWidth, resizeHeight, maintainAspectRatio } = resizeManager

// Gallery Integration Composable
const galleryIntegration = useGalleryIntegration({
  onImageLoad: async (imageData) => {
    await loadImageFromUrl(imageData.url, imageData.name)
  },
  onError: (error) => {
    console.error('Gallery load error:', error)
  }
})

// Image Layer Interaction Composable (für Collage-Modus)
const layerInteraction = useImageLayerInteraction(canvas)

// ===== NEU: Verwende SUPPORTED_FORMATS aus exportUtils =====
const formats = SUPPORTED_FORMATS

// Computed (canUndo, canRedo kommen jetzt vom imageHistory Composable)

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

/**
 * Checks if a file needs backend conversion for browser display (TIFF/HEIC)
 */
function needsBackendPreview(file) {
  const unsupportedTypes = ['image/tiff', 'image/heic', 'image/heif']
  if (unsupportedTypes.includes(file.type)) return true
  return /\.(tiff?|heic|heif)$/i.test(file.name)
}

/**
 * Loads a file into the editor canvas, converting via backend if needed
 */
async function loadFileIntoEditor(file) {
  const fileType = file.type ? file.type.split('/')[1] : file.name.split('.').pop().toLowerCase()
  currentImageFormat.value = fileType === 'jpeg' ? 'jpg' : fileType

  let imageUrl
  if (needsBackendPreview(file)) {
    // Browser can't display TIFF/HEIC – convert to PNG via backend
    const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {})
    imageUrl = URL.createObjectURL(pngBlob)
  } else {
    imageUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }

  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    i.src = imageUrl
  })

  originalImageDataUrl.value = imageUrl
  originalImage.value = img
  await loadImage(img)

  // Also save in store for persistence
  try {
    await imageStore.loadImageFromFile(file)
  } catch (err) {
    console.warn('Store save failed:', err)
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  loadFileIntoEditor(file).catch(err => console.error('Fehler beim Laden:', err))
}

/**
 * Handles drag leave events to properly reset drag state
 * Only resets when actually leaving the canvas-area (not child elements)
 */
function handleDragLeave(event) {
  // Check if we're actually leaving the canvas-area
  const canvasArea = event.currentTarget
  const relatedTarget = event.relatedTarget

  // Only reset if we're leaving to an element outside the canvas-area
  if (!canvasArea.contains(relatedTarget)) {
    isDraggingFile.value = false
  }
}

/**
 * Handles file drop on the canvas area
 * Validates that the dropped item is an image file before loading
 */
function handleFileDrop(event) {
  isDraggingFile.value = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]

  // Validate that it's an image file (also check extension for TIFF/HEIC where MIME may be empty)
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg|tiff?|heic|heif)$/i.test(file.name)
  if (!isImage) {
    console.warn('Dropped file is not an image:', file.type)
    return
  }

  loadFileIntoEditor(file).catch(err => console.error('Fehler beim Laden:', err))
}

async function loadImage(img) {
  currentImage.value = img

  // Reset Crop-Zustand über Composable
  crop.resetCropState()

  // Initialisiere Transform-History für neues Bild
  transform.initTransformHistory()
  
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

  // Initialisiere ResizeManager mit korrektem Seitenverhältnis
  resizeManager.initFromDimensions(width, height)

  renderImage()
  updateImageInfo()
  saveHistory()
  initTextHistory() // Initialisiere Text-History für neues Bild
}

/**
 * Zeichnet den Auswahl-Rahmen für einen Bild-Layer (Collage-Modus)
 */
function drawLayerSelection(context, layer) {
  context.save()

  // Rotation für Auswahl-Rahmen
  if (layer.rotation !== 0) {
    const centerX = layer.x + layer.width / 2
    const centerY = layer.y + layer.height / 2
    context.translate(centerX, centerY)
    context.rotate((layer.rotation * Math.PI) / 180)
    context.translate(-centerX, -centerY)
  }

  // Gestrichelter Rahmen
  context.strokeStyle = '#014f99'
  context.lineWidth = 2
  context.setLineDash([5, 5])
  context.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4)

  // Resize-Handles
  context.setLineDash([])
  context.fillStyle = '#014f99'
  const handleSize = 8
  const handles = [
    { x: layer.x - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 }
  ]

  handles.forEach(pos => {
    context.fillRect(pos.x, pos.y, handleSize, handleSize)
  })

  context.restore()
}

function renderImage() {
  // Im Collage-Modus benutze den imageStore zum Zeichnen
  if (isCollageMode.value && imageStore.hasImageLayers) {
    if (!canvas.value) return

    const ctx = canvas.value.getContext('2d')
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Hintergrund zeichnen (Canvas-Hintergrundfarbe aus imageStore für Collage-Modus)
    const bgColor = imageStore.canvasBackgroundColor
    if (bgColor && bgColor !== 'transparent') {
      ctx.save()
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
      ctx.restore()
    }

    // Layer direkt zeichnen (ohne Canvas zu löschen)
    imageStore.imageLayers.forEach(layer => {
      if (!layer.visible) return
      if (!layer.image || !layer.image.complete) {
        console.warn(`Layer "${layer.name}" hat kein gültiges Bild`)
        return
      }

      ctx.save()

      // Deckkraft
      ctx.globalAlpha = layer.opacity / 100

      // Filter für diesen Layer
      const filterParts = []
      if (layer.filters.brightness !== 100) filterParts.push(`brightness(${layer.filters.brightness}%)`)
      if (layer.filters.contrast !== 100) filterParts.push(`contrast(${layer.filters.contrast}%)`)
      if (layer.filters.saturation !== 100) filterParts.push(`saturate(${layer.filters.saturation}%)`)
      if (layer.filters.grayscale > 0) filterParts.push(`grayscale(${layer.filters.grayscale}%)`)
      if (layer.filters.sepia > 0) filterParts.push(`sepia(${layer.filters.sepia}%)`)
      ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none'

      // Rotation um Mittelpunkt
      if (layer.rotation !== 0) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      // Spiegelung (horizontal und/oder vertikal)
      if (layer.flipX || layer.flipY) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1)
        ctx.translate(-centerX, -centerY)
      }

      // Schlagschatten für Layer - MUSS VOR dem Clipping gezeichnet werden
      const hasShadow = layer.shadow && layer.shadow.enabled
      const borderRadiusPercent = layer.border?.radius || 0

      if (hasShadow && borderRadiusPercent > 0) {
        // Bei abgerundeten Ecken: Schatten als separate Form zeichnen
        ctx.save()
        const shadowOpacity = (layer.shadow.opacity || 50) / 100
        const hexColor = layer.shadow.color || '#000000'
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)

        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
        ctx.shadowBlur = layer.shadow.blur || 10
        ctx.shadowOffsetX = layer.shadow.offsetX || 5
        ctx.shadowOffsetY = layer.shadow.offsetY || 5

        // Schattenform als abgerundetes Rechteck zeichnen
        const rx = layer.x
        const ry = layer.y
        const rw = layer.width
        const rh = layer.height
        const minDimension = Math.min(rw, rh)
        const rad = (borderRadiusPercent / 100) * (minDimension / 2)

        // WICHTIG: Muss mit deckender Farbe gefüllt werden, damit Schatten sichtbar ist
        // Die Form wird später vom geclippten Bild überdeckt
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(rx + rad, ry)
        ctx.lineTo(rx + rw - rad, ry)
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
        ctx.lineTo(rx + rw, ry + rh - rad)
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
        ctx.lineTo(rx + rad, ry + rh)
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
        ctx.lineTo(rx, ry + rad)
        ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else if (hasShadow) {
        // Ohne Radius: Schatten normal setzen
        const shadowOpacity = (layer.shadow.opacity || 50) / 100
        const hexColor = layer.shadow.color || '#000000'
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
        ctx.shadowBlur = layer.shadow.blur || 10
        ctx.shadowOffsetX = layer.shadow.offsetX || 5
        ctx.shadowOffsetY = layer.shadow.offsetY || 5
      }

      // Umrandung mit Radius
      const borderWidth = layer.border?.width || 0

      if (borderRadiusPercent > 0) {
        // Clipping-Pfad für abgerundete Ecken
        ctx.save()

        // Schatten zurücksetzen für geclipptes Bild (wurde bereits separat gezeichnet)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        ctx.beginPath()
        const rx = layer.x
        const ry = layer.y
        const rw = layer.width
        const rh = layer.height
        // Konvertiere Prozent in Pixel (basierend auf kleinerer Dimension)
        const minDimension = Math.min(rw, rh)
        const rad = (borderRadiusPercent / 100) * (minDimension / 2)
        ctx.moveTo(rx + rad, ry)
        ctx.lineTo(rx + rw - rad, ry)
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
        ctx.lineTo(rx + rw, ry + rh - rad)
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
        ctx.lineTo(rx + rad, ry + rh)
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
        ctx.lineTo(rx, ry + rad)
        ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
        ctx.closePath()
        ctx.clip()

        // Bild zeichnen (innerhalb des Clipping-Pfads)
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)

        ctx.restore()

        // Schatten zurücksetzen für Umrandung
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Umrandung zeichnen (außerhalb des Clips)
        if (borderWidth > 0) {
          ctx.strokeStyle = layer.border?.color || '#000000'
          ctx.lineWidth = borderWidth
          ctx.beginPath()
          ctx.moveTo(rx + rad, ry)
          ctx.lineTo(rx + rw - rad, ry)
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
          ctx.lineTo(rx + rw, ry + rh - rad)
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
          ctx.lineTo(rx + rad, ry + rh)
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
          ctx.lineTo(rx, ry + rad)
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
          ctx.closePath()
          ctx.stroke()
        }
      } else {
        // Bild ohne abgerundete Ecken zeichnen
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)

        // Schatten zurücksetzen für Umrandung
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Rechteckige Umrandung zeichnen
        if (borderWidth > 0) {
          ctx.strokeStyle = layer.border?.color || '#000000'
          ctx.lineWidth = borderWidth
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height)
        }
      }

      ctx.restore()

      // Auswahl-Rahmen zeichnen
      if (layer.id === imageStore.selectedLayerId) {
        drawLayerSelection(ctx, layer)
      }
    })

    // Texte zeichnen
    ctx.filter = 'none'
    if (imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach(text => {
        ctx.save()
        const opacity = text.opacity !== undefined ? text.opacity : 100
        ctx.globalAlpha = opacity / 100
        const fontSize = text.fontSize || text.size || 32
        ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`
        ctx.fillStyle = text.color || '#000000'
        ctx.textBaseline = 'top'

        // Rotation um Textmittelpunkt
        if (text.rotation && text.rotation !== 0) {
          const metrics = ctx.measureText(text.content || text.txt || '')
          const centerX = (text.x || 0) + metrics.width / 2
          const centerY = (text.y || 0) + fontSize / 2
          ctx.translate(centerX, centerY)
          ctx.rotate((text.rotation * Math.PI) / 180)
          ctx.translate(-centerX, -centerY)
        }

        // Schatten
        if (text.shadowBlur && text.shadowBlur > 0) {
          ctx.shadowColor = text.shadowColor || '#000000'
          ctx.shadowBlur = text.shadowBlur
          ctx.shadowOffsetX = text.shadowOffsetX || 2
          ctx.shadowOffsetY = text.shadowOffsetY || 2
        }

        // Text mit Kontur (Stroke) zeichnen
        if (text.strokeWidth && text.strokeWidth > 0) {
          ctx.strokeStyle = text.strokeColor || '#000000'
          ctx.lineWidth = text.strokeWidth
          ctx.lineJoin = 'round'
          ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0)
        }

        // Text füllen
        ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0)

        // Auswahl-Rahmen für selektierten Text
        if (text.id === selectedTextId.value) {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          const metrics = ctx.measureText(text.content || text.txt || '')
          ctx.strokeStyle = '#007bff'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.strokeRect(
            (text.x || 0) - 4,
            (text.y || 0) - 4,
            metrics.width + 8,
            fontSize + 8
          )
          ctx.setLineDash([])
        }

        ctx.restore()
      })
    }

    updateImageDimensions()
    return
  }

  if (!canvas.value || !currentImage.value) return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Berechne Shadow-Padding wenn Schatten aktiviert ist
  let shadowPadding = 0
  if (transform.transforms.value.shadowEnabled) {
    const offsetX = Math.abs(transform.transforms.value.shadowOffsetX)
    const offsetY = Math.abs(transform.transforms.value.shadowOffsetY)
    const blur = transform.transforms.value.shadowBlur
    // Padding = max(offset) + blur + extra margin
    shadowPadding = Math.max(offsetX, offsetY) + blur + 10
  }

  // Berechne Skew-Padding damit das geskewte Bild nicht abgeschnitten wird
  let skewPadX = 0
  let skewPadY = 0
  if (transform.transforms.value.skewX !== 0 || transform.transforms.value.skewY !== 0) {
    skewPadX = Math.ceil(Math.abs(Math.tan(transform.transforms.value.skewX * Math.PI / 180)) * canvas.value.height / 2)
    skewPadY = Math.ceil(Math.abs(Math.tan(transform.transforms.value.skewY * Math.PI / 180)) * canvas.value.width / 2)
  }

  // Berechne Rotations-Padding damit das rotierte Bild nicht abgeschnitten wird
  let rotPadX = 0
  let rotPadY = 0
  if (transform.transforms.value.rotation !== 0) {
    const radians = (transform.transforms.value.rotation * Math.PI) / 180
    const cos = Math.abs(Math.cos(radians))
    const sin = Math.abs(Math.sin(radians))
    const w = canvas.value.width - (shadowPadding + skewPadX) * 2
    const h = canvas.value.height - (shadowPadding + skewPadY) * 2
    const rotatedW = w * cos + h * sin
    const rotatedH = w * sin + h * cos
    rotPadX = Math.ceil((rotatedW - w) / 2)
    rotPadY = Math.ceil((rotatedH - h) / 2)
  }

  // Berechne Bildbereich mit Padding (Shadow + Skew + Rotation)
  const totalPadX = shadowPadding + skewPadX + rotPadX
  const totalPadY = shadowPadding + skewPadY + rotPadY
  const drawX = totalPadX
  const drawY = totalPadY
  const drawWidth = canvas.value.width - (totalPadX * 2)
  const drawHeight = canvas.value.height - (totalPadY * 2)

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

  // Apply filters (inkl. neue Filter)
  // Berechne erweiterte Werte für Exposure, Highlights, Shadows
  const exposureAdjust = 100 + filters.value.exposure
  const highlightsAdjust = 100 + (filters.value.highlights * 0.5)
  const shadowsAdjust = 100 + (filters.value.shadows * 0.3)

  const filterString = `
    brightness(${filters.value.brightness * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)
    contrast(${filters.value.contrast * (shadowsAdjust / 100)}%)
    saturate(${filters.value.saturation}%)
    blur(${filters.value.blur}px)
    hue-rotate(${filters.value.hue}deg)
    sepia(${filters.value.sepia}%)
    grayscale(${filters.value.grayscale}%)
    invert(${filters.value.invert}%)
  `

  ctx.filter = filterString

  // Berechne BorderRadius in Pixeln für den Zeichenbereich
  const getBorderRadiusForDraw = () => {
    const radiusPercent = transform.transforms.value.borderRadius
    const minDimension = Math.min(drawWidth, drawHeight)
    return (radiusPercent / 100) * minDimension
  }

  // Schlagschatten (Drop Shadow) - muss VOR dem Clipping gezeichnet werden
  if (transform.transforms.value.shadowEnabled) {
    ctx.save()
    // Reset filter für Schatten
    ctx.filter = 'none'

    // Berechne Schatten-Farbe mit Deckkraft
    const shadowOpacity = transform.transforms.value.shadowOpacity / 100
    const shadowColor = transform.transforms.value.shadowColor
    // Konvertiere Hex zu RGBA
    const r = parseInt(shadowColor.slice(1, 3), 16)
    const g = parseInt(shadowColor.slice(3, 5), 16)
    const b = parseInt(shadowColor.slice(5, 7), 16)

    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
    ctx.shadowBlur = transform.transforms.value.shadowBlur
    ctx.shadowOffsetX = transform.transforms.value.shadowOffsetX
    ctx.shadowOffsetY = transform.transforms.value.shadowOffsetY

    // Zeichne die Schatten-Form (abhängig von borderRadius) - mit Padding
    ctx.fillStyle = 'rgba(0, 0, 0, 1)' // Nur für die Schatten-Silhouette
    if (transform.transforms.value.borderRadius >= 50) {
      // Kreis-Schatten
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
    } else if (transform.transforms.value.borderRadius > 0) {
      // Abgerundetes Rechteck-Schatten
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.fill()
    } else {
      // Normales Rechteck-Schatten
      ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
    }
    ctx.restore()

    // Filter wieder anwenden
    ctx.filter = filterString
  }

  // Border Radius (abgerundete Ecken)
  if (transform.transforms.value.borderRadius > 0) {
    ctx.save()
    if (transform.transforms.value.borderRadius >= 50) {
      // Vollständiger Kreis-Clip (50% = perfekter Kreis)
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.clip()
    } else {
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.clip()
    }
  }

  ctx.drawImage(currentImage.value, drawX, drawY, drawWidth, drawHeight)

  // Border zeichnen
  if (transform.transforms.value.borderWidth > 0) {
    ctx.strokeStyle = transform.transforms.value.borderColor
    ctx.lineWidth = transform.transforms.value.borderWidth
    if (transform.transforms.value.borderRadius >= 50) {
      // Vollständiger Kreis (50% = perfekter Kreis)
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2 - transform.transforms.value.borderWidth / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (transform.transforms.value.borderRadius > 0) {
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.stroke()
    } else {
      ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
    }
  }

  if (transform.transforms.value.borderRadius > 0) {
    ctx.restore()
  }

  // Vignette-Effekt anwenden
  if (filters.value.vignette > 0) {
    ctx.save()
    const vignetteStrength = filters.value.vignette / 100
    const centerX = canvas.value.width / 2
    const centerY = canvas.value.height / 2
    const radius = Math.max(centerX, centerY) * (1.5 - vignetteStrength * 0.5)

    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${vignetteStrength * 0.3})`)
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength * 0.8})`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
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

      // Deckkraft anwenden
      const opacity = text.opacity !== undefined ? text.opacity : 100
      ctx.globalAlpha = opacity / 100

      ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`
      ctx.fillStyle = text.color || '#000000'
      ctx.textBaseline = 'top'

      // Schatten anwenden
      if (text.shadowBlur && text.shadowBlur > 0) {
        ctx.shadowColor = text.shadowColor || '#000000'
        ctx.shadowBlur = text.shadowBlur
        ctx.shadowOffsetX = text.shadowOffsetX || 2
        ctx.shadowOffsetY = text.shadowOffsetY || 2
      }

      // Rotation anwenden (um den Textmittelpunkt)
      const rotation = text.rotation || 0
      if (rotation !== 0) {
        const textMetrics = ctx.measureText(text.content || text.txt || '')
        const textWidth = textMetrics.width
        const textHeight = text.fontSize || text.size || 32
        const centerX = (text.x || 0) + textWidth / 2
        const centerY = (text.y || 0) + textHeight / 2

        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      // Umrandung (Stroke) zeichnen
      if (text.strokeWidth && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor || '#000000'
        ctx.lineWidth = text.strokeWidth
        ctx.lineJoin = 'round'
        ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0)
      }

      // Text füllen
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
function renderImageForExport(forceTransparent = false) {
  // Im Collage-Modus: Zeichne Layer direkt ohne Auswahl-Markierung
  if (isCollageMode.value && imageStore.hasImageLayers) {
    const ctx = canvas.value.getContext('2d')
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Hintergrund zeichnen (nur wenn nicht transparent forciert wird)
    const bgColor = imageStore.canvasBackgroundColor
    if (!forceTransparent && bgColor && bgColor !== 'transparent') {
      ctx.save()
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
      ctx.restore()
    }

    // Layer direkt zeichnen (ohne Auswahl-Markierung für Export)
    imageStore.imageLayers.forEach(layer => {
      if (!layer.visible) return
      if (!layer.image || !layer.image.complete) return

      ctx.save()

      // Deckkraft
      ctx.globalAlpha = layer.opacity / 100

      // Filter für diesen Layer
      const filterParts = []
      if (layer.filters.brightness !== 100) filterParts.push(`brightness(${layer.filters.brightness}%)`)
      if (layer.filters.contrast !== 100) filterParts.push(`contrast(${layer.filters.contrast}%)`)
      if (layer.filters.saturation !== 100) filterParts.push(`saturate(${layer.filters.saturation}%)`)
      if (layer.filters.grayscale > 0) filterParts.push(`grayscale(${layer.filters.grayscale}%)`)
      if (layer.filters.sepia > 0) filterParts.push(`sepia(${layer.filters.sepia}%)`)
      ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none'

      // Rotation um Mittelpunkt
      if (layer.rotation !== 0) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      // Spiegelung (horizontal und/oder vertikal)
      if (layer.flipX || layer.flipY) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1)
        ctx.translate(-centerX, -centerY)
      }

      // Schlagschatten für Layer - MUSS VOR dem Clipping gezeichnet werden
      const hasShadow = layer.shadow && layer.shadow.enabled
      const borderRadiusPercent = layer.border?.radius || 0

      if (hasShadow && borderRadiusPercent > 0) {
        // Bei abgerundeten Ecken: Schatten als separate Form zeichnen
        ctx.save()
        const shadowOpacity = (layer.shadow.opacity || 50) / 100
        const hexColor = layer.shadow.color || '#000000'
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)

        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
        ctx.shadowBlur = layer.shadow.blur || 10
        ctx.shadowOffsetX = layer.shadow.offsetX || 5
        ctx.shadowOffsetY = layer.shadow.offsetY || 5

        // Schattenform als abgerundetes Rechteck zeichnen
        const rx = layer.x
        const ry = layer.y
        const rw = layer.width
        const rh = layer.height
        const minDimension = Math.min(rw, rh)
        const rad = (borderRadiusPercent / 100) * (minDimension / 2)

        // WICHTIG: Muss mit deckender Farbe gefüllt werden, damit Schatten sichtbar ist
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(rx + rad, ry)
        ctx.lineTo(rx + rw - rad, ry)
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
        ctx.lineTo(rx + rw, ry + rh - rad)
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
        ctx.lineTo(rx + rad, ry + rh)
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
        ctx.lineTo(rx, ry + rad)
        ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else if (hasShadow) {
        const shadowOpacity = (layer.shadow.opacity || 50) / 100
        const hexColor = layer.shadow.color || '#000000'
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
        ctx.shadowBlur = layer.shadow.blur || 10
        ctx.shadowOffsetX = layer.shadow.offsetX || 5
        ctx.shadowOffsetY = layer.shadow.offsetY || 5
      }

      // Umrandung mit Radius
      const borderWidth = layer.border?.width || 0

      if (borderRadiusPercent > 0) {
        // Clipping-Pfad für abgerundete Ecken
        ctx.save()

        // Schatten zurücksetzen für geclipptes Bild
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        ctx.beginPath()
        const rx = layer.x
        const ry = layer.y
        const rw = layer.width
        const rh = layer.height
        const minDimension = Math.min(rw, rh)
        const rad = (borderRadiusPercent / 100) * (minDimension / 2)
        ctx.moveTo(rx + rad, ry)
        ctx.lineTo(rx + rw - rad, ry)
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
        ctx.lineTo(rx + rw, ry + rh - rad)
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
        ctx.lineTo(rx + rad, ry + rh)
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
        ctx.lineTo(rx, ry + rad)
        ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)
        ctx.restore()

        // Schatten zurücksetzen für Umrandung
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        if (borderWidth > 0) {
          ctx.strokeStyle = layer.border?.color || '#000000'
          ctx.lineWidth = borderWidth
          ctx.beginPath()
          ctx.moveTo(rx + rad, ry)
          ctx.lineTo(rx + rw - rad, ry)
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
          ctx.lineTo(rx + rw, ry + rh - rad)
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
          ctx.lineTo(rx + rad, ry + rh)
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
          ctx.lineTo(rx, ry + rad)
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
          ctx.closePath()
          ctx.stroke()
        }
      } else {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        if (borderWidth > 0) {
          ctx.strokeStyle = layer.border?.color || '#000000'
          ctx.lineWidth = borderWidth
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height)
        }
      }

      ctx.restore()
    })

    // Texte zeichnen für Export
    ctx.filter = 'none'
    if (imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach(text => {
        ctx.save()
        const opacity = text.opacity !== undefined ? text.opacity : 100
        ctx.globalAlpha = opacity / 100
        const fontSize = text.fontSize || text.size || 32
        ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`
        ctx.fillStyle = text.color || '#000000'
        ctx.textBaseline = 'top'

        // Rotation um Textmittelpunkt
        if (text.rotation && text.rotation !== 0) {
          const metrics = ctx.measureText(text.content || text.txt || '')
          const centerX = (text.x || 0) + metrics.width / 2
          const centerY = (text.y || 0) + fontSize / 2
          ctx.translate(centerX, centerY)
          ctx.rotate((text.rotation * Math.PI) / 180)
          ctx.translate(-centerX, -centerY)
        }

        // Schatten
        if (text.shadowBlur && text.shadowBlur > 0) {
          ctx.shadowColor = text.shadowColor || '#000000'
          ctx.shadowBlur = text.shadowBlur
          ctx.shadowOffsetX = text.shadowOffsetX || 2
          ctx.shadowOffsetY = text.shadowOffsetY || 2
        }

        // Text mit Kontur (Stroke) zeichnen
        if (text.strokeWidth && text.strokeWidth > 0) {
          ctx.strokeStyle = text.strokeColor || '#000000'
          ctx.lineWidth = text.strokeWidth
          ctx.lineJoin = 'round'
          ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0)
        }

        // Text füllen
        ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0)
        ctx.restore()
      })
    }

    return
  }

  if (!canvas.value || !currentImage.value) return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Berechne Shadow-Padding wenn Schatten aktiviert ist
  let shadowPadding = 0
  if (transform.transforms.value.shadowEnabled) {
    const offsetX = Math.abs(transform.transforms.value.shadowOffsetX)
    const offsetY = Math.abs(transform.transforms.value.shadowOffsetY)
    const blur = transform.transforms.value.shadowBlur
    shadowPadding = Math.max(offsetX, offsetY) + blur + 10
  }

  // Berechne Skew-Padding damit das geskewte Bild nicht abgeschnitten wird
  let skewPadX = 0
  let skewPadY = 0
  if (transform.transforms.value.skewX !== 0 || transform.transforms.value.skewY !== 0) {
    skewPadX = Math.ceil(Math.abs(Math.tan(transform.transforms.value.skewX * Math.PI / 180)) * canvas.value.height / 2)
    skewPadY = Math.ceil(Math.abs(Math.tan(transform.transforms.value.skewY * Math.PI / 180)) * canvas.value.width / 2)
  }

  // Berechne Rotations-Padding damit das rotierte Bild nicht abgeschnitten wird
  let rotPadX = 0
  let rotPadY = 0
  if (transform.transforms.value.rotation !== 0) {
    const radians = (transform.transforms.value.rotation * Math.PI) / 180
    const cos = Math.abs(Math.cos(radians))
    const sin = Math.abs(Math.sin(radians))
    const w = canvas.value.width - (shadowPadding + skewPadX) * 2
    const h = canvas.value.height - (shadowPadding + skewPadY) * 2
    const rotatedW = w * cos + h * sin
    const rotatedH = w * sin + h * cos
    rotPadX = Math.ceil((rotatedW - w) / 2)
    rotPadY = Math.ceil((rotatedH - h) / 2)
  }

  // Berechne Bildbereich mit Padding (Shadow + Skew + Rotation)
  const totalPadX = shadowPadding + skewPadX + rotPadX
  const totalPadY = shadowPadding + skewPadY + rotPadY
  const drawX = totalPadX
  const drawY = totalPadY
  const drawWidth = canvas.value.width - (totalPadX * 2)
  const drawHeight = canvas.value.height - (totalPadY * 2)

  // Hintergrund zeichnen (nur wenn nicht transparent forciert wird)
  if (!forceTransparent && background.value.opacity > 0) {
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

  // Berechne BorderRadius in Pixeln für den Zeichenbereich
  const getBorderRadiusForDraw = () => {
    const radiusPercent = transform.transforms.value.borderRadius
    const minDimension = Math.min(drawWidth, drawHeight)
    return (radiusPercent / 100) * minDimension
  }

  // Schlagschatten (Drop Shadow) für Export
  if (transform.transforms.value.shadowEnabled) {
    ctx.save()
    ctx.filter = 'none'

    const shadowOpacity = transform.transforms.value.shadowOpacity / 100
    const shadowColor = transform.transforms.value.shadowColor
    const r = parseInt(shadowColor.slice(1, 3), 16)
    const g = parseInt(shadowColor.slice(3, 5), 16)
    const b = parseInt(shadowColor.slice(5, 7), 16)

    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`
    ctx.shadowBlur = transform.transforms.value.shadowBlur
    ctx.shadowOffsetX = transform.transforms.value.shadowOffsetX
    ctx.shadowOffsetY = transform.transforms.value.shadowOffsetY

    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    if (transform.transforms.value.borderRadius >= 50) {
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
    } else if (transform.transforms.value.borderRadius > 0) {
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.fill()
    } else {
      ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
    }
    ctx.restore()
    ctx.filter = filterString
  }

  // Border Radius
  if (transform.transforms.value.borderRadius > 0) {
    ctx.save()
    if (transform.transforms.value.borderRadius >= 50) {
      // Vollständiger Kreis-Clip (50% = perfekter Kreis)
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.clip()
    } else {
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.clip()
    }
  }

  ctx.drawImage(currentImage.value, drawX, drawY, drawWidth, drawHeight)

  // Border
  if (transform.transforms.value.borderWidth > 0) {
    ctx.strokeStyle = transform.transforms.value.borderColor
    ctx.lineWidth = transform.transforms.value.borderWidth
    if (transform.transforms.value.borderRadius >= 50) {
      // Vollständiger Kreis (50% = perfekter Kreis)
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      const radius = Math.min(drawWidth, drawHeight) / 2 - transform.transforms.value.borderWidth / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (transform.transforms.value.borderRadius > 0) {
      roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw())
      ctx.stroke()
    } else {
      ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
    }
  }

  if (transform.transforms.value.borderRadius > 0) {
    ctx.restore()
  }

  ctx.filter = 'none'

  if (restoreTransform) {
    restoreTransform()
  }

  // Texte OHNE Auswahl-Markierung (mit Rotation, Deckkraft, Umrandung und Schatten)
  if (imageStore.texts && imageStore.texts.length > 0) {
    imageStore.texts.forEach(text => {
      ctx.save()

      // Deckkraft anwenden
      const opacity = text.opacity !== undefined ? text.opacity : 100
      ctx.globalAlpha = opacity / 100

      ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`
      ctx.fillStyle = text.color || '#000000'
      ctx.textBaseline = 'top'

      // Schatten anwenden
      if (text.shadowBlur && text.shadowBlur > 0) {
        ctx.shadowColor = text.shadowColor || '#000000'
        ctx.shadowBlur = text.shadowBlur
        ctx.shadowOffsetX = text.shadowOffsetX || 2
        ctx.shadowOffsetY = text.shadowOffsetY || 2
      }

      // Rotation anwenden (um den Textmittelpunkt)
      const rotation = text.rotation || 0
      if (rotation !== 0) {
        const textMetrics = ctx.measureText(text.content || text.txt || '')
        const textWidth = textMetrics.width
        const textHeight = text.fontSize || text.size || 32
        const centerX = (text.x || 0) + textWidth / 2
        const centerY = (text.y || 0) + textHeight / 2

        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      // Umrandung (Stroke) zeichnen
      if (text.strokeWidth && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor || '#000000'
        ctx.lineWidth = text.strokeWidth
        ctx.lineJoin = 'round'
        ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0)
      }

      // Text füllen
      ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0)
      ctx.restore()
    })
  }
}

function resetFilters() {
  if (!currentImage.value || !originalImage.value) return

  // Bestätigung vom Benutzer
  const confirmReset = confirm('Do you really want to discard all changes?\n\nThe image will be reset to its original state. All filters, texts, crops and transformations will be lost.')
  if (!confirmReset) return

  // Filter und Hintergrund über Composable zurücksetzen
  filterManagement.resetAll()

  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState()

  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms()

  // Alle Texte entfernen
  imageStore.texts.splice(0, imageStore.texts.length)
  selectedTextId.value = null

  // Bild auf Original zurücksetzen
  currentImage.value = originalImage.value

  // Canvas auf Original-Dimensionen zurücksetzen
  const maxWidth = 1200
  const maxHeight = 800
  let width = originalImage.value.width
  let height = originalImage.value.height

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }

  canvas.value.width = width
  canvas.value.height = height

  // Initialisiere ResizeManager mit korrektem Seitenverhältnis
  resizeManager.initFromDimensions(width, height)

  // Neu zeichnen
  renderImage()
  updateImageInfo()

  // History zurücksetzen und neuen Startpunkt setzen
  history.value = []
  historyIndex.value = -1
  saveHistory()

  console.log('✅ Bild auf Originalzustand zurückgesetzt')

  // Toast-Benachrichtigung
  if (window.$toast) {
    window.$toast.success('Image has been reset to its original state')
  }
}

function clearImage() {
  if (!currentImage.value && !isCollageMode.value) return

  // Bestätigung vom Benutzer
  const confirmMessage = isCollageMode.value
    ? 'Möchten Sie die Collage wirklich entfernen? Alle Layer und Änderungen gehen verloren.'
    : 'Möchten Sie das Bild wirklich entfernen? Alle Änderungen gehen verloren.'
  const confirmDelete = confirm(confirmMessage)
  if (!confirmDelete) return

  // Im Collage-Modus: Layer löschen
  if (isCollageMode.value) {
    imageStore.clearImageLayers()
    isCollageMode.value = false
    layerInteraction.removeListeners()
  }

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
    hue: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 0,
    vignette: 0
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
  // Verwende filterManagement Composable
  filterManagement.applyPreset(preset)

  // Speichere in History
  saveHistory()
}

function onResizeChange(dimension) {
  // Verwende resizeManager Composable
  resizeManager.onDimensionChange(dimension)
}

function applySocialPreset(presetName) {
  if (!presetName || !currentImage.value) return
  // Verwende resizeManager Composable für Social Media Presets
  resizeManager.applyPreset(presetName)
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
    // Bei PNG mit transparentem Hintergrund: forceTransparent = true
    const useTransparent = outputFormat.value === 'png' && exportTransparent.value
    renderImageForExport(useTransparent)

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

  // Verwende das History Composable
  imageHistory.saveState({
    imageData: canvas.value.toDataURL(),
    filters: { ...filters.value },
    background: { ...background.value },
    width: canvas.value.width,
    height: canvas.value.height
  })
}

function undo() {
  imageHistory.undo()
}

function redo() {
  imageHistory.redo()
}

function restoreState(state) {
  const img = new Image()
  img.onload = () => {
    canvas.value.width = state.width
    canvas.value.height = state.height
    // Verwende filterManagement für konsistenten State
    if (state.filters) {
      filterManagement.importState({
        filters: state.filters,
        background: state.background
      })
    }
    const ctx = canvas.value.getContext('2d')
    ctx.drawImage(img, 0, 0)
    updateImageInfo()
    renderImage()
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
  } else if (result === 'activated' && canvas.value) {
    // Setze Canvas-Größe für Seitenverhältnis-Berechnung
    crop.setCanvasSize(canvas.value.width, canvas.value.height)
  }
}

function handleFinishCrop() {
  crop.finishCrop({
    canvas,
    currentImage,
    filters,
    imageStore,
    onCropComplete: (img, width, height, isCircleCrop) => {
      currentImage.value = img
      canvas.value.width = width
      canvas.value.height = height
      resizeManager.initFromDimensions(width, height)

      // Bei Kreis-Zuschnitt automatisch borderRadius auf 50% setzen
      if (isCircleCrop) {
        transform.setBorderRadius(50, false)
      }

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
      resizeManager.initFromDimensions(beforeCropData.width, beforeCropData.height)
      filters.value = { ...beforeCropData.filters }
      renderImage()
      updateImageSize() // Dateigröße neu berechnen nach Undo
      saveHistory()
    }
  })
}

function handleSetAspectRatio(ratioId) {
  crop.setAspectRatio(ratioId)
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

// Shadow-Handler
function handleShadowEnabledUpdate(enabled) {
  transform.setShadowEnabled(enabled)
  renderImage()
}

function handleShadowOffsetXUpdate(value) {
  transform.setShadowOffsetX(value)
  renderImage()
}

function handleShadowOffsetYUpdate(value) {
  transform.setShadowOffsetY(value)
  renderImage()
}

function handleShadowBlurUpdate(value) {
  transform.setShadowBlur(value)
  renderImage()
}

function handleShadowColorUpdate(color) {
  transform.setShadowColor(color)
  renderImage()
}

function handleShadowOpacityUpdate(value) {
  transform.setShadowOpacity(value)
  renderImage()
}

// Skew-Handler
function handleSkewXUpdate(value) {
  transform.setSkewX(value)
  renderImage()
}

function handleSkewYUpdate(value) {
  transform.setSkewY(value)
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

// Transform Undo/Redo Handler
function handleUndoTransform() {
  if (transform.undoTransform()) {
    renderImage()
    if (window.$toast) {
      window.$toast.info(t('toast.transform.undo', 'Transformation rückgängig'))
    }
  }
}

function handleRedoTransform() {
  if (transform.redoTransform()) {
    renderImage()
    if (window.$toast) {
      window.$toast.info(t('toast.transform.redo', 'Transformation wiederhergestellt'))
    }
  }
}

function handleCommitTransform() {
  transform.commitTransform()
}

function handleResetPan() {
  transform.resetPan()
  renderImage()

  if (window.$toast) {
    window.$toast.info(t('toast.transform.panReset', 'Ansicht zurückgesetzt'))
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

// Berechnet den Border-Radius in Pixeln aus dem Prozentwert (50% = perfekter Kreis)
function getBorderRadiusPixels() {
  if (!canvas.value) return 0
  const percentage = transform.transforms.value.borderRadius
  return (percentage / 100) * Math.min(canvas.value.width, canvas.value.height)
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
    color: '#000000',
    rotation: 0,
    opacity: 100,
    strokeWidth: 0,
    strokeColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowColor: '#000000'
  }

  imageStore.texts.push(newText)
  selectedTextId.value = newText.id
  renderImage()
  saveHistory()
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
    saveHistory()
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

function handleTextRotationUpdate(rotation) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.rotation = rotation
    renderImage()
  }
}

function handleTextOpacityUpdate(opacity) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.opacity = opacity
    renderImage()
  }
}

function handleTextStrokeWidthUpdate(strokeWidth) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.strokeWidth = strokeWidth
    renderImage()
  }
}

function handleTextStrokeColorUpdate(strokeColor) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.strokeColor = strokeColor
    renderImage()
  }
}

function handleTextShadowBlurUpdate(shadowBlur) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.shadowBlur = shadowBlur
    // Setze Standard-Offset wenn Schatten aktiviert wird
    if (shadowBlur > 0 && !text.shadowOffsetX) {
      text.shadowOffsetX = 2
      text.shadowOffsetY = 2
      text.shadowColor = text.shadowColor || '#000000'
    }
    renderImage()
  }
}

function handleTextShadowOffsetXUpdate(shadowOffsetX) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.shadowOffsetX = shadowOffsetX
    renderImage()
  }
}

function handleTextShadowOffsetYUpdate(shadowOffsetY) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.shadowOffsetY = shadowOffsetY
    renderImage()
  }
}

function handleTextShadowColorUpdate(shadowColor) {
  if (!selectedTextId.value) return
  const text = imageStore.texts.find(t => t.id === selectedTextId.value)
  if (text) {
    text.shadowColor = shadowColor
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
    saveHistory()
  }
}

function handleDeselectText() {
  selectedTextId.value = null
  renderImage()
}

// ===== TEXT HISTORY HANDLERS =====
function handleSaveTextHistory() {
  saveTextHistory()
}

function handleUndoText() {
  undoText()
  renderImage()
}

function handleRedoText() {
  redoText()
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

// Gibt den Display-Skalierungsfaktor zurück (wie viel kleiner ist die Anzeige als das Canvas)
function getDisplayScale() {
  if (!canvas.value) return 1
  const rect = canvas.value.getBoundingClientRect()
  return rect.width / canvas.value.width
}

function onSelectTextFromPanel(textId) {
  selectedTextId.value = textId
  renderImage()
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
  const displayScale = getDisplayScale()

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
  const cropHandled = crop.handleMouseDown(pos, displayScale)
  if (cropHandled) return

  // Im Collage-Modus: Erst Text prüfen, dann Layer
  if (isCollageMode.value) {
    // Text hat Priorität (liegt visuell über Layern)
    const text = findTextAtPosition(pos.x, pos.y)
    if (text) {
      selectedTextId.value = text.id
      isDraggingText.value = true
      dragOffset.value = {
        x: pos.x - text.x,
        y: pos.y - text.y
      }
      canvas.value.style.cursor = 'grabbing'
      // Layer-Auswahl aufheben
      imageStore.selectImageLayer(null)
      renderImage()
      return
    }

    // Kein Text getroffen, Layer-Interaktion
    selectedTextId.value = null
    layerInteraction.handleMouseDown(e)
    renderImage()
    return
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
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

  // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
  if (isCollageMode.value) {
    // Text-Dragging hat Priorität
    if (isDraggingText.value && selectedTextId.value) {
      const text = imageStore.texts.find(t => t.id === selectedTextId.value)
      if (text) {
        text.x = pos.x - dragOffset.value.x
        text.y = pos.y - dragOffset.value.y
        renderImage()
      }
      return
    }

    // Layer-Interaktion
    layerInteraction.handleMouseMove(e)
    if (layerInteraction.isDragging.value || layerInteraction.isResizing.value) {
      renderImage()
    }

    // Cursor für Text-Hover im Collage-Modus
    if (!layerInteraction.isDragging.value && !layerInteraction.isResizing.value) {
      const text = findTextAtPosition(pos.x, pos.y)
      if (text) {
        canvas.value.style.cursor = 'grab'
      }
    }
    return
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
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
    } else if (crop.cropMode.value) {
      // Nutze den Cursor vom Crop-Composable mit Display-Skalierung
      const displayScale = getDisplayScale()
      cursorStyle = crop.getCursorForPosition(pos.x, pos.y, displayScale)
    } else if (text) {
      cursorStyle = 'grab'
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

  // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
  if (isCollageMode.value) {
    // Text-Dragging beenden
    if (isDraggingText.value) {
      isDraggingText.value = false
      canvas.value.style.cursor = 'default'
      renderImage()
      return
    }

    // Layer-Interaktion beenden
    layerInteraction.handleMouseUp()
    renderImage()
    return
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
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

// Preview Handler für LayerControlPanel (Collage-Modus)
function handleLayerPreview() {
  if (!canvas.value) return

  // Rendere die Canvas mit allen aktuellen Änderungen neu
  renderImage()

  // Warte kurz, damit das Rendering abgeschlossen ist
  setTimeout(() => {
    // Im Collage-Modus: Erstes Layer-Bild als "Original" verwenden
    if (imageStore.imageLayers.length > 0) {
      originalPreviewSrc.value = imageStore.imageLayers[0].url || ''
    } else {
      originalPreviewSrc.value = ''
    }

    // Aktualisiere bearbeitetes Preview mit der aktuellen Canvas
    if (canvas.value) {
      editedPreviewSrc.value = canvas.value.toDataURL('image/png')
    }

    // Trigger Update und öffne Modal
    previewUpdateTrigger.value++
    showPreviewModal.value = true
  }, 100)
}

// ===========================

// Lifecycle
// Keyboard shortcuts und Initial Load

// ===== COLLAGE IMAGE LAYER RELOAD =====

/**
 * Lädt alle Bilder in den Layern neu
 * Wird benötigt da Image-Objekte beim Navigieren verloren gehen können
 */
async function reloadImageLayers() {
  const layers = imageStore.imageLayers
  if (!layers || layers.length === 0) return

  console.log(`🔄 Lade ${layers.length} Layer-Bilder neu...`)

  const loadPromises = layers.map(layer => {
    return new Promise((resolve) => {
      // Prüfe ob das Bild bereits geladen ist
      if (layer.image && layer.image.complete && layer.image.naturalWidth > 0) {
        console.log(`✓ Layer "${layer.name}" bereits geladen`)
        resolve()
        return
      }

      // Bild neu laden
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        layer.image = img
        console.log(`✓ Layer "${layer.name}" neu geladen`)
        resolve()
      }

      img.onerror = () => {
        console.error(`✗ Fehler beim Laden von Layer "${layer.name}"`)
        resolve() // Trotzdem resolve um andere Bilder nicht zu blockieren
      }

      img.src = layer.url
    })
  })

  await Promise.all(loadPromises)
  console.log('✅ Alle Layer-Bilder geladen')
}

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

// Globaler MouseMove Handler für Crop Drag/Resize außerhalb des Canvas
function handleGlobalMouseMove(e) {
  // Nur wenn wir gerade draggen, resizen, erstellen oder andere Aktionen ausführen
  const isCropActive = crop.isDragging.value || crop.isResizing.value || crop.isCreating.value
  if (!isCropActive && !isPanning.value && !isDraggingText.value) {
    return
  }

  // Berechne Position relativ zum Canvas
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()

  // Konvertiere globale Mausposition zu Canvas-Koordinaten
  const displayX = e.clientX - rect.left
  const displayY = e.clientY - rect.top
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  const pos = {
    x: displayX * scaleX,
    y: displayY * scaleY
  }

  // Crop-Handling (Dragging, Resizing oder Creating)
  if (isCropActive) {
    crop.handleMouseMove(pos)
    return
  }

  // Pan-Handling
  if (isPanning.value) {
    const deltaX = e.clientX - panStart.value.x
    const deltaY = e.clientY - panStart.value.y
    panStart.value = { x: e.clientX, y: e.clientY }
    transform.pan(deltaX, deltaY)
    renderImage()
    return
  }

  // Text-Dragging
  if (isDraggingText.value && selectedTextId.value) {
    const text = imageStore.texts.find(t => t.id === selectedTextId.value)
    if (text) {
      text.x = pos.x - dragOffset.value.x
      text.y = pos.y - dragOffset.value.y
      renderImage()
    }
  }
}

// Globaler MouseUp Handler für Crop Drag/Resize außerhalb des Canvas
function handleGlobalMouseUp() {
  // Stoppe alle aktiven Crop-Operationen
  if (crop.isDragging.value || crop.isResizing.value || crop.isCreating.value) {
    crop.cancelDragResize()
  }
  // Stoppe auch Text-Dragging
  if (isDraggingText.value) {
    isDraggingText.value = false
    if (canvas.value) {
      canvas.value.style.cursor = 'default'
    }
  }
  // Stoppe Panning
  if (isPanning.value) {
    isPanning.value = false
    if (canvas.value) {
      canvas.value.style.cursor = isSpacePressed.value && transform.canPan.value ? 'grab' : 'default'
    }
  }
}

onMounted(async () => {
  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  // Global mouse events für Drag/Resize außerhalb des Canvas
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)

  await nextTick()

  // Prüfe ob Collage-Modus aktiv ist (von Galerie aus)
  if (route.query.collageMode === 'true' && imageStore.hasImageLayers) {
    isCollageMode.value = true

    // Warte auf nächsten Tick damit das Canvas gerendert wird
    await nextTick()

    // Canvas initialisieren
    if (canvas.value) {
      // Canvas Größe setzen (Standard 1200x800 für Collage)
      canvas.value.width = 1200
      canvas.value.height = 800

      // ImageStore Canvas initialisieren
      imageStore.initCanvas(canvas.value)

      // HINWEIS: layerInteraction.initListeners() wird NICHT aufgerufen,
      // da wir die Handler manuell aus onCanvasMouseDown/Move/Up aufrufen.
      // So haben wir volle Kontrolle und können Text-Interaktionen priorisieren.

      // Bilder in Layern neu laden falls nötig
      await reloadImageLayers()

      // Erstes Rendern
      imageStore.draw()
      updateImageInfo()
      console.log(`✅ Collage-Modus aktiviert mit ${imageStore.imageLayerCount} Layern`)
    } else {
      console.error('❌ Canvas nicht gefunden im Collage-Modus')
    }
    return
  }

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
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  // Layer-Interaktion Listener entfernen
  if (isCollageMode.value) {
    layerInteraction.removeListeners()
  }
})

function handleKeydown(e) {
  // Ignoriere Shortcuts wenn Input/Textarea fokussiert ist
  const isInputFocused = document.activeElement?.tagName === 'INPUT' ||
                         document.activeElement?.tagName === 'TEXTAREA' ||
                         document.activeElement?.tagName === 'SELECT'

  // Leertaste für Pan-Modus (nur wenn Zoom > 100%)
  if (e.code === 'Space' && transform.canPan.value && !e.repeat) {
    if (!isInputFocused) {
      e.preventDefault()
      isSpacePressed.value = true
      if (canvas.value) {
        canvas.value.style.cursor = 'grab'
      }
    }
  }

  // Ctrl/Cmd Shortcuts
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      // Erst Transform-Undo versuchen, dann allgemeines Undo
      if (transform.canUndoTransform.value) {
        handleUndoTransform()
      } else {
        undo()
      }
    } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault()
      // Erst Transform-Redo versuchen, dann allgemeines Redo
      if (transform.canRedoTransform.value) {
        handleRedoTransform()
      } else {
        redo()
      }
    }
    return
  }

  // Nur wenn kein Bild geladen ist, keine weiteren Shortcuts
  if (!currentImage.value) return

  // Nur wenn kein Input fokussiert ist
  if (isInputFocused) return

  // Transform Shortcuts (nur wenn Bild geladen)
  switch (e.key) {
    // Spiegeln
    case 'h':
    case 'H':
      e.preventDefault()
      handleFlipHorizontal()
      break
    case 'v':
    case 'V':
      e.preventDefault()
      handleFlipVertical()
      break

    // Rotation mit Pfeiltasten
    case 'ArrowLeft':
      e.preventDefault()
      if (e.shiftKey) {
        // Grobe Rotation: -15°
        transform.setRotation(transform.transforms.value.rotation - 15, true)
      } else {
        // Feine Rotation: -1°
        transform.setRotation(transform.transforms.value.rotation - 1, true)
      }
      renderImage()
      break
    case 'ArrowRight':
      e.preventDefault()
      if (e.shiftKey) {
        // Grobe Rotation: +15°
        transform.setRotation(transform.transforms.value.rotation + 15, true)
      } else {
        // Feine Rotation: +1°
        transform.setRotation(transform.transforms.value.rotation + 1, true)
      }
      renderImage()
      break

    // Rotation zurücksetzen
    case 'r':
    case 'R':
      e.preventDefault()
      if (transform.transforms.value.rotation !== 0) {
        transform.setRotation(0, true)
        renderImage()
        if (window.$toast) {
          window.$toast.info(t('toast.transform.rotationReset', 'Rotation zurückgesetzt'))
        }
      }
      break

    // Schnell-Rotationen mit Ziffern
    case '1':
      e.preventDefault()
      handleRotate90Counter()
      break
    case '2':
      e.preventDefault()
      handleRotate180()
      break
    case '3':
      e.preventDefault()
      handleRotate90()
      break

    // Delete selected text
    case 'Delete':
    case 'Backspace':
      if (selectedTextId.value) {
        e.preventDefault()
        imageStore.deleteText(selectedTextId.value)
        selectedTextId.value = null
      }
      break
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
  // Verwende min-height statt height, damit die Seite scrollbar bleibt
  // und das sticky-Verhalten des AppHeaders funktioniert
  min-height: calc(100vh - var(--header-height) - var(--external-nav-height, 0px));

  @media (max-width: 768px) {
    min-height: calc(100vh - var(--header-height-mobile) - var(--external-nav-height, 0px));
  }
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
  align-items: center;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  margin: 0 0.25rem;
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
  color: #F5F4D6;

  &:hover:not(:disabled) {
    background: rgba(1, 79, 153, 0.9);
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
  width: 280px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 0.75rem;

  /* Sticky Sidebar - bleibt im Sichtfeld während Canvas scrollt */
  position: sticky;
  top: 0;
  height: calc(100vh - var(--external-nav-height, 50px) - var(--header-height, 60px) - 60px);
  align-self: stretch;

  /* Moderne Scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;

    &:hover {
      background: var(--color-text-light);
    }
  }
}

/* Crop Overlay */
.crop-overlay {
  position: absolute;
  border: 2px solid #4ade80;
  background: rgba(74, 222, 128, 0.1);
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);

  &.dragging {
    cursor: move;
    border-style: solid;
  }

  &.resizing {
    border-style: solid;
  }
}

/* Resize Handles - rein visuell, Canvas handled alle Events */
.resize-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 3px;
  pointer-events: none;
  z-index: 101;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &.handle-nw {
    top: -7px;
    left: -7px;
  }

  &.handle-n {
    top: -7px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.handle-ne {
    top: -7px;
    right: -7px;
  }

  &.handle-e {
    top: 50%;
    right: -7px;
    transform: translateY(-50%);
  }

  &.handle-se {
    bottom: -7px;
    right: -7px;
  }

  &.handle-s {
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.handle-sw {
    bottom: -7px;
    left: -7px;
  }

  &.handle-w {
    top: 50%;
    left: -7px;
    transform: translateY(-50%);
  }
}

/* Move Indicator in der Mitte */
.move-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(74, 222, 128, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  pointer-events: none;
  opacity: 0.8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  i {
    pointer-events: none;
  }
}

/* Collapsible Sidebar Sections */
.sidebar-section {
  margin-bottom: 0.5rem;
  background: var(--color-bg);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &.collapsible {
    .section-header {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-text);
      background: transparent;
      transition: all 0.2s ease;

      &:hover {
        background: var(--color-bg-secondary);
      }

      .section-icon {
        font-size: 0.85rem;
        color: var(--color-primary);
        opacity: 0.8;
      }

      .toggle-icon {
        margin-left: auto;
        font-size: 0.65rem;
        opacity: 0.5;
        transition: transform 0.2s ease;
      }
    }

    .section-content {
      padding: 0 1rem 1rem 1rem;
    }

    &.collapsed {
      .section-header {
        border-bottom: none;
      }
    }
  }

  // Non-collapsible sections (Format, Background, etc.)
  &:not(.collapsible) {
    padding: 0.75rem 1rem;

    h3 {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 0.75rem;
      color: var(--color-text-light);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
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
    box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.1);
  }
}

/* Modern Filter Controls */
.filter-control {
  margin-bottom: 0.875rem;

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;

    .filter-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text);
      opacity: 0.85;
    }

    .filter-value {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-primary);
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      min-width: 40px;
      text-align: right;
      background: rgba(1, 79, 153, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .slider-track {
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;

    // Hue-Slider mit Farbverlauf
    &.hue-slider {
      &::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(to right,
          hsl(0, 100%, 50%),
          hsl(60, 100%, 50%),
          hsl(120, 100%, 50%),
          hsl(180, 100%, 50%),
          hsl(240, 100%, 50%),
          hsl(300, 100%, 50%),
          hsl(360, 100%, 50%)
        );
        pointer-events: none;
      }

      .modern-slider {
        background: transparent !important;
      }
    }

    // Warm/Sepia-Slider
    &.warm-slider {
      &::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(to right,
          var(--color-border) 0%,
          #d4a574 50%,
          #8b5a2b 100%
        );
        pointer-events: none;
      }

      .modern-slider {
        background: transparent !important;
      }
    }
  }

  .modern-slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    transition: all 0.15s ease;

    // Chrome, Safari, Edge - Thumb
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid var(--color-bg);
    }

    &:hover::-webkit-slider-thumb {
      transform: scale(1.2);
      box-shadow: 0 2px 8px rgba(1, 79, 153, 0.4);
    }

    &:active::-webkit-slider-thumb {
      transform: scale(1.1);
      background: var(--color-primary);
    }

    // Firefox - Thumb
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: var(--color-primary);
      border: 2px solid var(--color-bg);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    &:hover::-moz-range-thumb {
      transform: scale(1.2);
      box-shadow: 0 2px 8px rgba(1, 79, 153, 0.4);
    }

    // Firefox - Track
    &::-moz-range-track {
      background: var(--color-border);
      border-radius: 2px;
      height: 4px;
    }

    // Center-Zero Slider (für Werte von -X bis +X)
    &.center-zero {
      background: linear-gradient(to right,
        var(--color-border) 0%,
        var(--color-border) 50%,
        var(--color-border) 100%
      );
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 8px;
        background: var(--color-text-light);
        border-radius: 1px;
        opacity: 0.5;
      }
    }
  }

  // Legacy support für alte input[type="range"] ohne .modern-slider Klasse
  input[type="range"]:not(.modern-slider) {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid var(--color-bg);
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: var(--color-primary);
      border: 2px solid var(--color-bg);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    &::-moz-range-track {
      background: var(--color-border);
      border-radius: 2px;
      height: 4px;
    }
  }

  span {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-light);
    min-width: 40px;
    text-align: right;
  }

  &.checkbox-control {
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--color-text);

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--color-primary);
      }
    }
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
  background: rgba(1, 79, 153, 0.05);
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
    background: rgba(1, 79, 153, 0.05); // ✨ Subtiler Hover
    transform: translateY(-1px); // ✨ Leichtes Anheben
  }

  &.active {
    background: var(--color-primary);
    color: #F5F4D6;
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(1, 79, 153, 0.3); // ✨ Shadow bei Active
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

  .resize-presets {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.5rem;

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg);
      color: var(--color-text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--color-primary);
      }

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

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
        box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.1);
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
  align-items: flex-start;
  justify-content: center;
  padding: 2rem;
  overflow: auto;
  background: var(--color-bg);
  position: relative;
  transition: all 0.2s ease;

  // Drag and drop visual feedback
  &.drag-over {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.1));
    border: 3px dashed var(--color-primary, #014f99);
    border-radius: 8px;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(1, 79, 153, 0.05);
      pointer-events: none;
      z-index: 10;
    }
  }
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
    min-width: 100%;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    height: auto;
    position: static;
    max-height: 40vh;
  }

  .toolbar {
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
    min-height: 40px;
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

// Dark Mode Optimierungen
:root[data-theme="dark"] {
  .sidebar {
    background: var(--color-bg-secondary);

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .sidebar-section {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);

    &:hover {
      border-color: var(--color-primary);
      background: rgba(255, 255, 255, 0.05);
    }

    &.collapsible .section-header {
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }

  .filter-control {
    label .filter-value {
      background: rgba(1, 79, 153, 0.15);
      color: #60a5fa;
    }

    .modern-slider {
      background: rgba(255, 255, 255, 0.1);

      &::-webkit-slider-thumb {
        border-color: var(--color-bg-secondary);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }

      &::-moz-range-thumb {
        border-color: var(--color-bg-secondary);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }

      &::-moz-range-track {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .slider-track.hue-slider::before,
    .slider-track.warm-slider::before {
      opacity: 0.9;
    }
  }

  .form-select {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text);

    &:hover {
      border-color: var(--color-primary);
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.2);
    }
  }

  .preset-btn {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(1, 79, 153, 0.1);
      border-color: var(--color-primary);
    }
  }

  .resize-controls input {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.2);
    }
  }

  .color-picker-row .color-text-input {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .format-info {
    background: rgba(255, 255, 255, 0.03);
  }

  .format-description {
    color: var(--color-text-light);
  }

  .format-badge {
    background: rgba(1, 79, 153, 0.15);
    color: #60a5fa;
  }

  .backend-badge {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }
}
</style>
