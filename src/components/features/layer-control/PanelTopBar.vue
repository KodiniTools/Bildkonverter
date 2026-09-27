<template>
  <!-- Tabs oben, darunter die Verlaufszeile (Visualizer-Muster) -->
  <div class="panel-topbar-wrap">
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
    </div>

    <HistoryActions
      class="panel-history"
      :can-undo="imageStore.canUndo"
      :can-redo="imageStore.canRedo"
      :undo-title="$t('layerPanel.history.undo')"
      :redo-title="$t('layerPanel.history.redo')"
      @undo="handleUndo"
      @redo="handleRedo"
    >
      <button
        type="button"
        class="btn-history btn-preview"
        :title="$t('layerPanel.history.preview')"
        @click="handlePreview"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span class="btn-history__label">{{ $t('layerPanel.history.preview') }}</span>
      </button>
      <span v-if="historyInfo" class="history-info">{{ historyInfo }}</span>
    </HistoryActions>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { LAYER_PANEL_KEY } from '@/composables/useLayerPanel';
import HistoryActions from '@/components/ui/HistoryActions.vue';

const { imageStore, activeTab, historyInfo, handleUndo, handleRedo, handlePreview } =
  inject(LAYER_PANEL_KEY);
</script>

<style lang="scss" scoped>
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

.panel-history {
  padding: 0.5rem 0.5rem 0;
  margin-bottom: 0;
  align-items: center;
}

.history-info {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  min-width: 28px;
  text-align: center;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .tab-btn {
    min-height: 44px;
    font-size: 0.85rem;
  }
}
</style>
