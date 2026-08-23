<template>
  <!-- Unified Top Bar: Tabs + History -->
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
      <button class="tab-btn" :class="{ active: activeTab === 'text' }" @click="activeTab = 'text'">
        <i class="fas fa-font"></i>
        {{ $t('layerPanel.tabs.text') }}
      </button>
    </div>
    <div class="history-group">
      <button
        class="history-btn"
        :class="{ disabled: !imageStore.canUndo }"
        :disabled="!imageStore.canUndo"
        :title="$t('layerPanel.history.undo')"
        @click="handleUndo"
      >
        <i class="fas fa-reply"></i>
      </button>
      <button
        class="history-btn"
        :class="{ disabled: !imageStore.canRedo }"
        :disabled="!imageStore.canRedo"
        :title="$t('layerPanel.history.redo')"
        @click="handleRedo"
      >
        <i class="fas fa-share"></i>
      </button>
      <button
        class="history-btn preview-btn"
        :title="$t('layerPanel.history.preview')"
        @click="handlePreview"
      >
        <i class="fas fa-eye"></i>
      </button>
      <span v-if="historyInfo" class="history-info">{{ historyInfo }}</span>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { LAYER_PANEL_KEY } from '@/composables/useLayerPanel';

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

  .history-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.5rem;
    border-left: 1px solid var(--color-border);
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

.history-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover:not(.disabled) {
    background: var(--color-primary);
    color: white;
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.preview-btn {
    background: var(--color-primary);
    color: #f5f4d6;

    &:hover {
      background: var(--color-primary-dark, #003971);
    }
  }
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

  .history-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
