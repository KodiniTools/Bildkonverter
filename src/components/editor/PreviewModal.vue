<template>
  <Teleport to="body">
    <div v-if="show" class="preview-modal-overlay" @click="$emit('close')">
      <div class="preview-modal-content" @click.stop>
        <button class="preview-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>

        <!-- Mode tabs -->
        <div class="preview-tabs">
          <button
            class="preview-tab"
            :class="{ active: mode === 'before' }"
            @click="mode = 'before'"
          >
            <i class="fas fa-history"></i>
            {{ $t('editor.preview.before', 'Vorher') }}
          </button>
          <button
            class="preview-tab"
            :class="{ active: mode === 'compare' }"
            @click="mode = 'compare'"
          >
            <i class="fas fa-columns"></i>
            {{ $t('editor.preview.compare', 'Vergleich') }}
          </button>
          <button
            class="preview-tab"
            :class="{ active: mode === 'after' }"
            @click="mode = 'after'"
          >
            <i class="fas fa-magic"></i>
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
              <i class="fas fa-exchange-alt"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  originalSrc: String,
  editedSrc: String,
});
defineEmits(['close']);

const mode = ref('compare');
const sliderPos = ref(50);
const sliderContainer = ref(null);
let dragging = false;

watch(() => props.show, (val) => {
  if (val) {
    mode.value = 'compare';
    sliderPos.value = 50;
  }
});

function startDrag(e) {
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
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
}

.preview-modal-content {
  position: relative;
  background: #1a1f2e;
  border-radius: 14px;
  padding: 1.5rem;
  max-width: 90vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.preview-close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* Tabs */
.preview-tabs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  padding-right: 2.5rem;
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1.1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  &.active {
    background: #f5a623;
    color: #1a1f2e;
    font-weight: 700;
  }

  i {
    font-size: 0.8rem;
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
    border-radius: 8px;
    display: block;
  }
}

/* Slider comparison */
.preview-slider {
  position: relative;
  cursor: col-resize;
  user-select: none;
  border-radius: 10px;
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

  &.slider-before {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-position: center;
  }
}

.slider-label {
  position: absolute;
  top: 0.75rem;
  padding: 0.2rem 0.6rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 4px;
  pointer-events: none;
  line-height: 1.4;
}

.slider-label-before {
  left: 0.75rem;
}

.slider-label-after {
  right: 0.75rem;
}

.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-handle {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  color: #444;
  font-size: 1rem;
  pointer-events: none;
}

.preview-placeholder {
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  text-align: center;
  line-height: 1.5;

  &.full {
    width: 100%;
  }
}
</style>
