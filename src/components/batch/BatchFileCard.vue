<template>
  <div
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
          <br />→ {{ formatSize(file.processedSize) }} ({{ format.toUpperCase() }})
        </template>
      </p>

      <div v-if="file.status === 'completed'" class="file-actions">
        <button
          class="btn-icon"
          :title="$t('batch.files.download')"
          :aria-label="$t('batch.files.download')"
          @click="emit('download')"
        >
          <AppIcon name="download" />
        </button>

        <button
          class="btn-icon"
          :title="$t('batch.files.preview')"
          :aria-label="$t('batch.files.preview')"
          @click="emit('preview')"
        >
          <AppIcon name="eye" />
        </button>
      </div>

      <div v-if="file.status === 'error'" class="error-message">
        {{ file.error }}
      </div>

      <div v-if="file.status === 'processing'" class="progress-info">{{ file.progress }}%</div>
    </div>

    <button
      class="remove-btn"
      :disabled="file.status === 'processing'"
      :aria-label="$t('confirm.delete', 'Löschen')"
      :title="$t('confirm.delete', 'Löschen')"
      @click="emit('remove')"
    >
      <AppIcon name="times" />
    </button>
  </div>
</template>

<script setup lang="ts">
/** Karte einer Datei in der Batch-Liste mit Status, Größe und Aktionen (aus BatchView ausgelagert) */
import AppIcon from '@/components/ui/AppIcon.vue';
import type { BatchFile } from '@/composables/batch/types';
import { formatSize } from '@/utils/fileUtils';

defineProps<{
  file: BatchFile;
  /** Zielformat (für die Größenangabe nach der Konvertierung) */
  format: string;
}>();

const emit = defineEmits<{
  download: [];
  preview: [];
  remove: [];
}>();
</script>

<style lang="scss" scoped>
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

@media (max-width: 768px) {
  .remove-btn,
  .btn-icon {
    width: var(--ds-row-height);
    height: var(--ds-row-height);
  }
}
</style>
