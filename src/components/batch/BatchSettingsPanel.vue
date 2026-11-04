<template>
  <div class="settings-panel">
    <h3>
      <AppIcon name="cog" />
      {{ $t('batch.settings.title') }}
    </h3>

    <div class="settings-grid">
      <div class="setting-group">
        <UiSelect
          v-model="settings.format"
          :label="$t('batch.settings.format')"
          :options="BATCH_FORMAT_OPTIONS"
        />
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
        <SliderField v-model="settings.quality" :min="1" :max="100" unit="%" :default-value="80" />
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
          <UiSwitch
            v-model="settings.maintainAspect"
            :label="$t('batch.settings.maintainAspect')"
          />
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

      <div v-if="supportsExif(settings.format)" class="setting-group">
        <UiSwitch
          v-model="settings.keepExif"
          :label="$t('batch.settings.keepExif')"
          data-testid="batch-keep-exif"
        />
      </div>
    </div>

    <div class="action-buttons">
      <button
        class="btn btn-primary"
        :disabled="isProcessing || !hasConvertableFiles"
        @click="emit('start')"
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
        :disabled="isProcessing || !hasProcessedFiles"
        @click="emit('download-all')"
      >
        <AppIcon name="download" />
        {{ $t('batch.downloadAll') }}
      </button>

      <button
        class="btn btn-zip"
        :class="{ 'btn-zip-ready': downloadReady }"
        :disabled="isProcessing || !hasProcessedFiles"
        @click="emit('download-zip')"
      >
        <AppIcon name="file-archive" />
        {{ $t('batch.downloadZip') }}
      </button>

      <button class="btn btn-danger" :disabled="isProcessing" @click="emit('clear')">
        <AppIcon name="trash" />
        {{ $t('batch.clearAll') }}
      </button>

      <button
        v-if="hasCompletedFiles"
        class="btn btn-secondary"
        :disabled="isProcessing"
        @click="emit('reset')"
      >
        <AppIcon name="undo" />
        {{ $t('batch.resetConversion') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Einstellungen und Aktionen der Batch-Konvertierung (aus BatchView
 * ausgelagert). Einstellungen per v-model; Breite/Höhe folgen bei
 * „Seitenverhältnis beibehalten“ dem ersten Bild (useBatchDimensions).
 */
import { toRef } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { BATCH_FORMAT_OPTIONS, type BatchSettings } from '@/composables/batch/types';
import { useBatchDimensions } from '@/composables/batch/useBatchDimensions';
import { supportsExif } from '@/utils/exif';

const props = defineProps<{
  /** Breite/Höhe des ersten Bildes (null, solange keins geladen ist) */
  referenceAspectRatio: number | null;
  isProcessing: boolean;
  hasConvertableFiles: boolean;
  hasCompletedFiles: boolean;
  hasProcessedFiles: boolean;
  downloadReady: boolean;
}>();

const settings = defineModel<BatchSettings>('settings', { required: true });

const emit = defineEmits<{
  start: [];
  'download-all': [];
  'download-zip': [];
  clear: [];
  reset: [];
}>();

const { onWidthInput, onHeightInput } = useBatchDimensions(
  settings,
  toRef(props, 'referenceAspectRatio')
);
</script>

<style lang="scss" scoped>
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

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  cursor: pointer;
  font-size: var(--ds-text-md);
  color: var(--ds-text);

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

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    button {
      min-width: 0;
    }
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
