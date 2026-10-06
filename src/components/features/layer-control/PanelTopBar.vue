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
          <AppIcon name="layer-group" />
          {{ $t('layerPanel.tabs.layers') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'text' }"
          @click="activeTab = 'text'"
        >
          <AppIcon name="font" />
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
import AppIcon from '@/components/ui/AppIcon.vue';

const { imageStore, activeTab, historyInfo, handleUndo, handleRedo, handlePreview } =
  inject(LAYER_PANEL_KEY);
</script>

<style lang="scss" scoped>
/* Reiter = UiSegmentedControl (surface-0-Hülle, 2 px Innenabstand,
   aktive Option surface-1 + border-strong), darunter die Verlaufszeile. */
.panel-topbar-wrap {
  padding: var(--ds-space-2) var(--ds-space-2) 0;
}

.panel-topbar {
  display: flex;
  align-items: stretch;

  .tab-group {
    display: flex;
    flex: 1;
    gap: 2px;
    padding: 2px;
    height: var(--ds-control-md);
    box-sizing: border-box;
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-0);
  }
}

.tab-btn {
  flex: 1;
  min-width: 0;
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-surface-1);
    border-color: var(--ds-border-strong);
    color: var(--ds-text);
  }
}

.panel-history {
  padding: var(--ds-space-2) 0 0;
  margin-bottom: 0;
  align-items: center;
}

.history-info {
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
  min-width: 28px;
  text-align: center;
}

/* Mobile: Touch-Ziel 44 */
@media (max-width: 768px) {
  .panel-topbar .tab-group {
    height: var(--ds-row-height);
  }

  .tab-btn {
    font-size: var(--ds-text-md);
  }
}
</style>
