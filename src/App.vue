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
import { onMounted, watch } from 'vue'
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg);
  
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
