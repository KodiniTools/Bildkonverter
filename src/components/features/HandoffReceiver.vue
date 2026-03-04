<template>
  <Transition name="handoff-slide">
    <div v-if="handoffPayload" class="handoff-banner">
      <div class="handoff-content">
        <div class="handoff-icon">
          <i class="fas fa-exchange-alt"></i>
        </div>

        <div class="handoff-text">
          <strong>{{ $t('handoff.title', { count: handoffPayload.images.length }) }}</strong>
          <span class="handoff-source">{{ $t('handoff.from', { tool: handoffPayload.source }) }}</span>
        </div>

        <div class="handoff-preview">
          <div
            v-for="(img, index) in previewImages"
            :key="index"
            class="handoff-thumb"
          >
            <img :src="img.dataUrl" :alt="img.name" />
          </div>
          <span v-if="handoffPayload.images.length > 4" class="handoff-more">
            +{{ handoffPayload.images.length - 4 }}
          </span>
        </div>

        <div class="handoff-actions">
          <button class="btn btn-success btn-sm" @click="acceptHandoff">
            <i class="fas fa-check"></i>
            {{ $t('handoff.accept') }}
          </button>
          <button class="btn btn-secondary-outline btn-sm" @click="dismissHandoffAction">
            <i class="fas fa-times"></i>
            {{ $t('handoff.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { checkHandoff, consumeHandoff, dismissHandoff } from '@/lib/core/handoff'

const emit = defineEmits(['accept', 'dismiss'])

const handoffPayload = ref(null)

const previewImages = computed(() => {
  if (!handoffPayload.value) return []
  return handoffPayload.value.images.slice(0, 4)
})

onMounted(() => {
  handoffPayload.value = checkHandoff()
})

function acceptHandoff() {
  const images = consumeHandoff()
  if (images) {
    emit('accept', images)
  }
  handoffPayload.value = null
}

function dismissHandoffAction() {
  dismissHandoff()
  emit('dismiss')
  handoffPayload.value = null
}
</script>

<style lang="scss" scoped>
.handoff-banner {
  background: linear-gradient(135deg, var(--color-primary), #0066cc);
  color: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 102, 204, 0.3);
}

.handoff-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.handoff-icon {
  font-size: 1.5rem;
  opacity: 0.9;
  flex-shrink: 0;
}

.handoff-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 150px;

  strong {
    font-size: 1rem;
  }

  .handoff-source {
    font-size: 0.85rem;
    opacity: 0.85;
  }
}

.handoff-preview {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.handoff-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.handoff-more {
  font-size: 0.85rem;
  opacity: 0.85;
  font-weight: 600;
}

.handoff-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;

  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-success {
    background: white;
    color: var(--color-primary);

    &:hover {
      background: #f0f0f0;
      transform: translateY(-1px);
    }
  }

  .btn-secondary-outline {
    background: transparent;
    color: white;
    border: 1.5px solid rgba(255, 255, 255, 0.5);

    &:hover {
      border-color: white;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
  }
}

// Transition
.handoff-slide-enter-active {
  transition: all 0.4s ease-out;
}

.handoff-slide-leave-active {
  transition: all 0.3s ease-in;
}

.handoff-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.handoff-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .handoff-banner {
    padding: 0.75rem 1rem;
  }

  .handoff-content {
    flex-direction: column;
    text-align: center;
  }

  .handoff-preview {
    justify-content: center;
  }

  .handoff-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
