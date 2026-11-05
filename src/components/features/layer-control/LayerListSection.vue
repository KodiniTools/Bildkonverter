<template>
  <!-- Layer Liste -->
  <div class="panel-section">
    <div class="section-header section-header--static">
      <AppIcon class="section-icon" name="layer-group" />
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
                style="width: 48px; height: 48px; object-fit: cover; display: block; flex-shrink: 0"
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
                :title="layer.visible ? $t('layerPanel.layers.hide') : $t('layerPanel.layers.show')"
                :aria-label="
                  layer.visible ? $t('layerPanel.layers.hide') : $t('layerPanel.layers.show')
                "
                @click.stop="toggleVisibility(layer)"
              >
                <AppIcon :name="layer.visible ? 'eye' : 'eye-slash'" />
              </button>
              <button
                class="icon-btn"
                :title="$t('layerPanel.layers.delete')"
                :aria-label="$t('layerPanel.layers.delete')"
                @click.stop="deleteLayer(layer.id)"
              >
                <AppIcon name="trash" />
              </button>
            </div>
          </div>
          <!-- Inline order buttons for selected layer -->
          <div v-if="layer.id === imageStore.selectedLayerId" class="layer-order-inline">
            <button
              class="btn btn-sm"
              :title="$t('layerPanel.layers.moveUp')"
              :aria-label="$t('layerPanel.layers.moveUp')"
              @click.stop="moveLayer('up')"
            >
              <AppIcon name="arrow-up" />
            </button>
            <button
              class="btn btn-sm"
              :title="$t('layerPanel.layers.moveDown')"
              :aria-label="$t('layerPanel.layers.moveDown')"
              @click.stop="moveLayer('down')"
            >
              <AppIcon name="arrow-down" />
            </button>
            <button
              class="btn btn-sm"
              :title="$t('layerPanel.layers.duplicate')"
              :aria-label="$t('layerPanel.layers.duplicate')"
              @click.stop="duplicateLayer"
            >
              <AppIcon name="copy" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { useLayerPanelContext } from '@/composables/layers/useLayerPanelContext';

// Ebenenliste mit Sichtbarkeit, Löschen und Reihenfolge
const {
  imageStore,
  reversedLayers,
  selectLayer,
  toggleVisibility,
  deleteLayer,
  moveLayer,
  duplicateLayer,
} = useLayerPanelContext();
</script>

<style lang="scss" scoped>
@use './shared' as *;
</style>
