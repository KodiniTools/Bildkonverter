<template>
  <Teleport to="#overlay-root">
    <Transition name="confirm-fade">
      <div v-if="state.visible" class="confirm-backdrop" @click.self="cancel">
        <div
          class="confirm-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="state.title ? 'confirm-dialog-title' : undefined"
          aria-describedby="confirm-dialog-message"
          @keydown.esc.prevent="cancel"
        >
          <div v-if="state.title" class="confirm-header">
            <AppIcon :name="iconName" :size="20" class="confirm-icon" :class="iconToneClass" />
            <h2 id="confirm-dialog-title" class="confirm-title">{{ state.title }}</h2>
          </div>

          <p id="confirm-dialog-message" class="confirm-body">{{ state.message }}</p>

          <div class="confirm-footer">
            <button type="button" class="confirm-btn confirm-btn--cancel" @click="cancel">
              {{ state.cancelText }}
            </button>
            <button type="button" :class="['confirm-btn', confirmBtnClass]" @click="ok">
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useConfirm } from '@/composables/useConfirm';
import AppIcon from '@/components/ui/AppIcon.vue';

const { state, respond } = useConfirm();

function ok() {
  respond(true);
}

function cancel() {
  respond(false);
}

const iconName = computed(() => {
  const map = {
    danger: 'exclamation-triangle',
    warning: 'exclamation-circle',
    default: 'question-circle',
  };
  return map[state.value.variant] || map.default;
});

const iconToneClass = computed(() => {
  if (state.value.variant === 'danger') return 'confirm-icon--danger';
  if (state.value.variant === 'warning') return 'confirm-icon--warning';
  return '';
});

const confirmBtnClass = computed(() => {
  return state.value.variant === 'danger' ? 'confirm-btn--danger' : 'confirm-btn--primary';
});
</script>

<style scoped lang="scss">
/* UiDialog (Design-System v2), Größe md: 440 px, surface-1, radius-lg,
   Padding 20, Lücke 12, Overlay-Schatten. Backdrop ohne Blur.
   Destruktiv ist textbasiert (Button danger), Primär ist Gold. */
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-4);
  background: rgba(0, 0, 0, 0.5);
}

.confirm-dialog {
  width: min(440px, 100%);
  max-height: calc(100vh - 2 * var(--ds-space-4));
  overflow: auto;
  box-sizing: border-box;
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-overlay);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}

.confirm-icon {
  color: var(--ds-text-2);

  &--danger {
    color: var(--ds-danger);
  }

  &--warning {
    color: var(--ds-warning);
  }
}

.confirm-title {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
}

.confirm-body {
  margin: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
  white-space: pre-line;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}

/* UiButton md */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.confirm-btn--cancel {
  border-color: var(--ds-border-strong);

  &:hover {
    background: var(--ds-surface-3);
  }
}

.confirm-btn--primary {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);

  &:hover {
    background: var(--ds-accent-hover);
  }
}

.confirm-btn--danger {
  background: transparent;
  color: var(--ds-danger);

  &:hover {
    background: var(--ds-surface-2);
  }
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--ds-duration-slow) var(--ds-ease);
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform var(--ds-duration-slow) var(--ds-ease);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: translateY(8px);
}
</style>
