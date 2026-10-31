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
      :fill-opacity="isEffect && preview.effect === 'blur' ? 0.35 : undefined"
      :fill-rule="preview.fillRule"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      :stroke-opacity="isHighlighter ? 0.55 : undefined"
      :stroke-dasharray="dashArray"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path v-if="preview.pattern" :d="preview.pattern" fill="currentColor" />
    <text
      v-if="isMarker"
      class="shape-icon__label"
      x="0"
      y="1"
      text-anchor="middle"
      dominant-baseline="central"
      :style="{
        fill: shape?.textColor || 'var(--ds-surface-1)',
        fontSize: markerLabel.length > 2 ? '11px' : '15px',
      }"
    >
      {{ markerLabel }}
    </text>
    <!-- Formen mit Text: angedeutete Textzeilen im Textbereich -->
    <path
      v-if="textLines"
      :d="textLines"
      fill="none"
      :stroke="shape?.textColor || textLineColor"
      stroke-width="2"
      stroke-linecap="round"
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
import { getGalleryPreview, SHAPE_KIND, SHAPE_PATHS } from '@/utils/shapes';

const props = defineProps({
  /** Galerie-Eintrag ({ type, aspect, preset }) */
  item: { type: Object, required: true },
  size: { type: Number, default: 32 },
  /** Konkrete Form: übernimmt Füll-/Linienfarbe statt currentColor */
  shape: { type: Object, default: null },
});

const VIEW = 40;
const preview = computed(() => {
  const s = props.shape;
  if (!s) return getGalleryPreview(props.item, VIEW);
  // Varianten der konkreten Form (Marker-Stil, Effekt, Umriss) übernehmen
  const preset = { ...(props.item.preset || {}) };
  for (const key of ['markerStyle', 'region', 'effect', 'points']) if (s[key]) preset[key] = s[key];
  // Freihand: eigenes Seitenverhältnis des Strichs
  const aspect = s.type === 'freehand' ? s.width / Math.max(1, s.height) : props.item.aspect;
  const base = getGalleryPreview({ ...props.item, aspect, preset }, VIEW);
  return { ...base, filled: s.filled !== false, dash: s.dash || 'solid' };
});

const isStroke = computed(() => preview.value.kind === SHAPE_KIND.STROKE);
const isMarker = computed(() => preview.value.kind === SHAPE_KIND.MARKER);
const isEffect = computed(() => preview.value.kind === SHAPE_KIND.EFFECT);
const markerLabel = computed(() => String(props.shape?.number ?? 1));
const isHighlighter = computed(() => (props.shape?.tool ?? props.item.tool) === 'highlighter');

/** Kurze Linien als Platzhalter für Text (nur Formen mit Textfeld und Text) */
const textLines = computed(() => {
  const def = SHAPE_PATHS[props.item.type];
  const text = props.shape ? props.shape.text : props.item.preset?.text;
  if (!def?.textBox || !String(text ?? '').trim()) return '';
  const box = def.textBox(preview.value.width, preview.value.height);
  const half = Math.max(2, box.width * 0.32);
  const gap = Math.min(5, box.height * 0.3);
  return (
    `M ${box.x - half} ${box.y - gap / 2} H ${box.x + half} ` +
    `M ${box.x - half * 0.65} ${box.y + gap / 2} H ${box.x + half * 0.65}`
  );
});
// Galerie-Kacheln sind in Textfarbe gefüllt → Linien in Flächenfarbe
const textLineColor = 'var(--ds-surface-1)';
const fill = computed(() => {
  if (isEffect.value) return preview.value.effect === 'blur' ? 'currentColor' : 'none';
  if (isStroke.value || !preview.value.filled) return 'none';
  return props.shape?.fillColor || 'currentColor';
});
const stroke = computed(() => {
  if (isEffect.value) return 'currentColor';
  if (isStroke.value || !preview.value.filled) return props.shape?.strokeColor || 'currentColor';
  // Gefüllte Form mit Umrandung (z. B. weiße Sprechblase) bleibt so erkennbar
  return props.shape?.strokeWidth > 0 ? props.shape.strokeColor : 'none';
});
const strokeWidth = computed(() =>
  isHighlighter.value ? 7 : isStroke.value ? 3 : isEffect.value ? 1.5 : 2.5
);
const dashArray = computed(() => {
  if (isEffect.value) return '3 2';
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

.shape-icon__label {
  font-family: var(--ds-font-sans, sans-serif);
  font-weight: 700;
}
</style>
