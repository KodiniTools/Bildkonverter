<template>
  <Teleport to="#overlay-root">
    <div v-if="open" class="forward-offer-overlay" @click.self="emit('dismiss')">
      <div class="forward-offer">
        <div class="forward-offer__icon">
          <AppIcon name="check-circle" :size="40" />
        </div>
        <h3 class="forward-offer__title">{{ $t('handoff.forwardTitle') }}</h3>
        <p class="forward-offer__text">{{ $t('handoff.forwardText') }}</p>

        <div class="forward-offer__options">
          <button class="forward-offer__option" @click="emit('forward', 'color-extractor')">
            <AppIcon name="palette" :size="20" />
            <span class="forward-offer__option-label">
              {{ $t('handoff.forwardColorExtractor') }}
              <small>{{ $t('handoff.forwardColorExtractorHint') }}</small>
            </span>
            <AppIcon name="arrow-right" class="forward-offer__option-arrow" />
          </button>

          <button class="forward-offer__option" @click="emit('forward', 'visualizer')">
            <AppIcon name="wave-square" :size="20" />
            <span class="forward-offer__option-label">
              {{ $t('handoff.forwardVisualizer') }}
              <small>{{ $t('handoff.forwardVisualizerHint') }}</small>
            </span>
            <AppIcon name="arrow-right" class="forward-offer__option-arrow" />
          </button>
        </div>

        <button class="forward-offer__dismiss" @click="emit('dismiss')">
          {{ $t('handoff.forwardDismiss') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Weiterleitungs-Angebot nach erfolgreichem Download (aus EditorView ausgelagert).
 */
import AppIcon from '@/components/ui/AppIcon.vue';

export type ForwardTarget = 'color-extractor' | 'visualizer';

defineProps<{ open: boolean }>();

const emit = defineEmits<{
  dismiss: [];
  forward: [target: ForwardTarget];
}>();
</script>

<style scoped lang="scss">
// ===== Forward Offer (nach Download) =====
.forward-offer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--ds-z-dialog);
  padding: var(--ds-space-4);
}

.forward-offer {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-6) var(--ds-space-5) var(--ds-space-5);
  min-width: 320px;
  max-width: 440px;
  width: 100%;
  color: var(--ds-text);
  text-align: center;
  box-shadow: var(--ds-shadow-overlay);
  animation: editor-dialog-in var(--ds-duration-slow) var(--ds-ease);

  &__icon {
    display: flex;
    justify-content: center;
    color: var(--ds-success);
    margin-bottom: var(--ds-space-3);
  }

  &__title {
    margin: 0 0 var(--ds-space-2);
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
  }

  &__text {
    margin: 0 0 var(--ds-space-5);
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3);
    margin-bottom: var(--ds-space-4);
  }

  /* Auswahl-Kachel */
  &__option {
    display: flex;
    align-items: center;
    gap: var(--ds-space-3);
    width: 100%;
    padding: var(--ds-space-3) var(--ds-space-4);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font: inherit;
    cursor: pointer;
    text-align: left;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    > .app-icon:first-child {
      color: var(--ds-text-2);
    }

    &:hover {
      border-color: var(--ds-border-strong);
      background: var(--ds-surface-3);

      .forward-offer__option-arrow {
        color: var(--ds-text);
      }
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }

  &__option-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);

    small {
      font-size: var(--ds-text-xs);
      font-weight: var(--ds-weight-regular);
      color: var(--ds-text-2);
    }
  }

  &__option-arrow {
    color: var(--ds-text-3);
    transition: color var(--ds-duration) var(--ds-ease);
    flex-shrink: 0;
  }

  /* Ghost-Button */
  &__dismiss {
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-4);
    background: transparent;
    border: var(--ds-border-width) solid transparent;
    border-radius: var(--ds-radius-md);
    color: var(--ds-text-2);
    font: inherit;
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    line-height: 1;
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    &:hover {
      background: var(--ds-surface-2);
      color: var(--ds-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }
}

/* Eingang: nur Einblenden + 8 px */
@keyframes editor-dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
