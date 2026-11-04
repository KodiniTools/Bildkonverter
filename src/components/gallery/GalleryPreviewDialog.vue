<template>
  <Teleport to="#overlay-root">
    <div v-if="image" class="preview-overlay" @click="emit('close')">
      <div class="preview-modal" @click.stop>
        <button
          class="preview-modal__close"
          :aria-label="$t('common.close', 'Schließen')"
          :title="$t('common.close', 'Schließen')"
          @click="emit('close')"
        >
          <AppIcon name="times" />
        </button>

        <div class="preview-modal__image">
          <img :src="image.url" :alt="image.name" />
        </div>

        <div class="preview-modal__footer">
          <div class="preview-modal__info">
            <h3>{{ image.name }}</h3>
            <div class="preview-modal__meta">
              <span
                ><AppIcon name="ruler-combined" /> {{ image.width }} × {{ image.height }}px</span
              >
              <span><AppIcon name="file" /> {{ formatSize(image.size) }}</span>
              <span><AppIcon name="calendar" /> {{ formatDateTime(image.uploadedAt) }}</span>
            </div>
          </div>
          <div class="preview-modal__actions">
            <button class="btn btn-primary" @click="emit('open-editor')">
              <AppIcon name="edit" />
              {{ $t('gallery.buttons.addToEditor', 'Im Editor öffnen') }}
            </button>
            <button class="btn btn-secondary" @click="emit('download')">
              <AppIcon name="download" />
              {{ $t('gallery.buttons.download', 'Herunterladen') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Großansicht eines Galerie-Bildes mit Aktionen (aus GalleryView ausgelagert) */
import AppIcon from '@/components/ui/AppIcon.vue';
import type { GalleryImage } from '@/composables/gallery/types';
import { formatSize } from '@/utils/fileUtils';
import { formatDateTime } from '@/utils/formatDate';

defineProps<{ image: GalleryImage | null }>();

const emit = defineEmits<{
  close: [];
  'open-editor': [];
  download: [];
}>();
</script>

<style lang="scss" scoped>
// ===== PREVIEW MODAL =====
// Wie die Bildvorschau im Collage Maker (ImageList): Backdrop 50 %, surface-1,
// radius-lg, shadow-overlay.

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--ds-space-4);
  animation: fadeIn var(--ds-duration-slow) var(--ds-ease);
}

.preview-modal {
  position: relative;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--ds-shadow-overlay);

  &__close {
    position: absolute;
    top: var(--ds-space-3);
    right: var(--ds-space-3);
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    border: var(--ds-border-width) solid var(--ds-border);
    background: var(--ds-surface-1);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
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

  &__image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ds-space-4);
    overflow: auto;
    background: var(--ds-surface-2);
    min-height: 300px;

    img {
      max-width: 100%;
      max-height: 60vh;
      object-fit: contain;
      border-radius: var(--ds-radius-md);
    }

    @media (max-width: 768px) {
      padding: var(--ds-space-2);
      img {
        max-height: 40vh;
      }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-4);
    padding: var(--ds-space-4) var(--ds-space-5);
    border-top: var(--ds-border-width) solid var(--ds-border);
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      padding: var(--ds-space-3);
    }
  }

  &__info {
    min-width: 0;

    h3 {
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-semibold);
      line-height: var(--ds-leading);
      color: var(--ds-text);
      margin: 0 0 var(--ds-space-2) 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__meta {
    display: flex;
    gap: var(--ds-space-4);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    flex-wrap: wrap;

    span {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);

      .app-icon {
        color: var(--ds-text-3);
      }
    }
  }

  &__actions {
    display: flex;
    gap: var(--ds-space-2);
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      .btn {
        flex: 1;
      }
    }
  }
}
</style>
