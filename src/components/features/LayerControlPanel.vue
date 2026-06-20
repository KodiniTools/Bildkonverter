<template>
  <div class="layer-control-panel">
    <!-- Unified Top Bar: Tabs + History -->
    <div class="panel-topbar">
      <div class="tab-group">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'layers' }"
          @click="activeTab = 'layers'"
        >
          <i class="fas fa-layer-group"></i>
          {{ $t('layerPanel.tabs.layers') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'text' }"
          @click="activeTab = 'text'"
        >
          <i class="fas fa-font"></i>
          {{ $t('layerPanel.tabs.text') }}
        </button>
      </div>
      <div class="history-group">
        <button
          class="history-btn"
          :class="{ disabled: !imageStore.canUndo }"
          :disabled="!imageStore.canUndo"
          :title="$t('layerPanel.history.undo')"
          @click="handleUndo"
        >
          <i class="fas fa-undo"></i>
        </button>
        <button
          class="history-btn"
          :class="{ disabled: !imageStore.canRedo }"
          :disabled="!imageStore.canRedo"
          :title="$t('layerPanel.history.redo')"
          @click="handleRedo"
        >
          <i class="fas fa-redo"></i>
        </button>
        <button
          class="history-btn preview-btn"
          :title="$t('layerPanel.history.preview')"
          @click="handlePreview"
        >
          <i class="fas fa-eye"></i>
        </button>
        <span v-if="historyInfo" class="history-info">{{ historyInfo }}</span>
      </div>
    </div>

    <!-- LAYERS TAB -->
    <div v-show="activeTab === 'layers'" class="tab-content">
      <!-- Layer Liste -->
      <div class="panel-section">
        <div class="section-header section-header--static">
          <i class="section-icon fas fa-layer-group"></i>
          {{ $t('layerPanel.layers.title') }} ({{ imageStore.imageLayerCount }})
        </div>
        <div class="section-content">
          <div class="layer-list">
            <div
              v-for="layer in reversedLayers"
              :key="layer.id"
              class="layer-item"
              :class="{ selected: layer.id === imageStore.selectedLayerId }"
              @click="selectLayer(layer.id)"
            >
              <!-- Main row -->
              <div class="layer-row">
                <span class="layer-num">L{{ reversedLayers.indexOf(layer) + 1 }}</span>
                <div class="layer-preview">
                  <img
                    :src="layer.thumbnail || layer.url"
                    :alt="layer.name"
                    style="width: 48px; height: 48px; object-fit: cover; display: block; flex-shrink: 0;"
                  />
                </div>
                <div class="layer-info">
                  <span class="layer-name">{{ layer.name.replace(/\.[^.]+$/, '').substring(0, 16) }}</span>
                  <span class="layer-size">{{ Math.round(layer.width) }}×{{ Math.round(layer.height) }}</span>
                </div>
                <div class="layer-actions">
                  <button
                    class="icon-btn"
                    :title="layer.visible ? $t('layerPanel.layers.hide') : $t('layerPanel.layers.show')"
                    @click.stop="toggleVisibility(layer)"
                  >
                    <i class="fas" :class="layer.visible ? 'fa-eye' : 'fa-eye-slash'"></i>
                  </button>
                  <button
                    class="icon-btn"
                    :title="$t('layerPanel.layers.delete')"
                    @click.stop="deleteLayer(layer.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <!-- Inline order buttons for selected layer -->
              <div
                v-if="layer.id === imageStore.selectedLayerId"
                class="layer-order-inline"
              >
                <button
                  class="btn btn-sm"
                  :title="$t('layerPanel.layers.moveUp')"
                  @click.stop="moveLayer('up')"
                >
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button
                  class="btn btn-sm"
                  :title="$t('layerPanel.layers.moveDown')"
                  @click.stop="moveLayer('down')"
                >
                  <i class="fas fa-arrow-down"></i>
                </button>
                <button
                  class="btn btn-sm"
                  :title="$t('layerPanel.layers.duplicate')"
                  @click.stop="duplicateLayer"
                >
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Canvas Hintergrund -->
      <div class="panel-section">
        <div class="section-header" @click="toggleSection('canvas')">
          <i class="section-icon fas fa-fill-drip"></i>
          {{ $t('layerPanel.background.title') }}
          <i
            class="fas toggle-icon"
            :class="openSections.canvas ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </div>
        <div v-show="openSections.canvas" class="section-content">
          <div class="control-group">
            <label>{{ $t('layerPanel.background.color') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="imageStore.canvasBackgroundColor"
                class="color-input"
                @input="updateBackgroundColor($event.target.value)"
              />
              <input
                type="text"
                :value="imageStore.canvasBackgroundColor"
                class="color-text-input"
                maxlength="7"
                @input="updateBackgroundColor($event.target.value)"
              />
              <button
                class="icon-btn"
                :class="{ active: imageStore.canvasBackgroundColor === 'transparent' }"
                :title="$t('layerPanel.background.transparent')"
                @click="updateBackgroundColor('transparent')"
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
              :class="{
                active: imageStore.canvasBackgroundColor === color.value,
                transparent: color.value === 'transparent',
              }"
              :style="color.value !== 'transparent' ? { backgroundColor: color.value } : {}"
              :title="color.label"
              @click="updateBackgroundColor(color.value)"
            >
              <i v-if="color.value === 'transparent'" class="fas fa-chess-board"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Ausgewählter Layer: Transform -->
      <div v-if="selectedLayer" class="panel-section">
        <div class="section-header" @click="toggleSection('transform')">
          <i class="section-icon fas fa-arrows-alt"></i>
          {{ $t('layerPanel.transform.title') }}
          <i
            class="fas toggle-icon"
            :class="openSections.transform ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </div>
        <div v-show="openSections.transform" class="section-content">
          <!-- Position -->
          <div class="control-group">
            <label>{{ $t('layerPanel.transform.position') }}</label>
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
            <label>{{ $t('layerPanel.transform.size') }}</label>
            <div class="input-row">
              <div class="input-field">
                <span>W</span>
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
                :title="$t('layerPanel.transform.maintainAspect')"
                @click="maintainAspectRatio = !maintainAspectRatio"
              >
                <i class="fas fa-link"></i>
              </button>
            </div>
          </div>

          <!-- Rotation -->
          <div class="control-group">
            <label>{{ $t('layerPanel.transform.rotation') }}: {{ selectedLayer.rotation }}°</label>
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

          <!-- Spiegelung -->
          <div class="control-group">
            <label>{{ $t('layerPanel.transform.flip') }}</label>
            <div class="flip-buttons">
              <button
                class="btn btn-sm"
                :class="{ active: selectedLayer.flipX }"
                :title="$t('layerPanel.transform.flipHorizontal')"
                @click="toggleFlip('flipX')"
              >
                <i class="fas fa-arrows-alt-h"></i>
                {{ $t('layerPanel.transform.horizontal') }}
              </button>
              <button
                class="btn btn-sm"
                :class="{ active: selectedLayer.flipY }"
                :title="$t('layerPanel.transform.flipVertical')"
                @click="toggleFlip('flipY')"
              >
                <i class="fas fa-arrows-alt-v"></i>
                {{ $t('layerPanel.transform.vertical') }}
              </button>
            </div>
          </div>

          <!-- Deckkraft -->
          <div class="control-group">
            <label>{{ $t('layerPanel.transform.opacity') }}: {{ selectedLayer.opacity }}%</label>
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
      <div v-if="selectedLayer" class="panel-section">
        <div class="section-header" @click="toggleSection('filters')">
          <i class="section-icon fas fa-sliders-h"></i>
          {{ $t('layerPanel.filters.title') }}
          <i
            class="fas toggle-icon"
            :class="openSections.filters ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </div>
        <div v-show="openSections.filters" class="section-content">
          <div class="control-group">
            <label>{{ $t('layerPanel.filters.brightness') }}: {{ selectedLayer.filters.brightness }}%</label>
            <input
              type="range"
              min="0"
              max="200"
              :value="selectedLayer.filters.brightness"
              @input="updateFilter('brightness', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.filters.contrast') }}: {{ selectedLayer.filters.contrast }}%</label>
            <input
              type="range"
              min="0"
              max="200"
              :value="selectedLayer.filters.contrast"
              @input="updateFilter('contrast', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.filters.saturation') }}: {{ selectedLayer.filters.saturation }}%</label>
            <input
              type="range"
              min="0"
              max="200"
              :value="selectedLayer.filters.saturation"
              @input="updateFilter('saturation', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.filters.grayscale') }}: {{ selectedLayer.filters.grayscale }}%</label>
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
            {{ $t('layerPanel.filters.reset') }}
          </button>
        </div>
      </div>

      <!-- Border Section -->
      <div v-if="selectedLayer" class="panel-section">
        <div class="section-header" @click="toggleSection('border')">
          <i class="section-icon fas fa-border-style"></i>
          {{ $t('layerPanel.border.title') }}
          <i
            class="fas toggle-icon"
            :class="openSections.border ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </div>
        <div v-show="openSections.border" class="section-content">
          <div class="control-group">
            <label>{{ $t('layerPanel.border.width') }}: {{ layerBorder.width }}px</label>
            <input
              type="range"
              min="0"
              max="50"
              :value="layerBorder.width"
              @input="updateBorder('width', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.border.color') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="layerBorder.color"
                class="color-input"
                @input="updateBorder('color', $event.target.value)"
              />
              <input
                type="text"
                :value="layerBorder.color"
                class="color-text-input"
                maxlength="7"
                @input="updateBorder('color', $event.target.value)"
              />
            </div>
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.border.radius') }}: {{ layerBorder.radius }}%</label>
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

      <!-- Shadow Section -->
      <div v-if="selectedLayer" class="panel-section">
        <div class="section-header" @click="toggleSection('shadow')">
          <i class="section-icon fas fa-clone"></i>
          {{ $t('layerPanel.shadow.title') }}
          <i
            class="fas toggle-icon"
            :class="openSections.shadow ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </div>
        <div v-show="openSections.shadow" class="section-content">
          <div class="control-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                :checked="layerShadow.enabled"
                @change="updateShadow('enabled', $event.target.checked)"
              />
              {{ $t('layerPanel.shadow.enable') }}
            </label>
          </div>
          <template v-if="layerShadow.enabled">
            <div class="control-group">
              <label>{{ $t('layerPanel.shadow.offsetX') }}: {{ layerShadow.offsetX }}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                :value="layerShadow.offsetX"
                @input="updateShadow('offsetX', parseInt($event.target.value))"
              />
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.shadow.offsetY') }}: {{ layerShadow.offsetY }}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                :value="layerShadow.offsetY"
                @input="updateShadow('offsetY', parseInt($event.target.value))"
              />
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.shadow.blur') }}: {{ layerShadow.blur }}px</label>
              <input
                type="range"
                min="0"
                max="50"
                :value="layerShadow.blur"
                @input="updateShadow('blur', parseInt($event.target.value))"
              />
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.shadow.color') }}</label>
              <div class="color-picker-row">
                <input
                  type="color"
                  :value="layerShadow.color"
                  class="color-input"
                  @input="updateShadow('color', $event.target.value)"
                />
                <input
                  type="text"
                  :value="layerShadow.color"
                  class="color-text-input"
                  maxlength="7"
                  @input="updateShadow('color', $event.target.value)"
                />
              </div>
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.shadow.opacity') }}: {{ layerShadow.opacity }}%</label>
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
      <div v-if="!selectedLayer" class="panel-section">
        <p class="hint-text">
          <i class="fas fa-mouse-pointer"></i>
          {{ $t('layerPanel.hints.selectLayer') }}
        </p>
      </div>
    </div>

    <!-- TEXT TAB -->
    <div v-show="activeTab === 'text'" class="tab-content">
      <!-- Add Text Button -->
      <div class="panel-section">
        <div class="section-content">
          <button class="btn btn-primary btn-full" @click="addText">
            <i class="fas fa-plus"></i>
            {{ $t('layerPanel.text.addButton') }}
          </button>
        </div>
      </div>

      <!-- Text Liste -->
      <div v-if="imageStore.texts && imageStore.texts.length > 0" class="panel-section">
        <div class="section-header section-header--static">
          <i class="section-icon fas fa-list"></i>
          {{ $t('layerPanel.text.listTitle') }} ({{ imageStore.texts.length }})
        </div>
        <div class="section-content">
          <div class="text-list">
            <div
              v-for="text in imageStore.texts"
              :key="text.id"
              class="text-item"
              :class="{ selected: text.id === selectedTextId }"
              @click="selectText(text.id)"
            >
              <div
                class="text-color-swatch"
                :style="{ backgroundColor: text.color || '#000000' }"
              ></div>
              <div class="text-info">
                <span class="text-content">{{ text.content || text.txt || 'Text' }}</span>
                <span class="text-meta">{{ text.fontSize || 32 }}px</span>
              </div>
              <button
                class="icon-btn"
                :title="$t('layerPanel.layers.delete')"
                @click.stop="deleteText(text.id)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ausgewählter Text Eigenschaften -->
      <div v-if="selectedText" class="panel-section">
        <div class="section-header section-header--static">
          <i class="section-icon fas fa-edit"></i>
          {{ $t('layerPanel.text.editTitle') }}
        </div>
        <div class="section-content">
          <div class="control-group">
            <label>{{ $t('layerPanel.text.content') }}</label>
            <input
              type="text"
              :value="selectedText.content || selectedText.txt"
              class="text-input"
              @input="updateTextProperty('content', $event.target.value)"
            />
          </div>

          <div class="control-group">
            <label>{{ $t('layerPanel.text.fontSize') }}: {{ selectedText.fontSize || 32 }}px</label>
            <input
              type="range"
              min="8"
              max="200"
              :value="selectedText.fontSize || 32"
              @input="updateTextProperty('fontSize', parseInt($event.target.value))"
            />
          </div>

          <div class="control-group">
            <label>{{ $t('layerPanel.text.fontFamily') }}</label>
            <select
              :value="selectedText.fontFamily || 'Arial'"
              class="form-select font-select"
              @change="updateTextProperty('fontFamily', $event.target.value)"
            >
              <optgroup :label="$t('layerPanel.text.customFonts')">
                <option
                  v-for="font in availableFonts"
                  :key="font"
                  :value="font"
                  :style="{ fontFamily: font }"
                >
                  {{ font }}
                </option>
              </optgroup>
              <optgroup :label="$t('layerPanel.text.systemFonts')">
                <option
                  v-for="font in systemFonts"
                  :key="font"
                  :value="font"
                  :style="{ fontFamily: font }"
                >
                  {{ font }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="control-group">
            <label>{{ $t('layerPanel.text.color') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedText.color || '#000000'"
                class="color-input"
                @input="updateTextProperty('color', $event.target.value)"
              />
              <input
                type="text"
                :value="selectedText.color || '#000000'"
                class="color-text-input"
                maxlength="7"
                @input="updateTextProperty('color', $event.target.value)"
              />
            </div>
          </div>

          <div class="control-group">
            <label>{{ $t('layerPanel.text.opacity') }}: {{ selectedText.opacity || 100 }}%</label>
            <input
              type="range"
              min="0"
              max="100"
              :value="selectedText.opacity || 100"
              @input="updateTextProperty('opacity', parseInt($event.target.value))"
            />
          </div>

          <div class="control-group">
            <label>{{ $t('layerPanel.text.rotation') }}: {{ selectedText.rotation || 0 }}°</label>
            <input
              type="range"
              min="-180"
              max="180"
              :value="selectedText.rotation || 0"
              @input="updateTextProperty('rotation', parseInt($event.target.value))"
            />
          </div>

          <!-- Text Kontur -->
          <h4 class="subsection-title">{{ $t('layerPanel.text.stroke') }}</h4>
          <div class="control-group">
            <label>{{ $t('layerPanel.text.strokeWidth') }}: {{ selectedText.strokeWidth || 0 }}px</label>
            <input
              type="range"
              min="0"
              max="20"
              :value="selectedText.strokeWidth || 0"
              @input="updateTextProperty('strokeWidth', parseInt($event.target.value))"
            />
          </div>

          <div v-if="(selectedText.strokeWidth || 0) > 0" class="control-group">
            <label>{{ $t('layerPanel.text.strokeColor') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedText.strokeColor || '#ffffff'"
                class="color-input"
                @input="updateTextProperty('strokeColor', $event.target.value)"
              />
              <input
                type="text"
                :value="selectedText.strokeColor || '#ffffff'"
                class="color-text-input"
                maxlength="7"
                @input="updateTextProperty('strokeColor', $event.target.value)"
              />
            </div>
          </div>

          <!-- Text Schatten -->
          <h4 class="subsection-title">{{ $t('layerPanel.text.textShadow') }}</h4>
          <div class="control-group">
            <label>{{ $t('layerPanel.text.shadowBlur') }}: {{ selectedText.shadowBlur || 0 }}px</label>
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
              <label>{{ $t('layerPanel.text.shadowX') }}: {{ selectedText.shadowOffsetX || 2 }}px</label>
              <input
                type="range"
                min="-20"
                max="20"
                :value="selectedText.shadowOffsetX || 2"
                @input="updateTextProperty('shadowOffsetX', parseInt($event.target.value))"
              />
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.text.shadowY') }}: {{ selectedText.shadowOffsetY || 2 }}px</label>
              <input
                type="range"
                min="-20"
                max="20"
                :value="selectedText.shadowOffsetY || 2"
                @input="updateTextProperty('shadowOffsetY', parseInt($event.target.value))"
              />
            </div>
            <div class="control-group">
              <label>{{ $t('layerPanel.text.shadowColor') }}</label>
              <div class="color-picker-row">
                <input
                  type="color"
                  :value="selectedText.shadowColor || '#000000'"
                  class="color-input"
                  @input="updateTextProperty('shadowColor', $event.target.value)"
                />
                <input
                  type="text"
                  :value="selectedText.shadowColor || '#000000'"
                  class="color-text-input"
                  maxlength="7"
                  @input="updateTextProperty('shadowColor', $event.target.value)"
                />
              </div>
            </div>
          </template>

          <button class="btn btn-danger btn-full" @click="deleteText(selectedText.id)">
            <i class="fas fa-trash"></i>
            {{ $t('layerPanel.text.delete') }}
          </button>
        </div>
      </div>

      <!-- Keine Texte -->
      <div v-if="!imageStore.texts || imageStore.texts.length === 0" class="panel-section">
        <p class="hint-text">
          <i class="fas fa-font"></i>
          {{ $t('layerPanel.hints.addText') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageStore } from '@/stores/imageStore';
import { availableFonts } from '@/assets/fonts/fontList.js';

const { t } = useI18n();

const props = defineProps({
  canvasSelectedTextId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['render', 'add-text', 'select-text', 'preview']);

const imageStore = useImageStore();
const maintainAspectRatio = ref(true);
const activeTab = ref('layers');
const selectedTextId = ref(null);

// Debounce Timer für History-Speicherung
let saveStateTimer = null;

// Debounced saveState - speichert erst nach 500ms Inaktivität
function debouncedSaveState(description, type = 'layer') {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer);
  }
  saveStateTimer = setTimeout(() => {
    imageStore.saveState(description, type);
    saveStateTimer = null;
  }, 500);
}

// Sofortige State-Speicherung ohne Debounce
function saveStateNow(description, type = 'layer') {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer);
    saveStateTimer = null;
  }
  imageStore.saveState(description, type);
}

// Wenn Text auf Canvas ausgewählt wird, zu Text-Tab wechseln und Text auswählen
watch(
  () => props.canvasSelectedTextId,
  (newTextId) => {
    if (newTextId) {
      selectedTextId.value = newTextId;
      activeTab.value = 'text';
      // Layer-Auswahl aufheben
      imageStore.selectImageLayer(null);
    } else {
      // Text wurde abgewählt - wenn ein Layer ausgewählt ist, zu Layers-Tab wechseln
      if (imageStore.selectedLayerId) {
        activeTab.value = 'layers';
        selectedTextId.value = null;
      }
    }
  }
);

// Wenn ein Layer ausgewählt wird, zu Layers-Tab wechseln
watch(
  () => imageStore.selectedLayerId,
  (newLayerId) => {
    if (newLayerId) {
      activeTab.value = 'layers';
      selectedTextId.value = null;
    }
  }
);

const openSections = reactive({
  canvas: true,
  transform: true,
  filters: false,
  border: false,
  shadow: false,
});

// Schnellfarben für Hintergrund
const quickColors = computed(() => [
  { value: 'transparent', label: t('layerPanel.background.transparent') },
  { value: '#ffffff', label: t('layerPanel.background.white') },
  { value: '#000000', label: t('layerPanel.background.black') },
  { value: '#f0f0f0', label: t('layerPanel.background.lightGray') },
  { value: '#808080', label: t('layerPanel.background.gray') },
  { value: '#ff0000', label: t('layerPanel.background.red') },
  { value: '#00ff00', label: t('layerPanel.background.green') },
  { value: '#0000ff', label: t('layerPanel.background.blue') },
]);

// System-Fonts als Fallback
const systemFonts = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Tahoma',
  'Trebuchet MS',
];

const selectedLayer = computed(() => imageStore.selectedImageLayer);

const reversedLayers = computed(() => {
  return [...imageStore.imageLayers].reverse();
});

const selectedText = computed(() => {
  if (!selectedTextId.value || !imageStore.texts) return null;
  return imageStore.texts.find((t) => t.id === selectedTextId.value);
});

// History Info Computed
const historyInfo = computed(() => {
  const current = imageStore.historyIndex + 1;
  const total = imageStore.history.length;
  if (total === 0) return '';
  return `${current}/${total}`;
});

// Default Werte für Layer Border
const layerBorder = computed(() => ({
  width: selectedLayer.value?.border?.width || 0,
  color: selectedLayer.value?.border?.color || '#000000',
  radius: selectedLayer.value?.border?.radius || 0,
}));

// Default Werte für Layer Shadow
const layerShadow = computed(() => ({
  enabled: selectedLayer.value?.shadow?.enabled || false,
  offsetX: selectedLayer.value?.shadow?.offsetX || 5,
  offsetY: selectedLayer.value?.shadow?.offsetY || 5,
  blur: selectedLayer.value?.shadow?.blur || 10,
  color: selectedLayer.value?.shadow?.color || '#000000',
  opacity: selectedLayer.value?.shadow?.opacity || 50,
}));

function toggleSection(section) {
  openSections[section] = !openSections[section];
}

function updateBackgroundColor(color) {
  imageStore.canvasBackgroundColor = color;
  emit('render');
  debouncedSaveState('Hintergrundfarbe geändert', 'layer');
}

function selectLayer(layerId) {
  imageStore.selectImageLayer(layerId);
  emit('render');
}

function toggleVisibility(layer) {
  imageStore.updateImageLayer(layer.id, { visible: !layer.visible });
  emit('render');
  saveStateNow(layer.visible ? 'Layer ausgeblendet' : 'Layer eingeblendet', 'layer');
}

function deleteLayer(layerId) {
  if (confirm(t('layerPanel.layers.confirmDelete'))) {
    imageStore.deleteImageLayer(layerId);
    emit('render');
  }
}

function moveLayer(direction) {
  if (selectedLayer.value) {
    imageStore.moveImageLayerOrder(selectedLayer.value.id, direction);
    emit('render');
  }
}

function duplicateLayer() {
  if (selectedLayer.value) {
    imageStore.duplicateImageLayer(selectedLayer.value.id);
    emit('render');
  }
}

function updateLayerProperty(property, value) {
  if (selectedLayer.value) {
    imageStore.updateImageLayer(selectedLayer.value.id, { [property]: value });
    emit('render');
    debouncedSaveState(`Layer ${property} geändert`, 'layer');
  }
}

function updateSize(property, value) {
  if (!selectedLayer.value) return;

  const layer = selectedLayer.value;
  const aspectRatio = layer.originalWidth / layer.originalHeight;

  if (maintainAspectRatio.value) {
    if (property === 'width') {
      imageStore.updateImageLayer(layer.id, {
        width: value,
        height: value / aspectRatio,
      });
    } else {
      imageStore.updateImageLayer(layer.id, {
        width: value * aspectRatio,
        height: value,
      });
    }
  } else {
    imageStore.updateImageLayer(layer.id, { [property]: value });
  }
  emit('render');
  debouncedSaveState('Layer-Größe geändert', 'layer');
}

function rotateBy(degrees) {
  if (selectedLayer.value) {
    const newRotation = (selectedLayer.value.rotation + degrees) % 360;
    updateLayerProperty('rotation', newRotation);
  }
}

function toggleFlip(direction) {
  if (selectedLayer.value) {
    const currentValue = selectedLayer.value[direction] || false;
    imageStore.updateImageLayer(selectedLayer.value.id, { [direction]: !currentValue });
    emit('render');
    saveStateNow(direction === 'flipX' ? 'Horizontal gespiegelt' : 'Vertikal gespiegelt', 'layer');
  }
}

function updateFilter(filterName, value) {
  if (selectedLayer.value) {
    const newFilters = { ...selectedLayer.value.filters, [filterName]: value };
    imageStore.updateImageLayer(selectedLayer.value.id, { filters: newFilters });
    emit('render');
    debouncedSaveState(`Layer-Filter ${filterName} geändert`, 'layer');
  }
}

function updateBorder(property, value) {
  if (selectedLayer.value) {
    const currentBorder = selectedLayer.value.border || { width: 0, color: '#000000', radius: 0 };
    const newBorder = { ...currentBorder, [property]: value };
    imageStore.updateImageLayer(selectedLayer.value.id, { border: newBorder });
    emit('render');
    debouncedSaveState('Layer-Umrandung geändert', 'layer');
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
      opacity: 50,
    };
    const newShadow = { ...currentShadow, [property]: value };
    imageStore.updateImageLayer(selectedLayer.value.id, { shadow: newShadow });
    emit('render');
    debouncedSaveState('Layer-Schatten geändert', 'layer');
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
        hue: 0,
      },
      rotation: 0,
      opacity: 100,
      border: { width: 0, color: '#000000', radius: 0 },
      shadow: { enabled: false, offsetX: 5, offsetY: 5, blur: 10, color: '#000000', opacity: 50 },
    });
    emit('render');
    saveStateNow('Layer-Filter zurückgesetzt', 'layer');
  }
}

// Text Funktionen
function addText() {
  const newText = {
    id: `text_${Date.now()}`,
    content: t('layerPanel.text.newText'),
    x: 100,
    y: 100,
    fontSize: 48,
    fontFamily: availableFonts[0] || 'Arial', // Erste verfügbare Schriftart
    color: '#000000',
    opacity: 100,
    rotation: 0,
    strokeWidth: 0,
    strokeColor: '#ffffff',
    shadowBlur: 0,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowColor: '#000000',
  };

  if (!imageStore.texts) {
    imageStore.texts = [];
  }
  imageStore.texts.push(newText);
  selectedTextId.value = newText.id;
  emit('render');
}

function selectText(textId) {
  selectedTextId.value = textId;
  // Layer-Auswahl aufheben
  imageStore.selectImageLayer(null);
  emit('select-text', textId);
  emit('render');
}

function deleteText(textId) {
  if (confirm(t('layerPanel.text.confirmDelete'))) {
    const index = imageStore.texts.findIndex((txt) => txt.id === textId);
    if (index !== -1) {
      imageStore.texts.splice(index, 1);
      if (selectedTextId.value === textId) {
        selectedTextId.value = null;
      }
      emit('render');
    }
  }
}

function updateTextProperty(property, value) {
  if (selectedText.value) {
    const index = imageStore.texts.findIndex((t) => t.id === selectedText.value.id);
    if (index !== -1) {
      imageStore.texts[index][property] = value;
      // Für ältere Text-Struktur auch 'txt' aktualisieren
      if (property === 'content') {
        imageStore.texts[index].txt = value;
      }
      emit('render');
    }
  }
}

// Undo/Redo Funktionen
function handleUndo() {
  if (imageStore.canUndo) {
    imageStore.undo();
    emit('render');
  }
}

function handleRedo() {
  if (imageStore.canRedo) {
    imageStore.redo();
    emit('render');
  }
}

// Preview Funktion
function handlePreview() {
  emit('render');
  emit('preview');
}

// Keyboard Shortcuts für Undo/Redo
function handleKeyDown(event) {
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
    event.preventDefault();
    handleUndo();
  } else if (
    (event.ctrlKey || event.metaKey) &&
    ((event.shiftKey && event.key === 'z') || event.key === 'y')
  ) {
    event.preventDefault();
    handleRedo();
  }
}

// Event Listener für Keyboard Shortcuts
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style lang="scss" scoped>
.layer-control-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);

  /* Sticky Sidebar */
  position: sticky;
  top: 0;
  height: calc(100vh - var(--external-nav-height, 50px) - var(--header-height, 60px) - 60px);
  align-self: stretch;
}

/* Unified top bar: tabs left, history right */
.panel-topbar {
  display: flex;
  align-items: stretch;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 0 0.25rem;

  .tab-group {
    display: flex;
    flex: 1;
  }

  .history-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.5rem;
    border-left: 1px solid var(--color-border);
  }
}

.tab-btn {
  flex: 1;
  padding: 0.7rem 0.875rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;

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

.history-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover:not(.disabled) {
    background: var(--color-primary);
    color: white;
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.preview-btn {
    background: var(--color-primary);
    color: #f5f4d6;

    &:hover {
      background: var(--color-primary-dark, #003971);
    }
  }
}

.history-info {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  min-width: 28px;
  text-align: center;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

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

/* Sidebar-card treatment for each section */
.panel-section {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* Collapsible section header */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  user-select: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);

  .section-icon {
    color: var(--color-primary);
    font-size: 0.8rem;
  }

  .toggle-icon {
    margin-left: auto;
    font-size: 0.6rem;
    opacity: 0.45;
  }

  &:hover {
    background: var(--color-bg-secondary);
  }
}

/* Non-collapsible section header */
.section-header--static {
  cursor: default;

  &:hover {
    background: transparent;
  }
}

.section-content {
  padding: 0.75rem 0.875rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

/* Layer list */
.layer-list,
.text-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0.25rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;

    &:hover {
      background: var(--color-primary);
    }
  }
}

.layer-item,
.text-item {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    border-color: var(--color-border);
  }

  &.selected {
    border-color: var(--color-primary);
    background: rgba(1, 79, 153, 0.07);
  }
}

/* Main content row inside a layer-item */
.layer-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  min-height: 56px;
}

.text-item {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
}

.layer-num {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border-radius: 3px;
  padding: 1px 4px;
  min-width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.layer-preview {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

/* Colored square for text items */
.text-color-swatch {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.layer-info,
.text-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;

  .layer-name,
  .text-content {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    margin-bottom: 1px;
  }

  .layer-size,
  .text-meta {
    display: block;
    font-size: 0.7rem;
    color: var(--color-text-secondary);
  }
}

.layer-actions {
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

/* Inline order controls shown inside selected layer-item */
.layer-order-inline {
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  margin: 0;
  border-top: 1px solid var(--color-border);
  width: 100%;
  justify-content: center;
  background: rgba(1, 79, 153, 0.04);
}

.icon-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--color-bg);
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

  input[type='range'] {
    width: 100%;
    height: 5px;
    border-radius: 3px;
    background: var(--color-bg-secondary);
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

  input[type='number'],
  input[type='text'],
  .text-input {
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

    &.font-select {
      max-height: 300px;

      optgroup {
        font-weight: 600;
        font-style: normal;
        color: var(--color-text-secondary);
        padding: 0.25rem 0;
      }

      option {
        padding: 0.35rem 0.5rem;
        font-weight: normal;
      }
    }
  }
}

.toggle-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type='checkbox'] {
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
    box-shadow: 0 0 0 2px var(--color-primary-light, rgba(1, 79, 153, 0.3));
  }

  &.transparent {
    background:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position:
      0 0,
      0 4px,
      4px -4px,
      -4px 0;

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

.flip-buttons {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.4rem;

  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;

    &.active {
      background: var(--color-primary);
      color: white;
    }
  }
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
    color: #f5f4d6;

    &:hover {
      background: var(--color-primary-dark, #003971);
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

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .layer-control-panel {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: auto;
    position: static;
    max-height: 40vh;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .tab-btn {
    min-height: 44px;
    font-size: 0.85rem;
  }

  .history-btn {
    width: 36px;
    height: 36px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
  }

  .layer-list,
  .text-list {
    max-height: 220px;
  }
}
</style>
