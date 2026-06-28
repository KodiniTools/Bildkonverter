<template>
  <aside class="transform-panel">
    <TextPanel
      :selected-text="selectedText"
      :has-texts="hasTexts"
      :can-undo-text="canUndoText"
      :can-redo-text="canRedoText"
      @update:text-content="$emit('update:text-content', $event)"
      @update:text-font-size="$emit('update:text-font-size', $event)"
      @update:text-font-family="$emit('update:text-font-family', $event)"
      @update:text-color="$emit('update:text-color', $event)"
      @update:text-rotation="$emit('update:text-rotation', $event)"
      @update:text-opacity="$emit('update:text-opacity', $event)"
      @update:text-stroke-width="$emit('update:text-stroke-width', $event)"
      @update:text-stroke-color="$emit('update:text-stroke-color', $event)"
      @update:text-shadow-blur="$emit('update:text-shadow-blur', $event)"
      @update:text-shadow-offset-x="$emit('update:text-shadow-offset-x', $event)"
      @update:text-shadow-offset-y="$emit('update:text-shadow-offset-y', $event)"
      @update:text-shadow-color="$emit('update:text-shadow-color', $event)"
      @save-text-history="$emit('save-text-history')"
      @undo-text="$emit('undo-text')"
      @redo-text="$emit('redo-text')"
      @delete-text="$emit('delete-text')"
      @deselect-text="$emit('deselect-text')"
    />

    <CropPanel
      :crop-mode="cropMode"
      :has-cropped="hasCropped"
      :selected-aspect-ratio="selectedAspectRatio"
      :aspect-ratio-presets="aspectRatioPresets"
      @toggle-crop="$emit('toggle-crop')"
      @undo-crop="$emit('undo-crop')"
      @set-aspect-ratio="$emit('set-aspect-ratio', $event)"
    />

    <ImageTransformPanel
      :transforms="transforms"
      :can-pan="canPan"
      :has-pan="hasPan"
      :can-undo-transform="canUndoTransform"
      :can-redo-transform="canRedoTransform"
      @update:opacity="$emit('update:opacity', $event)"
      @update:rotation="$emit('update:rotation', $event)"
      @update:scale="$emit('update:scale', $event)"
      @update:border-radius="$emit('update:border-radius', $event)"
      @update:border-width="$emit('update:border-width', $event)"
      @update:border-color="$emit('update:border-color', $event)"
      @update:shadow-enabled="$emit('update:shadow-enabled', $event)"
      @update:shadow-offset-x="$emit('update:shadow-offset-x', $event)"
      @update:shadow-offset-y="$emit('update:shadow-offset-y', $event)"
      @update:shadow-blur="$emit('update:shadow-blur', $event)"
      @update:shadow-color="$emit('update:shadow-color', $event)"
      @update:shadow-opacity="$emit('update:shadow-opacity', $event)"
      @update:skew-x="$emit('update:skew-x', $event)"
      @update:skew-y="$emit('update:skew-y', $event)"
      @rotate-90="$emit('rotate-90')"
      @rotate-90-counter="$emit('rotate-90-counter')"
      @rotate-180="$emit('rotate-180')"
      @flip-horizontal="$emit('flip-horizontal')"
      @flip-vertical="$emit('flip-vertical')"
      @reset-pan="$emit('reset-pan')"
      @undo-transform="$emit('undo-transform')"
      @redo-transform="$emit('redo-transform')"
      @commit-transform="$emit('commit-transform')"
    />
  </aside>
</template>

<script setup>
import TextPanel from './transform/TextPanel.vue';
import CropPanel from './transform/CropPanel.vue';
import ImageTransformPanel from './transform/ImageTransformPanel.vue';

defineProps({
  cropMode: { type: Boolean, required: true },
  hasCropped: { type: Boolean, required: true },
  selectedAspectRatio: { type: String, default: 'free' },
  aspectRatioPresets: { type: Array, default: () => [] },
  transforms: { type: Object, required: true },
  canPan: { type: Boolean, default: false },
  hasPan: { type: Boolean, default: false },
  selectedText: { type: Object, default: null },
  hasTexts: { type: Boolean, default: false },
  canUndoText: { type: Boolean, default: false },
  canRedoText: { type: Boolean, default: false },
  canUndoTransform: { type: Boolean, default: false },
  canRedoTransform: { type: Boolean, default: false },
});

defineEmits([
  'toggle-crop',
  'undo-crop',
  'set-aspect-ratio',
  'update:opacity',
  'update:rotation',
  'update:scale',
  'update:border-radius',
  'update:border-width',
  'update:border-color',
  'update:shadow-enabled',
  'update:shadow-offset-x',
  'update:shadow-offset-y',
  'update:shadow-blur',
  'update:shadow-color',
  'update:shadow-opacity',
  'update:skew-x',
  'update:skew-y',
  'rotate-90',
  'rotate-90-counter',
  'rotate-180',
  'flip-horizontal',
  'flip-vertical',
  'reset-pan',
  'undo-transform',
  'redo-transform',
  'commit-transform',
  'update:text-content',
  'update:text-font-size',
  'update:text-font-family',
  'update:text-color',
  'update:text-rotation',
  'update:text-opacity',
  'update:text-stroke-width',
  'update:text-stroke-color',
  'update:text-shadow-blur',
  'update:text-shadow-offset-x',
  'update:text-shadow-offset-y',
  'update:text-shadow-color',
  'save-text-history',
  'undo-text',
  'redo-text',
  'delete-text',
  'deselect-text',
]);
</script>

<style scoped>
.transform-panel {
  width: 280px;
  background: var(--color-bg-secondary, #f9fafb);
  border-left: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 0.75rem;
  position: sticky;
  top: 0;
  height: calc(100vh - var(--external-nav-height, 50px) - var(--header-height, 60px) - 60px);
  align-self: stretch;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;

    &:hover {
      background: var(--color-text-light);
    }
  }
}

:root[data-theme='dark'] .transform-panel {
  background: var(--color-bg-secondary);
  border-left-color: var(--color-border);
}

@media (max-width: 768px) {
  .transform-panel {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: auto;
    position: static;
    max-height: 40vh;
    border-left: none;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }
}
</style>
