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

// Observer für externe Navigation
let externalNavObserver = null
let domMutationObserver = null

// ─── Übersetzungen für die externe SSI-Navigation ───
// Muss mit nav.html synchron gehalten werden
const navTranslations = {
  de: {
    'nav.aria':           'Hauptnavigation',
    'nav.audiotools':     'Audiotools',
    'nav.mp3converter':   'MP3 Konverter',
    'nav.audioequalizer': 'Interactive Audio Equalizer',
    'nav.modernplayer':   'Moderner Musikplayer',
    'nav.ultimateplayer': 'Ultimativer Musikplayer',
    'nav.playlistgen':    'Audio Playlist Generator',
    'nav.playlistconv':   'Audio Playlist Konverter',
    'nav.alarmtool':      'Modernes Alarmtool',
    'nav.normalizer':     'Audio Normalizer',
    'nav.visualizer':     'Audio Visualizer',
    'nav.eq19':           '19 Band Equalizer',
    'nav.audioconv':      'Audio Konverter',
    'nav.imagetools':     'Bildtools',
    'nav.imageconv':      'Bildkonverter',
    'nav.batchedit':      'Bildserie bearbeiten',
    'nav.collage':        'Fotocollage',
    'nav.tools':          'Tools',
    'nav.colorextractor': 'Kodini Farbextraktor',
    'nav.videoconv':      'Videokonverter',
    'nav.contact':        'Kontakt',
    'nav.themeAria':      'Theme wechseln',
    'nav.themeTitle':     'Hell/Dunkel umschalten',
    'nav.langAria':       'Sprache wählen'
  },
  en: {
    'nav.aria':           'Main Navigation',
    'nav.audiotools':     'Audio Tools',
    'nav.mp3converter':   'MP3 Converter',
    'nav.audioequalizer': 'Interactive Audio Equalizer',
    'nav.modernplayer':   'Modern Music Player',
    'nav.ultimateplayer': 'Ultimate Music Player',
    'nav.playlistgen':    'Audio Playlist Generator',
    'nav.playlistconv':   'Audio Playlist Converter',
    'nav.alarmtool':      'Modern Alarm Tool',
    'nav.normalizer':     'Audio Normalizer',
    'nav.visualizer':     'Audio Visualizer',
    'nav.eq19':           '19 Band Equalizer',
    'nav.audioconv':      'Audio Converter',
    'nav.imagetools':     'Image Tools',
    'nav.imageconv':      'Image Converter',
    'nav.batchedit':      'Batch Image Editor',
    'nav.collage':        'Photo Collage',
    'nav.tools':          'Tools',
    'nav.colorextractor': 'Kodini Color Extractor',
    'nav.videoconv':      'Video Converter',
    'nav.contact':        'Contact',
    'nav.themeAria':      'Toggle theme',
    'nav.themeTitle':     'Switch Light/Dark',
    'nav.langAria':       'Select language'
  }
}

/**
 * Dispatcht das 'language-changed' Event und aktualisiert SSI-Elemente
 * mit data-lang-de / data-lang-en Attributen.
 *
 * SSI-Muster: <span data-lang-de="Deutscher Text" data-lang-en="English text"></span>
 * → textContent wird auf den Wert des aktiven Sprach-Attributs gesetzt.
 */
function dispatchLanguageChanged(lang) {
  // MutationObserver temporär disconnecten, da SSI-Partials auf das Event
  // reagieren und DOM-Änderungen auslösen können → sonst Endlosschleife
  if (domMutationObserver) domMutationObserver.disconnect()

  // Custom-Event auf window (konsistent mit theme-changed) für SSI-Partials
  window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))

  // data-lang-* Attribut-Wert → textContent
  const attr = `data-lang-${lang}`
  document.querySelectorAll(`[${attr}]`).forEach(el => {
    const text = el.getAttribute(attr)
    if (text) el.textContent = text
  })

  // MutationObserver wieder aktivieren
  if (domMutationObserver) {
    domMutationObserver.observe(document.body, { childList: true, subtree: true })
  }
}

/**
 * Übersetzt die externe SSI-Navigation (data-nav-i18n Attribute).
 * Da e.stopImmediatePropagation() den eigenen Handler der nav.html blockiert,
 * muss die Vue-App die Übersetzung der Nav-Elemente selbst übernehmen.
 */
function translateExternalNav(lang) {
  const t = navTranslations[lang] || navTranslations['de']
  const nav = document.querySelector('.global-nav')
  if (!nav) return

  // MutationObserver temporär disconnecten, da textContent-Änderungen
  // childList-Mutationen erzeugen und sonst eine Endlosschleife entsteht
  if (domMutationObserver) domMutationObserver.disconnect()

  nav.querySelectorAll('[data-nav-i18n]').forEach(el => {
    const key = el.getAttribute('data-nav-i18n')
    if (t[key]) el.textContent = t[key]
  })

  nav.querySelectorAll('[data-nav-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-nav-i18n-aria')
    if (t[key]) el.setAttribute('aria-label', t[key])
  })

  nav.querySelectorAll('[data-nav-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-nav-i18n-title')
    if (t[key]) el.setAttribute('title', t[key])
  })

  // MutationObserver wieder aktivieren
  if (domMutationObserver) {
    domMutationObserver.observe(document.body, { childList: true, subtree: true })
  }
}

/**
 * Misst die Höhe der externen KodiniTools Navigation und setzt sie als CSS-Variable
 * Dies ermöglicht eine dynamische Anpassung der sticky Position des AppHeaders
 */
function updateExternalNavHeight() {
  // Versuche verschiedene Selektoren für die externe Navigation
  // Priorität: external-nav-wrapper > kodini-nav Varianten > generische nav/header
  const externalNav = document.querySelector('.external-nav-wrapper')
    || document.querySelector('.kodini-nav, .kodinitools-nav, #kodini-nav, header.external-nav')
    || document.querySelector('body > nav:first-child')
    || document.querySelector('body > header:first-child')

  if (externalNav && !document.getElementById('app').contains(externalNav)) {
    // Messe das erste Kind-Element (nav/header) falls vorhanden, sonst den Wrapper selbst
    const navElement = externalNav.querySelector('nav, header') || externalNav
    const height = navElement.getBoundingClientRect().height

    // Setze die CSS-Variable für die Höhe (wird von AppHeader für sticky top verwendet)
    document.documentElement.style.setProperty('--external-nav-height', `${height}px`)

    // Setup ResizeObserver falls noch nicht vorhanden
    if (!externalNavObserver) {
      externalNavObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = entry.contentRect.height
          document.documentElement.style.setProperty('--external-nav-height', `${newHeight}px`)
        }
      })
      externalNavObserver.observe(navElement)
    }
  }
}

// Watchers - settings.locale ist die einzige Quelle der Wahrheit
// Direkter Zugriff auf die globale i18n-Instanz für zuverlässige Synchronisierung
watch(() => settings.locale, (newLocale) => {
  i18n.global.locale.value = newLocale
  document.documentElement.setAttribute('lang', newLocale)
  // SSI-Nav Buttons synchronisieren
  syncExternalLangButtons(newLocale)
  // SSI-Nav Texte übersetzen (da stopImmediatePropagation den nav.html-Handler blockiert)
  translateExternalNav(newLocale)
  // SSI-Partials über Sprachwechsel informieren (cookie-banner, footer etc.)
  dispatchLanguageChanged(newLocale)
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

// Listener für Theme-Wechsel über globale Navigation (SSI include)
function handleGlobalThemeChange(e) {
  const newTheme = e.detail?.theme
  if (newTheme && newTheme !== settings.theme) {
    settings.setTheme(newTheme)
  }
}

/**
 * Fängt Klicks auf die Sprach-Buttons der externen SSI-Navigation ab,
 * verhindert den Reload und steuert die Sprache über den Vue-Store.
 */
const langBtnAbortController = new AbortController()
const interceptedLangBtns = new WeakSet()

function interceptExternalLangSwitcher() {
  const langBtns = document.querySelectorAll('.global-nav-lang-btn')
  if (!langBtns.length) return

  langBtns.forEach(btn => {
    if (interceptedLangBtns.has(btn)) return
    interceptedLangBtns.add(btn)

    btn.addEventListener('click', (e) => {
      // Reload der SSI-Navigation verhindern
      e.preventDefault()
      e.stopImmediatePropagation()

      const targetLang = btn.getAttribute('data-lang')
      if (!targetLang || targetLang === settings.locale) return

      // Sprachänderung über den Vue-Store (aktualisiert i18n reaktiv)
      settings.setLocale(targetLang)

      // Button-Active-States in der SSI-Nav synchronisieren
      syncExternalLangButtons(targetLang)
    }, { capture: true, signal: langBtnAbortController.signal })
  })

  // Initialen Active-State setzen
  syncExternalLangButtons(settings.locale)
}

function syncExternalLangButtons(activeLang) {
  const langBtns = document.querySelectorAll('.global-nav-lang-btn')
  langBtns.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang')
    btn.classList.toggle('active', btnLang === activeLang)
  })
}

// Lifecycle
onMounted(() => {
  console.log('🚀 Vue Bildkonverter Pro gestartet')

  // Initiale Sprache setzen (redundant durch immediate: true im Watcher, aber sicherheitshalber)
  i18n.global.locale.value = settings.locale
  document.documentElement.setAttribute('lang', settings.locale)

  // Auf Theme-Wechsel der globalen Navigation hören
  window.addEventListener('theme-changed', handleGlobalThemeChange)

  // Sprach-Buttons der SSI-Navigation abfangen (Reload verhindern)
  interceptExternalLangSwitcher()

  // Externe Navigation messen und CSS-Variable setzen
  updateExternalNavHeight()
  // Erneut nach kurzer Verzögerung prüfen (falls externe Navigation verzögert lädt)
  setTimeout(updateExternalNavHeight, 100)
  setTimeout(updateExternalNavHeight, 500)

  // MutationObserver für dynamisch geladene externe Navigation
  domMutationObserver = new MutationObserver((mutations) => {
    // Prüfe ob relevante Nodes hinzugefügt wurden (nicht nur Text-Änderungen)
    const hasRelevantChanges = mutations.some(m =>
      m.type === 'childList' && m.addedNodes.length > 0 &&
      Array.from(m.addedNodes).some(n => n.nodeType === Node.ELEMENT_NODE)
    )
    if (!hasRelevantChanges) return

    // Observer pausieren um Endlos-Schleifen zu verhindern:
    // translateExternalNav und dispatchLanguageChanged modifizieren DOM-Nodes,
    // was ohne Pause den Observer erneut triggern würde.
    domMutationObserver.disconnect()

    updateExternalNavHeight()
    interceptExternalLangSwitcher()
    translateExternalNav(settings.locale)
    dispatchLanguageChanged(settings.locale)

    // Observer nach kurzem Delay wieder aktivieren (nach DOM-Settle)
    requestAnimationFrame(() => {
      if (domMutationObserver) {
        domMutationObserver.observe(document.body, { childList: true, subtree: true })
      }
    })
  })
  domMutationObserver.observe(document.body, { childList: true, subtree: true })

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

  // MutationObserver aufräumen
  if (domMutationObserver) {
    domMutationObserver.disconnect()
    domMutationObserver = null
  }

  // Event Listeners entfernen
  window.removeEventListener('theme-changed', handleGlobalThemeChange)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)

  // SSI-Nav Interception aufräumen
  langBtnAbortController.abort()
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
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-gradient) 100%);
  background-attachment: fixed;
  color: var(--color-text);
  transition: background 0.3s ease, color 0.3s ease;
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
