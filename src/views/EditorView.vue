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
              <i class="fas fa-reply"></i>
            </button>
            <button
              class="tb-btn tb-btn--icon"
              :disabled="!canRedo"
              :title="$t('editor.toolbar.redo', 'Wiederholen (Ctrl+Y)')"
              @click="redo"
            >
              <i class="fas fa-share"></i>
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
              :title="$t('editor.toolbar.print', 'Drucken')"
              @click="printCurrentImage"
            >
              <i class="fas fa-print"></i>
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
            {{
              isExporting
                ? $t('toast.editor.exporting', 'Exportiere...')
                : $t('editor.toolbar.download')
            }}
          </button>
        </div>
      </div>

      <!-- Hero-Leiste: Grösse ändern – nur sichtbar, wenn ein Bild geladen ist
           (hochgeladen oder aus der Galerie/Collage hinzugefügt) -->
      <div v-if="currentImage || isCollageMode" class="resize-hero">
        <ResizePanel
          variant="hero"
          :resize-width="resizeWidth"
          :resize-height="resizeHeight"
          :maintain-aspect-ratio="maintainAspectRatio"
          :selected-preset="selectedPreset"
          :natural-width="naturalWidth"
          :natural-height="naturalHeight"
          :disabled="!currentImage"
          @update:resize-width="resizeWidth = $event"
          @update:resize-height="resizeHeight = $event"
          @update:maintain-aspect-ratio="maintainAspectRatio = $event"
          @dimension-change="onResizeChange"
          @apply-preset="applySocialPreset"
          @apply-resize="applyResize"
        />
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
          <BackgroundPanel
            :background="background"
            :disabled="!currentImage"
            @update-background="setBackground"
            @render="renderImage"
            @save-history="saveHistory"
          />
          <DetachPanel
            :detached="detachedFromBackground"
            :disabled="!currentImage"
            @toggle="handleToggleDetach"
          />
          <AdjustmentsPanel
            :filters="filters"
            :sections-open="sectionsOpen"
            :disabled="!currentImage"
            @update-filter="setFilter"
            @toggle-section="toggleSection"
            @render="renderImage"
            @save-history="saveHistory"
          />
          <LightColorPanel
            :filters="filters"
            :sections-open="sectionsOpen"
            :disabled="!currentImage"
            @update-filter="setFilter"
            @toggle-section="toggleSection"
            @render="renderImage"
            @save-history="saveHistory"
          />
          <EffectsPanel
            :filters="filters"
            :sections-open="sectionsOpen"
            :disabled="!currentImage"
            @update-filter="setFilter"
            @toggle-section="toggleSection"
            @render="renderImage"
            @save-history="saveHistory"
          />
          <!-- Presets -->
          <div class="sidebar-section">
            <h3>{{ $t('editor.sidebar.presets') }}</h3>
            <FilterPresets :filters="filters" @apply-preset="handlePresetApply" />
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
            <div class="empty-canvas__header">
              <div class="empty-canvas__icon-wrap">
                <i class="fas fa-image"></i>
              </div>
              <h2>{{ $t('editor.canvas.empty.title') }}</h2>
              <p>{{ $t('editor.canvas.empty.description') }}</p>
            </div>

            <div class="upload-cards">
              <!-- Datei wählen -->
              <div
                class="upload-card upload-card--file"
                role="button"
                tabindex="0"
                @click="triggerFileInput"
                @keyup.enter="triggerFileInput"
              >
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
              @touchstart.prevent="onCanvasTouchStart"
              @touchmove.prevent="onCanvasTouchMove"
              @touchend.prevent="onCanvasTouchEnd"
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
              <!-- Live-Anzeige der Zuschnittabmessungen (Breite × Höhe in Pixel) -->
              <div
                class="crop-dimensions"
                :class="{ 'crop-dimensions--inside': cropLabelInside }"
                :title="$t('transform.crop.dimensionsTooltip')"
              >
                <i class="fas fa-vector-square"></i>
                <span
                  >{{ crop.cropDimensions.value.width }} ×
                  {{ crop.cropDimensions.value.height }} px</span
                >
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
          :crop-dimensions="panelCropDimensions"
          :transforms="transform.transforms.value"
          :can-pan="transform.canPan.value"
          :has-pan="transform.hasPan.value"
          :selected-text="selectedTextObject"
          :has-texts="imageStore.texts && imageStore.texts.length > 0"
          :texts="imageStore.texts || []"
          :selected-text-id="selectedTextId"
          :can-undo-text="canUndo"
          :can-redo-text="canRedo"
          :can-undo-transform="canUndo"
          :can-redo-transform="canRedo"
          @toggle-crop="handleToggleCrop"
          @cancel-crop="handleCancelCrop"
          @undo-crop="handleUndoCrop"
          @set-aspect-ratio="handleSetAspectRatio"
          @set-crop-width="handleSetCropWidth"
          @set-crop-height="handleSetCropHeight"
          @center-crop="handleCenterCrop"
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
          @undo-transform="undo"
          @redo-transform="redo"
          @commit-transform="handleCommitTransform"
          @update:text-content="handleTextContentUpdate"
          @update:text-font-size="handleTextFontSizeUpdate"
          @update:text-font-family="handleTextFontFamilyUpdate"
          @update:text-color="handleTextColorUpdate"
          @update:text-rotation="handleTextRotationUpdate"
          @update:text-opacity="handleTextOpacityUpdate"
          @update:text-bold="handleTextBoldUpdate"
          @update:text-italic="handleTextItalicUpdate"
          @update:text-skew-x="handleTextSkewXUpdate"
          @update:text-skew-y="handleTextSkewYUpdate"
          @update:text-stroke-width="handleTextStrokeWidthUpdate"
          @update:text-stroke-color="handleTextStrokeColorUpdate"
          @update:text-shadow-blur="handleTextShadowBlurUpdate"
          @update:text-shadow-offset-x="handleTextShadowOffsetXUpdate"
          @update:text-shadow-offset-y="handleTextShadowOffsetYUpdate"
          @update:text-shadow-color="handleTextShadowColorUpdate"
          @save-text-history="saveHistory"
          @undo-text="undo"
          @redo-text="redo"
          @delete-text="handleDeleteText"
          @deselect-text="handleDeselectText"
          @add-text="addText"
          @select-text-by-id="onSelectTextFromPanel"
          @delete-text-by-id="handleDeleteTextById"
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

    <!-- Export Dialog -->
    <Teleport to="body">
      <div
        v-if="showExportDialog"
        class="export-dialog-overlay"
        @click.self="showExportDialog = false"
      >
        <div class="export-dialog">
          <h3 class="export-dialog__title">{{ $t('editor.toolbar.download') }}</h3>
          <div class="export-dialog__input-row">
            <input
              v-model="exportDialogFilename"
              class="export-dialog__input"
              type="text"
              :placeholder="$t('editor.toolbar.download')"
              autofocus
              @keydown.enter="confirmExport"
              @keydown.escape="showExportDialog = false"
            />
            <span class="export-dialog__ext">.{{ outputFormat }}</span>
          </div>
          <div class="export-dialog__actions">
            <button
              class="export-dialog__btn export-dialog__btn--cancel"
              @click="showExportDialog = false"
            >
              {{ $t('common.cancel', 'Abbrechen') }}
            </button>
            <button class="export-dialog__btn export-dialog__btn--confirm" @click="confirmExport">
              <i class="fas fa-download"></i>
              {{ $t('editor.toolbar.download') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Weiterleitungs-Angebot nach erfolgreichem Download -->
    <Teleport to="body">
      <div v-if="showForwardOffer" class="forward-offer-overlay" @click.self="dismissForwardOffer">
        <div class="forward-offer">
          <div class="forward-offer__icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3 class="forward-offer__title">{{ $t('handoff.forwardTitle') }}</h3>
          <p class="forward-offer__text">{{ $t('handoff.forwardText') }}</p>

          <div class="forward-offer__options">
            <button class="forward-offer__option" @click="forwardTo('color-extractor')">
              <i class="fas fa-palette"></i>
              <span class="forward-offer__option-label">
                {{ $t('handoff.forwardColorExtractor') }}
                <small>{{ $t('handoff.forwardColorExtractorHint') }}</small>
              </span>
              <i class="fas fa-arrow-right forward-offer__option-arrow"></i>
            </button>

            <button class="forward-offer__option" @click="forwardTo('visualizer')">
              <i class="fas fa-wave-square"></i>
              <span class="forward-offer__option-label">
                {{ $t('handoff.forwardVisualizer') }}
                <small>{{ $t('handoff.forwardVisualizerHint') }}</small>
              </span>
              <i class="fas fa-arrow-right forward-offer__option-arrow"></i>
            </button>
          </div>

          <button class="forward-offer__dismiss" @click="dismissForwardOffer">
            {{ $t('handoff.forwardDismiss') }}
          </button>
        </div>
      </div>
    </Teleport>
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
import { useFilterManagement, DEFAULT_FILTERS } from '@/composables/useFilterManagement';
import { useResizeManager } from '@/composables/useResizeManager';
import { useImageLayerInteraction } from '@/composables/useImageLayerInteraction';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { useImageLoader } from '@/composables/useImageLoader';
import { FORMAT_INFO, SUPPORTED_FORMATS, getFormatInfo } from '@/utils/exportUtils';

import TransformPanel from '@/components/features/TransformPanel.vue';
import LayerControlPanel from '@/components/features/LayerControlPanel.vue';
import FilterPresets from '@/components/editor/FilterPresets.vue';
import ExportPanel from '@/components/editor/sidebar/ExportPanel.vue';
import BackgroundPanel from '@/components/editor/sidebar/BackgroundPanel.vue';
import DetachPanel from '@/components/editor/sidebar/DetachPanel.vue';
import AdjustmentsPanel from '@/components/editor/sidebar/AdjustmentsPanel.vue';
import LightColorPanel from '@/components/editor/sidebar/LightColorPanel.vue';
import EffectsPanel from '@/components/editor/sidebar/EffectsPanel.vue';
import ResizePanel from '@/components/editor/sidebar/ResizePanel.vue';
import PreviewModal from '@/components/editor/PreviewModal.vue';
import { useTransformHandlers } from '@/composables/editor/useTransformHandlers';
import { useEditorText } from '@/composables/editor/useEditorText';
import { useCanvasInteraction } from '@/composables/editor/useCanvasInteraction';
import { useEditorKeyboard } from '@/composables/editor/useEditorKeyboard';
import { useImageInfo } from '@/composables/editor/useImageInfo';
import { useEditorHistory } from '@/composables/editor/useEditorHistory';
import { useEditorResize } from '@/composables/editor/useEditorResize';
import { useEditorDetach } from '@/composables/editor/useEditorDetach';
import { useEditorExport } from '@/composables/editor/useEditorExport';
import { useEditorPreview } from '@/composables/editor/useEditorPreview';
import { logger } from '@/utils/logger';

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
const currentFileName = ref(''); // Dateiname ohne Endung (für Export und Ebenen)

// ===== TEXT INTERACTION STATE =====
const selectedTextId = ref(null);
const isDraggingText = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// ===== PAN INTERACTION STATE =====
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const isSpacePressed = ref(false);

// ===== COLLAGE MODE STATE =====
const isCollageMode = ref(false);
// true, wenn das Basisbild als freie Ebene abgelöst ist (geteilt mit Detach und Historie)
const detachedFromBackground = ref(false);

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

// Die Sidebar-Panels verändern ihre Props nicht, sondern melden Änderungen;
// gesetzt wird hier, neu gezeichnet über das render-Ereignis der Panels.
function setFilter(name, value) {
  filters.value[name] = value;
}
function setBackground(property, value) {
  background.value[property] = value;
}
const toggleSection = filterManagement.toggleSection;

// Resize Manager Composable
const resizeManager = useResizeManager({
  getCurrentDimensions: () => ({
    width: canvas.value?.width || 0,
    height: canvas.value?.height || 0,
  }),
  onResize: () => {
    // Resize wird in applyResize() gehandhabt
  },
});
const { resizeWidth, resizeHeight, maintainAspectRatio, naturalWidth, naturalHeight } =
  resizeManager;

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
const { renderImage: _renderImageCore, renderImageForExport } = canvasRenderer;

const {
  imageWidth,
  imageHeight,
  imageSize,
  updateImageDimensions,
  updateImageSize,
  updateImageInfo,
  formatSize,
} = useImageInfo({ canvas, outputFormat });

function renderImage() {
  _renderImageCore();
  updateImageDimensions();
}

// Die einzige Undo/Redo-Historie (Bild, Filter, Transform, Texte, Crop, Ebenen);
// wird im imageStore registriert, damit Ebenen-Panel und Text-Dialog sie nutzen
const { canUndo, canRedo, saveHistory, undo, redo, resetHistory, unregisterHistory } =
  useEditorHistory({
    canvas,
    currentImage,
    isCollageMode,
    detachedFromBackground,
    selectedTextId,
    filters,
    background,
    imageStore,
    filterManagement,
    transform,
    resizeManager,
    crop,
    renderImage,
    updateImageInfo,
  });

// Größe ändern: Live-Vorschau, Presets, Anwenden
const { selectedPreset, onResizeChange, applySocialPreset, applyResize } = useEditorResize({
  canvas,
  currentImage,
  resizeManager,
  renderImage,
  updateImageSize,
  saveHistory,
  t,
});

// Bild vom Hintergrund lösen / wieder verbinden
const { handleToggleDetach } = useEditorDetach({
  canvas,
  currentImage,
  originalImage,
  isCollageMode,
  detachedFromBackground,
  background,
  currentFileName,
  imageStore,
  filterManagement,
  transform,
  resizeManager,
  renderImage,
  renderImageForExport,
  updateImageInfo,
  saveHistory,
  t,
});

// Export-Dialog, Drucken, Weiterleitung an andere Kodini-Tools
const {
  exportQuality,
  isExporting,
  exportTransparent,
  showExportDialog,
  exportDialogFilename,
  showForwardOffer,
  downloadImage,
  confirmExport,
  printCurrentImage,
  forwardTo,
  dismissForwardOffer,
} = useEditorExport({
  canvas,
  outputFormat,
  currentFileName,
  imageStore,
  renderImage,
  renderImageForExport,
  t,
});

// Vorher/Nachher-Vorschau
const {
  showPreviewModal,
  originalPreviewSrc,
  editedPreviewSrc,
  openPreview,
  handleLayerPreview,
  closePreview,
} = useEditorPreview({
  canvas,
  currentImage,
  originalImageDataUrl,
  imageStore,
  renderImage,
  renderImageForExport,
});

// Image Loader Composable
const {
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
  currentFileName,
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

// Crop-Overlay-Rechteck: Konvertiere Canvas-Koordinaten zu Display-Koordinaten
const cropOverlayRect = computed(() => {
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
    left: offsetX + parsePixels(originalStyle.left) * scaleX,
    top: offsetY + parsePixels(originalStyle.top) * scaleY,
    width: parsePixels(originalStyle.width) * scaleX,
    height: parsePixels(originalStyle.height) * scaleY,
  };
});

const scaledCropOverlayStyle = computed(() => {
  const rect = cropOverlayRect.value;
  if (!rect) return null;

  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
});

// Abmessungs-Label sitzt normalerweise über der Crop-Box.
// Ist dort kein Platz (Box klebt am oberen Rand), klappt es nach innen.
const cropLabelInside = computed(() => {
  const rect = cropOverlayRect.value;
  return rect ? rect.top < 34 : false;
});

// Abmessungen für das Crop-Panel – nur solange eine Auswahl existiert
const panelCropDimensions = computed(() => {
  if (!crop.cropping.value) return { width: 0, height: 0 };
  return crop.cropDimensions.value;
});

// Image info (reactive refs statt computed für bessere Kontrolle)
// Bild-Infos (Breite/Höhe/Dateigröße) siehe useImageInfo-Composable oben.

// Methods
function triggerFileInput() {
  fileInput.value?.click();
}

async function loadImage(img) {
  currentImage.value = img;

  // Reset Crop-Zustand über Composable
  crop.resetCropState();

  // Transformationen für neues Bild zurücksetzen
  transform.resetTransforms();

  // Warte bis Vue das Canvas gerendert hat
  await nextTick();

  // Prüfe ob canvas bereit ist
  if (!canvas.value) {
    logger.warn('⚠️ Canvas noch nicht initialisiert, warte...');
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

  // Abgelösten Zustand (freie Ebene) auflösen und zurück in den Einzelbild-Modus
  if (detachedFromBackground.value || isCollageMode.value) {
    imageStore.clearImageLayers();
    imageStore.selectImageLayer(null);
    detachedFromBackground.value = false;
    isCollageMode.value = false;
    layerInteraction.removeListeners();
  }

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
  resetHistory();
  saveHistory();

  logger.log('✅ Bild auf Originalzustand zurückgesetzt');

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
  detachedFromBackground.value = false;

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
  filters.value = { ...DEFAULT_FILTERS };
  currentPreset.value = null;

  // Crop-Modus über Composable zurücksetzen
  crop.resetCropState();

  // Transform-Zustand über Composable zurücksetzen
  transform.resetTransforms();

  // History zurücksetzen
  resetHistory();

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

  logger.log('🗑️ Bild erfolgreich gelöscht');
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

function handleCancelCrop() {
  crop.cancelCrop();
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

// Pixelgenaue Zuschnittgröße über die Eingabefelder im Crop-Panel
function handleSetCropWidth(width) {
  crop.setCropWidth(width);
}

function handleSetCropHeight(height) {
  crop.setCropHeight(height);
}

// Zuschnittbereich mittig im Canvas positionieren
function handleCenterCrop() {
  crop.centerCropBox();
}

// ===== TRANSFORM FUNCTIONS =====

const {
  handleOpacityUpdate,
  handleRotationUpdate,
  handleScaleUpdate,
  handleBorderRadiusUpdate,
  handleBorderWidthUpdate,
  handleBorderColorUpdate,
  handleShadowEnabledUpdate,
  handleShadowOffsetXUpdate,
  handleShadowOffsetYUpdate,
  handleShadowBlurUpdate,
  handleShadowColorUpdate,
  handleShadowOpacityUpdate,
  handleSkewXUpdate,
  handleSkewYUpdate,
  handleRotate90,
  handleRotate90Counter,
  handleRotate180,
  handleFlipHorizontal,
  handleFlipVertical,
  handleResetPan,
  handleCommitTransform,
} = useTransformHandlers({ transform, renderImage, t, saveHistory });

// ===== TEXT FUNCTIONS =====

const {
  addText,
  handleTextContentUpdate,
  handleTextFontSizeUpdate,
  handleTextColorUpdate,
  handleTextRotationUpdate,
  handleTextOpacityUpdate,
  handleTextBoldUpdate,
  handleTextItalicUpdate,
  handleTextSkewXUpdate,
  handleTextSkewYUpdate,
  handleTextStrokeWidthUpdate,
  handleTextStrokeColorUpdate,
  handleTextShadowOffsetXUpdate,
  handleTextShadowOffsetYUpdate,
  handleTextShadowColorUpdate,
  handleTextFontFamilyUpdate,
  handleTextShadowBlurUpdate,
  handleDeleteText,
  handleDeleteTextById,
  handleDeselectText,
} = useEditorText({
  currentImage,
  canvas,
  imageStore,
  selectedTextId,
  renderImage,
  saveHistory,
});

const {
  onSelectTextFromPanel,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasDoubleClick,
  onCanvasTouchStart,
  onCanvasTouchMove,
  onCanvasTouchEnd,
  handleGlobalMouseMove,
  handleGlobalMouseUp,
} = useCanvasInteraction({
  canvas,
  isSpacePressed,
  isPanning,
  panStart,
  isCollageMode,
  selectedTextId,
  isDraggingText,
  dragOffset,
  transform,
  crop,
  layerInteraction,
  imageStore,
  textModal,
  renderImage,
  handleFinishCrop,
  saveHistory,
});

// Watch texts
watch(
  () => imageStore.texts,
  () => {
    renderImage();
  },
  { deep: true }
);

// ===========================

// Lifecycle
// Keyboard shortcuts und Initial Load

// ===== LIFECYCLE HOOKS =====

const { handleKeydown, handleKeyup } = useEditorKeyboard({
  canvas,
  currentImage,
  selectedTextId,
  isSpacePressed,
  isPanning,
  transform,
  imageStore,
  renderImage,
  undo,
  redo,
  handleFlipHorizontal,
  handleFlipVertical,
  handleRotate90,
  handleRotate90Counter,
  handleRotate180,
  t,
});

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

      // Erstes Rendern und Startpunkt der Historie
      renderImage();
      updateImageInfo();
      saveHistory('Collage geladen');
      logger.log(`✅ Collage-Modus aktiviert mit ${imageStore.imageLayerCount} Layern`);
    } else {
      logger.error('❌ Canvas nicht gefunden im Collage-Modus');
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
      logger.log('🔄 Galerie-Bild-ID geändert:', newId);
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
  // Historie beim Store abmelden (Ebenen-Panel/Text-Dialog außerhalb des Editors)
  unregisterHistory();
});
</script>

<style lang="scss" scoped src="./EditorView.scoped.scss"></style>
<style lang="scss" src="./EditorView.styles.scss"></style>
