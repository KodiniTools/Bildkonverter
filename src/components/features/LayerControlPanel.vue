<template>
  <div class="layer-control-panel">
    <!-- Layer Liste -->
    <div class="panel-section">
      <h3 class="section-title">
        <i class="fas fa-layer-group"></i>
        {{ $t('collage.layers', 'Ebenen') }} ({{ imageStore.imageLayerCount }})
      </h3>

      <div class="layer-list">
        <div
          v-for="(layer, index) in reversedLayers"
          :key="layer.id"
          class="layer-item"
          :class="{ selected: layer.id === imageStore.selectedLayerId }"
          @click="selectLayer(layer.id)"
        >
          <div class="layer-preview">
            <img :src="layer.url" :alt="layer.name" />
          </div>
          <div class="layer-info">
            <span class="layer-name">{{ layer.name }}</span>
            <span class="layer-size">{{ Math.round(layer.width) }} × {{ Math.round(layer.height) }}</span>
          </div>
          <div class="layer-actions">
            <button
              class="icon-btn"
              @click.stop="toggleVisibility(layer)"
              :title="layer.visible ? 'Ausblenden' : 'Einblenden'"
            >
              <i class="fas" :class="layer.visible ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
            <button
              class="icon-btn"
              @click.stop="deleteLayer(layer.id)"
              title="Löschen"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Layer Reihenfolge -->
      <div class="layer-order-buttons" v-if="selectedLayer">
        <button class="btn btn-sm" @click="moveLayer('up')" title="Nach oben">
          <i class="fas fa-arrow-up"></i>
        </button>
        <button class="btn btn-sm" @click="moveLayer('down')" title="Nach unten">
          <i class="fas fa-arrow-down"></i>
        </button>
        <button class="btn btn-sm" @click="duplicateLayer" title="Duplizieren">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    </div>

    <!-- Ausgewählter Layer Eigenschaften -->
    <div class="panel-section" v-if="selectedLayer">
      <h3 class="section-title">
        <i class="fas fa-sliders-h"></i>
        {{ selectedLayer.name }}
      </h3>

      <!-- Position -->
      <div class="control-group">
        <label>Position</label>
        <div class="input-row">
          <div class="input-field">
            <span>X</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.x)"
              @input="updateLayerProperty('x', parseInt($event.target.value) || 0)"
            />
          </div>
          <div class="input-field">
            <span>Y</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.y)"
              @input="updateLayerProperty('y', parseInt($event.target.value) || 0)"
            />
          </div>
        </div>
      </div>

      <!-- Größe -->
      <div class="control-group">
        <label>Größe</label>
        <div class="input-row">
          <div class="input-field">
            <span>B</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.width)"
              @input="updateSize('width', parseInt($event.target.value) || 50)"
            />
          </div>
          <div class="input-field">
            <span>H</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.height)"
              @input="updateSize('height', parseInt($event.target.value) || 50)"
            />
          </div>
          <button
            class="icon-btn"
            :class="{ active: maintainAspectRatio }"
            @click="maintainAspectRatio = !maintainAspectRatio"
            title="Seitenverhältnis beibehalten"
          >
            <i class="fas fa-link"></i>
          </button>
        </div>
      </div>

      <!-- Rotation -->
      <div class="control-group">
        <label>Rotation: {{ selectedLayer.rotation }}°</label>
        <input
          type="range"
          min="-180"
          max="180"
          :value="selectedLayer.rotation"
          @input="updateLayerProperty('rotation', parseInt($event.target.value))"
        />
        <div class="quick-rotate">
          <button class="btn btn-sm" @click="rotateBy(-90)">-90°</button>
          <button class="btn btn-sm" @click="updateLayerProperty('rotation', 0)">0°</button>
          <button class="btn btn-sm" @click="rotateBy(90)">+90°</button>
        </div>
      </div>

      <!-- Deckkraft -->
      <div class="control-group">
        <label>Deckkraft: {{ selectedLayer.opacity }}%</label>
        <input
          type="range"
          min="0"
          max="100"
          :value="selectedLayer.opacity"
          @input="updateLayerProperty('opacity', parseInt($event.target.value))"
        />
      </div>

      <!-- Filter -->
      <div class="control-group">
        <label>Helligkeit: {{ selectedLayer.filters.brightness }}%</label>
        <input
          type="range"
          min="0"
          max="200"
          :value="selectedLayer.filters.brightness"
          @input="updateFilter('brightness', parseInt($event.target.value))"
        />
      </div>

      <div class="control-group">
        <label>Kontrast: {{ selectedLayer.filters.contrast }}%</label>
        <input
          type="range"
          min="0"
          max="200"
          :value="selectedLayer.filters.contrast"
          @input="updateFilter('contrast', parseInt($event.target.value))"
        />
      </div>

      <div class="control-group">
        <label>Sättigung: {{ selectedLayer.filters.saturation }}%</label>
        <input
          type="range"
          min="0"
          max="200"
          :value="selectedLayer.filters.saturation"
          @input="updateFilter('saturation', parseInt($event.target.value))"
        />
      </div>

      <div class="control-group">
        <label>Graustufen: {{ selectedLayer.filters.grayscale }}%</label>
        <input
          type="range"
          min="0"
          max="100"
          :value="selectedLayer.filters.grayscale"
          @input="updateFilter('grayscale', parseInt($event.target.value))"
        />
      </div>

      <!-- Reset Button -->
      <button class="btn btn-secondary btn-full" @click="resetLayerFilters">
        <i class="fas fa-undo"></i>
        Filter zurücksetzen
      </button>
    </div>

    <!-- Keine Auswahl -->
    <div class="panel-section" v-else>
      <p class="hint-text">
        <i class="fas fa-mouse-pointer"></i>
        Klicken Sie auf ein Bild im Canvas um es zu bearbeiten
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useImageStore } from '@/stores/imageStore'

const emit = defineEmits(['render'])

const imageStore = useImageStore()
const maintainAspectRatio = ref(true)

const selectedLayer = computed(() => imageStore.selectedImageLayer)

const reversedLayers = computed(() => {
  return [...imageStore.imageLayers].reverse()
})

function selectLayer(layerId) {
  imageStore.selectImageLayer(layerId)
  emit('render')
}

function toggleVisibility(layer) {
  imageStore.updateImageLayer(layer.id, { visible: !layer.visible })
  emit('render')
}

function deleteLayer(layerId) {
  if (confirm('Möchten Sie diesen Layer wirklich löschen?')) {
    imageStore.deleteImageLayer(layerId)
    emit('render')
  }
}

function moveLayer(direction) {
  if (selectedLayer.value) {
    imageStore.moveImageLayerOrder(selectedLayer.value.id, direction)
    emit('render')
  }
}

function duplicateLayer() {
  if (selectedLayer.value) {
    imageStore.duplicateImageLayer(selectedLayer.value.id)
    emit('render')
  }
}

function updateLayerProperty(property, value) {
  if (selectedLayer.value) {
    imageStore.updateImageLayer(selectedLayer.value.id, { [property]: value })
    emit('render')
  }
}

function updateSize(property, value) {
  if (!selectedLayer.value) return

  const layer = selectedLayer.value
  const aspectRatio = layer.originalWidth / layer.originalHeight

  if (maintainAspectRatio.value) {
    if (property === 'width') {
      imageStore.updateImageLayer(layer.id, {
        width: value,
        height: value / aspectRatio
      })
    } else {
      imageStore.updateImageLayer(layer.id, {
        width: value * aspectRatio,
        height: value
      })
    }
  } else {
    imageStore.updateImageLayer(layer.id, { [property]: value })
  }
  emit('render')
}

function rotateBy(degrees) {
  if (selectedLayer.value) {
    const newRotation = (selectedLayer.value.rotation + degrees) % 360
    updateLayerProperty('rotation', newRotation)
  }
}

function updateFilter(filterName, value) {
  if (selectedLayer.value) {
    const newFilters = { ...selectedLayer.value.filters, [filterName]: value }
    imageStore.updateImageLayer(selectedLayer.value.id, { filters: newFilters })
    emit('render')
  }
}

function resetLayerFilters() {
  if (selectedLayer.value) {
    imageStore.updateImageLayer(selectedLayer.value.id, {
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hue: 0
      },
      rotation: 0,
      opacity: 100
    })
    emit('render')
  }
}
</script>

<style lang="scss" scoped>
.layer-control-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.panel-section {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);

  i {
    color: var(--color-primary);
  }
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--color-bg);
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-border);
  }

  &.selected {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }
}

.layer-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.layer-info {
  flex: 1;
  min-width: 0;

  .layer-name {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .layer-size {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
}

.layer-actions {
  display: flex;
  gap: 0.25rem;
}

.layer-order-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: center;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary);
    color: white;
  }

  &.active {
    background: var(--color-primary);
    color: white;
  }
}

.control-group {
  margin-bottom: 1rem;

  label {
    display: block;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }

  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg);
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-primary);
      cursor: pointer;
    }
  }

  input[type="number"] {
    width: 100%;
    padding: 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.85rem;
  }
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  span {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    width: 16px;
  }

  input {
    flex: 1;
  }
}

.quick-rotate {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &.btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
  }

  &.btn-secondary {
    background: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  &.btn-full {
    width: 100%;
  }
}

.hint-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  padding: 1rem;

  i {
    display: block;
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }
}
</style>
