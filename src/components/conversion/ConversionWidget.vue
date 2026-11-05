<template>
  <!-- Konverter-Widget: Upload, Verarbeitung, Fehler, Ergebnis -->
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
        <h2>{{ $t(`conversion.${pair}.cta`) }}</h2>
        <p>{{ conversion.from }}-{{ $t('conversion.widget.dropHint') }}</p>
        <span class="upload-formats">{{ conversion.from }} → {{ conversion.to }}</span>
      </div>

      <!-- Processing State -->
      <div v-else-if="isConverting" class="processing-state">
        <div class="spinner-large"></div>
        <p>{{ $t('conversion.widget.converting') }}</p>
        <p class="processing-detail">{{ conversion.from }} → {{ conversion.to }}</p>
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
              <span class="preview-label">{{ conversion.from }}</span>
              <img :src="sourcePreview ?? undefined" :alt="sourceFile.name" />
              <span class="preview-size">{{ formatSize(sourceFile.size) }}</span>
            </div>
            <div class="preview-arrow">
              <AppIcon name="arrow-right" :size="20" />
            </div>
            <div class="preview-item">
              <span class="preview-label">{{ conversion.to }}</span>
              <img :src="convertedUrl ?? undefined" :alt="outputFilename" />
              <span class="preview-size">{{ formatSize(convertedSize) }}</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary btn-large" @click="downloadResult">
            <AppIcon name="download" />
            {{ $t('conversion.widget.download') }} ({{ conversion.to }})
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
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';
import { isImageFile, formatSize } from '@/utils/fileUtils';
import {
  useFormatConverter,
  type ConversionPair,
} from '@/composables/conversion/useFormatConverter';

const props = defineProps<{
  pair: string;
  conversion: ConversionPair;
}>();

const { t } = useI18n({ useScope: 'global' });

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const {
  sourceFile,
  sourcePreview,
  isConverting,
  conversionError,
  convertedUrl,
  convertedSize,
  outputFilename,
  startConversion,
  downloadResult,
  resetConverter: resetState,
} = useFormatConverter({ conversion: toRef(props, 'conversion'), t });

function resetConverter() {
  resetState();
  if (fileInput.value) fileInput.value.value = '';
}

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

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) startConversion(file);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && isImageFile(file)) {
    startConversion(file);
  } else if (file) {
    window.$toast?.warning(t('toast.batch.noImages'));
  }
}
</script>

<style lang="scss" scoped>
// Widget als Panel (surface-1), Dropzone wie der ImageUploader des Collage Makers.

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

  h2 {
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

@media (max-width: 768px) {
  .converter-widget {
    padding: 0 var(--ds-space-4) var(--ds-space-8);
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
