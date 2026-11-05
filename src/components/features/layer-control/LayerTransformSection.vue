<template>
  <!-- Ausgewählter Layer: Transform -->
  <div v-if="selectedLayer" class="panel-section">
    <div class="section-header" @click="toggleSection('transform')">
      <AppIcon class="section-icon" name="arrows-alt" />
      {{ $t('layerPanel.transform.title') }}
      <AppIcon class="toggle-icon" :name="openSections.transform ? 'chevron-up' : 'chevron-down'" />
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
              @input="
                updateLayerProperty('x', parseInt(($event.target as HTMLInputElement).value) || 0)
              "
            />
          </div>
          <div class="input-field">
            <span>Y</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.y)"
              @input="
                updateLayerProperty('y', parseInt(($event.target as HTMLInputElement).value) || 0)
              "
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
              @input="
                updateSize('width', parseInt(($event.target as HTMLInputElement).value) || 50)
              "
            />
          </div>
          <div class="input-field">
            <span>H</span>
            <input
              type="number"
              :value="Math.round(selectedLayer.height)"
              @input="
                updateSize('height', parseInt(($event.target as HTMLInputElement).value) || 50)
              "
            />
          </div>
          <button
            class="icon-btn"
            :class="{ active: maintainAspectRatio }"
            :title="$t('layerPanel.transform.maintainAspect')"
            :aria-label="$t('layerPanel.transform.maintainAspect')"
            @click="maintainAspectRatio = !maintainAspectRatio"
          >
            <AppIcon name="link" />
          </button>
        </div>
      </div>

      <!-- Rotation -->
      <div class="control-group">
        <FilterSlider
          :model-value="selectedLayer.rotation"
          :label="$t('layerPanel.transform.rotation')"
          :min="-180"
          :max="180"
          :default-value="0"
          unit="°"
          center-zero
          @update:model-value="updateLayerProperty('rotation', $event)"
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
            <AppIcon name="arrows-alt-h" />
            {{ $t('layerPanel.transform.horizontal') }}
          </button>
          <button
            class="btn btn-sm"
            :class="{ active: selectedLayer.flipY }"
            :title="$t('layerPanel.transform.flipVertical')"
            @click="toggleFlip('flipY')"
          >
            <AppIcon name="arrows-alt-v" />
            {{ $t('layerPanel.transform.vertical') }}
          </button>
        </div>
      </div>

      <!-- Deckkraft -->
      <FilterSlider
        :model-value="selectedLayer.opacity"
        :label="$t('layerPanel.transform.opacity')"
        :min="0"
        :max="100"
        :default-value="100"
        unit="%"
        @update:model-value="updateLayerProperty('opacity', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSlider from '@/components/editor/sidebar/FilterSlider.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Ausgewählte Ebene: Position, Größe, Rotation, Spiegeln, Deckkraft
const {
  maintainAspectRatio,
  openSections,
  selectedLayer,
  toggleSection,
  updateLayerProperty,
  updateSize,
  rotateBy,
  toggleFlip,
} = useLayerPanelContext();
</script>

<style lang="scss" scoped>
@import './shared';
</style>
