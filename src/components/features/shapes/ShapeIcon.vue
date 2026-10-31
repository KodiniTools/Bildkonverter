<template>
  <svg
    class="shape-icon"
    :viewBox="preview.viewBox"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
  >
    <path
      :d="preview.d"
      :fill="fill"
      :fill-rule="preview.fillRule"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      :stroke-dasharray="dashArray"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup>
/**
 * Vorschau einer Form als Inline-SVG – dieselbe Pfadgeometrie wie auf dem
 * Canvas (src/utils/shapes.js). Farbe folgt `currentColor` (Theme-Text) bzw.
 * optional den Farben einer konkreten Form.
 */
import { computed } from 'vue';
import { getGalleryPreview, SHAPE_KIND } from '@/utils/shapes';

const props = defineProps({
  /** Galerie-Eintrag ({ type, aspect, preset }) */
  item: { type: Object, required: true },
  size: { type: Number, default: 32 },
  /** Konkrete Form: übernimmt Füll-/Linienfarbe statt currentColor */
  shape: { type: Object, default: null },
});

const VIEW = 40;
const preview = computed(() => {
  const base = getGalleryPreview(props.item, VIEW);
  if (!props.shape) return base;
  return { ...base, filled: props.shape.filled !== false, dash: props.shape.dash || 'solid' };
});

const isStroke = computed(() => preview.value.kind === SHAPE_KIND.STROKE);
const fill = computed(() => {
  if (isStroke.value || !preview.value.filled) return 'none';
  return props.shape?.fillColor || 'currentColor';
});
const stroke = computed(() => {
  if (isStroke.value || !preview.value.filled) return props.shape?.strokeColor || 'currentColor';
  // Gefüllte Form mit Umrandung (z. B. weiße Sprechblase) bleibt so erkennbar
  return props.shape?.strokeWidth > 0 ? props.shape.strokeColor : 'none';
});
const strokeWidth = computed(() => (isStroke.value ? 3 : 2.5));
const dashArray = computed(() => {
  if (preview.value.dash === 'dashed') return '6 4';
  if (preview.value.dash === 'dotted') return '0.1 5';
  return undefined;
});
</script>

<style scoped>
.shape-icon {
  display: block;
  flex-shrink: 0;
  overflow: visible;
}
</style>
