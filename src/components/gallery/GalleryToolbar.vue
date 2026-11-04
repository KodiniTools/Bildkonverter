<template>
  <div class="toolbar">
    <div class="toolbar__group">
      <button class="tb-btn" @click="emit('upload')">
        <AppIcon name="upload" />
        <span>{{ $t('gallery.buttons.upload') }}</span>
      </button>
      <slot name="file-input" />
      <button class="tb-btn" @click="emit('upload-folder')">
        <AppIcon name="folder-open" />
        <span>{{ $t('gallery.buttons.uploadFolder') }}</span>
      </button>
      <slot name="folder-input" />

      <div v-if="imageCount > 1" class="toolbar__separator"></div>

      <button
        v-if="imageCount > 1"
        class="tb-btn"
        :class="{ 'tb-btn--active': multiSelect }"
        @click="emit('toggle-multi-select')"
      >
        <AppIcon :name="multiSelect ? 'times' : 'object-group'" />
        <span>{{
          multiSelect
            ? $t('gallery.buttons.cancelSelection', 'Abbrechen')
            : $t('gallery.buttons.selectMultiple', 'Mehrfachauswahl')
        }}</span>
      </button>

      <template v-if="multiSelect">
        <button class="tb-btn" @click="emit('toggle-select-all')">
          <AppIcon :name="allSelected ? 'square' : 'check-square'" />
          <span>{{
            allSelected
              ? $t('gallery.buttons.deselectAll', 'Alle abwählen')
              : $t('gallery.buttons.selectAll', 'Alle auswählen')
          }}</span>
        </button>
        <button
          v-if="selectedCount > 1"
          class="tb-btn tb-btn--accent"
          @click="emit('create-collage')"
        >
          <AppIcon name="layer-group" />
          <span>{{ $t('gallery.buttons.createCollage', 'Collage') }} ({{ selectedCount }})</span>
        </button>
      </template>
    </div>

    <div class="toolbar__group">
      <template v-if="hasSelection && !multiSelect">
        <button class="tb-btn tb-btn--primary" @click="emit('open-editor')">
          <AppIcon name="edit" />
          <span>{{ $t('gallery.buttons.addToEditor') }}</span>
        </button>
        <button
          class="tb-btn tb-btn--danger"
          :aria-label="$t('confirm.delete', 'Löschen')"
          :title="$t('confirm.delete', 'Löschen')"
          @click="emit('delete-selected')"
        >
          <AppIcon name="trash" />
        </button>
      </template>
      <button
        v-if="imageCount > 0"
        class="tb-btn tb-btn--danger-ghost"
        :title="$t('gallery.tooltips.deleteAll')"
        @click="emit('delete-all')"
      >
        <AppIcon name="trash-alt" />
        <span>{{ $t('gallery.buttons.deleteAll') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Werkzeugleiste der Galerie (aus GalleryView ausgelagert). Reine Darstellung,
 * Aktionen als Ereignisse. Slots `file-input`/`folder-input` nehmen die
 * versteckten Datei-Inputs neben ihren Buttons auf.
 */
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  imageCount: number;
  multiSelect: boolean;
  /** Mehrfachauswahl: alle Bilder ausgewählt */
  allSelected: boolean;
  selectedCount: number;
  /** Einzelauswahl vorhanden */
  hasSelection: boolean;
}>();

const emit = defineEmits<{
  upload: [];
  'upload-folder': [];
  'toggle-multi-select': [];
  'toggle-select-all': [];
  'create-collage': [];
  'open-editor': [];
  'delete-selected': [];
  'delete-all': [];
}>();
</script>

<style lang="scss" scoped>
// ===== TOOLBAR =====

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  margin-bottom: var(--ds-space-3);
  flex-wrap: wrap;

  &__group {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    flex-wrap: wrap;
  }

  &__separator {
    width: var(--ds-border-width);
    height: var(--ds-space-5);
    background: var(--ds-border);
    margin: 0 var(--ds-space-1);
  }
}

// Wie UiButton (md): Sekundär-Fläche, Primär in Gold, Danger als Text
.tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &--primary,
  &--accent {
    background: var(--ds-accent);
    border-color: transparent;
    color: var(--ds-on-accent);
    font-weight: var(--ds-weight-semibold);

    &:hover {
      background: var(--ds-accent-hover);
      color: var(--ds-on-accent);
    }
  }

  &--danger,
  &--danger-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--ds-danger);

    &:hover {
      background: var(--ds-surface-2);
      color: var(--ds-danger);
    }
  }

  &--danger {
    width: var(--ds-control-md);
    padding: 0;
  }

  &--active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);

    &:hover {
      background: var(--ds-accent-soft);
    }
  }
}
</style>
