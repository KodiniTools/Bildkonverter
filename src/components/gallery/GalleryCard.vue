<template>
  <div
    class="gallery-card"
    :class="{
      selected: !multiSelect && selected,
      'multi-selected': multiSelect && checked,
    }"
    @click="emit('select')"
  >
    <!-- Thumbnail -->
    <div class="gallery-card__thumb">
      <img :src="image.thumbnail" :alt="image.name" />

      <div v-if="multiSelect" class="gallery-card__checkbox" @click.stop="emit('toggle')">
        <AppIcon :name="checked ? 'check-square' : 'square'" :size="20" />
      </div>
      <div v-else class="gallery-card__select-dot">
        <AppIcon :name="selected ? 'check-circle' : 'circle'" :size="20" />
      </div>

      <button
        class="gallery-card__preview-btn"
        :title="$t('gallery.buttons.preview')"
        :aria-label="$t('gallery.buttons.preview')"
        @click.stop="emit('preview')"
      >
        <AppIcon name="search-plus" />
      </button>
    </div>

    <!-- Image Info -->
    <div class="gallery-card__info">
      <div class="gallery-card__name-row">
        <div
          v-if="!editing"
          class="gallery-card__name"
          :title="image.name"
          @dblclick.stop="emit('start-rename')"
        >
          {{ image.name }}
        </div>
        <input
          v-else
          v-model="editName"
          :data-rename-id="image.id"
          class="gallery-card__name-input"
          @keydown.enter.stop="emit('confirm-rename')"
          @keydown.escape.stop="emit('cancel-rename')"
          @blur="emit('confirm-rename')"
          @click.stop
        />
        <button
          v-if="!editing"
          class="gallery-card__rename-btn"
          :title="$t('gallery.buttons.rename', 'Umbenennen')"
          :aria-label="$t('gallery.buttons.rename', 'Umbenennen')"
          @click.stop="emit('start-rename')"
        >
          <AppIcon name="pen" />
        </button>
      </div>
      <div class="gallery-card__meta">
        <span><AppIcon name="expand-arrows-alt" /> {{ image.width }} × {{ image.height }}</span>
        <span><AppIcon name="file" /> {{ formatSize(image.size) }}</span>
      </div>
      <div class="gallery-card__date">
        <AppIcon name="clock" /> {{ formatDateTime(image.uploadedAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Karte eines Galerie-Bildes (aus GalleryView ausgelagert): Vorschaubild,
 * Auswahl (einzeln oder Mehrfachauswahl), Umbenennen und Bildinfos.
 * Den Zustand hält GalleryView; die Karte meldet nur Ereignisse.
 */
import AppIcon from '@/components/ui/AppIcon.vue';
import type { GalleryImage } from '@/composables/gallery/types';
import { formatSize } from '@/utils/fileUtils';
import { formatDateTime } from '@/utils/formatDate';

defineProps<{
  image: GalleryImage;
  multiSelect: boolean;
  /** Einzelauswahl */
  selected: boolean;
  /** Mehrfachauswahl */
  checked: boolean;
  /** Name wird gerade bearbeitet */
  editing: boolean;
}>();

/** Eingabe beim Umbenennen */
const editName = defineModel<string>('editName', { default: '' });

const emit = defineEmits<{
  select: [];
  toggle: [];
  preview: [];
  'start-rename': [];
  'confirm-rename': [];
  'cancel-rename': [];
}>();
</script>

<style lang="scss" scoped>
// ===== GALLERY CARD =====
// Wie TemplateCard: surface-1, 1-px-Rahmen, radius-md, flach.
// Auswahl wie Thumbnail-Ring: 2 px Akzent mit 2 px Abstand.

.gallery-card {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  &.selected,
  &.multi-selected {
    border-color: var(--ds-accent);
    outline-color: var(--ds-accent);
  }

  // Thumbnail area
  &__thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--ds-surface-2);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  // Auswahl-Marker über dem Bild: kleine surface-1-Chips, ausgewählt in Gold
  &__select-dot,
  &__checkbox {
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
    color: var(--ds-text-2);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    .app-icon {
      width: var(--ds-icon-sm);
      height: var(--ds-icon-sm);
    }
  }

  &__select-dot {
    border-radius: 50%;
  }

  &__checkbox {
    border-radius: var(--ds-radius-sm);
    cursor: pointer;

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }
  }

  &.selected &__select-dot,
  &.multi-selected &__checkbox {
    background: var(--ds-accent);
    border-color: var(--ds-accent);
    color: var(--ds-on-accent);
  }

  &__preview-btn {
    position: absolute;
    top: var(--ds-space-2);
    right: var(--ds-space-2);
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: 50%;
    color: var(--ds-text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease),
      opacity var(--ds-duration) var(--ds-ease);

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
      opacity: 1;
    }
  }

  &__thumb:hover &__preview-btn {
    opacity: 1;
  }

  // Info section
  &__info {
    padding: var(--ds-space-3) var(--ds-space-4) var(--ds-space-4);
    border-top: var(--ds-border-width) solid var(--ds-border);
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
    margin-bottom: var(--ds-space-1);
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;
  }

  &__name-input {
    flex: 1;
    min-width: 0;
    height: var(--ds-control-sm);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-accent);
    border-radius: var(--ds-radius-sm);
    padding: 0 var(--ds-space-2);
    outline: none;

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }

  &__rename-btn {
    flex-shrink: 0;
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    border: none;
    background: none;
    cursor: pointer;
    color: var(--ds-text-2);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ds-radius-sm);
    opacity: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease),
      opacity var(--ds-duration) var(--ds-ease);

    &:hover {
      color: var(--ds-text);
      background: var(--ds-surface-2);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
      opacity: 1;
    }
  }

  &:hover &__rename-btn {
    opacity: 1;
  }

  &__meta {
    display: flex;
    gap: var(--ds-space-3);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-1);

    span {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);

      .app-icon {
        color: var(--ds-text-3);
      }
    }
  }

  &__date {
    font-size: var(--ds-text-xs);
    color: var(--ds-text-3);
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
  }

  @media (max-width: 768px) {
    &__thumb {
      aspect-ratio: 1;
    }
    &__preview-btn,
    &__rename-btn {
      opacity: 1;
    }
    &__select-dot,
    &__checkbox,
    &__preview-btn {
      width: var(--ds-control-md);
      height: var(--ds-control-md);
    }
  }
}
</style>
