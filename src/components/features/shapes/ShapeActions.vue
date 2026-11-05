<template>
  <template v-if="selectedShape">
    <!-- Ebene & Aktionen -->
    <div class="action-grid">
      <button
        type="button"
        class="transform-btn"
        :disabled="isTop"
        :title="$t('shapes.edit.bringForward')"
        @click="reorder('up')"
      >
        <AppIcon name="arrow-up" />
        <span>{{ $t('shapes.edit.bringForward') }}</span>
      </button>
      <button
        type="button"
        class="transform-btn"
        :disabled="isBottom"
        :title="$t('shapes.edit.sendBackward')"
        @click="reorder('down')"
      >
        <AppIcon name="arrow-down" />
        <span>{{ $t('shapes.edit.sendBackward') }}</span>
      </button>
    </div>
    <button type="button" class="transform-btn" @click="duplicate">
      <AppIcon name="copy" />
      <span>{{ $t('shapes.edit.duplicate') }}</span>
    </button>
    <button type="button" class="transform-btn delete-btn" @click="remove(selectedShape.id)">
      <AppIcon name="trash" />
      <span>{{ $t('shapes.edit.delete') }}</span>
    </button>
    <button type="button" class="transform-btn" @click="select(null)">
      <AppIcon name="times" />
      <span>{{ $t('shapes.edit.deselect') }}</span>
    </button>
  </template>
</template>

<script setup lang="ts">
/** Ebenen-Reihenfolge, Duplizieren, Löschen, Abwählen (Teil von ShapesPanel) */
import AppIcon from '@/components/ui/AppIcon.vue';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';

const { selectedShape, isTop, isBottom, reorder, duplicate, remove, select } =
  useShapeEditorContext();
</script>

<style scoped lang="scss">
@use '../transform/shared' as *;

.action-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--ds-space-2);

  .transform-btn {
    min-width: 0;
    gap: var(--ds-space-1);
    padding: 0 var(--ds-space-1);
    font-size: var(--ds-text-sm);
  }
}

// Destruktiv = UiButton danger
.transform-btn.delete-btn {
  background: transparent;
  border-color: transparent;
  color: var(--ds-danger);

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
  }
}
</style>
