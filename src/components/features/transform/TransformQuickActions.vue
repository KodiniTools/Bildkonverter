<template>
  <!-- Schnell-Rotation Buttons -->
  <div class="button-group">
    <button
      class="quick-btn"
      :title="$t('transform.rotationTooltip.counterClockwise')"
      @click="$emit('rotate-90-counter')"
    >
      <AppIcon name="undo" />
      90°
    </button>
    <button
      class="quick-btn"
      :title="$t('transform.rotationTooltip.rotate180')"
      @click="$emit('rotate-180')"
    >
      <AppIcon name="sync" />
      180°
    </button>
    <button
      class="quick-btn"
      :title="$t('transform.rotationTooltip.clockwise')"
      @click="$emit('rotate-90')"
    >
      <AppIcon name="redo" />
      90°
    </button>
  </div>

  <!-- Spiegeln -->
  <div class="button-group">
    <button
      class="quick-btn"
      :class="{ active: flipHorizontal }"
      :title="$t('transform.flip.horizontalTooltip')"
      @click="$emit('flip-horizontal')"
    >
      <AppIcon name="arrows-alt-h" />
      {{ $t('transform.flip.horizontal') }}
    </button>
    <button
      class="quick-btn"
      :class="{ active: flipVertical }"
      :title="$t('transform.flip.verticalTooltip')"
      @click="$emit('flip-vertical')"
    >
      <AppIcon name="arrows-alt-v" />
      {{ $t('transform.flip.vertical') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  flipHorizontal: boolean;
  flipVertical: boolean;
}>();

defineEmits<{
  'rotate-90': [];
  'rotate-90-counter': [];
  'rotate-180': [];
  'flip-horizontal': [];
  'flip-vertical': [];
}>();
</script>

<style scoped lang="scss">
.button-group {
  display: flex;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-4);
}

// Schnellaktionen = UiButton secondary; Spiegeln aktiv = SelectionTile
.quick-btn {
  flex: 1;
  min-width: 0;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-2);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  color: var(--ds-text);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);
  }
}

// Mobile
@media (max-width: 768px) {
  .quick-btn {
    min-height: var(--ds-row-height);
  }
}
</style>
