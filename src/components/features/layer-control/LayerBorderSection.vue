<template>
  <!-- Border Section -->
  <div v-if="selectedLayer" class="panel-section">
    <div class="section-header" @click="toggleSection('border')">
      <AppIcon class="section-icon" name="border-style" />
      {{ $t('layerPanel.border.title') }}
      <AppIcon class="toggle-icon" :name="openSections.border ? 'chevron-up' : 'chevron-down'" />
    </div>
    <div v-show="openSections.border" class="section-content">
      <FilterSlider
        :model-value="layerBorder.width"
        :label="$t('layerPanel.border.width')"
        :min="0"
        :max="50"
        :default-value="0"
        unit="px"
        @update:model-value="updateBorder('width', $event)"
      />
      <div class="control-group">
        <label>{{ $t('layerPanel.border.color') }}</label>
        <div class="color-picker-row">
          <ColorField
            :model-value="layerBorder.color"
            :label="$t('layerPanel.border.color')"
            class="color-input"
            @update:model-value="updateBorder('color', $event)"
          />
          <input
            type="text"
            :value="layerBorder.color"
            class="color-text-input"
            maxlength="7"
            @input="updateBorder('color', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <FilterSlider
        :model-value="layerBorder.radius"
        :label="$t('layerPanel.border.radius')"
        :min="0"
        :max="50"
        :default-value="0"
        unit="%"
        @update:model-value="updateBorder('radius', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSlider from '@/components/editor/sidebar/FilterSlider.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Ausgewählte Ebene: Rahmen
const { openSections, selectedLayer, layerBorder, toggleSection, updateBorder } =
  useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
