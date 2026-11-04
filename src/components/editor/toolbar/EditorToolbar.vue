<template>
  <div class="toolbar">
    <!-- Links: Upload -->
    <div class="toolbar-group">
      <button
        class="tb-btn tb-btn--primary"
        :title="hasImage ? $t('editor.toolbar.replaceImageHint') : undefined"
        @click="emit('upload')"
      >
        <AppIcon :name="hasImage ? 'exchange-alt' : 'upload'" />
        {{ hasImage ? $t('editor.toolbar.replaceImage') : $t('editor.toolbar.upload') }}
      </button>
      <slot name="upload" />
    </div>

    <!-- Mitte: Bearbeitungsaktionen -->
    <div class="toolbar-center">
      <!-- History -->
      <HistoryActions
        class="toolbar-history"
        compact
        :can-undo="canUndo"
        :can-redo="canRedo"
        :undo-title="$t('editor.toolbar.undo', 'Rückgängig (Ctrl+Z)')"
        :redo-title="$t('editor.toolbar.redo', 'Wiederholen (Ctrl+Y)')"
        @undo="emit('undo')"
        @redo="emit('redo')"
      />

      <!-- Collage beenden -->
      <div v-if="isCollageMode" class="toolbar-group">
        <button
          class="tb-btn"
          :title="$t('editor.toolbar.exitCollage', 'Collage-Modus beenden')"
          @click="emit('exit-collage')"
        >
          <AppIcon name="th" />
          {{ $t('editor.toolbar.exitCollage', 'Collage beenden') }}
        </button>
      </div>

      <!-- Werkzeuge -->
      <div class="toolbar-group">
        <button
          class="tb-btn tb-btn--icon"
          :disabled="!hasContent"
          :title="$t('editor.toolbar.addText', 'Text hinzufügen (T)')"
          :aria-label="$t('editor.toolbar.addText', 'Text hinzufügen (T)')"
          @click="emit('add-text')"
        >
          <AppIcon name="font" />
        </button>
        <button
          class="tb-btn tb-btn--icon"
          :disabled="!hasContent"
          :title="$t('editor.toolbar.preview', 'Vorschau')"
          :aria-label="$t('editor.toolbar.preview', 'Vorschau')"
          @click="emit('preview')"
        >
          <AppIcon name="eye" />
        </button>
        <button
          class="tb-btn tb-btn--icon"
          :disabled="!hasContent"
          :title="$t('editor.toolbar.print', 'Drucken')"
          :aria-label="$t('editor.toolbar.print', 'Drucken')"
          @click="emit('print')"
        >
          <AppIcon name="print" />
        </button>
        <button
          class="tb-btn tb-btn--icon"
          :disabled="!hasContent || isExporting"
          :title="$t('editor.toolbar.copy')"
          :aria-label="$t('editor.toolbar.copy')"
          @click="emit('copy')"
        >
          <AppIcon name="clipboard-copy" />
        </button>
        <button
          class="tb-btn tb-btn--icon"
          :disabled="!hasContent"
          :title="$t('editor.toolbar.reset', 'Zurücksetzen')"
          :aria-label="$t('editor.toolbar.reset', 'Zurücksetzen')"
          @click="emit('reset')"
        >
          <AppIcon name="sync-alt" />
        </button>
      </div>

      <!-- Löschen -->
      <div class="toolbar-group">
        <button
          class="tb-btn tb-btn--icon tb-btn--danger"
          :disabled="!hasContent"
          :title="$t('editor.toolbar.clearImage', 'Bild entfernen')"
          :aria-label="$t('editor.toolbar.clearImage', 'Bild entfernen')"
          @click="emit('clear')"
        >
          <AppIcon name="trash" />
        </button>
      </div>
    </div>

    <!-- Rechts: Teilen + Download -->
    <div class="toolbar-group">
      <button
        class="tb-btn tb-btn--primary"
        :disabled="!hasContent || isExporting"
        :title="$t('editor.toolbar.shareHint')"
        @click="emit('share')"
      >
        <AppIcon name="share" />
        {{ $t('editor.toolbar.share') }}
      </button>
      <button
        class="tb-btn tb-btn--success"
        :disabled="!hasContent || isExporting"
        @click="emit('download')"
      >
        <AppIcon :name="isExporting ? 'spinner fa-spin' : 'download'" />
        {{
          isExporting
            ? $t('toast.editor.exporting', 'Exportiere...')
            : $t('editor.toolbar.download')
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Werkzeugleiste des Editors (aus EditorView ausgelagert). Reine Darstellung:
 * jede Aktion wird als Ereignis gemeldet, den Zustand hält EditorView.
 * Slot `upload`: Platz für das versteckte Datei-Input neben dem Upload-Button.
 */
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';

const props = defineProps<{
  /** Ein Einzelbild ist geladen */
  hasImage: boolean;
  isCollageMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
}>();

const emit = defineEmits<{
  upload: [];
  undo: [];
  redo: [];
  'exit-collage': [];
  'add-text': [];
  preview: [];
  print: [];
  copy: [];
  reset: [];
  clear: [];
  share: [];
  download: [];
}>();

/** Bild oder Collage vorhanden: Werkzeuge und Export sind aktiv */
const hasContent = computed(() => props.hasImage || props.isCollageMode);
</script>

<style scoped lang="scss">
/* Werkzeugleiste: flache Leiste wie die ThumbnailBar im Collage Maker */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-4);
  background: var(--ds-surface-1);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  flex-wrap: wrap;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}

/* Visuelle Gruppen-Container (wie die Tool-Rail) */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}

/* Verlaufs-Buttons in Toolbar-Höhe (Button md) */
.toolbar-history :deep(.btn-history) {
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  border-radius: var(--ds-radius-md);
}

/* Basis-Button in der Toolbar (UiButton md, ghost) */
.tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
    color: var(--ds-text);
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

/* Icon-only: UiIconButton md (36 × 36) */
.tb-btn--icon {
  width: var(--ds-control-md);
  padding: 0;
}

/* Upload / Ersetzen: Sekundär-Button */
.tb-btn--primary {
  background: var(--ds-surface-2);
  border-color: var(--ds-border-strong);
  color: var(--ds-text);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
  }
}

/* Download: die eine Primäraktion der Ansicht */
.tb-btn--success {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);

  &:hover:not(:disabled) {
    background: var(--ds-accent-hover);
    color: var(--ds-on-accent);
  }
}

/* Gefahr: Löschen – nur Icon in --ds-danger */
.tb-btn--danger {
  color: var(--ds-danger);

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
    color: var(--ds-danger);
  }
}
</style>
