<template>
  <!-- Shadow Section -->
  <div v-if="selectedLayer" class="panel-section">
    <div class="section-header" @click="toggleSection('shadow')">
      <AppIcon class="section-icon" name="clone" />
      {{ $t('layerPanel.shadow.title') }}
      <AppIcon class="toggle-icon" :name="openSections.shadow ? 'chevron-up' : 'chevron-down'" />
    </div>
    <div v-show="openSections.shadow" class="section-content">
      <div class="control-group">
        <UiSwitch
          :model-value="layerShadow.enabled"
          :label="$t('layerPanel.shadow.enable')"
          @update:model-value="updateShadow('enabled', $event)"
        />
      </div>
      <template v-if="layerShadow.enabled">
        <FilterSlider
          :model-value="layerShadow.offsetX"
          :label="$t('layerPanel.shadow.offsetX')"
          :min="-50"
          :max="50"
          :default-value="5"
          unit="px"
          center-zero
          @update:model-value="updateShadow('offsetX', $event)"
        />
        <FilterSlider
          :model-value="layerShadow.offsetY"
          :label="$t('layerPanel.shadow.offsetY')"
          :min="-50"
          :max="50"
          :default-value="5"
          unit="px"
          center-zero
          @update:model-value="updateShadow('offsetY', $event)"
        />
        <FilterSlider
          :model-value="layerShadow.blur"
          :label="$t('layerPanel.shadow.blur')"
          :min="0"
          :max="50"
          :default-value="10"
          unit="px"
          @update:model-value="updateShadow('blur', $event)"
        />
        <div class="control-group">
          <label>{{ $t('layerPanel.shadow.color') }}</label>
          <div class="color-picker-row">
            <ColorField
              :model-value="layerShadow.color"
              :label="$t('layerPanel.shadow.color')"
              class="color-input"
              @update:model-value="updateShadow('color', $event)"
            />
            <input
              type="text"
              :value="layerShadow.color"
              class="color-text-input"
              maxlength="7"
              @input="updateShadow('color', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <FilterSlider
          :model-value="layerShadow.opacity"
          :label="$t('layerPanel.shadow.opacity')"
          :min="0"
          :max="100"
          :default-value="50"
          unit="%"
          @update:model-value="updateShadow('opacity', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSlider from '@/components/editor/sidebar/FilterSlider.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Ausgewählte Ebene: Schatten
const { openSections, selectedLayer, layerShadow, toggleSection, updateShadow } =
  useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
