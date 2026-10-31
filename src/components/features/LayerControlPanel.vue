<template>
  <div class="layer-control-panel">
    <PanelTopBar />
    <LayersTab />
    <TextTab />
    <div v-show="panel.activeTab.value === 'shapes'" class="shapes-tab">
      <ShapesPanel />
    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { useLayerPanel, LAYER_PANEL_KEY } from '@/composables/useLayerPanel';
import PanelTopBar from './layer-control/PanelTopBar.vue';
import LayersTab from './layer-control/LayersTab.vue';
import TextTab from './layer-control/TextTab.vue';
import ShapesPanel from './shapes/ShapesPanel.vue';

const props = defineProps({
  canvasSelectedTextId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['render', 'add-text', 'select-text', 'preview']);

// Gesamte Panel-Logik ist nach @/composables/useLayerPanel ausgelagert.
// Der zurückgegebene Kontext wird per provide/inject an die Tab-Komponenten
// (PanelTopBar / LayersTab / TextTab) weitergereicht.
const panel = useLayerPanel(props, emit);
provide(LAYER_PANEL_KEY, panel);
</script>

<style lang="scss" scoped>
.layer-control-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background: var(--ds-surface-0);
  border-left: var(--ds-border-width) solid var(--ds-border);

  /* Sticky Sidebar */
  position: sticky;
  top: 0;
  height: calc(100vh - var(--external-nav-height, 50px) - var(--header-height, 60px) - 60px);
  align-self: stretch;
}

/* Reiter „Formen“: gleiche Scroll-Fläche wie die anderen Reiter */
.shapes-tab {
  flex: 1;
  overflow-y: auto;
  padding: var(--ds-space-2);

  @supports not selector(::-webkit-scrollbar) {
    scrollbar-width: thin;
    scrollbar-color: var(--ds-text-3) transparent;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--ds-text-3);
    border-radius: var(--ds-radius-full);
    border: 2px solid transparent;
    background-clip: content-box;
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
    border-top: var(--ds-border-width) solid var(--ds-border);
  }
}
</style>
