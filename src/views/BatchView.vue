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
        accept="image/*,.tiff,.tif,.heic,.heif,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef,.x3f"
        style="display: none"
        @change="handleFileSelect"
      />

      <AppIcon name="cloud-upload-alt" :size="32" />
      <h3>{{ $t('batch.upload.title') }}</h3>
      <p>{{ $t('batch.upload.description') }}</p>
      <span class="upload-hint">{{ $t('batch.upload.hint') }}</span>
    </div>

    <!-- Settings Panel -->
    <div v-if="files.length > 0" class="settings-panel">
      <h3>
        <AppIcon name="cog" />
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
          <SliderField
            v-model="settings.quality"
            :min="1"
            :max="100"
            unit="%"
            :default-value="80"
          />
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
          <AppIcon name="play" />
          {{
            isProcessing
              ? $t('batch.processing')
              : hasCompletedFiles
                ? $t('batch.reconvert')
                : $t('batch.start')
          }}
        </button>

        <button
          class="btn btn-download"
          :class="{ 'btn-download-ready': downloadReady }"
          :disabled="isProcessing || processedFiles.length === 0"
          @click="downloadAll"
        >
          <AppIcon name="download" />
          {{ $t('batch.downloadAll') }}
        </button>

        <button
          class="btn btn-zip"
          :class="{ 'btn-zip-ready': downloadReady }"
          :disabled="isProcessing || processedFiles.length === 0"
          @click="downloadAsZip"
        >
          <AppIcon name="file-archive" />
          {{ $t('batch.downloadZip') }}
        </button>

        <button class="btn btn-danger" :disabled="isProcessing" @click="clearAll">
          <AppIcon name="trash" />
          {{ $t('batch.clearAll') }}
        </button>

        <button
          v-if="hasCompletedFiles"
          class="btn btn-secondary"
          :disabled="isProcessing"
          @click="resetConversion"
        >
          <AppIcon name="undo" />
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

        <div v-if="isProcessing" class="progress-summary">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
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
            error: file.status === 'error',
          }"
        >
          <div class="file-preview">
            <img :src="file.preview" :alt="file.name" />

            <div v-if="file.status === 'processing'" class="processing-overlay">
              <div class="spinner"></div>
            </div>

            <div v-if="file.status === 'completed'" class="completed-overlay">
              <AppIcon name="check-circle" />
            </div>

            <div v-if="file.status === 'error'" class="error-overlay">
              <AppIcon name="exclamation-circle" />
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
                :title="$t('batch.files.download')"
                :aria-label="$t('batch.files.download')"
                @click="downloadFile(file)"
              >
                <AppIcon name="download" />
              </button>

              <button
                class="btn-icon"
                :title="$t('batch.files.preview')"
                :aria-label="$t('batch.files.preview')"
                @click="previewFile(file)"
              >
                <AppIcon name="eye" />
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
            :disabled="file.status === 'processing'"
            :aria-label="$t('confirm.delete', 'Löschen')"
            :title="$t('confirm.delete', 'Löschen')"
            @click="removeFile(file.id)"
          >
            <AppIcon name="times" />
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="previewingFile" class="preview-modal" @click="closePreview">
        <div class="modal-content" @click.stop>
          <button
            class="close-btn"
            :aria-label="$t('common.close', 'Schließen')"
            :title="$t('common.close', 'Schließen')"
            @click="closePreview"
          >
            <AppIcon name="times" />
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import { useBatchConversion } from '@/composables/useBatchConversion';
import { formatSize } from '@/utils/fileUtils';
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';

const { t } = useI18n({ useScope: 'global' });
const { confirm: confirmDialog } = useConfirm();

// UI-State
const fileInput = ref(null);
const isDragging = ref(false);
const previewingFile = ref(null);

const settings = ref({
  format: 'jpg',
  quality: 80,
  width: null,
  height: null,
  maintainAspect: true,
  prefix: '',
  pdfMode: 'single', // 'single' = jedes Bild als eigenes PDF, 'merged' = alle in einem PDF
});

const {
  files,
  processedFiles,
  isProcessing,
  downloadReady,
  referenceAspectRatio,
  hasConvertableFiles,
  hasCompletedFiles,
  processedCount,
  overallProgress,
  addFiles,
  startProcessing,
  removeFile,
  clearAll,
  resetConversion,
  downloadFile,
  downloadAll,
  downloadAsZip,
} = useBatchConversion({ settings, t, confirm: confirmDialog });

// Seitenverhältnis: das erste hochgeladene Bild dient als Referenz
const isUpdatingDimension = ref(false);

function onWidthInput() {
  if (!settings.value.maintainAspect || isUpdatingDimension.value) return;
  if (!settings.value.width || !referenceAspectRatio.value) return;
  isUpdatingDimension.value = true;
  settings.value.height = Math.max(
    1,
    Math.round(settings.value.width / referenceAspectRatio.value)
  );
  isUpdatingDimension.value = false;
}

function onHeightInput() {
  if (!settings.value.maintainAspect || isUpdatingDimension.value) return;
  if (!settings.value.height || !referenceAspectRatio.value) return;
  isUpdatingDimension.value = true;
  settings.value.width = Math.max(
    1,
    Math.round(settings.value.height * referenceAspectRatio.value)
  );
  isUpdatingDimension.value = false;
}

// Beim Einschalten von "Seitenverhältnis beibehalten" die Höhe aus der Breite ableiten
watch(
  () => settings.value.maintainAspect,
  (newVal) => {
    if (newVal && settings.value.width && referenceAspectRatio.value) {
      settings.value.height = Math.max(
        1,
        Math.round(settings.value.width / referenceAspectRatio.value)
      );
    }
  }
);

// Upload
function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  addFiles(Array.from(event.target.files));
}

function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;
  addFiles(Array.from(event.dataTransfer.files));
}

// Vorschau-Modal
function previewFile(file) {
  previewingFile.value = file;
}

function closePreview() {
  previewingFile.value = null;
}
</script>

<style lang="scss" scoped>
.batch-view {
  padding: var(--ds-space-8);
  min-height: 100vh;
}

.batch-header {
  text-align: center;
  margin-bottom: var(--ds-space-8);

  h1 {
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    letter-spacing: var(--ds-tracking-tight);
    line-height: var(--ds-leading-tight);
    margin-bottom: var(--ds-space-2);
  }

  .batch-subtitle {
    margin: 0;
    color: var(--ds-text-2);
    font-size: var(--ds-text-lg);
  }
}

// ===== DROPZONE (wie ImageUploader) =====

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-6);
  text-align: center;
  color: var(--ds-text-2);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);
  margin-bottom: var(--ds-space-8);

  > .app-icon {
    box-sizing: content-box;
    padding: var(--ds-space-3);
    border-radius: 50%;
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  &:hover {
    border-color: var(--ds-accent);
    background: var(--ds-surface-2);
  }

  &.drag-over {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);

    > .app-icon {
      background: var(--ds-accent);
      color: var(--ds-on-accent);
    }
  }

  h3 {
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
  }

  p {
    margin: 0;
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  .upload-hint {
    font-size: var(--ds-text-xs);
    color: var(--ds-text-3);
  }
}

// ===== EINSTELLUNGEN (Panel) =====

.settings-panel {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-5);
  margin-bottom: var(--ds-space-8);

  h3 {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin-bottom: var(--ds-space-4);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);

    .app-icon {
      color: var(--ds-text-2);
    }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--ds-space-6);
  margin-bottom: var(--ds-space-6);
}

.setting-group {
  > label {
    display: block;
    margin-bottom: var(--ds-space-2);
    font-weight: var(--ds-weight-medium);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  select,
  input[type='text'],
  input[type='number'] {
    width: 100%;
  }
}

.resize-options {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);

  > span {
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
  }
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  cursor: pointer;
  font-size: var(--ds-text-md);
  color: var(--ds-text);

  input[type='checkbox'],
  input[type='radio'] {
    width: auto;
  }
}

.pdf-mode-options {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.action-buttons {
  display: flex;
  gap: var(--ds-space-3);
  flex-wrap: wrap;

  button {
    flex: 1;
    min-width: 150px;
  }
}

// Download-Buttons: Sekundär; nach der Konvertierung als „bereit“ markiert
// (Auswahlzustand statt grüner Fläche)
.btn-download,
.btn-zip {
  background: var(--ds-surface-2);
  border-color: var(--ds-border-strong);
  color: var(--ds-text);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
  }
}

.btn-download-ready,
.btn-zip-ready {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
  color: var(--ds-text);

  &:hover:not(:disabled) {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent-hover);
  }
}

// ===== DATEILISTE =====

.files-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ds-space-4);
    flex-wrap: wrap;
    gap: var(--ds-space-4);

    h3 {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      margin: 0;
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-semibold);
      line-height: var(--ds-leading);

      .file-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 var(--ds-space-2);
        background: var(--ds-surface-2);
        border: var(--ds-border-width) solid var(--ds-border);
        color: var(--ds-text-2);
        border-radius: var(--ds-radius-full);
        font-size: var(--ds-text-xs);
        font-weight: var(--ds-weight-semibold);
        line-height: 1;
      }
    }
  }

  .progress-summary {
    display: flex;
    align-items: center;
    gap: var(--ds-space-3);

    .progress-bar {
      width: 200px;
      height: 6px;
      background: var(--ds-border-strong);
      border-radius: var(--ds-radius-full);
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: var(--ds-accent);
        border-radius: var(--ds-radius-full);
      }
    }

    span {
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-medium);
      color: var(--ds-text-2);
      font-variant-numeric: tabular-nums;
    }
  }
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--ds-space-5);
}

// Karte wie TemplateCard; Status nur als 1-px-Linie und Icon
.file-card {
  position: relative;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  &.processing {
    border-color: var(--ds-accent);
  }

  &.completed {
    border-color: var(--ds-success);
  }

  &.error {
    border-color: var(--ds-danger);
  }
}

.file-preview {
  position: relative;
  width: 100%;
  padding-top: 75%;
  overflow: hidden;
  background: var(--ds-surface-2);
  border-bottom: var(--ds-border-width) solid var(--ds-border);

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// Status-Chips oben links über dem Bild (surface-1, Icon in Statusfarbe)
.processing-overlay,
.completed-overlay,
.error-overlay {
  position: absolute;
  top: var(--ds-space-2);
  left: var(--ds-space-2);
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 50%;
}

.completed-overlay {
  color: var(--ds-success);
}

.error-overlay {
  color: var(--ds-danger);
}

.spinner {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  border: 2px solid var(--ds-border-strong);
  border-top-color: var(--ds-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.file-info {
  padding: var(--ds-space-4);

  h4 {
    margin-bottom: var(--ds-space-1);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-meta {
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-2);
  }

  .file-actions {
    display: flex;
    gap: var(--ds-space-2);
  }

  .error-message {
    font-size: var(--ds-text-xs);
    color: var(--ds-danger);
  }

  .progress-info {
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text-2);
    font-variant-numeric: tabular-nums;
  }
}

.remove-btn {
  position: absolute;
  top: var(--ds-space-2);
  right: var(--ds-space-2);
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-1);
  color: var(--ds-text-2);
  border-radius: 50%;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
    color: var(--ds-danger);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

// Icon-Button sm (28): Sekundär-Fläche
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

// ===== VORSCHAU-MODAL =====

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--ds-space-4);
  animation: fadeIn var(--ds-duration-slow) var(--ds-ease);
}

.modal-content {
  position: relative;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-overlay);
  padding: var(--ds-space-5);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.close-btn {
  position: absolute;
  top: var(--ds-space-3);
  right: var(--ds-space-3);
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.comparison-view {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--ds-space-6);
  align-items: center;
  margin-top: var(--ds-space-8);

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
    margin-bottom: var(--ds-space-3);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }

  img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: var(--ds-radius-md);
    border: var(--ds-border-width) solid var(--ds-border);
  }
}

.comparison-divider {
  width: var(--ds-border-width);
  height: 400px;
  background: var(--ds-border);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .batch-view {
    padding: var(--ds-space-4);
  }

  .batch-header {
    margin-bottom: var(--ds-space-6);

    h1 {
      font-size: var(--ds-text-xl);
    }

    .batch-subtitle {
      font-size: var(--ds-text-md);
    }
  }

  .upload-zone {
    padding: var(--ds-space-5);
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    button {
      min-width: 0;
    }
  }

  .progress-summary .progress-bar {
    width: 120px;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--ds-space-4);
  }

  .remove-btn,
  .btn-icon {
    width: var(--ds-row-height);
    height: var(--ds-row-height);
  }

  .preview-modal {
    padding: var(--ds-space-2);
  }

  .modal-content {
    padding: var(--ds-space-4);
    max-width: 95vw;
  }
}

@media (max-width: 480px) {
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
