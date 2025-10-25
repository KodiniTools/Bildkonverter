<template>
  <Teleport to="body">
    <!-- Shortcuts Help Modal -->
    <Transition name="modal">
      <div v-if="showHelp" class="shortcuts-modal" @click="closeHelp">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>
              <i class="fas fa-keyboard"></i>
              {{ $t('shortcuts.title') }}
            </h2>
            <button class="close-btn" @click="closeHelp">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div 
              v-for="group in shortcutGroups" 
              :key="group.name"
              class="shortcut-group"
            >
              <h3>{{ $t(`shortcuts.groups.${group.name}`) }}</h3>
              
              <div class="shortcuts-list">
                <div 
                  v-for="shortcut in group.shortcuts"
                  :key="shortcut.key"
                  class="shortcut-item"
                >
                  <div class="shortcut-keys">
                    <kbd 
                      v-for="(key, index) in shortcut.keys"
                      :key="index"
                      class="key"
                    >
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// State
const showHelp = ref(false)

// Shortcuts Configuration
const shortcutGroups = [
  {
    name: 'general',
    shortcuts: [
      { keys: ['?'], action: 'showHelp', handler: () => toggleHelp() },
      { keys: ['Ctrl', 'K'], action: 'search', handler: () => focusSearch() },
      { keys: ['Esc'], action: 'close', handler: () => closeModals() }
    ]
  },
  {
    name: 'navigation',
    shortcuts: [
      { keys: ['G', 'H'], action: 'goHome', handler: () => router.push('/') },
      { keys: ['G', 'E'], action: 'goEditor', handler: () => router.push('/editor') },
      { keys: ['G', 'G'], action: 'goGallery', handler: () => router.push('/gallery') },
      { keys: ['G', 'B'], action: 'goBatch', handler: () => router.push('/batch') }
    ]
  },
  {
    name: 'editor',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], action: 'undo', handler: () => triggerUndo() },
      { keys: ['Ctrl', 'Y'], action: 'redo', handler: () => triggerRedo() },
      { keys: ['Ctrl', 'S'], action: 'save', handler: () => triggerSave() },
      { keys: ['Ctrl', 'O'], action: 'open', handler: () => triggerOpen() },
      { keys: ['R'], action: 'reset', handler: () => triggerReset() }
    ]
  }
]

// State for sequence detection
let keySequence = []
let sequenceTimeout = null

// Methods
function toggleHelp() {
  showHelp.value = !showHelp.value
}

function closeHelp() {
  showHelp.value = false
}

function focusSearch() {
  const searchInput = document.querySelector('.search-input')
  if (searchInput) {
    searchInput.focus()
  }
}

function closeModals() {
  showHelp.value = false
  // Emit event for other modals
  window.dispatchEvent(new CustomEvent('close-modals'))
}

function triggerUndo() {
  window.dispatchEvent(new CustomEvent('editor-undo'))
}

function triggerRedo() {
  window.dispatchEvent(new CustomEvent('editor-redo'))
}

function triggerSave() {
  window.dispatchEvent(new CustomEvent('editor-save'))
}

function triggerOpen() {
  window.dispatchEvent(new CustomEvent('editor-open'))
}

function triggerReset() {
  window.dispatchEvent(new CustomEvent('editor-reset'))
}

function handleKeyDown(event) {
  const key = event.key
  const ctrl = event.ctrlKey || event.metaKey
  const shift = event.shiftKey
  const alt = event.altKey
  
  // Build modifier string
  let modifiers = ''
  if (ctrl) modifiers += 'Ctrl+'
  if (shift) modifiers += 'Shift+'
  if (alt) modifiers += 'Alt+'
  
  const fullKey = modifiers + key.toUpperCase()
  
  // Check for single-key shortcuts with modifiers
  shortcutGroups.forEach(group => {
    group.shortcuts.forEach(shortcut => {
      const shortcutKeys = shortcut.keys.join('+').toUpperCase()
      
      if (shortcutKeys === fullKey) {
        event.preventDefault()
        shortcut.handler()
        return
      }
    })
  })
  
  // Check for sequence shortcuts (like G+H)
  if (!ctrl && !alt && key.length === 1) {
    keySequence.push(key.toUpperCase())
    
    clearTimeout(sequenceTimeout)
    sequenceTimeout = setTimeout(() => {
      keySequence = []
    }, 1000)
    
    // Check if sequence matches any shortcut
    const sequence = keySequence.join(',')
    
    shortcutGroups.forEach(group => {
      group.shortcuts.forEach(shortcut => {
        const shortcutSequence = shortcut.keys.join(',')
        
        if (sequence === shortcutSequence) {
          event.preventDefault()
          shortcut.handler()
          keySequence = []
          return
        }
      })
    })
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  clearTimeout(sequenceTimeout)
})
</script>

<style lang="scss" scoped>
.shortcuts-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }
}

.modal-content {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  
  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin: 0;
    font-size: 1.5rem;
    
    i {
      color: var(--color-primary);
    }
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-light-blue);
    color: var(--color-primary);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
}

.shortcut-group {
  margin-bottom: var(--spacing-xl);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-md);
    color: var(--color-primary);
  }
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-md);
  gap: var(--spacing-md);
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.shortcut-keys {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  
  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    font-family: monospace;
    font-size: var(--font-size-sm);
    font-weight: 600;
    box-shadow: 0 2px 0 var(--color-border);
  }
}

.shortcut-description {
  flex: 1;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: right;
  
  @media (max-width: 480px) {
    text-align: left;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: scale(0.9) translateY(-20px);
  }
}
</style>
