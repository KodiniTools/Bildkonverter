<template>
  <Teleport to="#overlay-root">
    <div v-if="file" class="preview-modal" @click="emit('close')">
      <div class="modal-content" @click.stop>
        <button
          class="close-btn"
          :aria-label="$t('common.close', 'Schließen')"
          :title="$t('common.close', 'Schließen')"
          @click="emit('close')"
        >
          <AppIcon name="times" />
        </button>

        <div class="comparison-view">
          <div class="comparison-item">
            <h4>{{ $t('batch.preview.original') }}</h4>
            <img :src="file.preview" :alt="file.name" />
          </div>

          <div class="comparison-divider"></div>

          <div class="comparison-item">
            <h4>{{ $t('batch.preview.processed') }}</h4>
            <img :src="file.processedPreview ?? undefined" :alt="file.name" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Vergleich Original/Ergebnis einer konvertierten Datei (aus BatchView ausgelagert) */
import AppIcon from '@/components/ui/AppIcon.vue';
import type { BatchFile } from '@/composables/batch/types';

defineProps<{ file: BatchFile | null }>();

const emit = defineEmits<{ close: [] }>();
</script>

<style lang="scss" scoped>
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

@media (max-width: 768px) {
  .preview-modal {
    padding: var(--ds-space-2);
  }

  .modal-content {
    padding: var(--ds-space-4);
    max-width: 95vw;
  }
}
</style>
