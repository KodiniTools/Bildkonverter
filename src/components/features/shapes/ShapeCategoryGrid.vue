<template>
  <div class="segmented segmented--wrap" role="tablist" :aria-label="$t('shapes.title')">
    <button
      v-for="category in SHAPE_CATEGORIES"
      :key="category"
      type="button"
      role="tab"
      class="segmented__option"
      :class="{ active: activeCategory === category }"
      :aria-selected="activeCategory === category"
      @click="activeCategory = category"
    >
      {{ $t(`shapes.categories.${category}`) }}
    </button>
  </div>

  <div class="shape-grid" role="tabpanel">
    <button
      v-for="item in galleryItems"
      :key="item.id"
      type="button"
      class="shape-tile"
      :title="$t(`shapes.items.${item.id}`)"
      :aria-label="$t('shapes.add', { name: $t(`shapes.items.${item.id}`) })"
      :disabled="disabled"
      :data-shape="item.id"
      :class="{ active: isDrawToolItem(item) && drawTool === item.tool }"
      :aria-pressed="isDrawToolItem(item) ? drawTool === item.tool : undefined"
      @click="onTileClick(item)"
    >
      <ShapeIcon :item="item" :size="30" :text="stickerText(item) ?? undefined" />
    </button>
  </div>
</template>

<script setup lang="ts">
/** Kategorie-Reiter und Kachel-Galerie der Formen (Teil von ShapesPanel) */
import { SHAPE_CATEGORIES, isDrawToolItem } from '@/utils/shapes';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';
import ShapeIcon from './ShapeIcon.vue';

const { activeCategory, galleryItems, drawTool, disabled, onTileClick, stickerText } =
  useShapeEditorContext();
</script>

<style scoped lang="scss">
@import '../transform/shared';
@import './shapes';

// Kategorien: bei Platzmangel in zwei Zeilen (3 + 2) statt abgeschnitten
.segmented--wrap {
  flex-wrap: wrap;

  .segmented__option {
    flex: 1 1 30%;
    min-height: calc(var(--ds-control-md) - 6px);
  }
}

// Galerie-Kacheln (SelectionTile)
.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}

.shape-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
    border-color: var(--ds-accent);
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

.shape-tile.active {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
  color: var(--ds-accent);
}
</style>
