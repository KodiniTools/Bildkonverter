<template>
  <Teleport to="#overlay-root">
    <!-- Shortcuts Help Modal -->
    <Transition name="modal">
      <div v-if="showHelp" class="shortcuts-modal" @click="closeHelp">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>
              <AppIcon name="keyboard" :size="20" />
              {{ $t('shortcuts.title') }}
            </h2>
            <button
              type="button"
              class="close-btn"
              :aria-label="$t('shortcuts.close')"
              :title="$t('shortcuts.close')"
              @click="closeHelp"
            >
              <AppIcon name="times" />
            </button>
          </div>

          <div class="modal-body">
            <div v-for="group in shortcutGroups" :key="group.name" class="shortcut-group">
              <h3>{{ $t(`shortcuts.groups.${group.name}`) }}</h3>

              <div class="shortcuts-list">
                <div v-for="shortcut in group.shortcuts" :key="shortcut.key" class="shortcut-item">
                  <div class="shortcut-keys">
                    <kbd v-for="(key, index) in shortcut.keys" :key="index" class="key">
                      {{ key }}
                    </kbd>
                  </div>
                  <div class="shortcut-description">
                    {{ $t(`shortcuts.actions.${shortcut.action}`) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" @click="closeHelp">
              {{ $t('shortcuts.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';

const router = useRouter();

// State
const showHelp = ref(false);

// Shortcuts Configuration
const shortcutGroups = [
  {
    name: 'general',
    shortcuts: [
      { keys: ['?'], action: 'showHelp', handler: () => toggleHelp() },
      { keys: ['Ctrl', 'K'], action: 'search', handler: () => focusSearch() },
      { keys: ['Esc'], action: 'close', handler: () => closeModals() },
    ],
  },
  {
    name: 'navigation',
    shortcuts: [
      { keys: ['G', 'H'], action: 'goHome', handler: () => router.push('/') },
      { keys: ['G', 'E'], action: 'goEditor', handler: () => router.push('/editor') },
      { keys: ['G', 'G'], action: 'goGallery', handler: () => router.push('/gallery') },
      { keys: ['G', 'B'], action: 'goBatch', handler: () => router.push('/batch') },
    ],
  },
  {
    name: 'editor',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], action: 'undo', handler: () => triggerUndo() },
      { keys: ['Ctrl', 'Y'], action: 'redo', handler: () => triggerRedo() },
      { keys: ['Ctrl', 'S'], action: 'save', handler: () => triggerSave() },
      { keys: ['Ctrl', 'O'], action: 'open', handler: () => triggerOpen() },
      { keys: ['R'], action: 'reset', handler: () => triggerReset() },
    ],
  },
];

// State for sequence detection
let keySequence = [];
let sequenceTimeout = null;

// Methods
function toggleHelp() {
  showHelp.value = !showHelp.value;
}

function closeHelp() {
  showHelp.value = false;
}

function focusSearch() {
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.focus();
  }
}

function closeModals() {
  showHelp.value = false;
  // Emit event for other modals
  window.dispatchEvent(new CustomEvent('close-modals'));
}

function triggerUndo() {
  window.dispatchEvent(new CustomEvent('editor-undo'));
}

function triggerRedo() {
  window.dispatchEvent(new CustomEvent('editor-redo'));
}

function triggerSave() {
  window.dispatchEvent(new CustomEvent('editor-save'));
}

function triggerOpen() {
  window.dispatchEvent(new CustomEvent('editor-open'));
}

function triggerReset() {
  window.dispatchEvent(new CustomEvent('editor-reset'));
}

function handleKeyDown(event) {
  // Tastenkürzel ignorieren, wenn ein Eingabefeld fokussiert ist,
  // damit z.B. der Buchstabe "R" (Reset-Shortcut) normal getippt werden kann.
  const target = event.target;
  const isEditable =
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.tagName === 'SELECT' ||
    target?.isContentEditable;
  if (isEditable) return;

  const key = event.key;
  const ctrl = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  // Build modifier string
  let modifiers = '';
  if (ctrl) modifiers += 'Ctrl+';
  if (shift) modifiers += 'Shift+';
  if (alt) modifiers += 'Alt+';

  const fullKey = modifiers + key.toUpperCase();

  // Check for single-key shortcuts with modifiers
  shortcutGroups.forEach((group) => {
    group.shortcuts.forEach((shortcut) => {
      const shortcutKeys = shortcut.keys.join('+').toUpperCase();

      if (shortcutKeys === fullKey) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    });
  });

  // Check for sequence shortcuts (like G+H)
  if (!ctrl && !alt && key.length === 1) {
    keySequence.push(key.toUpperCase());

    clearTimeout(sequenceTimeout);
    sequenceTimeout = setTimeout(() => {
      keySequence = [];
    }, 1000);

    // Check if sequence matches any shortcut
    const sequence = keySequence.join(',');

    shortcutGroups.forEach((group) => {
      group.shortcuts.forEach((shortcut) => {
        const shortcutSequence = shortcut.keys.join(',');

        if (sequence === shortcutSequence) {
          event.preventDefault();
          shortcut.handler();
          keySequence = [];
          return;
        }
      });
    });
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  clearTimeout(sequenceTimeout);
});
</script>

<style lang="scss" scoped>
/* UiDialog (Design-System v2), Größe lg: 720 px, surface-1, radius-lg,
   Padding 20, Lücke 12, Overlay-Schatten; Backdrop ohne Blur.
   Kategorien als Eyebrow, Tasten als UiKbd. */
.shortcuts-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--ds-space-4);
}

.modal-content {
  width: min(720px, 100%);
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);

  h2 {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);

    .app-icon {
      color: var(--ds-text-2);
    }
  }
}

/* UiIconButton ghost, sm */
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  background: transparent;
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-sm);
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

.modal-body {
  display: grid;
  gap: var(--ds-space-6);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 639px) {
    gap: var(--ds-space-5);
  }
}

.shortcut-group {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);

  /* Eyebrow 12/600 Versalien */
  h3 {
    margin: 0;
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--ds-text-2);
  }
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-1) 0;
}

/* UiKbd */
.shortcut-keys {
  order: 2;
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  flex-shrink: 0;

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 22px;
    padding: 0 calc(var(--ds-space-1) + 2px);
    box-sizing: border-box;
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
}

.shortcut-description {
  order: 1;
  flex: 1;
  min-width: 0;
  color: var(--ds-text);
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}

// Transitions: Fade + 8 px
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--ds-duration-slow) var(--ds-ease);

  .modal-content {
    transition: transform var(--ds-duration-slow) var(--ds-ease);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: translateY(8px);
  }
}
</style>
