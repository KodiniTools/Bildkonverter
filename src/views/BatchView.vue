<template>
  <div class="batch-view">
    <header class="batch-header">
      <h1>{{ $t('batch.title') }}</h1>
      <p class="batch-subtitle">{{ $t('batch.subtitle') }}</p>
    </header>

    <!-- Upload Area -->
    <BatchUploadZone @files="addFiles" />

    <!-- Settings Panel -->
    <BatchSettingsPanel
      v-if="files.length > 0"
      v-model:settings="settings"
      :reference-aspect-ratio="referenceAspectRatio"
      :is-processing="isProcessing"
      :has-convertable-files="hasConvertableFiles"
      :has-completed-files="hasCompletedFiles"
      :has-processed-files="processedFiles.length > 0"
      :download-ready="downloadReady"
      @start="startProcessing"
      @download-all="downloadAll"
      @download-zip="downloadAsZip"
      @clear="clearAll"
      @reset="resetConversion"
    />

    <!-- Files List -->
    <BatchFileList
      v-if="files.length > 0"
      :files="files"
      :format="settings.format"
      :is-processing="isProcessing"
      :overall-progress="overallProgress"
      :processed-count="processedCount"
      @download="downloadFile"
      @preview="previewFile"
      @remove="removeFile"
    />

    <!-- Preview Modal -->
    <BatchPreviewDialog :file="previewingFile" @close="closePreview" />
  </div>
</template>

<script setup lang="ts">
/**
 * Batch-Konvertierung: Container für Ablagefläche, Einstellungen, Dateiliste
 * und Vergleichsansicht. Die Verarbeitung liegt in useBatchConversion.
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import { useBatchConversion } from '@/composables/useBatchConversion';
import {
  defaultBatchSettings,
  type BatchFile,
  type BatchSettings,
} from '@/composables/batch/types';
import BatchFileList from '@/components/batch/BatchFileList.vue';
import BatchPreviewDialog from '@/components/batch/BatchPreviewDialog.vue';
import BatchSettingsPanel from '@/components/batch/BatchSettingsPanel.vue';
import BatchUploadZone from '@/components/batch/BatchUploadZone.vue';

const { t } = useI18n({ useScope: 'global' });
const { confirm: confirmDialog } = useConfirm();

const settings = ref<BatchSettings>(defaultBatchSettings());
const previewingFile = ref<BatchFile | null>(null);

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

// Vorschau-Modal
function previewFile(file: BatchFile) {
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
}
</style>
