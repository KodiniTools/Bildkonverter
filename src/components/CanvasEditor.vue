<template>
  <div class="canvas-container">
    <canvas
      ref="canvasRef"
      class="image-canvas"
      :class="{ interacting: isInteracting }"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @dblclick="onDoubleClick"
      @touchstart.prevent="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend.prevent="onTouchEnd"
    />

    <!-- Text-Bearbeitung Modal -->
    <TextEditModal
      v-if="showTextModal"
      :text="editingText"
      @save="saveTextEdit"
      @close="closeTextModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useImageStore } from '@/stores/imageStore';
import { useTextInteraction } from '@/composables/useTextInteraction';
import TextEditModal from './TextEditModal.vue';

// Stores
const imageStore = useImageStore();

// Composables
const { isInteracting, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown } =
  useTextInteraction(imageStore);

// Refs
const canvasRef = ref(null);
const showTextModal = ref(false);
const editingText = ref(null);

// Canvas Position berechnen (Maus oder Touch)
function getCanvasPosition(event) {
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = imageStore.imageWidth / rect.width;
  const scaleY = imageStore.imageHeight / rect.height;

  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

// Event Handlers
function onMouseDown(event) {
  const pos = getCanvasPosition(event);
  const result = handleMouseDown(pos.x, pos.y);

  // Wenn Doppelklick erkannt wurde
  if (result && result.action === 'edit') {
    editingText.value = imageStore.texts[result.textIndex];
    showTextModal.value = true;
  }
}

function onMouseMove(event) {
  const pos = getCanvasPosition(event);
  handleMouseMove(pos.x, pos.y);
}

function onMouseUp() {
  handleMouseUp();
}

function onDoubleClick(event) {
  const pos = getCanvasPosition(event);
  // Doppelklick wird bereits in handleMouseDown behandelt
  console.log('Double click at:', pos);
}

// Touch-Handler mit Long-Press für Text-Bearbeitung
let touchLongPressTimer = null;
let lastTouchTime = 0;
let lastTouchPos = null;

function onTouchStart(event) {
  if (event.touches.length !== 1) return;

  const pos = getCanvasPosition(event);
  const result = handleMouseDown(pos.x, pos.y);

  if (result && result.action === 'edit') {
    editingText.value = imageStore.texts[result.textIndex];
    showTextModal.value = true;
    return;
  }

  // Doppeltipp-Erkennung (400ms Fenster)
  const now = Date.now();
  if (lastTouchPos && now - lastTouchTime < 400) {
    const dx = Math.abs(pos.x - lastTouchPos.x);
    const dy = Math.abs(pos.y - lastTouchPos.y);
    if (dx < 30 && dy < 30) {
      // Doppeltipp: Text bearbeiten
      const textIndex = imageStore.texts.findIndex((t) => t.id === imageStore.selectedTextId);
      if (textIndex !== -1) {
        editingText.value = imageStore.texts[textIndex];
        showTextModal.value = true;
        lastTouchTime = 0;
        return;
      }
    }
  }

  lastTouchTime = now;
  lastTouchPos = pos;

  // Long-Press-Erkennung (600ms) für Text-Bearbeitung
  touchLongPressTimer = setTimeout(() => {
    const textIndex = imageStore.texts.findIndex((t) => t.id === imageStore.selectedTextId);
    if (textIndex !== -1) {
      handleMouseUp();
      editingText.value = imageStore.texts[textIndex];
      showTextModal.value = true;
    }
  }, 600);
}

function onTouchMove(event) {
  if (event.touches.length !== 1) return;
  clearTimeout(touchLongPressTimer);
  const pos = getCanvasPosition(event);
  handleMouseMove(pos.x, pos.y);
}

function onTouchEnd(event) {
  clearTimeout(touchLongPressTimer);
  handleMouseUp();
}

function onKeyDown(event) {
  handleKeyDown(event);
}

// Text Modal
function saveTextEdit(updatedText) {
  if (editingText.value) {
    imageStore.updateText(editingText.value.id, updatedText);
    imageStore.saveState('Text bearbeitet', 'text');
  }
  closeTextModal();
}

function closeTextModal() {
  showTextModal.value = false;
  editingText.value = null;
}

// Lifecycle
onMounted(() => {
  // Canvas initialisieren
  if (canvasRef.value) {
    imageStore.initCanvas(canvasRef.value);
  }

  // Keyboard Listener
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

const { workingUrl, filters, texts, selectedTextId } = storeToRefs(imageStore);

watch([workingUrl, selectedTextId], () => {
  if (imageStore.hasImage) imageStore.draw();
});

watch(filters, () => {
  if (imageStore.hasImage) imageStore.draw();
}, { deep: true });

watch(texts, () => {
  if (imageStore.hasImage) imageStore.draw();
}, { deep: true });
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.image-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid var(--border-color, #ddd);
  background: var(--canvas-bg, #f5f5f5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-canvas.interacting {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}
</style>
