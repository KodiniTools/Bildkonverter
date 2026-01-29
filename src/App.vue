<template>
  <div id="app" :class="{ 'dark-mode': settings.isDarkMode, 'debug-mode': settings.debugMode }">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
    
    <!-- Toast Container -->
    <ToastContainer />
    
    <!-- Keyboard Shortcuts Listener -->
    <KeyboardShortcuts v-if="settings.shortcutsEnabled" />
    
    <!-- Performance Monitor (nur im Debug-Modus) -->
    <PerformanceMonitor v-if="settings.showPerformanceMetrics" />
    
    <!-- Global Text Edit Modal -->
    <!-- Das Modal ist global verfügbar und kann von überall geöffnet werden -->
    <TextEditModal
      v-if="textModal.isModalOpen.value"
      :text="textModal.editingText.value"
      @editor-text-save="handleTextSave"
      @close="textModal.closeModal()"
      @delete="handleTextDelete"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTextModal } from '@/composables/useTextModal'
import { i18n } from '@/i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import KeyboardShortcuts from '@/components/features/KeyboardShortcuts.vue'
import PerformanceMonitor from '@/components/dev/PerformanceMonitor.vue'
import TextEditModal from '@/components/modals/TextEditModal.vue'

// Stores & Composables
const settings = useSettingsStore()
const textModal = useTextModal()

// ResizeObserver für externe Navigation
let externalNavObserver = null

/**
 * Misst die Höhe der externen KodiniTools Navigation und setzt sie als CSS-Variable
 * Dies ermöglicht eine dynamische Anpassung der sticky Position des AppHeaders
 */
function updateExternalNavHeight() {
  // Versuche verschiedene Selektoren für die externe Navigation
  const externalNav = document.querySelector('.kodini-nav, .kodinitools-nav, #kodini-nav, header.external-nav')
    || document.querySelector('body > nav:first-child')
    || document.querySelector('body > header:first-child')

  if (externalNav && !document.getElementById('app').contains(externalNav)) {
    const height = externalNav.getBoundingClientRect().height
    document.documentElement.style.setProperty('--external-nav-height', `${height}px`)

    // Setup ResizeObserver falls noch nicht vorhanden
    if (!externalNavObserver) {
      externalNavObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = entry.contentRect.height
          document.documentElement.style.setProperty('--external-nav-height', `${newHeight}px`)
        }
      })
      externalNavObserver.observe(externalNav)
    }
  }
}

// Watchers - settings.locale ist die einzige Quelle der Wahrheit
// Direkter Zugriff auf die globale i18n-Instanz für zuverlässige Synchronisierung
watch(() => settings.locale, (newLocale) => {
  i18n.global.locale.value = newLocale
  document.documentElement.setAttribute('lang', newLocale)
  console.log('🌍 i18n locale geändert:', newLocale)
}, { immediate: true })

watch(() => settings.theme, (newTheme) => {
  const theme = newTheme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : newTheme
  document.documentElement.setAttribute('data-theme', theme)
})

// Event Handlers
function handleTextSave(textData) {
  try {
    textModal.saveText(textData)
    console.log('✅ Text gespeichert:', textData)
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error)
    alert('Fehler beim Speichern des Textes: ' + error.message)
  }
}

function handleTextDelete() {
  try {
    if (textModal.editingText.value?.id) {
      textModal.deleteText(textModal.editingText.value.id)
      console.log('✅ Text gelöscht')
    }
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error)
    alert('Fehler beim Löschen des Textes: ' + error.message)
  }
}

// Lifecycle
onMounted(() => {
  console.log('🚀 Vue Bildkonverter Pro gestartet')

  // Initiale Sprache setzen (redundant durch immediate: true im Watcher, aber sicherheitshalber)
  i18n.global.locale.value = settings.locale
  document.documentElement.setAttribute('lang', settings.locale)

  // Externe Navigation messen und CSS-Variable setzen
  updateExternalNavHeight()
  // Erneut nach kurzer Verzögerung prüfen (falls externe Navigation verzögert lädt)
  setTimeout(updateExternalNavHeight, 100)

  // Online/Offline Events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Debug-Info
  if (settings.debugMode) {
    console.log('📊 Debug-Modus aktiv')
    console.log('🎨 Theme:', settings.theme)
    console.log('🌐 Locale:', settings.locale)
  }
})

onUnmounted(() => {
  // ResizeObserver aufräumen
  if (externalNavObserver) {
    externalNavObserver.disconnect()
    externalNavObserver = null
  }

  // Event Listeners entfernen
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

function handleOnline() {
  console.log('🌐 Online')
}

function handleOffline() {
  console.log('📴 Offline')
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/global.scss';

#app {
  // min-height etwas größer als Viewport, damit Seite immer scrollbar ist
  // und AppHeader sticky unter externer Navigation funktioniert
  min-height: calc(100vh + 1px);
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg);

  // Minimaler Scroll-Bereich, damit AppHeader sticky funktioniert
  &::after {
    content: '';
    display: block;
    height: 1px;
  }

  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
