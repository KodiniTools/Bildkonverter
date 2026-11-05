<template>
  <!-- Freies Verzerren (Distort): Eckpunkte ziehen, dann übernehmen -->
  <div class="control-group distort-section">
    <label class="switch-row">
      <span class="label-text">
        <AppIcon name="vector-square" />
        {{ $t('transform.distort.title') }}
      </span>
      <UiSwitch
        :model-value="enabled"
        :label="$t('transform.distort.title')"
        label-hidden
        :title="$t('transform.distort.hint')"
        @update:model-value="$emit('toggle-distort')"
      />
    </label>

    <div v-if="enabled" class="distort-actions">
      <button
        type="button"
        class="distort-btn"
        :disabled="!hasDistortion || isApplyingDistort"
        :title="$t('transform.distort.reset')"
        :aria-label="$t('transform.distort.reset')"
        @click="$emit('reset-distort')"
      >
        <AppIcon name="undo" />
      </button>
      <button
        type="button"
        class="distort-btn primary"
        :disabled="!hasDistortion || isApplyingDistort"
        :title="$t('transform.distort.applyHint')"
        :aria-label="$t('transform.distort.apply')"
        @click="$emit('apply-distort')"
      >
        <AppIcon :name="isApplyingDistort ? 'fas fa-spinner fa-spin' : 'fas fa-check'" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';

defineProps<{
  enabled: boolean;
  // Verzerrung sichtbar aktiv (Modus an UND Ecken versetzt)
  hasDistortion: boolean;
  isApplyingDistort: boolean;
}>();

defineEmits<{
  'toggle-distort': [];
  'reset-distort': [];
  'apply-distort': [];
}>();
</script>

<style scoped lang="scss">
@use './shared' as *;
@use './transform-sections' as *;

.distort-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}

// UiButton secondary bzw. primary (Übernehmen ist die Primäraktion des Modus)
.distort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  min-width: 0;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  color: var(--ds-text);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
  }

  &.primary {
    color: var(--ds-on-accent);
    background: var(--ds-accent);
    border-color: var(--ds-accent);
    font-weight: var(--ds-weight-semibold);

    &:hover:not(:disabled) {
      background: var(--ds-accent-hover);
      border-color: var(--ds-accent-hover);
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
