<template>
  <div
    class="upload-zone"
    :class="{ 'drag-over': isDragging }"
    @drop="handleDrop"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @click="fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,.tiff,.tif,.heic,.heif,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef,.x3f"
      style="display: none"
      @change="onSelect"
    />

    <AppIcon name="cloud-upload-alt" :size="32" />
    <h2>{{ $t('batch.upload.title') }}</h2>
    <p>{{ $t('batch.upload.description') }}</p>
    <span class="upload-hint">{{ $t('batch.upload.hint') }}</span>
  </div>
</template>

<script setup lang="ts">
/** Ablagefläche für Bilder (Klick öffnet die Dateiauswahl), aus BatchView ausgelagert */
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits<{ files: [files: File[]] }>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function onSelect(event: Event) {
  emit('files', Array.from((event.target as HTMLInputElement).files ?? []));
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  emit('files', Array.from(event.dataTransfer?.files ?? []));
}
</script>

<style lang="scss" scoped>
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

  h2 {
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

@media (max-width: 768px) {
  .upload-zone {
    padding: var(--ds-space-5);
  }
}
</style>
