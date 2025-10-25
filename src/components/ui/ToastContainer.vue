<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <i :class="getIcon(toast.type)"></i>
          </div>
          
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          
          <button class="toast-close" @click.stop="removeToast(toast.id)">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }"></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const toasts = ref([])

function addToast(toast) {
  const id = Date.now() + Math.random()
  const duration = toast.duration || 3000
  
  const newToast = {
    id,
    type: toast.type || 'info',
    title: toast.title,
    message: toast.message,
    duration
  }
  
  toasts.value.push(newToast)
  
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

function getIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  return icons[type] || icons.info
}

defineExpose({
  addToast
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.$toast = {
      success: (message, title = null, duration = 3000) => {
        addToast({ type: 'success', message, title, duration })
      },
      error: (message, title = null, duration = 4000) => {
        addToast({ type: 'error', message, title, duration })
      },
      warning: (message, title = null, duration = 3500) => {
        addToast({ type: 'warning', message, title, duration })
      },
      info: (message, title = null, duration = 3000) => {
        addToast({ type: 'info', message, title, duration })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  pointer-events: none;
}

.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  min-width: 320px;
  max-width: 450px;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  cursor: pointer;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }
  
  &-success::before {
    background: var(--color-success);
  }
  
  &-error::before {
    background: var(--color-danger);
  }
  
  &-warning::before {
    background: var(--color-warning);
  }
  
  &-info::before {
    background: var(--color-info);
  }
}

.toast-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50%) scale(0.8);
}
</style>
