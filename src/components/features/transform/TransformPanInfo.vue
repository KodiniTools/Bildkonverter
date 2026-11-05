<template>
  <!-- Pan-Hinweis und Reset (nur bei Zoom > 100%) -->
  <div class="pan-info">
    <p class="pan-hint">
      <AppIcon name="hand-paper" />
      {{ $t('transform.panHint', 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben') }}
    </p>
    <button v-if="hasPan" class="transform-btn pan-reset-btn" @click="$emit('reset-pan')">
      <AppIcon name="compress-arrows-alt" />
      <span>{{ $t('transform.resetPan', 'Ansicht zentrieren') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  hasPan: boolean;
}>();

defineEmits<{
  'reset-pan': [];
}>();
</script>

<style scoped lang="scss">
@use './shared' as *;

// Hinweis = UiCallout (surface-2, 1-px-Rahmen, radius-md)
.pan-info {
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}

.pan-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0 0 var(--ds-space-2) 0;
  line-height: var(--ds-leading);

  .app-icon {
    color: var(--ds-text-2);
    margin-top: 2px;
  }
}

.pan-reset-btn {
  margin-bottom: 0;
}
</style>
