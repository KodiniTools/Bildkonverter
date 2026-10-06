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
            accept="image/*,.tiff,.tif,.heic,.heif"
            style="display: none"
            @change="handleFileSelect"
          />
          <AppIcon name="cloud-upload-alt" :size="32" />
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
          <AppIcon name="exclamation-triangle" :size="40" />
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
                <AppIcon name="arrow-right" :size="20" />
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
              <AppIcon name="download" />
              {{ $t('conversion.widget.download') }} ({{ conversionData.to }})
            </button>
            <button class="btn btn-secondary btn-large" @click="resetConverter">
              <AppIcon name="redo" />
              {{ $t('conversion.widget.convertAnother') }}
            </button>
          </div>
        </div>
      </div>

      <div class="widget-footer">
        <router-link :to="{ name: 'batch' }" class="batch-link">
          <AppIcon name="images" />
          {{ $t('conversion.batchCta') }}
        </router-link>
      </div>
    </section>

    <section class="info-section">
      <div class="info-grid">
        <div class="info-card">
          <div class="info-icon"><AppIcon name="bolt" :size="20" /></div>
          <h3>{{ $t('conversion.benefits.fast.title') }}</h3>
          <p>{{ $t('conversion.benefits.fast.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><AppIcon name="shield-alt" :size="20" /></div>
          <h3>{{ $t('conversion.benefits.privacy.title') }}</h3>
          <p>{{ $t('conversion.benefits.privacy.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><AppIcon name="check-circle" :size="20" /></div>
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
          <AppIcon name="arrow-right" :size="20" />
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
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';
import { formatConversions } from '@/router/index.js';
import { FORMAT_INFO } from '@/utils/exportUtils';
import { ApiClient } from '@/api/api';
import {
  isImageFile,
  needsBackendPreview,
  readFileAsDataURL,
  loadImage,
  formatSize,
} from '@/utils/fileUtils';
import { drawImageToCanvas, convertCanvasToFormat } from '@/utils/conversionUtils';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({
  pair: {
    type: String,
    required: true,
  },
});

const conversionData = computed(() => {
  return formatConversions.find((f) => f.pair === props.pair) || { from: '', to: '' };
});

const otherConversions = computed(() => {
  return formatConversions.filter((f) => f.pair !== props.pair).slice(0, 6);
});

// Converter widget state
const fileInput = ref(null);
const isDragging = ref(false);
const sourceFile = ref(null);
const sourcePreview = ref(null);
const isConverting = ref(false);
const conversionError = ref(null);
const convertedUrl = ref(null);
const convertedBlob = ref(null);
const convertedSize = ref(0);

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
  PDF: 'pdf',
};

const outputFormat = computed(() => {
  return FORMAT_MAP[conversionData.value.to] || 'png';
});

// Extension map for special formats not in FORMAT_INFO
const EXT_MAP = {
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  bmp: 'bmp',
  tiff: 'tiff',
  gif: 'gif',
  heic: 'heic',
  heif: 'heif',
  pdf: 'pdf',
  svg: 'svg',
};

const outputFilename = computed(() => {
  if (!sourceFile.value) return '';
  const baseName = sourceFile.value.name.replace(/\.[^.]+$/, '');
  const fmt = outputFormat.value;
  const ext = FORMAT_INFO[fmt]?.extension || EXT_MAP[fmt] || fmt;
  return `${baseName}.${ext}`;
});

// Reset when pair changes (navigation between conversion pages)
watch(
  () => props.pair,
  () => {
    resetConverter();
  }
);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) startConversion(file);
}

function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && isImageFile(file)) {
    startConversion(file);
  } else if (file) {
    window.$toast?.warning(t('toast.batch.noImages'));
  }
}

async function startConversion(file) {
  sourceFile.value = file;
  isConverting.value = true;
  conversionError.value = null;
  convertedUrl.value = null;
  convertedBlob.value = null;

  window.$toast?.info(t('toast.conversion.uploadReceived'));

  try {
    let previewUrl;

    if (needsBackendPreview(file)) {
      // Browser can't display TIFF/HEIC natively – convert to PNG via backend
      const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
      previewUrl = URL.createObjectURL(pngBlob);
    } else {
      previewUrl = await readFileAsDataURL(file);
    }

    sourcePreview.value = previewUrl;

    // Bild in Originalgröße auf einen Canvas zeichnen (weißer Grund für JPG/BMP/PDF)
    const img = await loadImage(previewUrl);
    const format = outputFormat.value;
    const canvas = drawImageToCanvas(img, { width: img.width, height: img.height }, format);

    // PDF/SVG/Backend/Client-Raster – Qualität: WebP 0.85, sonst 0.92
    const blob = await convertCanvasToFormat(canvas, format, file.name, {
      quality: format === 'webp' ? 0.85 : 0.92,
    });
    convertedBlob.value = blob;
    convertedSize.value = blob.size;
    convertedUrl.value = URL.createObjectURL(blob);

    window.$toast?.success(
      t('toast.conversion.success', {
        from: conversionData.value.from,
        to: conversionData.value.to,
      })
    );
  } catch (error) {
    conversionError.value = error.message || t('conversion.widget.converting');
    window.$toast?.error(t('toast.conversion.error', { error: error.message }));
  } finally {
    isConverting.value = false;
  }
}

function downloadResult() {
  if (!convertedBlob.value) return;
  const url = URL.createObjectURL(convertedBlob.value);
  const link = document.createElement('a');
  link.href = url;
  link.download = outputFilename.value;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  window.$toast?.success(t('toast.conversion.downloadStarted', { filename: outputFilename.value }));
}

function resetConverter() {
  if (convertedUrl.value && convertedUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(convertedUrl.value);
  }
  sourceFile.value = null;
  sourcePreview.value = null;
  isConverting.value = false;
  conversionError.value = null;
  convertedUrl.value = null;
  convertedBlob.value = null;
  convertedSize.value = 0;
  if (fileInput.value) fileInput.value.value = '';
}
</script>

<style lang="scss" scoped>
// Konvertierungsseite: Inhaltsseite wie die Landing-Page des Collage Makers,
// Widget als Panel (surface-1), Dropzone wie dessen ImageUploader.

.format-conversion-view {
  min-height: 100vh;
  background: var(--ds-surface-0);
}

.conversion-hero {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-8) var(--ds-space-8);
  max-width: 800px;
  margin: 0 auto;

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);
  }

  .hero-description {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

/* Converter Widget */
.converter-widget {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 var(--ds-space-8) var(--ds-space-12);
}

.widget-container {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
}

// Dropzone (ImageUploader): 1 px gestrichelt, Hover/Drag färben Rahmen und Fläche
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  margin: var(--ds-space-5);
  padding: var(--ds-space-10) var(--ds-space-6);
  text-align: center;
  cursor: pointer;
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-accent);
    background: var(--ds-surface-2);
  }

  &.drag-over {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);

    .app-icon {
      background: var(--ds-accent);
      color: var(--ds-on-accent);
    }
  }

  // Icon im runden Feld (p-3, rounded-full)
  .app-icon {
    box-sizing: content-box;
    padding: var(--ds-space-3);
    margin-bottom: var(--ds-space-2);
    border-radius: 50%;
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  &:hover:not(.drag-over) .app-icon {
    background: var(--ds-surface-3);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    margin: 0;
  }

  p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0 0 var(--ds-space-2);
  }

  .upload-formats {
    display: inline-flex;
    align-items: center;
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-3);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-full);
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    line-height: 1;
  }
}

.processing-state {
  padding: var(--ds-space-12) var(--ds-space-6);
  text-align: center;

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text);
    margin: var(--ds-space-4) 0 0;
  }

  .processing-detail {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin-top: var(--ds-space-1);
  }
}

// Lade-Spinner: einzige Dauer-Animation
.spinner-large {
  width: 32px;
  height: 32px;
  border: 2px solid var(--ds-border-strong);
  border-top-color: var(--ds-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--ds-space-12) var(--ds-space-6);
  text-align: center;

  .app-icon {
    color: var(--ds-danger);
    margin-bottom: var(--ds-space-4);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-danger);
    margin-bottom: var(--ds-space-6);
  }
}

.result-state {
  padding: var(--ds-space-6);
}

.preview-comparison {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  justify-content: center;
  margin-bottom: var(--ds-space-6);

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
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-2);
  }

  img {
    max-width: 100%;
    max-height: 200px;
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    object-fit: contain;
    background: var(--ds-surface-2);
  }

  .preview-size {
    display: block;
    margin-top: var(--ds-space-1);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }
}

.preview-arrow {
  display: flex;
  color: var(--ds-text-3);

  @media (max-width: 500px) {
    transform: rotate(90deg);
  }
}

.result-actions {
  display: flex;
  gap: var(--ds-space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.widget-footer {
  text-align: center;
  margin-top: var(--ds-space-4);
}

.batch-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  color: var(--ds-link);
  text-decoration: none;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  transition: color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-accent);
  }
}

/* Sektionen */
.info-section,
.format-details,
.steps-section,
.other-conversions {
  padding: var(--ds-space-12) var(--ds-space-8);

  > h2 {
    text-align: center;
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-8);
  }
}

.format-details,
.other-conversions {
  max-width: 900px;
  margin: 0 auto;
}

.steps-section {
  border-top: var(--ds-border-width) solid var(--ds-border);
}

/* Info Section */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--ds-space-6);
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .info-icon {
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--ds-space-4);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

/* Format Details */
.format-comparison {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  justify-content: center;
  margin-bottom: var(--ds-space-6);

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.format-box {
  flex: 1;
  max-width: 300px;
  padding: var(--ds-space-5);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;

  h3 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }

  &.target {
    border-color: var(--ds-border-strong);
  }
}

.conversion-arrow {
  display: flex;
  color: var(--ds-text-3);

  @media (max-width: 600px) {
    transform: rotate(90deg);
  }
}

.advantage-text {
  text-align: center;
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
  margin: 0;
}

/* Steps (wie Landing-Page: 64-px-Kreise in Gold) */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ds-space-8);
  max-width: 900px;
  margin: 0 auto;
}

.step {
  text-align: center;

  .step-number {
    width: 64px;
    height: 64px;
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    line-height: 1;
    margin: 0 auto var(--ds-space-4);
  }

  h3 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

/* Other Conversions */
.conversion-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: center;
}

.conversion-link {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  text-decoration: none;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  transition: background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

@media (max-width: 768px) {
  .conversion-hero {
    padding: var(--ds-space-10) var(--ds-space-4) var(--ds-space-6);

    h1 {
      font-size: var(--ds-text-2xl);
    }
  }

  .converter-widget {
    padding: 0 var(--ds-space-4) var(--ds-space-8);
  }

  .info-section,
  .format-details,
  .steps-section,
  .other-conversions {
    padding: var(--ds-space-10) var(--ds-space-4);
  }
}

@media (max-width: 480px) {
  .upload-zone {
    margin: var(--ds-space-4);
    padding: var(--ds-space-8) var(--ds-space-4);
  }

  .result-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
