<template>
  <Teleport to="#overlay-root">
    <div v-if="show" class="preview-modal-overlay" @click="$emit('close')">
      <div class="preview-modal-content" @click.stop>
        <button
          class="preview-close-btn"
          :aria-label="$t('common.close', 'Schließen')"
          @click="$emit('close')"
        >
          <AppIcon name="times" />
        </button>

        <!-- Mode tabs -->
        <div class="preview-tabs">
          <button
            class="preview-tab"
            :class="{ active: mode === 'before' }"
            @click="mode = 'before'"
          >
            <AppIcon name="history" />
            {{ $t('editor.preview.before', 'Vorher') }}
          </button>
          <button
            class="preview-tab"
            :class="{ active: mode === 'compare' }"
            @click="mode = 'compare'"
          >
            <AppIcon name="columns" />
            {{ $t('editor.preview.compare', 'Vergleich') }}
          </button>
          <button class="preview-tab" :class="{ active: mode === 'after' }" @click="mode = 'after'">
            <AppIcon name="magic" />
            {{ $t('editor.preview.after', 'Nachher') }}
          </button>
        </div>

        <!-- Single image: Before -->
        <div v-if="mode === 'before'" class="preview-single">
          <img v-if="originalSrc" :src="originalSrc" alt="Original" />
          <div v-else class="preview-placeholder">
            {{ $t('editor.preview.noOriginal', 'Kein Original verfügbar') }}
          </div>
        </div>

        <!-- Single image: After -->
        <div v-if="mode === 'after'" class="preview-single">
          <img v-if="editedSrc" :src="editedSrc" alt="Edited" />
          <div v-else class="preview-placeholder">
            {{ $t('editor.preview.noEdited', 'Keine Bearbeitung verfügbar') }}
          </div>
        </div>

        <!-- Slider comparison -->
        <div
          v-if="mode === 'compare'"
          ref="sliderContainer"
          class="preview-slider"
          @mousedown="startDrag"
          @touchstart.prevent="startDrag"
        >
          <!-- After image (back layer) -->
          <img
            v-if="editedSrc"
            :src="editedSrc"
            alt="Edited"
            class="slider-img"
            draggable="false"
          />
          <div v-else class="preview-placeholder full">
            {{ $t('editor.preview.noEdited', 'Keine Bearbeitung verfügbar') }}
          </div>

          <!-- Before image (front layer, clipped by slider position) -->
          <img
            v-if="originalSrc"
            :src="originalSrc"
            alt="Original"
            class="slider-img slider-before"
            draggable="false"
            :style="{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }"
          />

          <!-- Labels -->
          <span class="slider-label slider-label-before">
            {{ $t('editor.preview.labelBefore', 'VORHER') }}
          </span>
          <span class="slider-label slider-label-after">
            {{ $t('editor.preview.labelAfter', 'NACHHER') }}
          </span>

          <!-- Divider + handle -->
          <div class="slider-line" :style="{ left: sliderPos + '%' }">
            <div class="slider-handle">
              <AppIcon name="exchange-alt" :size="20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  show: Boolean,
  originalSrc: { type: String, default: '' },
  editedSrc: { type: String, default: '' },
});
defineEmits(['close']);

const mode = ref('compare');
const sliderPos = ref(50);
const sliderContainer = ref(null);
let dragging = false;

watch(
  () => props.show,
  (val) => {
    if (val) {
      mode.value = 'compare';
      sliderPos.value = 50;
    }
  }
);

function startDrag(e) {
  // Verhindert natives Bild-Ziehen (sonst „schluckt" der Browser das
  // mouseup und der Slider würde nach dem Loslassen weiterziehen)
  if (e.cancelable) e.preventDefault();
  dragging = true;
  updateSlider(e);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
  if (!dragging) return;
  e.preventDefault();
  updateSlider(e);
}

function stopDrag() {
  dragging = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
}

function updateSlider(e) {
  const container = sliderContainer.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
  sliderPos.value = (x / rect.width) * 100;
}
</script>

<style lang="scss" scoped>
/* Bildvorschau wie im Collage Maker (breites Modal ohne UiDialog):
   Backdrop 50 % Schwarz, surface-1, 1-px-Rahmen, radius-lg, Overlay-Schatten.
   Modus-Umschalter = UiSegmentedControl. */
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--ds-space-4);
  animation: preview-fade var(--ds-duration-slow) var(--ds-ease);
}

.preview-modal-content {
  position: relative;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-overlay);
  padding: var(--ds-space-4);
  max-width: 90vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  overflow: hidden;
}

/* UiIconButton ghost, Größe sm */
.preview-close-btn {
  position: absolute;
  top: var(--ds-space-4);
  right: var(--ds-space-4);
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  background: transparent;
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);
  z-index: 10;

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

/* Tabs = UiSegmentedControl */
.preview-tabs {
  display: inline-flex;
  align-self: center;
  gap: 2px;
  padding: 2px;
  height: var(--ds-control-md);
  margin-right: var(--ds-space-8);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);
}

.preview-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  background: transparent;
  color: var(--ds-text-2);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-surface-1);
    border-color: var(--ds-border-strong);
    color: var(--ds-text);
  }
}

/* Single image view */
.preview-single {
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    border-radius: var(--ds-radius-md);
    display: block;
  }
}

/* Slider comparison */
.preview-slider {
  position: relative;
  cursor: col-resize;
  user-select: none;
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  line-height: 0;
  max-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-img {
  display: block;
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  -webkit-user-drag: none;
  user-select: none;

  &.slider-before {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-position: center;
  }
}

/* Badge über dem Bild */
.slider-label {
  position: absolute;
  top: var(--ds-space-3);
  padding: var(--ds-space-1) var(--ds-space-2);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  border-radius: var(--ds-radius-sm);
  pointer-events: none;
  line-height: var(--ds-leading);
}

.slider-label-before {
  left: var(--ds-space-3);
}

.slider-label-after {
  right: var(--ds-space-3);
}

/* Trennlinie und Griff über dem Bild: Weiß (README-Ausnahme) */
.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #fff;
  transform: translateX(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-handle {
  position: absolute;
  width: var(--ds-row-height);
  height: var(--ds-row-height);
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ds-shadow-overlay);
  color: var(--ds-on-accent);
  pointer-events: none;
}

.preview-placeholder {
  padding: var(--ds-space-12);
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-3);
  font-size: var(--ds-text-sm);
  text-align: center;
  line-height: var(--ds-leading);

  &.full {
    width: 100%;
  }
}

@keyframes preview-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
