<template>
  <div class="panel-section text-list-section">
    <div class="section-header">
      <h3>
        <i class="fas fa-font"></i>
        {{ $t('layerPanel.text.listTitle', 'Texte') }} ({{ texts.length }})
      </h3>
    </div>

    <button class="transform-btn add-text-btn" @click="$emit('add-text')">
      <i class="fas fa-plus"></i>
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
          @click.stop="$emit('delete-text-by-id', text.id)"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <p v-else class="empty-hint">
      <i class="fas fa-info-circle"></i>
      {{ $t('textPanel.noTexts', 'Noch keine Texte – füge einen hinzu.') }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  texts: { type: Array, default: () => [] },
  selectedTextId: { type: [String, Number], default: null },
});

defineEmits(['add-text', 'select-text-by-id', 'delete-text-by-id']);
</script>

<style scoped lang="scss">
@import './shared';

.add-text-btn {
  justify-content: center;
  margin-bottom: 0.6rem;
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.text-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-primary, #014f99);
    background: rgba(1, 79, 153, 0.05);
  }

  &.selected {
    border-color: var(--color-primary, #014f99);
    background: rgba(1, 79, 153, 0.1);
  }
}

.text-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--color-border, #d1d5db);
  flex-shrink: 0;
}

.text-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.text-content {
  font-size: 0.8rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-meta {
  font-size: 0.65rem;
  color: var(--color-text-light);
}

.text-delete-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 5px;
  cursor: pointer;
  color: var(--color-text-light);
  transition: all 0.15s ease;

  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

.empty-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin: 0;
  line-height: 1.4;

  i {
    color: var(--color-primary, #014f99);
    font-size: 0.85rem;
  }
}

:root[data-theme='dark'] {
  .text-item {
    border-color: var(--color-border);

    &:hover,
    &.selected {
      border-color: var(--color-primary);
      background: rgba(1, 79, 153, 0.18);
    }
  }
}
</style>
