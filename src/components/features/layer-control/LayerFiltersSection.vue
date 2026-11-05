<template>
  <!-- Filter Section -->
  <div v-if="selectedLayer" class="panel-section">
    <div class="section-header" @click="toggleSection('filters')">
      <AppIcon class="section-icon" name="sliders-h" />
      {{ $t('layerPanel.filters.title') }}
      <AppIcon class="toggle-icon" :name="openSections.filters ? 'chevron-up' : 'chevron-down'" />
    </div>
    <div v-show="openSections.filters" class="section-content">
      <FilterSlider
        :model-value="selectedLayer.filters.brightness"
        :label="$t('layerPanel.filters.brightness')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        @update:model-value="updateFilter('brightness', $event)"
      />
      <FilterSlider
        :model-value="selectedLayer.filters.contrast"
        :label="$t('layerPanel.filters.contrast')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        @update:model-value="updateFilter('contrast', $event)"
      />
      <FilterSlider
        :model-value="selectedLayer.filters.saturation"
        :label="$t('layerPanel.filters.saturation')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        @update:model-value="updateFilter('saturation', $event)"
      />
      <FilterSlider
        :model-value="selectedLayer.filters.grayscale"
        :label="$t('layerPanel.filters.grayscale')"
        :min="0"
        :max="100"
        :default-value="0"
        unit="%"
        @update:model-value="updateFilter('grayscale', $event)"
      />
      <button
        type="button"
        class="btn-history btn-reset btn-history--full"
        @click="resetLayerFilters"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {{ $t('layerPanel.filters.reset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSlider from '@/components/editor/sidebar/FilterSlider.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Ausgewählte Ebene: Filter
const { openSections, selectedLayer, toggleSection, updateFilter, resetLayerFilters } =
  useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
