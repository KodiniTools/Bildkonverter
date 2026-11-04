<template>
  <div class="shape-list">
    <p class="mini-label">{{ $t('shapes.listTitle') }} ({{ shapes.length }})</p>
    <div
      v-for="shape in reversedShapes"
      :key="shape.id"
      class="shape-item"
      :class="{ selected: shape.id === selectedId }"
      role="button"
      tabindex="0"
      @click="select(shape.id)"
      @keyup.enter="select(shape.id)"
    >
      <span class="shape-item__icon">
        <ShapeIcon :item="galleryItemFor(shape)" :shape="shape" :size="22" />
      </span>
      <span class="shape-item__name">{{
        knownGalleryId(shape) ? $t(`shapes.items.${knownGalleryId(shape)}`) : shape.type
      }}</span>
      <button
        type="button"
        class="icon-btn icon-btn--danger"
        :title="$t('shapes.edit.delete')"
        :aria-label="$t('shapes.edit.delete')"
        @click.stop="remove(shape.id)"
      >
        <AppIcon name="trash" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Liste der eingefügten Formen, oberste zuerst (Teil von ShapesPanel) */
import AppIcon from '@/components/ui/AppIcon.vue';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';
import ShapeIcon from './ShapeIcon.vue';

const { shapes, reversedShapes, selectedId, select, remove, galleryItemFor, knownGalleryId } =
  useShapeEditorContext();
</script>

<style scoped lang="scss">
@import '../transform/shared';

// Liste der eingefügten Formen (wie die Textliste)
.shape-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-4);

  .mini-label {
    margin-bottom: 0;
  }
}

.shape-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-1) var(--ds-space-2) var(--ds-space-1) var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.selected {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }
}

.shape-item__icon {
  display: flex;
  color: var(--ds-text-2);
}

.shape-item__name {
  flex: 1;
  min-width: 0;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// UiIconButton sm (ghost)
.icon-btn {
  flex-shrink: 0;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-2);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-1);
  }

  &--danger:hover {
    color: var(--ds-danger);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}
</style>
