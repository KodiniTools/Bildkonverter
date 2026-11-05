<template>
  <!-- LAYERS TAB -->
  <div v-show="activeTab === 'layers'" class="tab-content">
    <LayerListSection />
    <LayerBackgroundSection />
    <LayerTransformSection />
    <LayerFiltersSection />
    <LayerBorderSection />
    <LayerShadowSection />

    <!-- Keine Auswahl -->
    <div v-if="!selectedLayer" class="panel-section">
      <p class="hint-text">
        <AppIcon name="mouse-pointer" :size="40" />
        {{ $t('layerPanel.hints.selectLayer') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import LayerListSection from './LayerListSection.vue';
import LayerBackgroundSection from './LayerBackgroundSection.vue';
import LayerTransformSection from './LayerTransformSection.vue';
import LayerFiltersSection from './LayerFiltersSection.vue';
import LayerBorderSection from './LayerBorderSection.vue';
import LayerShadowSection from './LayerShadowSection.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

const { activeTab, selectedLayer } = useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
