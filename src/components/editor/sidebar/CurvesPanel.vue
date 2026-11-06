<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.curves }">
    <h3 class="section-header" @click="$emit('toggle-section', 'curves')">
      <AppIcon name="spline" class="section-icon" />
      {{ $t('editor.sidebar.curves') }}
      <AppIcon :name="sectionsOpen.curves ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
    </h3>

    <div v-show="sectionsOpen.curves" class="section-content curves">
      <div class="curves__channels" role="group" :aria-label="$t('editor.curves.channel')">
        <button
          v-for="c in CURVE_CHANNELS"
          :key="c"
          type="button"
          :class="['curves__channel', `curves__channel--${c}`, { active: c === channel }]"
          :aria-pressed="c === channel ? 'true' : 'false'"
          :disabled="disabled"
          :data-testid="`curve-channel-${c}`"
          @click="selectChannel(c)"
        >
          {{ $t(`editor.curves.channels.${c}`) }}
          <template v-if="activeChannels[c]">
            <span class="curves__dot" aria-hidden="true" />
            <span class="sr-only">({{ $t('editor.curves.changed') }})</span>
          </template>
        </button>
      </div>

      <svg
        ref="svg"
        class="curves__graph"
        :class="[`curves__graph--${channel}`, { disabled }]"
        viewBox="-8 -8 271 271"
        role="group"
        :aria-label="$t('editor.curves.graphLabel', { channel: channelLabel })"
        data-testid="curve-graph"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <rect class="curves__bg" x="0" y="0" width="255" height="255" />
        <path class="curves__grid" :d="GRID_PATH" />
        <line class="curves__diagonal" x1="0" y1="255" x2="255" y2="0" />
        <polyline class="curves__line" :points="linePoints" />
        <circle
          v-for="(p, i) in points"
          :key="i"
          class="curves__handle"
          :class="{ active: i === activeIndex }"
          :cx="p[0]"
          :cy="255 - p[1]"
          r="6"
          role="slider"
          :tabindex="disabled ? -1 : 0"
          :aria-label="$t('editor.curves.point', { n: i + 1 })"
          aria-valuemin="0"
          aria-valuemax="255"
          :aria-valuenow="p[1]"
          :aria-valuetext="$t('editor.curves.pointValue', { input: p[0], output: p[1] })"
          :data-testid="`curve-point-${i}`"
          @focus="activeIndex = i"
          @keydown="onKeyDown($event, i)"
          @keyup="onKeyUp"
          @dblclick.stop="remove(i)"
        />
      </svg>

      <p class="curves__hint">{{ $t('editor.curves.hint') }}</p>

      <div class="curves__actions">
        <UiSelect
          :label="$t('editor.curves.preset')"
          size="sm"
          :options="presetOptions"
          :disabled="disabled"
          :model-value="matchingPreset"
          data-testid="curve-preset"
          @update:model-value="applyPreset"
        />
        <UiButton
          size="sm"
          variant="secondary"
          :disabled="disabled || !anyActive"
          data-testid="curve-reset"
          @click="resetAll"
        >
          <template #icon><AppIcon name="undo" :size="16" /></template>
          {{ $t('editor.curves.reset') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import type { SelectOption } from '@/components/ui/types';
import { isActiveCurve } from '@/utils/curveKernel';
import {
  CURVE_CHANNELS,
  CURVE_KEYS,
  CURVE_PRESETS,
  addPoint,
  curvePoints,
  curveValues,
  hitPoint,
  movePoint,
  removePoint,
  serializeCurve,
  type CurveChannel,
  type CurvePoint,
  type CurvePresetId,
} from '@/utils/toneCurve';

/**
 * Gradationskurven (Gesamt, Rot, Grün, Blau). Punkte per Klick setzen, ziehen,
 * per Doppelklick oder Entf entfernen; Pfeiltasten verschieben den fokussierten
 * Punkt. Werte gehen wie bei den Reglern als update-filter an den Editor.
 */
const props = withDefaults(
  defineProps<{
    filters: Record<string, unknown>;
    sectionsOpen: Record<string, boolean>;
    disabled?: boolean;
  }>(),
  { disabled: false }
);

const emit = defineEmits<{
  'update-filter': [key: string, value: string];
  'toggle-section': [name: string];
  render: [];
  'save-history': [];
}>();

const { t } = useI18n();

/** Raster in Vierteln (Kurvenkoordinaten, y nach unten). */
const GRID_PATH = [64, 128, 191].map((v) => `M${v} 0V255M0 ${v}H255`).join('');
/** Fangradius für Punkte in Kurvenkoordinaten. */
const HIT_RADIUS = 10;
/** Sichtbarer Bereich des viewBox (siehe Template). */
const VIEW_MIN = -8;
const VIEW_SIZE = 271;

const channel = ref<CurveChannel>('rgb');
const key = computed(() => CURVE_KEYS[channel.value]);
const stored = computed(() => String(props.filters[key.value] ?? ''));

// Lokale Punkte: Ein Punkt auf der Diagonalen ergäbe gespeichert '' (linear)
// und verschwände sonst mitten im Ziehen.
const points = ref<CurvePoint[]>(curvePoints(stored.value));
watch(stored, (value) => {
  if (serializeCurve(points.value) !== value) points.value = curvePoints(value);
});

const activeIndex = ref(-1);
const dragIndex = ref(-1);
const svg = ref<SVGSVGElement | null>(null);

const channelLabel = computed(() => t(`editor.curves.channels.${channel.value}`));
const activeChannels = computed(() =>
  Object.fromEntries(
    CURVE_CHANNELS.map((c) => [c, isActiveCurve(props.filters[CURVE_KEYS[c]] as string)])
  )
);
const anyActive = computed(() => Object.values(activeChannels.value).some(Boolean));

const linePoints = computed(() => {
  const values = curveValues(points.value);
  return Array.from(values, (y, x) => `${x},${255 - y}`).join(' ');
});

const presetIds = Object.keys(CURVE_PRESETS) as CurvePresetId[];
const matchingPreset = computed(
  () => presetIds.find((id) => CURVE_PRESETS[id] === serializeCurve(points.value)) ?? 'custom'
);
const presetOptions = computed<SelectOption[]>(() => [
  ...presetIds.map((id) => ({ value: id, label: t(`editor.curves.presets.${id}`) })),
  ...(matchingPreset.value === 'custom'
    ? [{ value: 'custom', label: t('editor.curves.presets.custom'), disabled: true }]
    : []),
]);

function emitChange(next: CurvePoint[]) {
  points.value = next;
  emit('update-filter', key.value, serializeCurve(next));
  emit('render');
}

function selectChannel(c: CurveChannel) {
  channel.value = c;
  points.value = curvePoints(stored.value);
  activeIndex.value = -1;
}

function applyPreset(id: string) {
  if (!(id in CURVE_PRESETS)) return;
  emitChange(curvePoints(CURVE_PRESETS[id as CurvePresetId]));
  emit('save-history');
}

function resetAll() {
  for (const c of CURVE_CHANNELS) {
    if (activeChannels.value[c]) emit('update-filter', CURVE_KEYS[c], '');
  }
  points.value = curvePoints('');
  activeIndex.value = -1;
  emit('render');
  emit('save-history');
}

function remove(index: number) {
  if (props.disabled) return;
  const next = removePoint(points.value, index);
  if (next.length === points.value.length) return;
  activeIndex.value = -1;
  emitChange(next);
  emit('save-history');
}

/** Bildschirm- in Kurvenkoordinaten (x: Eingang, y: Ausgang). */
function toCurve(e: PointerEvent): [number, number] | null {
  const rect = svg.value?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return null;
  const vx = VIEW_MIN + ((e.clientX - rect.left) / rect.width) * VIEW_SIZE;
  const vy = VIEW_MIN + ((e.clientY - rect.top) / rect.height) * VIEW_SIZE;
  return [vx, 255 - vy];
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return;
  const pos = toCurve(e);
  if (!pos) return;
  let index = hitPoint(points.value, pos[0], pos[1], HIT_RADIUS);
  if (index < 0) {
    const added = addPoint(points.value, pos[0], pos[1]);
    if (added.index < 0) return;
    index = added.index;
    emitChange(added.points);
  }
  e.preventDefault();
  dragIndex.value = index;
  activeIndex.value = index;
  svg.value?.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (dragIndex.value < 0) return;
  const pos = toCurve(e);
  if (!pos) return;
  emitChange(movePoint(points.value, dragIndex.value, pos[0], pos[1]));
}

function onPointerUp(e: PointerEvent) {
  if (dragIndex.value < 0) return;
  dragIndex.value = -1;
  svg.value?.releasePointerCapture?.(e.pointerId);
  emit('save-history');
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

function onKeyDown(e: KeyboardEvent, index: number) {
  if (props.disabled) return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    remove(index);
    return;
  }
  const dir = ARROWS[e.key];
  if (!dir) return;
  e.preventDefault();
  const step = e.shiftKey ? 10 : 1;
  const [x, y] = points.value[index];
  emitChange(movePoint(points.value, index, x + dir[0] * step, y + dir[1] * step));
}

function onKeyUp(e: KeyboardEvent) {
  if (!props.disabled && e.key in ARROWS) emit('save-history');
}
</script>

<style scoped>
.curves {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.curves__channels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-1);
}

.curves__channel {
  position: relative;
  min-height: var(--ds-control-sm);
  padding: 0 var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-1);
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-sm);
  cursor: pointer;
  transition:
    background var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);
}

.curves__channel:hover:not(:disabled) {
  background: var(--ds-surface-2);
}

.curves__channel.active {
  border-color: var(--ds-accent);
  background: var(--ds-accent-soft);
  color: var(--ds-text);
  font-weight: var(--ds-weight-medium);
}

.curves__channel:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.curves__channel:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.curves__dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-accent);
}

.curves__graph {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  touch-action: none;
  cursor: crosshair;
  user-select: none;
  --curve-color: var(--ds-text);
}

/* Kanalfarben aus den Statusfarben des Systems (Rot, Grün, Blau) */
.curves__graph--r {
  --curve-color: var(--ds-danger);
}
.curves__graph--g {
  --curve-color: var(--ds-success);
}
.curves__graph--b {
  --curve-color: var(--ds-info);
}

.curves__graph.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.curves__bg {
  fill: var(--ds-surface-2);
  stroke: var(--ds-border-strong);
  stroke-width: 1;
}

.curves__grid,
.curves__diagonal {
  fill: none;
  stroke: var(--ds-border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.curves__diagonal {
  stroke-dasharray: 4 4;
}

.curves__line {
  fill: none;
  stroke: var(--curve-color);
  stroke-width: 2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.curves__handle {
  fill: var(--ds-surface-0);
  stroke: var(--curve-color);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  cursor: grab;
}

.curves__handle.active {
  fill: var(--curve-color);
}

.curves__handle:focus-visible {
  outline: none;
  stroke: var(--ds-accent);
  stroke-width: 3;
}

.curves__hint {
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
}

.curves__actions {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
</style>
