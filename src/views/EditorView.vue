<template>
  <div class="editor-view">
    <div class="editor-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <!-- Links: Upload -->
        <div class="toolbar-group">
          <button class="tb-btn tb-btn--primary" @click="triggerFileInput">
            <i class="fas fa-upload"></i>
            {{ $t('editor.toolbar.upload') }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*,.tiff,.tif,.heic,.heif,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef,.x3f"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <!-- Mitte: Bearbeitungsaktionen -->
        <div class="toolbar-center">
          <!-- History -->
          <div class="toolbar-group">
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!canUndo"
              :title="$t('editor.toolbar.undo', 'Rückgängig (Ctrl+Z)')"
              @click="undo"
            >
              <i class="fas fa-undo"></i>
            </button>
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!canRedo"
              :title="$t('editor.toolbar.redo', 'Wiederholen (Ctrl+Y)')"
              @click="redo"
            >
              <i class="fas fa-redo"></i>
            </button>
          </div>

          <!-- Collage beenden -->
          <div v-if="isCollageMode" class="toolbar-group">
            <button
              class="tb-btn"
              :title="$t('editor.toolbar.exitCollage', 'Collage-Modus beenden')"
              @click="exitCollageMode"
            >
              <i class="fas fa-th"></i>
              {{ $t('editor.toolbar.exitCollage', 'Collage beenden') }}
            </button>
          </div>

          <!-- Werkzeuge -->
          <div class="toolbar-group">
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!currentImage && !isCollageMode"
              :title="$t('editor.toolbar.addText', 'Text hinzufügen (T)')"
              @click="addText"
            >
              <i class="fas fa-font"></i>
            </button>
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!currentImage && !isCollageMode"
              :title="$t('editor.toolbar.preview', 'Vorschau')"
              @click="openPreview"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!currentImage && !isCollageMode"
              :title="$t('editor.toolbar.reset', 'Zurücksetzen')"
              @click="resetFilters"
            >
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>

          <!-- Löschen -->
          <div class="toolbar-group">
            <button
              class="tb-btn tb-btn--icon tb-btn--danger"
              :disabled="!currentImage && !isCollageMode"
              :title="$t('editor.toolbar.clearImage', 'Bild entfernen')"
              @click="clearImage"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Rechts: Download -->
        <div class="toolbar-group">
          <button
            class="tb-btn tb-btn--success"
            :disabled="(!currentImage && !isCollageMode) || isExporting"
            @click="downloadImage"
          >
            <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
            {{ isExporting ? $t('toast.editor.exporting', 'Exportiere...') : $t('editor.toolbar.download') }}
          </button>
        </div>
      </div>

      <!-- Main Editor -->
      <div class="editor-main">
        <!-- Sidebar -->
        <aside class="sidebar">
          <ExportPanel
            :output-format="outputFormat"
            :formats="formats"
            :format-info="FORMAT_INFO"
            :current-format-info="currentFormatInfo"
            :supports-quality="supportsQuality"
            :requires-backend="requiresBackend"
            :export-quality="exportQuality"
            :export-transparent="exportTransparent"
            @update:output-format="outputFormat = $event"
            @update:export-quality="exportQuality = $event"
            @update:export-transparent="exportTransparent = $event"
          />
          <BackgroundPanel :background="background" :disabled="!currentImage" @render="renderImage" />
          <AdjustmentsPanel :filters="filters" :sections-open="sectionsOpen" :disabled="!currentImage" @render="renderImage" @save-history="saveHistory" />
          <LightColorPanel :filters="filters" :sections-open="sectionsOpen" :disabled="!currentImage" @render="renderImage" @save-history="saveHistory" />
          <EffectsPanel :filters="filters" :sections-open="sectionsOpen" :disabled="!currentImage" @render="renderImage" @save-history="saveHistory" />
          <!-- Presets -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.presets') }}</h3>
            <FilterPresets :filters="filters" @apply-preset="handlePresetApply" />
          </div>
          <ResizePanel
            :resize-width="resizeWidth"
            :resize-height="resizeHeight"
            :maintain-aspect-ratio="maintainAspectRatio"
            :disabled="!currentImage"
            @update:resize-width="resizeWidth = $event"
            @update:resize-height="resizeHeight = $event"
            @update:maintain-aspect-ratio="maintainAspectRatio = $event"
            @dimension-change="onResizeChange"
            @apply-preset="applySocialPreset"
            @apply-resize="applyResize"
          />
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
            <div class="empty-canvas__header">
              <div class="empty-canvas__icon-wrap">
                <i class="fas fa-image"></i>
              </div>
              <h2>{{ $t('editor.canvas.empty.title') }}</h2>
              <p>{{ $t('editor.canvas.empty.description') }}</p>
            </div>

            <div class="upload-cards">
              <!-- Datei wählen -->
              <div class="upload-card upload-card--file" role="button" tabindex="0" @click="triggerFileInput" @keyup.enter="triggerFileInput">
                <div class="upload-card__icon">
                  <i class="fas fa-folder-open"></i>
                </div>
                <div class="upload-card__body">
                  <strong>{{ $t('editor.canvas.empty.button') }}</strong>
                  <span>{{ $t('editor.canvas.empty.uploadDesc') }}</span>
                </div>
              </div>

              <!-- Drag & Drop -->
              <div class="upload-card upload-card--drag">
                <div class="upload-card__icon">
                  <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-card__body">
                  <strong>{{ $t('editor.canvas.empty.dragDropTitle') }}</strong>
                  <span>{{ $t('editor.canvas.empty.dragDropDesc') }}</span>
                </div>
              </div>

              <!-- Einfügen -->
              <div class="upload-card upload-card--paste">
                <div class="upload-card__icon">
                  <i class="fas fa-clipboard"></i>
                </div>
                <div class="upload-card__body">
                  <strong>{{ $t('editor.canvas.empty.clipboardTitle') }}</strong>
                  <span><kbd>Ctrl</kbd> + <kbd>V</kbd></span>
                </div>
              </div>
            </div>
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
              :class="{ dragging: crop.isDragging.value, resizing: crop.isResizing.value }"
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
              <span
                ><i class="fas fa-expand-arrows-alt"></i> {{ imageWidth }} ×
                {{ imageHeight }}px</span
              >
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
    <PreviewModal
      :show="showPreviewModal"
      :original-src="originalPreviewSrc"
      :edited-src="editedPreviewSrc"
      @close="closePreview"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useImageStore } from '@/stores/imageStore';
import { useTextModal } from '@/composables/useTextModal';
import { useConfirm } from '@/composables/useConfirm';
import { useCrop, ASPECT_RATIO_PRESETS } from '@/composables/useCrop';
import { useTransform } from '@/composables/useTransform';
import { useFilterManagement } from '@/composables/useFilterManagement';
import { useImageHistory } from '@/composables/useImageHistory';
import { useTextHistory } from '@/composables/useTextHistory';
import { useResizeManager } from '@/composables/useResizeManager';
import { useImageLayerInteraction } from '@/composables/useImageLayerInteraction';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { useImageLoader } from '@/composables/useImageLoader';
import { exportImage, FORMAT_INFO, SUPPORTED_FORMATS, getFormatInfo } from '@/utils/exportUtils';

import TransformPanel from '@/components/features/TransformPanel.vue';
import LayerControlPanel from '@/components/features/LayerControlPanel.vue';
import FilterPresets from '@/components/editor/FilterPresets.vue';
import ExportPanel from '@/components/editor/sidebar/ExportPanel.vue';
import BackgroundPanel from '@/components/editor/sidebar/BackgroundPanel.vue';
import AdjustmentsPanel from '@/components/editor/sidebar/AdjustmentsPanel.vue';
import LightColorPanel from '@/components/editor/sidebar/LightColorPanel.vue';
import EffectsPanel from '@/components/editor/sidebar/EffectsPanel.vue';
import ResizePanel from '@/components/editor/sidebar/ResizePanel.vue';
import PreviewModal from '@/components/editor/PreviewModal.vue';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const router = useRouter();
const imageStore = useImageStore();
const textModal = useTextModal();
const { confirm: confirmDialog } = useConfirm();

// ===== CORE REFS =====
const fileInput = ref(null);
const canvas = ref(null);
const currentImage = ref(null);
const originalImage = ref(null);
const originalImageDataUrl = ref(''); // Speichert das Original als Data URL
const outputFormat = ref('png');
const currentImageFormat = ref(''); // Format des hochgeladenen Bildes

// ===== EXPORT STATE =====
const exportQuality = ref(92); // Quality-Wert (0-100)
const isExporting = ref(false); // Loading-State beim Export
const exportTransparent = ref(false); // Transparenter Hintergrund beim PNG-Export

// ===== TEXT INTERACTION STATE =====
const selectedTextId = ref(null);
const isDraggingText = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// ===== PAN INTERACTION STATE =====
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const isSpacePressed = ref(false);

// ===== PREVIEW MODAL STATE =====
const showPreviewModal = ref(false);
const originalPreviewSrc = ref('');
const editedPreviewSrc = ref('');

// ===== COLLAGE MODE STATE =====
const isCollageMode = ref(false);

// ===== DRAG & DROP STATE =====
const isDraggingFile = ref(false);

// ===== COMPOSABLES =====

// Crop Composable
const crop = useCrop();

// Transform Composable
const transform = useTransform();

// Filter Management Composable
const filterManagement = useFilterManagement({
  onFilterChange: () => renderImage(),
});
const { filters, background, sectionsOpen, currentPreset } = filterManagement;

// Image History Composable
const imageHistory = useImageHistory({
  maxHistorySize: 50,
  onRestore: (state) => restoreState(state),
});
const { history, historyIndex, canUndo, canRedo } = imageHistory;

// Text History Composable (separate History für Text mit 50 Schritten)
const textHistory = useTextHistory({
  getTexts: () => imageStore.texts,
  setTexts: (texts) => {
    imageStore.texts = texts;
  },
  getSelectedTextId: () => selectedTextId.value,
  setSelectedTextId: (id) => {
    selectedTextId.value = id;
  },
});
const { canUndoText, canRedoText, saveTextHistory, initTextHistory, undoText, redoText } =
  textHistory;

// Resize Manager Composable
const resizeManager = useResizeManager({
  getCurrentDimensions: () => ({
    width: canvas.value?.width || 0,
    height: canvas.value?.height || 0,
  }),
  onResize: (dimensions) => {
    // Resize wird in applyResize() gehandhabt
  },
});
const { resizeWidth, resizeHeight, maintainAspectRatio } = resizeManager;

// Image Layer Interaction Composable (für Collage-Modus)
const layerInteraction = useImageLayerInteraction(canvas);

// ===== Canvas Renderer Composable =====
const canvasRenderer = useCanvasRenderer({
  canvas,
  currentImage,
  isCollageMode,
  imageStore,
  transform,
  filters,
  background,
  selectedTextId,
});
const {
  renderImage: _renderImageCore,
  renderImageForExport,
  drawTextSelection,
} = canvasRenderer;

function renderImage() {
  _renderImageCore();
  updateImageDimensions();
}

// Image Loader Composable
const {
  loadFileIntoEditor,
  handleFileSelect,
  handleDragLeave,
  handleFileDrop,
  handlePaste,
  loadGalleryImage,
  reloadImageLayers,
} = useImageLoader({
  currentImageFormat,
  originalImageDataUrl,
  originalImage,
  isDraggingFile,
  imageStore,
  onImageReady: (img) => loadImage(img),
});

const formats = SUPPORTED_FORMATS;

// Computed (canUndo, canRedo kommen jetzt vom imageHistory Composable)

// Aktuell ausgewählter Text als Objekt
const selectedTextObject = computed(() => {
  if (!selectedTextId.value || !imageStore.texts) return null;
  return imageStore.texts.find((t) => t.id === selectedTextId.value) || null;
});

// ===== NEU: Format-Info Computed Properties =====
const currentFormatInfo = computed(() => {
  return getFormatInfo(outputFormat.value);
});

const supportsQuality = computed(() => {
  return currentFormatInfo.value?.supportsQuality || false;
});

const requiresBackend = computed(() => {
  return currentFormatInfo.value?.requiresBackend || false;
});

// Crop-Overlay-Style: Konvertiere Canvas-Koordinaten zu Display-Koordinaten
const scaledCropOverlayStyle = computed(() => {
  if (!crop.cropOverlayStyle.value || !canvas.value) return null;

  const canvasRect = canvas.value.getBoundingClientRect();
  const containerRect = canvas.value.parentElement.getBoundingClientRect();

  // Skalierungsfaktoren
  const scaleX = canvasRect.width / canvas.value.width;
  const scaleY = canvasRect.height / canvas.value.height;

  // Offset vom Canvas innerhalb des Containers
  const offsetX = canvasRect.left - containerRect.left;
  const offsetY = canvasRect.top - containerRect.top;

  const originalStyle = crop.cropOverlayStyle.value;

  // Parse die Pixel-Werte und skaliere sie
  const parsePixels = (str) => parseFloat(str) || 0;

  return {
    left: `${offsetX + parsePixels(originalStyle.left) * scaleX}px`,
    top: `${offsetY + parsePixels(originalStyle.top) * scaleY}px`,
    width: `${parsePixels(originalStyle.width) * scaleX}px`,
    height: `${parsePixels(originalStyle.height) * scaleY}px`,
  };
});

// Image info (reactive refs statt computed für bessere Kontrolle)
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageSize = ref(0);

// Schnelle Funktion: nur Dimensionen aktualisieren (wird bei jedem renderImage() aufgerufen)
function updateImageDimensions() {
  if (!canvas.value) {
    imageWidth.value = 0;
    imageHeight.value = 0;
    return;
  }

  imageWidth.value = canvas.value.width;
  imageHeight.value = canvas.value.height;
}

// Langsame Funktion: Dateigröße berechnen (nur bei Bedarf aufrufen!)
function updateImageSize() {
  if (!canvas.value) {
    imageSize.value = 0;
    return;
  }

  try {
    const dataUrl = canvas.value.toDataURL(`image/${outputFormat.value}`, 0.92);
    const base64String = dataUrl.split(',')[1];
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
    const bytes = (base64String.length * 3) / 4 - padding;
    imageSize.value = Math.round(bytes);
  } catch (error) {
    imageSize.value = Math.round(canvas.value.toDataURL().length * 0.75);
  }
}

// Komplette Update-Funktion (nur bei Load/Resize/Format-Wechsel)
function updateImageInfo() {
  updateImageDimensions();
  updateImageSize();
}

// Watch outputFormat changes to update image size
watch(outputFormat, () => {
  updateImageSize();
});

// Methods
function triggerFileInput() {
  fileInput.value?.click();
}


async function loadImage(img) {
  currentImage.value = img;

  // Reset Crop-Zustand über Composable
  crop.resetCropState();

  // Initialisiere Transform-History für neues Bild
  transform.initTransformHistory();

  // Warte bis Vue das Canvas gerendert hat
  await nextTick();

  // Prüfe ob canvas bereit ist
  if (!canvas.value) {
    console.warn('⚠️ Canvas noch nicht initialisiert, warte...');
    setTimeout(() => loadImage(img), 50);
    return;
  }

  // Set canvas size to original image resolution
  // CSS (max-width/max-height) handles display scaling — canvas stores full resolution
  canvas.value.width = img.width;
  canvas.value.height = img.height;

  // Initialisiere ResizeManager mit korrektem Seitenverhältnis
  resizeManager.initFromDimensions(img.width, img.height);

  renderImage();
  updateImageInfo();
  saveHistory();
  initTextHistory(); // Initialisiere Text-History für neues Bild
}

async function resetFilters() {
  if (!currentImage.value || !originalImage.value) return;

  const confirmed = await confirmDialog(t('confirm.editor.resetMessage'), {
    title: t('confirm.editor.resetTitle'),
    confirmText: t('confirm.reset'),
    cancelText: t('confirm.cancel'),
    variant: 'warning',
  });
  if (!confirmed) return;

  // Filter und Hintergrund über Composable zurücksetzen
  filterManagement.resetAll();

  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState();

  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms();

  // Alle Texte entfernen
  imageStore.texts.splice(0, imageStore.texts.length);
  selectedTextId.value = null;

  // Bild auf Original zurücksetzen
  currentImage.value = originalImage.value;

  // Canvas auf Original-Dimensionen zurücksetzen
  const maxWidth = 1200;
  const maxHeight = 800;
  let width = originalImage.value.width;
  let height = originalImage.value.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }

  canvas.value.width = width;
  canvas.value.height = height;

  // Initialisiere ResizeManager mit korrektem Seitenverhältnis
  resizeManager.initFromDimensions(width, height);

  // Neu zeichnen
  renderImage();
  updateImageInfo();

  // History zurücksetzen und neuen Startpunkt setzen
  history.value = [];
  historyIndex.value = -1;
  saveHistory();

  console.log('✅ Bild auf Originalzustand zurückgesetzt');

  if (window.$toast) {
    window.$toast.success(t('toast.editor.imageReset', 'Bild zurückgesetzt'));
  }
}

function exitCollageMode() {
  imageStore.clearImageLayers();
  isCollageMode.value = false;
  layerInteraction.removeListeners();
  router.push('/gallery');
}

async function clearImage() {
  if (!currentImage.value && !isCollageMode.value) return;

  const confirmMessage = isCollageMode.value
    ? t('confirm.editor.clearCollageMessage')
    : t('confirm.editor.clearMessage');
  const confirmTitle = t('confirm.editor.clearTitle');
  const confirmed = await confirmDialog(confirmMessage, {
    title: confirmTitle,
    confirmText: t('confirm.delete'),
    cancelText: t('confirm.cancel'),
    variant: 'danger',
  });
  if (!confirmed) return;

  // Im Collage-Modus: Layer löschen
  if (isCollageMode.value) {
    imageStore.clearImageLayers();
    isCollageMode.value = false;
    layerInteraction.removeListeners();
  }

  // Bild und Daten zurücksetzen
  currentImage.value = null;
  originalImage.value = null;
  originalImageDataUrl.value = ''; // Original-Bild Data URL zurücksetzen
  currentImageFormat.value = ''; // Format zurücksetzen

  // Image-Info zurücksetzen
  imageWidth.value = 0;
  imageHeight.value = 0;
  imageSize.value = 0;

  // Canvas leeren
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    canvas.value.width = 0;
    canvas.value.height = 0;
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
    vignette: 0,
  };
  currentPreset.value = null;

  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState();

  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms();

  // History zurücksetzen
  history.value = [];
  historyIndex.value = -1;

  // Resize-Werte zurücksetzen
  resizeWidth.value = null;
  resizeHeight.value = null;

  // Text-Elemente zurücksetzen (falls Methode existiert)
  if (textModal && typeof textModal.clearAllTexts === 'function') {
    textModal.clearAllTexts();
  }
  selectedTextId.value = null;

  // ImageStore zurücksetzen (falls Methode existiert)
  if (imageStore && typeof imageStore.clearImage === 'function') {
    imageStore.clearImage();
  }

  // File Input zurücksetzen
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  console.log('🗑️ Bild erfolgreich gelöscht');
  if (window.$toast) {
    window.$toast.success(t('toast.editor.imageDeleted'));
  }
}

function handlePresetApply(preset) {
  // Verwende filterManagement Composable
  filterManagement.applyPreset(preset);

  // Speichere in History
  saveHistory();
}

function onResizeChange(dimension) {
  // Verwende resizeManager Composable
  resizeManager.onDimensionChange(dimension);
}

function applySocialPreset(presetName) {
  if (!presetName || !currentImage.value) return;
  // Verwende resizeManager Composable für Social Media Presets
  resizeManager.applyPreset(presetName);
}

function applyResize() {
  if (!canvas.value || !currentImage.value) return;

  canvas.value.width = resizeWidth.value;
  canvas.value.height = resizeHeight.value;
  renderImage();
  updateImageSize(); // Dateigröße neu berechnen nach Resize
  saveHistory();

  // Toast-Benachrichtigung
  if (window.$toast) {
    window.$toast.success(
      t('toast.editor.resizeSuccess', {
        width: resizeWidth.value,
        height: resizeHeight.value,
      })
    );
  }
}

// ===== NEU: Aktualisierte downloadImage Funktion mit neuer Export-Architektur =====
async function downloadImage() {
  if (!canvas.value) return;

  isExporting.value = true;

  try {
    const filename = `image-${Date.now()}`;

    // ✨ FIX: Rendere ohne Auswahl-Markierung vor dem Export
    // Bei PNG mit transparentem Hintergrund: forceTransparent = true
    const useTransparent = outputFormat.value === 'png' && exportTransparent.value;
    renderImageForExport(useTransparent);

    // Export mit neuer Export-Utils
    const result = await exportImage(canvas.value, outputFormat.value, filename, {
      quality: exportQuality.value / 100, // Konvertiere 0-100 zu 0-1
      texts: imageStore.texts || [], // Texte aus dem Store
    });

    console.log('✅ Export erfolgreich:', result);

    // Optional: Success-Toast anzeigen
    if (window.$toast) {
      window.$toast.success(
        `Bild erfolgreich als ${result.format.toUpperCase()} exportiert` +
          (result.size ? ` (${result.size})` : '')
      );
    }
  } catch (error) {
    console.error('❌ Export fehlgeschlagen:', error);

    // Error-Toast anzeigen
    if (window.$toast) {
      window.$toast.error(`Export fehlgeschlagen: ${error.message}`);
    }
  } finally {
    isExporting.value = false;

    // ✨ FIX: Stelle Auswahl-Markierung nach dem Export wieder her
    renderImage();
  }
}

function saveHistory() {
  if (!canvas.value) return;

  // Das rohe Bild (ohne Transforms) für verlässliches Undo/Redo speichern
  let rawImageSrc = null;
  if (currentImage.value) {
    if (currentImage.value.src && currentImage.value.src.startsWith('data:')) {
      rawImageSrc = currentImage.value.src;
    } else {
      // Blob-URL o.ä.: als Data-URL über Hilfs-Canvas sichern
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.value.width;
      tmpCanvas.height = canvas.value.height;
      tmpCanvas
        .getContext('2d')
        .drawImage(currentImage.value, 0, 0, tmpCanvas.width, tmpCanvas.height);
      rawImageSrc = tmpCanvas.toDataURL('image/png');
    }
  }

  // Verwende das History Composable
  imageHistory.saveState({
    imageData: canvas.value.toDataURL(),
    rawImageSrc,
    filters: { ...filters.value },
    background: { ...background.value },
    transforms: { ...transform.transforms.value },
    width: canvas.value.width,
    height: canvas.value.height,
    hasCropped: crop.hasCropped.value,
  });
}

function undo() {
  imageHistory.undo();
}

function redo() {
  imageHistory.redo();
}

function restoreState(state) {
  // rawImageSrc enthält das rohe Bild ohne gebackene Transforms → für renderImage() verwenden
  // imageData ist der gerenderte Canvas-Snapshot (Fallback)
  const srcToLoad = state.rawImageSrc || state.imageData;
  const img = new Image();
  img.onload = () => {
    canvas.value.width = state.width;
    canvas.value.height = state.height;
    currentImage.value = img;
    resizeManager.initFromDimensions(state.width, state.height);
    // Verwende filterManagement für konsistenten State
    if (state.filters) {
      filterManagement.importState({
        filters: state.filters,
        background: state.background,
      });
    }
    // Transform-State wiederherstellen (inkl. borderRadius für Kreis-Zuschnitt)
    if (state.transforms) {
      transform.transforms.value = { ...state.transforms };
    }
    // Crop-State zurücksetzen wenn der gespeicherte State kein Zuschnitt war
    if (!state.hasCropped) {
      crop.resetCropState();
    }
    updateImageInfo();
    renderImage();
  };
  img.src = srcToLoad;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ===== CROP FUNCTIONS (jetzt über useCrop Composable) =====

function handleToggleCrop() {
  const result = crop.toggleCropMode();
  if (result === 'finish') {
    handleFinishCrop();
  } else if (result === 'activated' && canvas.value) {
    // Setze Canvas-Größe für Seitenverhältnis-Berechnung
    crop.setCanvasSize(canvas.value.width, canvas.value.height);
  }
}

function handleFinishCrop() {
  crop.finishCrop({
    canvas,
    currentImage,
    filters,
    imageStore,
    borderRadiusBeforeCrop: transform.transforms.value.borderRadius,
    onCropComplete: (img, width, height, isCircleCrop) => {
      currentImage.value = img;
      canvas.value.width = width;
      canvas.value.height = height;
      resizeManager.initFromDimensions(width, height);

      // Bei Kreis-Zuschnitt automatisch borderRadius auf 50% setzen
      if (isCircleCrop) {
        transform.setBorderRadius(50, false);
      }

      renderImage();
      updateImageSize(); // Dateigröße neu berechnen nach Crop
      saveHistory();
    },
  });
}

function handleUndoCrop() {
  crop.undoCrop({
    imageStore,
    onUndoComplete: (img, beforeCropData) => {
      currentImage.value = img;
      canvas.value.width = beforeCropData.width;
      canvas.value.height = beforeCropData.height;
      resizeManager.initFromDimensions(beforeCropData.width, beforeCropData.height);
      filters.value = { ...beforeCropData.filters };
      // BorderRadius auf den Wert vor dem Zuschnitt zurücksetzen (wichtig für Kreis-Preset)
      transform.setBorderRadius(beforeCropData.borderRadius ?? 0, false);
      renderImage();
      updateImageSize(); // Dateigröße neu berechnen nach Undo
      saveHistory();
    },
  });
}

function handleSetAspectRatio(ratioId) {
  crop.setAspectRatio(ratioId);
}

// ===== TRANSFORM FUNCTIONS =====

function makeHandler(setter) {
  return (value) => { setter(value); renderImage(); };
}
function makeActionHandler(action, toastKey) {
  return () => { action(); renderImage(); if (toastKey && window.$toast) window.$toast.success(t(toastKey)); };
}

const handleOpacityUpdate = makeHandler((v) => transform.setOpacity(v));
const handleRotationUpdate = makeHandler((v) => transform.setRotation(v));
const handleScaleUpdate = makeHandler((v) => transform.setScale(v));
const handleBorderRadiusUpdate = makeHandler((v) => transform.setBorderRadius(v));
const handleBorderWidthUpdate = makeHandler((v) => transform.setBorderWidth(v));
const handleBorderColorUpdate = makeHandler((v) => transform.setBorderColor(v));
const handleShadowEnabledUpdate = makeHandler((v) => transform.setShadowEnabled(v));
const handleShadowOffsetXUpdate = makeHandler((v) => transform.setShadowOffsetX(v));
const handleShadowOffsetYUpdate = makeHandler((v) => transform.setShadowOffsetY(v));
const handleShadowBlurUpdate = makeHandler((v) => transform.setShadowBlur(v));
const handleShadowColorUpdate = makeHandler((v) => transform.setShadowColor(v));
const handleShadowOpacityUpdate = makeHandler((v) => transform.setShadowOpacity(v));
const handleSkewXUpdate = makeHandler((v) => transform.setSkewX(v));
const handleSkewYUpdate = makeHandler((v) => transform.setSkewY(v));
const handleRotate90 = makeActionHandler(() => transform.rotate90(), 'toast.transform.rotated90');
const handleRotate90Counter = makeActionHandler(() => transform.rotate90Counter(), 'toast.transform.rotated90');
const handleRotate180 = makeActionHandler(() => transform.rotate180(), 'toast.transform.rotated180');
const handleFlipHorizontal = makeActionHandler(() => transform.flipHorizontal(), 'toast.transform.flippedHorizontal');
const handleFlipVertical = makeActionHandler(() => transform.flipVertical(), 'toast.transform.flippedVertical');
const handleResetPan = makeActionHandler(() => transform.resetPan(), 'toast.transform.panReset');

function handleUndoTransform() {
  if (transform.undoTransform()) {
    renderImage();
    if (window.$toast) window.$toast.info(t('toast.transform.undo', 'Transformation rückgängig'));
  }
}

function handleRedoTransform() {
  if (transform.redoTransform()) {
    renderImage();
    if (window.$toast) window.$toast.info(t('toast.transform.redo', 'Transformation wiederhergestellt'));
  }
}

function handleCommitTransform() { transform.commitTransform(); }

// ===== TEXT FUNCTIONS =====

function addText() {
  if (!currentImage.value) return;
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
    shadowColor: '#000000',
  };
  imageStore.texts.push(newText);
  selectedTextId.value = newText.id;
  renderImage();
  saveHistory();
}

function updateSelectedText(updates) {
  if (!selectedTextId.value) return;
  const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
  if (!text) return;
  Object.assign(text, updates);
  renderImage();
}

const handleTextContentUpdate = (content) => updateSelectedText({ content, txt: content });
const handleTextFontSizeUpdate = (fontSize) => updateSelectedText({ fontSize, size: fontSize });
const handleTextColorUpdate = (color) => updateSelectedText({ color });
const handleTextRotationUpdate = (rotation) => updateSelectedText({ rotation });
const handleTextOpacityUpdate = (opacity) => updateSelectedText({ opacity });
const handleTextStrokeWidthUpdate = (strokeWidth) => updateSelectedText({ strokeWidth });
const handleTextStrokeColorUpdate = (strokeColor) => updateSelectedText({ strokeColor });
const handleTextShadowOffsetXUpdate = (shadowOffsetX) => updateSelectedText({ shadowOffsetX });
const handleTextShadowOffsetYUpdate = (shadowOffsetY) => updateSelectedText({ shadowOffsetY });
const handleTextShadowColorUpdate = (shadowColor) => updateSelectedText({ shadowColor });

function handleTextFontFamilyUpdate(fontFamily) {
  updateSelectedText({ fontFamily });
  saveHistory();
}

function handleTextShadowBlurUpdate(shadowBlur) {
  if (!selectedTextId.value) return;
  const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
  if (!text) return;
  const updates = { shadowBlur };
  if (shadowBlur > 0 && !text.shadowOffsetX) {
    updates.shadowOffsetX = 2;
    updates.shadowOffsetY = 2;
    updates.shadowColor = text.shadowColor || '#000000';
  }
  Object.assign(text, updates);
  renderImage();
}

function handleDeleteText() {
  if (!selectedTextId.value) return;
  const index = imageStore.texts.findIndex((t) => t.id === selectedTextId.value);
  if (index !== -1) {
    imageStore.texts.splice(index, 1);
    selectedTextId.value = null;
    renderImage();
    saveHistory();
  }
}

function handleDeselectText() { selectedTextId.value = null; renderImage(); }

const handleSaveTextHistory = () => saveTextHistory();
const handleUndoText = () => { undoText(); renderImage(); };
const handleRedoText = () => { redoText(); renderImage(); };

function getMousePos(e) {
  const rect = canvas.value.getBoundingClientRect();

  // Maus-Position relativ zum Canvas-Element (in Display-Pixeln)
  const displayX = e.clientX - rect.left;
  const displayY = e.clientY - rect.top;

  // Skalierungsfaktor zwischen Display-Größe und Canvas-Größe
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;

  // Konvertiere zu Canvas-Koordinaten
  return {
    x: displayX * scaleX,
    y: displayY * scaleY,
  };
}

// Gibt den Display-Skalierungsfaktor zurück (wie viel kleiner ist die Anzeige als das Canvas)
function getDisplayScale() {
  if (!canvas.value) return 1;
  const rect = canvas.value.getBoundingClientRect();
  return rect.width / canvas.value.width;
}

function onSelectTextFromPanel(textId) {
  selectedTextId.value = textId;
  renderImage();
}

function findTextAtPosition(x, y) {
  if (!imageStore.texts || imageStore.texts.length === 0) return null;

  const ctx = canvas.value.getContext('2d');

  // Von oben nach unten suchen (oberster Text hat Priorität)
  for (let i = imageStore.texts.length - 1; i >= 0; i--) {
    const text = imageStore.texts[i];
    const fontSize = text.fontSize || text.size || 32;
    const content = text.content || text.txt || '';

    ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`;
    const metrics = ctx.measureText(content);

    // Hit-Box: text.y ist Top-Koordinate (wegen textBaseline = 'top' in renderImage)
    // Etwas größere Hit-Box für bessere Bedienbarkeit
    const padding = 8;
    if (
      x >= text.x - padding &&
      x <= text.x + metrics.width + padding &&
      y >= text.y - padding &&
      y <= text.y + fontSize + padding
    ) {
      return text;
    }
  }
  return null;
}

function onCanvasMouseDown(e) {
  const pos = getMousePos(e);
  const displayScale = getDisplayScale();

  // Pan mit mittlerer Maustaste oder Leertaste + Linksklick
  const isMiddleButton = e.button === 1;
  const isPanGesture = isMiddleButton || (isSpacePressed.value && e.button === 0);

  if (isPanGesture && transform.canPan.value) {
    e.preventDefault();
    isPanning.value = true;
    panStart.value = { x: e.clientX, y: e.clientY };
    canvas.value.style.cursor = 'grabbing';
    return;
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseDown(pos, displayScale);
  if (cropHandled) return;

  // Im Collage-Modus: Erst Text prüfen, dann Layer
  if (isCollageMode.value) {
    // Text hat Priorität (liegt visuell über Layern)
    const text = findTextAtPosition(pos.x, pos.y);
    if (text) {
      selectedTextId.value = text.id;
      isDraggingText.value = true;
      dragOffset.value = {
        x: pos.x - text.x,
        y: pos.y - text.y,
      };
      canvas.value.style.cursor = 'grabbing';
      // Layer-Auswahl aufheben
      imageStore.selectImageLayer(null);
      renderImage();
      return;
    }

    // Kein Text getroffen, Layer-Interaktion
    selectedTextId.value = null;
    layerInteraction.handleMouseDown(e);
    renderImage();
    return;
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
  const text = findTextAtPosition(pos.x, pos.y);

  if (text) {
    selectedTextId.value = text.id;
    isDraggingText.value = true;
    dragOffset.value = {
      x: pos.x - text.x,
      y: pos.y - text.y,
    };
    canvas.value.style.cursor = 'grabbing';
  } else {
    selectedTextId.value = null;
  }

  renderImage();
}

function onCanvasMouseMove(e) {
  const pos = getMousePos(e);

  // Pan-Handling (hat höchste Priorität wenn aktiv)
  if (isPanning.value) {
    const deltaX = e.clientX - panStart.value.x;
    const deltaY = e.clientY - panStart.value.y;
    panStart.value = { x: e.clientX, y: e.clientY };
    transform.pan(deltaX, deltaY);
    renderImage();
    return;
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseMove(pos);
  if (cropHandled) return;

  // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
  if (isCollageMode.value) {
    // Text-Dragging hat Priorität
    if (isDraggingText.value && selectedTextId.value) {
      const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
      if (text) {
        text.x = pos.x - dragOffset.value.x;
        text.y = pos.y - dragOffset.value.y;
        renderImage();
      }
      return;
    }

    // Layer-Interaktion
    layerInteraction.handleMouseMove(e);
    if (layerInteraction.isDragging.value || layerInteraction.isResizing.value) {
      renderImage();
    }

    // Cursor für Text-Hover im Collage-Modus
    if (!layerInteraction.isDragging.value && !layerInteraction.isResizing.value) {
      const text = findTextAtPosition(pos.x, pos.y);
      if (text) {
        canvas.value.style.cursor = 'grab';
      }
    }
    return;
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
  if (isDraggingText.value && selectedTextId.value) {
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (text) {
      text.x = pos.x - dragOffset.value.x;
      text.y = pos.y - dragOffset.value.y;
      renderImage();
    }
  } else {
    const text = findTextAtPosition(pos.x, pos.y);
    // Cursor basierend auf Kontext anpassen
    let cursorStyle = 'default';
    if (isSpacePressed.value && transform.canPan.value) {
      cursorStyle = 'grab';
    } else if (crop.cropMode.value) {
      // Nutze den Cursor vom Crop-Composable mit Display-Skalierung
      const displayScale = getDisplayScale();
      cursorStyle = crop.getCursorForPosition(pos.x, pos.y, displayScale);
    } else if (text) {
      cursorStyle = 'grab';
    }
    canvas.value.style.cursor = cursorStyle;
  }
}

function onCanvasMouseUp() {
  // Pan-Handling beenden
  if (isPanning.value) {
    isPanning.value = false;
    canvas.value.style.cursor = isSpacePressed.value && transform.canPan.value ? 'grab' : 'default';
    return;
  }

  // Crop-Handler über Composable (hat Priorität)
  const cropHandled = crop.handleMouseUp();
  if (cropHandled) {
    handleFinishCrop();
    return;
  }

  // Im Collage-Modus: Text-Dragging oder Layer-Interaktion
  if (isCollageMode.value) {
    // Text-Dragging beenden
    if (isDraggingText.value) {
      isDraggingText.value = false;
      canvas.value.style.cursor = 'default';
      renderImage();
      return;
    }

    // Layer-Interaktion beenden
    layerInteraction.handleMouseUp();
    renderImage();
    return;
  }

  // Sonst Text-Interaktion (nicht Collage-Modus)
  if (isDraggingText.value) {
    isDraggingText.value = false;
    canvas.value.style.cursor = 'default';
    saveHistory();
  }
}

function onCanvasDoubleClick(e) {
  const pos = getMousePos(e);
  const text = findTextAtPosition(pos.x, pos.y);

  if (text) {
    textModal.openEditTextModal(text.id);
  }
}

// Watch texts
watch(() => imageStore.texts, () => {
  renderImage();
}, { deep: true });

// ===== PREVIEW FUNCTIONS =====

function openPreview() {
  if (!currentImage.value || !canvas.value) return;

  // Rendere die Canvas mit allen aktuellen Änderungen neu
  renderImage();

  // Warte kurz, damit das Rendering abgeschlossen ist, dann aktualisiere die Preview-Bilder
  setTimeout(() => {
    // Aktualisiere Original-Preview
    originalPreviewSrc.value = originalImageDataUrl.value || imageStore.workingUrl || '';

    // Aktualisiere bearbeitetes Preview mit der AKTUELLEN Canvas
    if (canvas.value) {
      editedPreviewSrc.value = canvas.value.toDataURL('image/png');
    }

    // Öffne das Modal
    showPreviewModal.value = true;
  }, 100);
}

function closePreview() {
  showPreviewModal.value = false;
}

// Preview Handler für LayerControlPanel (Collage-Modus)
function handleLayerPreview() {
  if (!canvas.value) return;

  // Rendere die Canvas mit allen aktuellen Änderungen neu
  renderImage();

  // Warte kurz, damit das Rendering abgeschlossen ist
  setTimeout(() => {
    // Im Collage-Modus: Erstes Layer-Bild als "Original" verwenden
    if (imageStore.imageLayers.length > 0) {
      originalPreviewSrc.value = imageStore.imageLayers[0].url || '';
    } else {
      originalPreviewSrc.value = '';
    }

    // Aktualisiere bearbeitetes Preview mit der aktuellen Canvas
    if (canvas.value) {
      editedPreviewSrc.value = canvas.value.toDataURL('image/png');
    }

    showPreviewModal.value = true;
  }, 100);
}

// ===========================

// Lifecycle
// Keyboard shortcuts und Initial Load

// ===== LIFECYCLE HOOKS =====

// Globaler MouseMove Handler für Crop Drag/Resize außerhalb des Canvas
function handleGlobalMouseMove(e) {
  // Nur wenn wir gerade draggen, resizen, erstellen oder andere Aktionen ausführen
  const isCropActive = crop.isDragging.value || crop.isResizing.value || crop.isCreating.value;
  if (!isCropActive && !isPanning.value && !isDraggingText.value) {
    return;
  }

  // Berechne Position relativ zum Canvas
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();

  // Konvertiere globale Mausposition zu Canvas-Koordinaten
  const displayX = e.clientX - rect.left;
  const displayY = e.clientY - rect.top;
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;

  const pos = {
    x: displayX * scaleX,
    y: displayY * scaleY,
  };

  // Crop-Handling (Dragging, Resizing oder Creating)
  if (isCropActive) {
    crop.handleMouseMove(pos);
    return;
  }

  // Pan-Handling
  if (isPanning.value) {
    const deltaX = e.clientX - panStart.value.x;
    const deltaY = e.clientY - panStart.value.y;
    panStart.value = { x: e.clientX, y: e.clientY };
    transform.pan(deltaX, deltaY);
    renderImage();
    return;
  }

  // Text-Dragging
  if (isDraggingText.value && selectedTextId.value) {
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (text) {
      text.x = pos.x - dragOffset.value.x;
      text.y = pos.y - dragOffset.value.y;
      renderImage();
    }
  }
}

// Globaler MouseUp Handler für Crop Drag/Resize außerhalb des Canvas
function handleGlobalMouseUp() {
  // Stoppe alle aktiven Crop-Operationen
  if (crop.isDragging.value || crop.isResizing.value || crop.isCreating.value) {
    crop.cancelDragResize();
  }
  // Stoppe auch Text-Dragging
  if (isDraggingText.value) {
    isDraggingText.value = false;
    if (canvas.value) {
      canvas.value.style.cursor = 'default';
    }
  }
  // Stoppe Panning
  if (isPanning.value) {
    isPanning.value = false;
    if (canvas.value) {
      canvas.value.style.cursor =
        isSpacePressed.value && transform.canPan.value ? 'grab' : 'default';
    }
  }
}

onMounted(async () => {
  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);
  window.addEventListener('paste', handlePaste);
  // Global mouse events für Drag/Resize außerhalb des Canvas
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);

  await nextTick();

  // Prüfe ob Collage-Modus aktiv ist (von Galerie aus)
  if (route.query.collageMode === 'true' && imageStore.hasImageLayers) {
    isCollageMode.value = true;

    // Warte auf nächsten Tick damit das Canvas gerendert wird
    await nextTick();

    // Canvas initialisieren
    if (canvas.value) {
      // Canvas Größe setzen (Standard 1200x800 für Collage)
      canvas.value.width = 1200;
      canvas.value.height = 800;

      // ImageStore Canvas initialisieren
      imageStore.initCanvas(canvas.value);

      // HINWEIS: layerInteraction.initListeners() wird NICHT aufgerufen,
      // da wir die Handler manuell aus onCanvasMouseDown/Move/Up aufrufen.
      // So haben wir volle Kontrolle und können Text-Interaktionen priorisieren.

      // Bilder in Layern neu laden falls nötig
      await reloadImageLayers();

      // Erstes Rendern
      imageStore.draw();
      updateImageInfo();
      console.log(`✅ Collage-Modus aktiviert mit ${imageStore.imageLayerCount} Layern`);
    } else {
      console.error('❌ Canvas nicht gefunden im Collage-Modus');
    }
    return;
  }

  // Prüfe ob Bild aus Galerie geladen werden soll
  const loaded = await loadGalleryImage(route.query.galleryImageId, t);

  // Wenn kein Galerie-Bild geladen wurde und ein Bild im Store ist, lade es
  if (!loaded && imageStore.hasImage && imageStore.originalImage) {
    currentImage.value = imageStore.originalImage;
    await nextTick();
    if (canvas.value) {
      loadImage(imageStore.originalImage);
    }
  }
});

// Watch für Galerie-Navigation: Lädt Bild neu wenn galleryImageId sich ändert
watch(
  () => route.query.galleryImageId,
  async (newId, oldId) => {
    // Nur laden wenn sich die ID geändert hat und eine neue ID vorhanden ist
    if (newId && newId !== oldId) {
      console.log('🔄 Galerie-Bild-ID geändert:', newId);
      await loadGalleryImage(newId, t);
    }
  }
);

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keyup', handleKeyup);
  window.removeEventListener('paste', handlePaste);
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
  // Layer-Interaktion Listener entfernen
  if (isCollageMode.value) {
    layerInteraction.removeListeners();
  }
});

function handleKeydown(e) {
  // Ignoriere Shortcuts wenn Input/Textarea fokussiert ist
  const isInputFocused =
    document.activeElement?.tagName === 'INPUT' ||
    document.activeElement?.tagName === 'TEXTAREA' ||
    document.activeElement?.tagName === 'SELECT';

  // Leertaste für Pan-Modus (nur wenn Zoom > 100%)
  if (e.code === 'Space' && transform.canPan.value && !e.repeat) {
    if (!isInputFocused) {
      e.preventDefault();
      isSpacePressed.value = true;
      if (canvas.value) {
        canvas.value.style.cursor = 'grab';
      }
    }
  }

  // Ctrl/Cmd Shortcuts
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // Erst Transform-Undo versuchen, dann allgemeines Undo
      if (transform.canUndoTransform.value) {
        handleUndoTransform();
      } else {
        undo();
      }
    } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault();
      // Erst Transform-Redo versuchen, dann allgemeines Redo
      if (transform.canRedoTransform.value) {
        handleRedoTransform();
      } else {
        redo();
      }
    }
    return;
  }

  // Nur wenn kein Bild geladen ist, keine weiteren Shortcuts
  if (!currentImage.value) return;

  // Nur wenn kein Input fokussiert ist
  if (isInputFocused) return;

  // Transform Shortcuts (nur wenn Bild geladen)
  switch (e.key) {
    // Spiegeln
    case 'h':
    case 'H':
      e.preventDefault();
      handleFlipHorizontal();
      break;
    case 'v':
    case 'V':
      e.preventDefault();
      handleFlipVertical();
      break;

    // Rotation mit Pfeiltasten
    case 'ArrowLeft':
      e.preventDefault();
      if (e.shiftKey) {
        // Grobe Rotation: -15°
        transform.setRotation(transform.transforms.value.rotation - 15, true);
      } else {
        // Feine Rotation: -1°
        transform.setRotation(transform.transforms.value.rotation - 1, true);
      }
      renderImage();
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (e.shiftKey) {
        // Grobe Rotation: +15°
        transform.setRotation(transform.transforms.value.rotation + 15, true);
      } else {
        // Feine Rotation: +1°
        transform.setRotation(transform.transforms.value.rotation + 1, true);
      }
      renderImage();
      break;

    // Rotation zurücksetzen
    case 'r':
    case 'R':
      e.preventDefault();
      if (transform.transforms.value.rotation !== 0) {
        transform.setRotation(0, true);
        renderImage();
        if (window.$toast) {
          window.$toast.info(t('toast.transform.rotationReset', 'Rotation zurückgesetzt'));
        }
      }
      break;

    // Schnell-Rotationen mit Ziffern
    case '1':
      e.preventDefault();
      handleRotate90Counter();
      break;
    case '2':
      e.preventDefault();
      handleRotate180();
      break;
    case '3':
      e.preventDefault();
      handleRotate90();
      break;

    // Delete selected text
    case 'Delete':
    case 'Backspace':
      if (selectedTextId.value) {
        e.preventDefault();
        imageStore.deleteText(selectedTextId.value);
        selectedTextId.value = null;
      }
      break;
  }
}

function handleKeyup(e) {
  // Leertaste loslassen beendet Pan-Modus
  if (e.code === 'Space') {
    isSpacePressed.value = false;
    isPanning.value = false;
    if (canvas.value) {
      canvas.value.style.cursor = 'default';
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
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

/* Visuelle Gruppen-Container */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 3px;
}

/* Basis-Button in der Toolbar */
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.82rem;
  line-height: 1;
  padding: 0.45rem 0.65rem;
  transition: background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  color: var(--color-text);
  background: transparent;

  i {
    font-size: 0.85rem;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
  }

  &:active:not(:disabled) {
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.12);
  }
}

/* Icon-only: feste Breite für gleichmäßiges Raster */
.tb-btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  justify-content: center;
}

/* Primär: Upload */
.tb-btn--primary {
  background: var(--color-primary);
  color: #fff;
  padding: 0.45rem 0.9rem;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary) 88%, #000);
    box-shadow: 0 2px 6px rgba(1, 79, 153, 0.3);
  }
}

/* Erfolg: Download */
.tb-btn--success {
  background: var(--color-success, #22c55e);
  color: #fff;
  padding: 0.45rem 0.9rem;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-success, #22c55e) 88%, #000);
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
  }
}

/* Gefahr: Löschen */
.tb-btn--danger {
  color: var(--color-danger, #dc3545);

  &:hover:not(:disabled) {
    background: rgba(220, 53, 69, 0.1);
    color: var(--color-danger, #dc3545);
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
  padding: 1rem;

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
</style>

<style lang="scss">
/* Collapsible Sidebar Sections */
.sidebar-section {
  margin-bottom: 0.75rem;
  background: var(--color-bg);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: rgba(1, 79, 153, 0.35);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  &.collapsible {
    .section-header {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.875rem 1rem;
      margin: 0;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text);
      background: transparent;
      transition: background 0.15s ease;

      &:hover {
        background: var(--color-bg-secondary);
      }

      .section-icon {
        font-size: 0.85rem;
        color: var(--color-primary);
      }

      .toggle-icon {
        margin-left: auto;
        font-size: 0.65rem;
        opacity: 0.4;
        transition: transform 0.2s ease;
      }
    }

    .section-content {
      padding: 0.25rem 1rem 1.125rem 1rem;
    }

    &.collapsed {
      .section-header {
        border-bottom: none;
      }
    }
  }

  // Non-collapsible sections (Format, Background, Resize, Presets)
  &:not(.collapsible) {
    padding: 0.875rem 1rem;
    padding-top: 0;

    h3 {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 -1rem 0.875rem -1rem;
      padding: 0.875rem 1rem;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border-bottom: 1px solid var(--color-border);
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
        background: linear-gradient(
          to right,
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
        background: linear-gradient(to right, var(--color-border) 0%, #d4a574 50%, #8b5a2b 100%);
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
      background: linear-gradient(
        to right,
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
  input[type='range']:not(.modern-slider) {
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

      input[type='checkbox'] {
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
    color: #f5f4d6;
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

    input[type='checkbox'] {
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem 1rem;
  max-width: 640px;
  width: 100%;
}

.empty-canvas__header {
  text-align: center;
  color: var(--color-text-secondary);

  h2 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0.75rem 0 0.35rem;
    color: var(--color-text);
  }

  p {
    font-size: 0.9rem;
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.empty-canvas__icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--color-light-blue, rgba(1, 79, 153, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  i {
    font-size: 2rem;
    color: var(--color-primary);
    opacity: 0.7;
  }
}

/* Upload-Karten */
.upload-cards {
  display: flex;
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 560px) {
    flex-direction: column;
  }
}

.upload-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-secondary);
  text-align: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.25rem;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    strong {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-text);
    }

    span {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    kbd {
      display: inline-block;
      padding: 0.1em 0.4em;
      font-size: 0.75em;
      font-family: inherit;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      box-shadow: 0 1px 0 var(--color-border);
    }
  }

  /* Datei hochladen — klickbar */
  &--file {
    cursor: pointer;
    border-color: var(--color-primary);

    .upload-card__icon {
      background: rgba(1, 79, 153, 0.1);
      i { color: var(--color-primary); }
    }

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 16px rgba(1, 79, 153, 0.15);
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  /* Drag & Drop — passiv */
  &--drag {
    .upload-card__icon {
      background: var(--color-light-gold, rgba(201, 152, 77, 0.15));
      i { color: var(--color-accent, #c9984d); }
    }
  }

  /* Paste — passiv */
  &--paste {
    .upload-card__icon {
      background: rgba(80, 227, 194, 0.15);
      i { color: var(--color-success, #50e3c2); }
    }
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
:root[data-theme='dark'] {
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
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);

    &:hover {
      border-color: rgba(1, 79, 153, 0.5);
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
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
