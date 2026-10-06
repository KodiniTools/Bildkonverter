<template>
  <Transition name="handoff-slide">
    <div v-if="handoffPayload" class="handoff-banner">
      <div class="handoff-content">
        <div class="handoff-icon">
          <AppIcon name="exchange-alt" :size="20" />
        </div>

        <div class="handoff-text">
          <strong>{{ $t('handoff.title', { count: handoffPayload.images.length }) }}</strong>
          <span class="handoff-source">{{
            $t('handoff.from', { tool: handoffPayload.source })
          }}</span>
        </div>

        <div class="handoff-preview">
          <div v-for="(img, index) in previewImages" :key="index" class="handoff-thumb">
            <img :src="img.dataUrl" :alt="img.name" />
          </div>
          <span v-if="handoffPayload.images.length > 4" class="handoff-more">
            +{{ handoffPayload.images.length - 4 }}
          </span>
        </div>

        <div class="handoff-actions">
          <button class="btn btn-success btn-sm" @click="acceptHandoff">
            <AppIcon name="check" />
            {{ $t('handoff.accept') }}
          </button>
          <button class="btn btn-secondary-outline btn-sm" @click="dismissHandoffAction">
            <AppIcon name="times" />
            {{ $t('handoff.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { checkHandoff, consumeHandoff, dismissHandoff } from '@/lib/core/handoff';
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits(['accept', 'dismiss']);
const handoffPayload = ref(null);

const previewImages = computed(() => {
  if (!handoffPayload.value) return [];
  return handoffPayload.value.images.slice(0, 4);
});

onMounted(() => {
  // Prüfe localStorage direkt — kein URL-Parameter nötig
  handoffPayload.value = checkHandoff();
});

function acceptHandoff() {
  const images = consumeHandoff();
  if (images) {
    emit('accept', images);
  }
  handoffPayload.value = null;
}

function dismissHandoffAction() {
  dismissHandoff();
  emit('dismiss');
  handoffPayload.value = null;
}
</script>

<style lang="scss" scoped>
/* Wie HandoffReceiver im Collage Maker: flache surface-1-Fläche mit
   1-px-Rahmen; hier im Seitenfluss, daher radius-lg und kein Schatten.
   Eine Goldfläche (Übernehmen), Verwerfen als Ghost-Button. */
.handoff-banner {
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-3) var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.handoff-content {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
}

.handoff-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border-radius: var(--ds-radius-md);
  background: var(--ds-accent-soft);
  color: var(--ds-text);
  flex-shrink: 0;
}

.handoff-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 150px;

  strong {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
  }

  .handoff-source {
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }
}

.handoff-preview {
  display: flex;
  gap: calc(var(--ds-space-1) + 2px);
  align-items: center;
  flex-shrink: 0;
}

.handoff-thumb {
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  border-radius: var(--ds-radius-sm);
  overflow: hidden;
  border: var(--ds-border-width) solid var(--ds-border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.handoff-more {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text-2);
  padding-left: var(--ds-space-1);
}

.handoff-actions {
  display: flex;
  gap: var(--ds-space-2);
  flex-shrink: 0;

  /* UiButton sm (28); Fläche von .btn-success (= Primär) aus global.scss */
  .btn-sm {
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-3);
    border-radius: var(--ds-radius-sm);
    font-size: var(--ds-text-sm);
  }

  /* UiButton ghost */
  .btn-secondary-outline {
    background: transparent;
    color: var(--ds-text-2);

    &:hover:not(:disabled) {
      background: var(--ds-surface-2);
      color: var(--ds-text);
    }
  }
}

// Eingang: Fade + 8 px
.handoff-slide-enter-active,
.handoff-slide-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.handoff-slide-enter-from,
.handoff-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .handoff-content {
    gap: var(--ds-space-2);
  }

  .handoff-preview {
    display: none;
  }

  .handoff-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
