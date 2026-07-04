<template>
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
                  style="
                    width: 48px;
                    height: 48px;
                    object-fit: cover;
                    display: block;
                    flex-shrink: 0;
                  "
                />
              </div>
              <div class="layer-info">
                <span class="layer-name">{{
                  layer.name.replace(/\.[^.]+$/, '').substring(0, 16)
                }}</span>
                <span class="layer-size"
                  >{{ Math.round(layer.width) }}×{{ Math.round(layer.height) }}</span
                >
              </div>
              <div class="layer-actions">
                <button
                  class="icon-btn"
                  :title="
                    layer.visible ? $t('layerPanel.layers.hide') : $t('layerPanel.layers.show')
                  "
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
            <div v-if="layer.id === imageStore.selectedLayerId" class="layer-order-inline">
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
          <label
            >{{ $t('layerPanel.filters.brightness') }}:
            {{ selectedLayer.filters.brightness }}%</label
          >
          <input
            type="range"
            min="0"
            max="200"
            :value="selectedLayer.filters.brightness"
            @input="updateFilter('brightness', parseInt($event.target.value))"
          />
        </div>
        <div class="control-group">
          <label
            >{{ $t('layerPanel.filters.contrast') }}: {{ selectedLayer.filters.contrast }}%</label
          >
          <input
            type="range"
            min="0"
            max="200"
            :value="selectedLayer.filters.contrast"
            @input="updateFilter('contrast', parseInt($event.target.value))"
          />
        </div>
        <div class="control-group">
          <label
            >{{ $t('layerPanel.filters.saturation') }}:
            {{ selectedLayer.filters.saturation }}%</label
          >
          <input
            type="range"
            min="0"
            max="200"
            :value="selectedLayer.filters.saturation"
            @input="updateFilter('saturation', parseInt($event.target.value))"
          />
        </div>
        <div class="control-group">
          <label
            >{{ $t('layerPanel.filters.grayscale') }}: {{ selectedLayer.filters.grayscale }}%</label
          >
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
</template>

<script setup>
import { inject } from 'vue';
import { LAYER_PANEL_KEY } from '@/composables/useLayerPanel';

const {
  imageStore,
  activeTab,
  maintainAspectRatio,
  openSections,
  quickColors,
  selectedLayer,
  reversedLayers,
  layerBorder,
  layerShadow,
  toggleSection,
  updateBackgroundColor,
  selectLayer,
  toggleVisibility,
  deleteLayer,
  moveLayer,
  duplicateLayer,
  updateLayerProperty,
  updateSize,
  rotateBy,
  toggleFlip,
  updateFilter,
  updateBorder,
  updateShadow,
  resetLayerFilters,
} = inject(LAYER_PANEL_KEY);
</script>

<style lang="scss" scoped>
@import './shared';
</style>
