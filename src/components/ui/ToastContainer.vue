<template>
  <Teleport to="#overlay-root">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          @click="removeToast(toast.id)"
        >
          <span class="toast-icon" aria-hidden="true">
            <AppIcon :name="getIcon(toast.type)" :stroke-width="2" />
          </span>

          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>

          <button
            type="button"
            class="toast-close"
            :aria-label="$t('common.close')"
            :title="$t('common.close')"
            @click.stop="removeToast(toast.id)"
          >
            <AppIcon name="times" :stroke-width="2" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const toasts = ref([]);

function addToast(toast) {
  const id = Date.now() + Math.random();
  const duration = toast.duration || 3000;

  const newToast = {
    id,
    type: toast.type || 'info',
    title: toast.title,
    message: toast.message,
    duration,
  };

  toasts.value.push(newToast);

  setTimeout(() => {
    removeToast(id);
  }, duration);
}

function removeToast(id) {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
}

function getIcon(type) {
  const icons = {
    success: 'check',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle',
  };
  return icons[type] || icons.info;
}

defineExpose({
  addToast,
});

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.$toast = {
      success: (message, title = null, duration = 3000) => {
        addToast({ type: 'success', message, title, duration });
      },
      error: (message, title = null, duration = 4000) => {
        addToast({ type: 'error', message, title, duration });
      },
      warning: (message, title = null, duration = 3500) => {
        addToast({ type: 'warning', message, title, duration });
      },
      info: (message, title = null, duration = 3000) => {
        addToast({ type: 'info', message, title, duration });
      },
    };
  }
});
</script>

<style lang="scss" scoped>
/* UiToast (Design-System v2): flache surface-1, 1-px-Rahmen, Statuslinie 3 px
   links, Status nur über Linie und Icon, Schatten nur hier (Overlay). */
.toast-container {
  position: fixed;
  right: var(--ds-space-4);
  bottom: var(--ds-space-4);
  z-index: var(--ds-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  max-width: calc(100vw - var(--ds-space-4));
  pointer-events: none;

  @media (max-width: 639px) {
    right: var(--ds-space-2);
    bottom: var(--ds-space-2);
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  max-width: 400px;
  padding: var(--ds-space-3) var(--ds-space-3) var(--ds-space-3) var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border);
  border-left: 3px solid var(--ds-info);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-overlay);
  pointer-events: auto;
  cursor: pointer;
}

.toast-icon {
  display: inline-flex;
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  flex-shrink: 0;
  color: var(--ds-info);
}

.toast-success {
  border-left-color: var(--ds-success);

  .toast-icon {
    color: var(--ds-success);
  }
}

.toast-error {
  border-left-color: var(--ds-danger);

  .toast-icon {
    color: var(--ds-danger);
  }
}

.toast-warning {
  border-left-color: var(--ds-warning);

  .toast-icon {
    color: var(--ds-warning);
  }
}

.toast-content {
  flex: 1;
  min-width: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.toast-title {
  font-weight: var(--ds-weight-semibold);
}

.toast-message {
  color: var(--ds-text);
}

/* UiIconButton size sm (ghost) */
.toast-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
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

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
