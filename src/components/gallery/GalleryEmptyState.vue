<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <AppIcon name="images" :size="40" />
    </div>
    <h3>{{ $t('gallery.empty.title') }}</h3>
    <p>{{ $t('gallery.empty.description') }}</p>
    <div class="empty-state__actions">
      <button class="btn btn-primary" @click="emit('upload')">
        <AppIcon name="upload" />
        {{ $t('gallery.buttons.upload') }}
      </button>
    </div>
    <div class="empty-state__shortcut">
      <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
      <span>{{ $t('gallery.pasteShortcutHint', 'aus Zwischenablage einfügen') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Leere Galerie mit Upload-Button und Einfüge-Hinweis (aus GalleryView ausgelagert) */
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits<{ upload: [] }>();
</script>

<style lang="scss" scoped>
// Wie UiKbd
.empty-state__shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 calc(var(--ds-space-1) + 2px);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-bottom-width: 2px;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font-family: inherit;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: 1;
  white-space: nowrap;
}

// ===== EMPTY STATE =====

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-4);
  color: var(--ds-text-2);

  &__icon {
    display: inline-flex;
    margin-bottom: var(--ds-space-1);
    color: var(--ds-text-3);
  }

  h3 {
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
  }

  p {
    margin: 0;
    max-width: 40ch;
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  &__actions {
    margin-top: var(--ds-space-2);
  }

  &__shortcut {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
    margin-top: var(--ds-space-2);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }
}
</style>
