<template>
  <div class="layer-control-panel">
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'layers' }"
        @click="activeTab = 'layers'"
      >
        <i class="fas fa-layer-group"></i>
        Ebenen
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'text' }"
        @click="activeTab = 'text'"
      >
        <i class="fas fa-font"></i>
        Text
      </button>
    </div>

    <!-- Undo/Redo Toolbar -->
    <div class="history-toolbar">
      <button
        class="history-btn"
        :class="{ disabled: !imageStore.canUndo }"
        :disabled="!imageStore.canUndo"
        @click="handleUndo"
        title="Rückgängig (Strg+Z)"
      >
        <i class="fas fa-undo"></i>
      </button>
      <button
        class="history-btn"
        :class="{ disabled: !imageStore.canRedo }"
        :disabled="!imageStore.canRedo"
        @click="handleRedo"
        title="Wiederholen (Strg+Y)"
      >
        <i class="fas fa-redo"></i>
      </button>
      <button
        class="history-btn preview-btn"
        @click="handlePreview"
        title="Vorschau"
      >
        <i class="fas fa-eye"></i>
      </button>
      <span class="history-info" v-if="historyInfo">
        <i class="fas fa-history"></i>
        {{ historyInfo }}
      </span>
    </div>

    <!-- LAYERS TAB -->
    <div v-show="activeTab === 'layers'" class="tab-content">
      <!-- Layer Liste -->
      <div class="panel-section">
        <h3 class="section-title">
          <i class="fas fa-layer-group"></i>
          Ebenen ({{ imageStore.imageLayerCount }})
        </h3>

        <div class="layer-list">
          <div
            v-for="layer in reversedLayers"
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

      <!-- Canvas Hintergrund -->
      <div class="panel-section">
        <h3 class="section-title collapsible" @click="toggleSection('canvas')">
          <i class="fas fa-fill-drip"></i>
          Hintergrund
          <i class="fas toggle-icon" :class="openSections.canvas ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </h3>

        <div v-show="openSections.canvas" class="section-content">
          <div class="control-group">
            <label>Hintergrundfarbe</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="imageStore.canvasBackgroundColor"
                @input="updateBackgroundColor($event.target.value)"
                class="color-input"
              />
              <input
                type="text"
                :value="imageStore.canvasBackgroundColor"
                @input="updateBackgroundColor($event.target.value)"
                class="color-text-input"
                maxlength="7"
              />
              <button
                class="icon-btn"
                :class="{ active: imageStore.canvasBackgroundColor === 'transparent' }"
                @click="updateBackgroundColor('transparent')"
                title="Transparent"
              >
                <i class="fas fa-chess-board"></i>
              </button>
            </div>
          </div>
          <div class="quick-colors">
            <button
              v-for="color in quickColors"
              :key="color.value"
              class="color-swatch"
              :class="{ active: imageStore.canvasBackgroundColor === color.value, transparent: color.value === 'transparent' }"
              :style="color.value !== 'transparent' ? { backgroundColor: color.value } : {}"
              @click="updateBackgroundColor(color.value)"
              :title="color.label"
            >
              <i v-if="color.value === 'transparent'" class="fas fa-chess-board"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Ausgewählter Layer Eigenschaften -->
      <div class="panel-section" v-if="selectedLayer">
        <h3 class="section-title collapsible" @click="toggleSection('transform')">
          <i class="fas fa-arrows-alt"></i>
          Transformieren
          <i class="fas toggle-icon" :class="openSections.transform ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </h3>

        <div v-show="openSections.transform" class="section-content">
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
        </div>
      </div>

      <!-- Filter Section -->
      <div class="panel-section" v-if="selectedLayer">
        <h3 class="section-title collapsible" @click="toggleSection('filters')">
          <i class="fas fa-sliders-h"></i>
          Filter
          <i class="fas toggle-icon" :class="openSections.filters ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </h3>

        <div v-show="openSections.filters" class="section-content">
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

          <button class="btn btn-secondary btn-full" @click="resetLayerFilters">
            <i class="fas fa-undo"></i>
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <!-- Border/Umrandung Section -->
      <div class="panel-section" v-if="selectedLayer">
        <h3 class="section-title collapsible" @click="toggleSection('border')">
          <i class="fas fa-border-style"></i>
          Umrandung
          <i class="fas toggle-icon" :class="openSections.border ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </h3>

        <div v-show="openSections.border" class="section-content">
          <div class="control-group">
            <label>Randstärke: {{ layerBorder.width }}px</label>
            <input
              type="range"
              min="0"
              max="50"
              :value="layerBorder.width"
              @input="updateBorder('width', parseInt($event.target.value))"
            />
          </div>

          <div class="control-group">
            <label>Randfarbe</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="layerBorder.color"
                @input="updateBorder('color', $event.target.value)"
                class="color-input"
              />
              <input
                type="text"
                :value="layerBorder.color"
                @input="updateBorder('color', $event.target.value)"
                class="color-text-input"
                maxlength="7"
              />
            </div>
          </div>

          <div class="control-group">
            <label>Eckenradius: {{ layerBorder.radius }}%</label>
            <input
              type="range"
              min="0"
              max="50"
              :value="layerBorder.radius"
              @input="updateBorder('radius', parseInt($event.target.value))"
            />
          </div>
        </div>
      </div>

      <!-- Shadow/Schatten Section -->
      <div class="panel-section" v-if="selectedLayer">
        <h3 class="section-title collapsible" @click="toggleSection('shadow')">
          <i class="fas fa-clone"></i>
          Schlagschatten
          <i class="fas toggle-icon" :class="openSections.shadow ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </h3>

        <div v-show="openSections.shadow" class="section-content">
          <div class="control-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                :checked="layerShadow.enabled"
                @change="updateShadow('enabled', $event.target.checked)"
              />
              Schatten aktivieren
            </label>
          </div>

          <template v-if="layerShadow.enabled">
            <div class="control-group">
              <label>Versatz X: {{ layerShadow.offsetX }}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                :value="layerShadow.offsetX"
                @input="updateShadow('offsetX', parseInt($event.target.value))"
              />
            </div>

            <div class="control-group">
              <label>Versatz Y: {{ layerShadow.offsetY }}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                :value="layerShadow.offsetY"
                @input="updateShadow('offsetY', parseInt($event.target.value))"
              />
            </div>

            <div class="control-group">
              <label>Unschärfe: {{ layerShadow.blur }}px</label>
              <input
                type="range"
                min="0"
                max="50"
                :value="layerShadow.blur"
                @input="updateShadow('blur', parseInt($event.target.value))"
              />
            </div>

            <div class="control-group">
              <label>Schattenfarbe</label>
              <div class="color-picker-row">
                <input
                  type="color"
                  :value="layerShadow.color"
                  @input="updateShadow('color', $event.target.value)"
                  class="color-input"
                />
                <input
                  type="text"
                  :value="layerShadow.color"
                  @input="updateShadow('color', $event.target.value)"
                  class="color-text-input"
                  maxlength="7"
                />
              </div>
            </div>

            <div class="control-group">
              <label>Deckkraft: {{ layerShadow.opacity }}%</label>
              <input
                type="range"
                min="0"
                max="100"
                :value="layerShadow.opacity"
                @input="updateShadow('opacity', parseInt($event.target.value))"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Keine Auswahl -->
      <div class="panel-section" v-if="!selectedLayer">
        <p class="hint-text">
          <i class="fas fa-mouse-pointer"></i>
          Klicken Sie auf ein Bild im Canvas um es zu bearbeiten
        </p>
      </div>
    </div>

    <!-- TEXT TAB -->
    <div v-show="activeTab === 'text'" class="tab-content">
      <!-- Add Text Button -->
      <div class="panel-section">
        <button class="btn btn-primary btn-full" @click="addText">
          <i class="fas fa-plus"></i>
          Text hinzufügen
        </button>
      </div>

      <!-- Text Liste -->
      <div class="panel-section" v-if="imageStore.texts && imageStore.texts.length > 0">
        <h3 class="section-title">
          <i class="fas fa-list"></i>
          Texte ({{ imageStore.texts.length }})
        </h3>

        <div class="text-list">
          <div
            v-for="text in imageStore.texts"
            :key="text.id"
            class="text-item"
            :class="{ selected: text.id === selectedTextId }"
            @click="selectText(text.id)"
          >
            <div class="text-preview">
              <i class="fas fa-font"></i>
            </div>
            <div class="text-info">
              <span class="text-content">{{ text.content || text.txt || 'Text' }}</span>
              <span class="text-meta">{{ text.fontSize || 32 }}px</span>
            </div>
            <button
              class="icon-btn"
              @click.stop="deleteText(text.id)"
              title="Löschen"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Ausgewählter Text Eigenschaften -->
      <div class="panel-section" v-if="selectedText">
        <h3 class="section-title">
          <i class="fas fa-edit"></i>
          Text bearbeiten
        </h3>

        <div class="control-group">
          <label>Inhalt</label>
          <input
            type="text"
            :value="selectedText.content || selectedText.txt"
            @input="updateTextProperty('content', $event.target.value)"
            class="text-input"
          />
        </div>

        <div class="control-group">
          <label>Schriftgröße: {{ selectedText.fontSize || 32 }}px</label>
          <input
            type="range"
            min="8"
            max="200"
            :value="selectedText.fontSize || 32"
            @input="updateTextProperty('fontSize', parseInt($event.target.value))"
          />
        </div>

        <div class="control-group">
          <label>Schriftart</label>
          <select
            :value="selectedText.fontFamily || 'Arial'"
            @change="updateTextProperty('fontFamily', $event.target.value)"
            class="form-select"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>

        <div class="control-group">
          <label>Textfarbe</label>
          <div class="color-picker-row">
            <input
              type="color"
              :value="selectedText.color || '#000000'"
              @input="updateTextProperty('color', $event.target.value)"
              class="color-input"
            />
            <input
              type="text"
              :value="selectedText.color || '#000000'"
              @input="updateTextProperty('color', $event.target.value)"
              class="color-text-input"
              maxlength="7"
            />
          </div>
        </div>

        <div class="control-group">
          <label>Deckkraft: {{ selectedText.opacity || 100 }}%</label>
          <input
            type="range"
            min="0"
            max="100"
            :value="selectedText.opacity || 100"
            @input="updateTextProperty('opacity', parseInt($event.target.value))"
          />
        </div>

        <div class="control-group">
          <label>Rotation: {{ selectedText.rotation || 0 }}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            :value="selectedText.rotation || 0"
            @input="updateTextProperty('rotation', parseInt($event.target.value))"
          />
        </div>

        <!-- Text Kontur -->
        <h4 class="subsection-title">Kontur</h4>
        <div class="control-group">
          <label>Konturstärke: {{ selectedText.strokeWidth || 0 }}px</label>
          <input
            type="range"
            min="0"
            max="20"
            :value="selectedText.strokeWidth || 0"
            @input="updateTextProperty('strokeWidth', parseInt($event.target.value))"
          />
        </div>

        <div class="control-group" v-if="(selectedText.strokeWidth || 0) > 0">
          <label>Konturfarbe</label>
          <div class="color-picker-row">
            <input
              type="color"
              :value="selectedText.strokeColor || '#ffffff'"
              @input="updateTextProperty('strokeColor', $event.target.value)"
              class="color-input"
            />
            <input
              type="text"
              :value="selectedText.strokeColor || '#ffffff'"
              @input="updateTextProperty('strokeColor', $event.target.value)"
              class="color-text-input"
              maxlength="7"
            />
          </div>
        </div>

        <!-- Text Schatten -->
        <h4 class="subsection-title">Textschatten</h4>
        <div class="control-group">
          <label>Schattenunschärfe: {{ selectedText.shadowBlur || 0 }}px</label>
          <input
            type="range"
            min="0"
            max="30"
            :value="selectedText.shadowBlur || 0"
            @input="updateTextProperty('shadowBlur', parseInt($event.target.value))"
          />
        </div>

        <template v-if="(selectedText.shadowBlur || 0) > 0">
          <div class="control-group">
            <label>Schatten X: {{ selectedText.shadowOffsetX || 2 }}px</label>
            <input
              type="range"
              min="-20"
              max="20"
              :value="selectedText.shadowOffsetX || 2"
              @input="updateTextProperty('shadowOffsetX', parseInt($event.target.value))"
            />
          </div>

          <div class="control-group">
            <label>Schatten Y: {{ selectedText.shadowOffsetY || 2 }}px</label>
            <input
              type="range"
              min="-20"
              max="20"
              :value="selectedText.shadowOffsetY || 2"
              @input="updateTextProperty('shadowOffsetY', parseInt($event.target.value))"
            />
          </div>

          <div class="control-group">
            <label>Schattenfarbe</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedText.shadowColor || '#000000'"
                @input="updateTextProperty('shadowColor', $event.target.value)"
                class="color-input"
              />
              <input
                type="text"
                :value="selectedText.shadowColor || '#000000'"
                @input="updateTextProperty('shadowColor', $event.target.value)"
                class="color-text-input"
                maxlength="7"
              />
            </div>
          </div>
        </template>

        <button class="btn btn-danger btn-full" @click="deleteText(selectedText.id)">
          <i class="fas fa-trash"></i>
          Text löschen
        </button>
      </div>

      <!-- Keine Texte -->
      <div class="panel-section" v-if="!imageStore.texts || imageStore.texts.length === 0">
        <p class="hint-text">
          <i class="fas fa-font"></i>
          Klicken Sie auf "Text hinzufügen" um einen neuen Text zu erstellen
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useImageStore } from '@/stores/imageStore'

const props = defineProps({
  canvasSelectedTextId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['render', 'add-text', 'select-text', 'preview'])

const imageStore = useImageStore()
const maintainAspectRatio = ref(true)
const activeTab = ref('layers')
const selectedTextId = ref(null)

// Debounce Timer für History-Speicherung
let saveStateTimer = null

// Debounced saveState - speichert erst nach 500ms Inaktivität
function debouncedSaveState(description, type = 'layer') {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer)
  }
  saveStateTimer = setTimeout(() => {
    imageStore.saveState(description, type)
    saveStateTimer = null
  }, 500)
}

// Sofortige State-Speicherung ohne Debounce
function saveStateNow(description, type = 'layer') {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer)
    saveStateTimer = null
  }
  imageStore.saveState(description, type)
}

// Wenn Text auf Canvas ausgewählt wird, zu Text-Tab wechseln und Text auswählen
watch(() => props.canvasSelectedTextId, (newTextId) => {
  if (newTextId) {
    selectedTextId.value = newTextId
    activeTab.value = 'text'
    // Layer-Auswahl aufheben
    imageStore.selectImageLayer(null)
  } else {
    // Text wurde abgewählt - wenn ein Layer ausgewählt ist, zu Layers-Tab wechseln
    if (imageStore.selectedLayerId) {
      activeTab.value = 'layers'
      selectedTextId.value = null
    }
  }
})

// Wenn ein Layer ausgewählt wird, zu Layers-Tab wechseln
watch(() => imageStore.selectedLayerId, (newLayerId) => {
  if (newLayerId) {
    activeTab.value = 'layers'
    selectedTextId.value = null
  }
})

const openSections = reactive({
  canvas: true,
  transform: true,
  filters: false,
  border: false,
  shadow: false
})

// Schnellfarben für Hintergrund
const quickColors = [
  { value: 'transparent', label: 'Transparent' },
  { value: '#ffffff', label: 'Weiß' },
  { value: '#000000', label: 'Schwarz' },
  { value: '#f0f0f0', label: 'Hellgrau' },
  { value: '#808080', label: 'Grau' },
  { value: '#ff0000', label: 'Rot' },
  { value: '#00ff00', label: 'Grün' },
  { value: '#0000ff', label: 'Blau' }
]

const selectedLayer = computed(() => imageStore.selectedImageLayer)

const reversedLayers = computed(() => {
  return [...imageStore.imageLayers].reverse()
})

const selectedText = computed(() => {
  if (!selectedTextId.value || !imageStore.texts) return null
  return imageStore.texts.find(t => t.id === selectedTextId.value)
})

// History Info Computed
const historyInfo = computed(() => {
  const current = imageStore.historyIndex + 1
  const total = imageStore.history.length
  if (total === 0) return ''
  return `${current}/${total}`
})

// Default Werte für Layer Border
const layerBorder = computed(() => ({
  width: selectedLayer.value?.border?.width || 0,
  color: selectedLayer.value?.border?.color || '#000000',
  radius: selectedLayer.value?.border?.radius || 0
}))

// Default Werte für Layer Shadow
const layerShadow = computed(() => ({
  enabled: selectedLayer.value?.shadow?.enabled || false,
  offsetX: selectedLayer.value?.shadow?.offsetX || 5,
  offsetY: selectedLayer.value?.shadow?.offsetY || 5,
  blur: selectedLayer.value?.shadow?.blur || 10,
  color: selectedLayer.value?.shadow?.color || '#000000',
  opacity: selectedLayer.value?.shadow?.opacity || 50
}))

function toggleSection(section) {
  openSections[section] = !openSections[section]
}

function updateBackgroundColor(color) {
  imageStore.canvasBackgroundColor = color
  emit('render')
  debouncedSaveState('Hintergrundfarbe geändert', 'layer')
}

function selectLayer(layerId) {
  imageStore.selectImageLayer(layerId)
  emit('render')
}

function toggleVisibility(layer) {
  imageStore.updateImageLayer(layer.id, { visible: !layer.visible })
  emit('render')
  saveStateNow(layer.visible ? 'Layer ausgeblendet' : 'Layer eingeblendet', 'layer')
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
    debouncedSaveState(`Layer ${property} geändert`, 'layer')
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
  debouncedSaveState('Layer-Größe geändert', 'layer')
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
    debouncedSaveState(`Layer-Filter ${filterName} geändert`, 'layer')
  }
}

function updateBorder(property, value) {
  if (selectedLayer.value) {
    const currentBorder = selectedLayer.value.border || { width: 0, color: '#000000', radius: 0 }
    const newBorder = { ...currentBorder, [property]: value }
    imageStore.updateImageLayer(selectedLayer.value.id, { border: newBorder })
    emit('render')
    debouncedSaveState('Layer-Umrandung geändert', 'layer')
  }
}

function updateShadow(property, value) {
  if (selectedLayer.value) {
    const currentShadow = selectedLayer.value.shadow || {
      enabled: false,
      offsetX: 5,
      offsetY: 5,
      blur: 10,
      color: '#000000',
      opacity: 50
    }
    const newShadow = { ...currentShadow, [property]: value }
    imageStore.updateImageLayer(selectedLayer.value.id, { shadow: newShadow })
    emit('render')
    debouncedSaveState('Layer-Schatten geändert', 'layer')
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
      opacity: 100,
      border: { width: 0, color: '#000000', radius: 0 },
      shadow: { enabled: false, offsetX: 5, offsetY: 5, blur: 10, color: '#000000', opacity: 50 }
    })
    emit('render')
    saveStateNow('Layer-Filter zurückgesetzt', 'layer')
  }
}

// Text Funktionen
function addText() {
  const newText = {
    id: `text_${Date.now()}`,
    content: 'Neuer Text',
    x: 100,
    y: 100,
    fontSize: 48,
    fontFamily: 'Arial',
    color: '#000000',
    opacity: 100,
    rotation: 0,
    strokeWidth: 0,
    strokeColor: '#ffffff',
    shadowBlur: 0,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowColor: '#000000'
  }

  if (!imageStore.texts) {
    imageStore.texts = []
  }
  imageStore.texts.push(newText)
  selectedTextId.value = newText.id
  emit('render')
}

function selectText(textId) {
  selectedTextId.value = textId
  // Layer-Auswahl aufheben
  imageStore.selectImageLayer(null)
  emit('select-text', textId)
  emit('render')
}

function deleteText(textId) {
  if (confirm('Möchten Sie diesen Text wirklich löschen?')) {
    const index = imageStore.texts.findIndex(t => t.id === textId)
    if (index !== -1) {
      imageStore.texts.splice(index, 1)
      if (selectedTextId.value === textId) {
        selectedTextId.value = null
      }
      emit('render')
    }
  }
}

function updateTextProperty(property, value) {
  if (selectedText.value) {
    const index = imageStore.texts.findIndex(t => t.id === selectedText.value.id)
    if (index !== -1) {
      imageStore.texts[index][property] = value
      // Für ältere Text-Struktur auch 'txt' aktualisieren
      if (property === 'content') {
        imageStore.texts[index].txt = value
      }
      emit('render')
    }
  }
}

// Undo/Redo Funktionen
function handleUndo() {
  if (imageStore.canUndo) {
    imageStore.undo()
    emit('render')
  }
}

function handleRedo() {
  if (imageStore.canRedo) {
    imageStore.redo()
    emit('render')
  }
}

// Preview Funktion
function handlePreview() {
  emit('render')
  emit('preview')
}

// Keyboard Shortcuts für Undo/Redo
function handleKeyDown(event) {
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
    event.preventDefault()
    handleUndo()
  } else if ((event.ctrlKey || event.metaKey) && (event.shiftKey && event.key === 'z' || event.key === 'y')) {
    event.preventDefault()
    handleRedo()
  }
}

// Event Listener für Keyboard Shortcuts
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.layer-control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 280px;
  min-width: 280px;
  max-width: 280px;
}

.history-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.history-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover:not(.disabled) {
    background: var(--color-primary);
    color: white;
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.history-btn.preview-btn {
  margin-left: auto;
  background: var(--color-primary);
  color: white;

  &:hover {
    background: var(--color-primary-dark, #2563eb);
  }
}

.history-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.35rem;

  i {
    font-size: 0.8rem;
    opacity: 0.7;
  }
}

.tab-nav {
  display: flex;
  gap: 0;
  background: var(--color-bg-secondary);
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-text);
    background: var(--color-bg);
  }

  &.active {
    color: var(--color-primary);
    background: var(--color-bg);
    border-bottom: 2px solid var(--color-primary);
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-section {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 0.75rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);

  i:first-child {
    color: var(--color-primary);
  }

  &.collapsible {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--color-primary);
    }

    .toggle-icon {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
  }
}

.subsection-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 1rem 0 0.5rem 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.section-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.layer-list, .text-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
}

.layer-item, .text-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem;
  background: var(--color-bg);
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;
  max-width: 100%;

  &:hover {
    border-color: var(--color-border);
  }

  &.selected {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }
}

.layer-preview, .text-preview {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    min-width: 36px;
    min-height: 36px;
    object-fit: cover;
  }

  i {
    color: var(--color-text-secondary);
  }
}

.layer-info, .text-info {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 100px);
  overflow: hidden;

  .layer-name, .text-content {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .layer-size, .text-meta {
    display: block;
    font-size: 0.7rem;
    color: var(--color-text-secondary);
  }
}

.layer-actions {
  display: flex;
  gap: 0.2rem;
}

.layer-order-buttons {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;

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
  margin-bottom: 0.75rem;

  label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.4rem;
  }

  input[type="range"] {
    width: 100%;
    height: 5px;
    border-radius: 3px;
    background: var(--color-bg);
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-primary);
      cursor: pointer;
    }
  }

  input[type="number"], input[type="text"], .text-input {
    width: 100%;
    padding: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.8rem;
  }

  .form-select {
    width: 100%;
    padding: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.8rem;
    cursor: pointer;
  }
}

.toggle-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.color-picker-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .color-input {
    width: 40px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
  }

  .color-text-input {
    flex: 1;
  }
}

.quick-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    border-color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light, rgba(59, 130, 246, 0.3));
  }

  &.transparent {
    background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0;

    i {
      font-size: 0.7rem;
      color: #666;
    }
  }
}

.input-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.input-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.2rem;

  span {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    width: 14px;
  }

  input {
    flex: 1;
  }
}

.quick-rotate {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.4rem;
  justify-content: center;
}

.btn {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;

  &.btn-sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  &.btn-primary {
    background: var(--color-primary);
    color: white;

    &:hover {
      background: var(--color-primary-dark, #2563eb);
    }
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

  &.btn-danger {
    background: var(--color-danger);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &.btn-full {
    width: 100%;
  }
}

.hint-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  padding: 0.75rem;

  i {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.4rem;
    opacity: 0.5;
  }
}
</style>
