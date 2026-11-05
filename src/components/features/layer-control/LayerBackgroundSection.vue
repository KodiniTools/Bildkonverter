<template>
  <!-- Canvas Hintergrund -->
  <div class="panel-section">
    <div class="section-header" @click="toggleSection('canvas')">
      <AppIcon class="section-icon" name="fill-drip" />
      {{ $t('layerPanel.background.title') }}
      <AppIcon class="toggle-icon" :name="openSections.canvas ? 'chevron-up' : 'chevron-down'" />
    </div>
    <div v-show="openSections.canvas" class="section-content">
      <div class="control-group">
        <label>{{ $t('layerPanel.background.color') }}</label>
        <div class="color-picker-row">
          <ColorField
            :model-value="imageStore.canvasBackgroundColor"
            :label="$t('layerPanel.background.color')"
            class="color-input"
            @update:model-value="updateBackgroundColor($event)"
          />
          <input
            type="text"
            :value="imageStore.canvasBackgroundColor"
            class="color-text-input"
            maxlength="7"
            @input="updateBackgroundColor(($event.target as HTMLInputElement).value)"
          />
          <button
            class="icon-btn"
            :class="{ active: imageStore.canvasBackgroundColor === 'transparent' }"
            :title="$t('layerPanel.background.transparent')"
            :aria-label="$t('layerPanel.background.transparent')"
            @click="updateBackgroundColor('transparent')"
          >
            <AppIcon name="chess-board" />
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
          :aria-label="color.label"
          @click="updateBackgroundColor(color.value)"
        >
          <AppIcon v-if="color.value === 'transparent'" name="chess-board" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Canvas-Hintergrund: Farbe, transparent, Schnellfarben
const { imageStore, openSections, quickColors, toggleSection, updateBackgroundColor } =
  useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
