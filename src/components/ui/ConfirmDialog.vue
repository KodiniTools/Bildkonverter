<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="state.visible" class="confirm-backdrop" @click.self="cancel">
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <div v-if="state.title" class="confirm-header">
            <i :class="iconClass"></i>
            <span>{{ state.title }}</span>
          </div>

          <div class="confirm-body">
            <p>{{ state.message }}</p>
          </div>

          <div class="confirm-footer">
            <button class="confirm-btn confirm-btn--cancel" @click="cancel">
              {{ state.cancelText }}
            </button>
            <button :class="['confirm-btn', confirmBtnClass]" @click="ok">
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

const { state, respond } = useConfirm();

function ok() {
  respond(true);
}

function cancel() {
  respond(false);
}

const iconClass = computed(() => {
  const map = {
    danger: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    default: 'fas fa-question-circle',
  };
  return map[state.value.variant] || map.default;
});

const confirmBtnClass = computed(() => {
  return state.value.variant === 'danger'
    ? 'confirm-btn--danger'
    : 'confirm-btn--primary';
});
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.confirm-dialog {
  background: var(--color-bg, #fff);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border, #e5e7eb);
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.1rem 1.5rem 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text, #111827);

  i {
    color: var(--color-warning, #f59e0b);
    font-size: 1.15rem;
  }
}

.confirm-body {
  padding: 0 1.5rem 1.25rem;

  p {
    margin: 0;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.95rem;
    line-height: 1.6;
    white-space: pre-line;
  }
}

.confirm-footer {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem 1.25rem;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  line-height: 1;
}

.confirm-btn--cancel {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text, #111827);
  border-color: var(--color-border, #d1d5db);

  &:hover {
    background: var(--color-border, #e5e7eb);
  }
}

.confirm-btn--primary {
  background: var(--color-primary, #014f99);
  color: #fff;

  &:hover {
    background: var(--color-primary-dark, #003971);
  }
}

.confirm-btn--danger {
  background: #dc2626;
  color: #fff;

  &:hover {
    background: #b91c1c;
  }
}

/* Transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.confirm-fade-enter-from .confirm-dialog {
  transform: scale(0.9) translateY(-10px);
}

.confirm-fade-leave-to .confirm-dialog {
  transform: scale(0.9) translateY(-10px);
}
</style>
