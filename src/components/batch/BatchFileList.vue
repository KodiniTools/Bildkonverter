<template>
  <div class="files-list">
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
      <BatchFileCard
        v-for="file in files"
        :key="file.id"
        :file="file"
        :format="format"
        @download="emit('download', file)"
        @preview="emit('preview', file)"
        @remove="emit('remove', file.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Dateiliste der Batch-Konvertierung mit Gesamtfortschritt (aus BatchView ausgelagert) */
import type { BatchFile } from '@/composables/batch/types';
import BatchFileCard from './BatchFileCard.vue';

defineProps<{
  files: BatchFile[];
  format: string;
  isProcessing: boolean;
  /** 0–100 */
  overallProgress: number;
  processedCount: number;
}>();

const emit = defineEmits<{
  download: [file: BatchFile];
  preview: [file: BatchFile];
  remove: [id: string];
}>();
</script>

<style lang="scss" scoped>
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

@media (max-width: 768px) {
  .progress-summary .progress-bar {
    width: 120px;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--ds-space-4);
  }
}

@media (max-width: 480px) {
  .files-grid {
    grid-template-columns: 1fr;
  }

  .progress-summary .progress-bar {
    width: 80px;
  }
}
</style>
