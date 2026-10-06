<template>
  <div class="panel-section text-list-section">
    <div class="section-header">
      <h3>
        <AppIcon name="font" />
        {{ $t('layerPanel.text.listTitle', 'Texte') }} ({{ texts.length }})
      </h3>
    </div>

    <button class="transform-btn add-text-btn" @click="$emit('add-text')">
      <AppIcon name="plus" />
      <span>{{ $t('layerPanel.text.addButton', 'Text hinzufügen') }}</span>
    </button>

    <div v-if="texts.length" class="text-list">
      <div
        v-for="text in texts"
        :key="text.id"
        class="text-item"
        :class="{ selected: text.id === selectedTextId }"
        @click="$emit('select-text-by-id', text.id)"
      >
        <div class="text-color-swatch" :style="{ backgroundColor: text.color || '#000000' }"></div>
        <div class="text-info">
          <span class="text-content">{{ text.content || text.txt || 'Text' }}</span>
          <span class="text-meta">{{ text.fontSize || text.size || 32 }}px</span>
        </div>
        <button
          class="text-delete-btn"
          :title="$t('layerPanel.layers.delete', 'Löschen')"
          :aria-label="$t('layerPanel.layers.delete', 'Löschen')"
          @click.stop="$emit('delete-text-by-id', text.id)"
        >
          <AppIcon name="trash" />
        </button>
      </div>
    </div>

    <p v-else class="empty-hint">
      <AppIcon name="info-circle" />
      {{ $t('textPanel.noTexts', 'Noch keine Texte – füge einen hinzu.') }}
    </p>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps({
  texts: { type: Array, default: () => [] },
  selectedTextId: { type: [String, Number], default: null },
});

defineEmits(['add-text', 'select-text-by-id', 'delete-text-by-id']);
</script>

<style scoped lang="scss">
@import './shared';

.add-text-btn {
  margin-bottom: var(--ds-space-3);
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

// Listeneintrag wie im Collage Maker: surface-2, Hover surface-3, Auswahl accent-soft
.text-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-2) var(--ds-space-2) var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &.selected {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }
}

.text-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: var(--ds-radius-sm);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  flex-shrink: 0;
}

.text-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.text-content {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-meta {
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

// UiIconButton sm (ghost), destruktiv über die Icon-Farbe
.text-delete-btn {
  flex-shrink: 0;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  color: var(--ds-text-2);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-danger);
    background: var(--ds-surface-1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.empty-hint {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0;
  line-height: var(--ds-leading);

  .app-icon {
    color: var(--ds-text-3);
  }
}
</style>
