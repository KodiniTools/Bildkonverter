import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { i18n } from '@/i18n'

/**
 * Settings Store - Verwaltet App-Einstellungen
 *
 * Dieser Store verwaltet:
 * - Theme (Light/Dark)
 * - Sprache (DE/EN)
 * - Performance-Einstellungen
 * - UI-Präferenzen
 */
export const useSettingsStore = defineStore('settings', () => {
  // ===== STATE =====

  // Theme - globale Nav nutzt 'theme', Vue App nutzte bisher 'bildkonverter-theme'
  // Priorität: globale Nav Key > alter App Key > Fallback 'light'
  const theme = ref(
    localStorage.getItem('theme') || localStorage.getItem('bildkonverter-theme') || 'light'
  )

  // Sprache - globale Nav nutzt 'locale', Vue App nutzte bisher 'bildkonverter-locale'
  // Priorität: globale Nav Key > alter App Key > Fallback 'de'
  const locale = ref(
    localStorage.getItem('locale') || localStorage.getItem('bildkonverter-locale') || 'de'
  )
  
  // Performance
  const performanceMode = ref(localStorage.getItem('bildkonverter-performance') || 'balanced')
  
  // Quality Settings
  const defaultExportQuality = ref(
    parseInt(localStorage.getItem('bildkonverter-export-quality') || '95')
  )
  const defaultExportFormat = ref(
    localStorage.getItem('bildkonverter-export-format') || 'png'
  )
  
  // UI Preferences
  const showGrid = ref(localStorage.getItem('bildkonverter-show-grid') === 'true')
  const snapToGrid = ref(localStorage.getItem('bildkonverter-snap-to-grid') === 'true')
  const gridSize = ref(parseInt(localStorage.getItem('bildkonverter-grid-size') || '20'))
  const autoSave = ref(localStorage.getItem('bildkonverter-auto-save') !== 'false')
  const autoSaveInterval = ref(
    parseInt(localStorage.getItem('bildkonverter-auto-save-interval') || '30000')
  )
  
  // Keyboard Shortcuts
  const shortcutsEnabled = ref(
    localStorage.getItem('bildkonverter-shortcuts-enabled') !== 'false'
  )
  
  // Advanced
  const debugMode = ref(false)
  const showPerformanceMetrics = ref(false)
  
  // Toast Einstellungen
  const toastDuration = ref(3000)
  const toastPosition = ref('top-right')
  
  // ===== COMPUTED =====
  
  const isDarkMode = computed(() => theme.value === 'dark')
  
  const isGerman = computed(() => locale.value === 'de')
  
  const availableThemes = computed(() => ['light', 'dark', 'auto'])
  
  const availableLocales = computed(() => ['de', 'en'])
  
  const performanceModes = computed(() => ['low', 'balanced', 'high'])
  
  const exportFormats = computed(() => ['png', 'jpg', 'jpeg', 'webp', 'gif'])
  
  // ===== ACTIONS =====
  
  /**
   * Setzt das Theme
   */
  function setTheme(newTheme) {
    if (!availableThemes.value.includes(newTheme)) {
      console.warn(`Ungültiges Theme: ${newTheme}`)
      return
    }
    
    theme.value = newTheme
    
    // Theme im DOM anwenden
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    
    // Persistieren - beide Keys für Kompatibilität mit globaler Nav
    localStorage.setItem('theme', newTheme)
    localStorage.setItem('bildkonverter-theme', newTheme)

    console.log(`🎨 Theme geändert: ${newTheme}`)
  }
  
  /**
   * Wechselt zwischen Light und Dark Theme
   */
  function toggleTheme() {
    const newTheme = isDarkMode.value ? 'light' : 'dark'
    setTheme(newTheme)
  }
  
  /**
   * Setzt die Sprache
   */
  function setLocale(newLocale) {
    if (!availableLocales.value.includes(newLocale)) {
      console.warn(`Ungültige Sprache: ${newLocale}`)
      return
    }

    locale.value = newLocale

    // i18n direkt synchronisieren - das ist der wichtigste Schritt!
    i18n.global.locale.value = newLocale
    document.documentElement.setAttribute('lang', newLocale)

    // Persistieren - beide Keys für Kompatibilität mit globaler Nav
    localStorage.setItem('locale', newLocale)
    localStorage.setItem('bildkonverter-locale', newLocale)

    console.log(`🌍 Sprache geändert: ${newLocale}, i18n.global.locale: ${i18n.global.locale.value}`)
  }
  
  /**
   * Wechselt die Sprache
   */
  function toggleLocale() {
    const newLocale = isGerman.value ? 'en' : 'de'
    setLocale(newLocale)
  }
  
  /**
   * Setzt den Performance-Modus
   */
  function setPerformanceMode(mode) {
    if (!performanceModes.value.includes(mode)) {
      console.warn(`Ungültiger Performance-Modus: ${mode}`)
      return
    }
    
    performanceMode.value = mode
    localStorage.setItem('bildkonverter-performance', mode)
    
    console.log(`⚡ Performance-Modus: ${mode}`)
  }
  
  /**
   * Setzt die Export-Qualität
   */
  function setDefaultExportQuality(quality) {
    const numQuality = parseInt(quality)
    if (numQuality < 1 || numQuality > 100) {
      console.warn(`Ungültige Qualität: ${quality}`)
      return
    }
    
    defaultExportQuality.value = numQuality
    localStorage.setItem('bildkonverter-export-quality', numQuality.toString())
  }
  
  /**
   * Setzt das Export-Format
   */
  function setDefaultExportFormat(format) {
    if (!exportFormats.value.includes(format)) {
      console.warn(`Ungültiges Format: ${format}`)
      return
    }
    
    defaultExportFormat.value = format
    localStorage.setItem('bildkonverter-export-format', format)
  }
  
  /**
   * Grid-Einstellungen
   */
  function setShowGrid(show) {
    showGrid.value = show
    localStorage.setItem('bildkonverter-show-grid', show.toString())
  }
  
  function setSnapToGrid(snap) {
    snapToGrid.value = snap
    localStorage.setItem('bildkonverter-snap-to-grid', snap.toString())
  }
  
  function setGridSize(size) {
    const numSize = parseInt(size)
    if (numSize < 5 || numSize > 100) {
      console.warn(`Ungültige Grid-Größe: ${size}`)
      return
    }
    
    gridSize.value = numSize
    localStorage.setItem('bildkonverter-grid-size', numSize.toString())
  }
  
  /**
   * Auto-Save Einstellungen
   */
  function setAutoSave(enabled) {
    autoSave.value = enabled
    localStorage.setItem('bildkonverter-auto-save', enabled.toString())
  }
  
  function setAutoSaveInterval(interval) {
    const numInterval = parseInt(interval)
    if (numInterval < 5000 || numInterval > 300000) {
      console.warn(`Ungültiges Auto-Save-Intervall: ${interval}`)
      return
    }
    
    autoSaveInterval.value = numInterval
    localStorage.setItem('bildkonverter-auto-save-interval', numInterval.toString())
  }
  
  /**
   * Keyboard Shortcuts
   */
  function setShortcutsEnabled(enabled) {
    shortcutsEnabled.value = enabled
    localStorage.setItem('bildkonverter-shortcuts-enabled', enabled.toString())
  }
  
  /**
   * Debug-Modus
   */
  function setDebugMode(enabled) {
    debugMode.value = enabled
    document.body.classList.toggle('debug-mode', enabled)
    console.log(`🐛 Debug-Modus: ${enabled ? 'aktiviert' : 'deaktiviert'}`)
  }
  
  function toggleDebugMode() {
    setDebugMode(!debugMode.value)
  }
  
  /**
   * Performance-Metriken
   */
  function setShowPerformanceMetrics(show) {
    showPerformanceMetrics.value = show
  }
  
  function togglePerformanceMetrics() {
    setShowPerformanceMetrics(!showPerformanceMetrics.value)
  }
  
  /**
   * Toast-Einstellungen
   */
  function setToastDuration(duration) {
    const numDuration = parseInt(duration)
    if (numDuration < 1000 || numDuration > 10000) {
      console.warn(`Ungültige Toast-Dauer: ${duration}`)
      return
    }
    
    toastDuration.value = numDuration
  }
  
  function setToastPosition(position) {
    const validPositions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
    if (!validPositions.includes(position)) {
      console.warn(`Ungültige Toast-Position: ${position}`)
      return
    }
    
    toastPosition.value = position
  }
  
  /**
   * Setzt alle Einstellungen zurück
   */
  function resetAllSettings() {
    // Theme
    setTheme('light')
    
    // Sprache
    setLocale('de')
    
    // Performance
    setPerformanceMode('balanced')
    
    // Export
    setDefaultExportQuality(95)
    setDefaultExportFormat('png')
    
    // UI
    setShowGrid(false)
    setSnapToGrid(false)
    setGridSize(20)
    setAutoSave(true)
    setAutoSaveInterval(30000)
    
    // Shortcuts
    setShortcutsEnabled(true)
    
    // Debug
    setDebugMode(false)
    setShowPerformanceMetrics(false)
    
    // Toast
    setToastDuration(3000)
    setToastPosition('top-right')
    
    console.log('🔄 Alle Einstellungen zurückgesetzt')
  }
  
  /**
   * Exportiert alle Einstellungen als JSON
   */
  function exportSettings() {
    return {
      theme: theme.value,
      locale: locale.value,
      performanceMode: performanceMode.value,
      defaultExportQuality: defaultExportQuality.value,
      defaultExportFormat: defaultExportFormat.value,
      showGrid: showGrid.value,
      snapToGrid: snapToGrid.value,
      gridSize: gridSize.value,
      autoSave: autoSave.value,
      autoSaveInterval: autoSaveInterval.value,
      shortcutsEnabled: shortcutsEnabled.value,
      toastDuration: toastDuration.value,
      toastPosition: toastPosition.value
    }
  }
  
  /**
   * Importiert Einstellungen aus JSON
   */
  function importSettings(settings) {
    try {
      if (settings.theme) setTheme(settings.theme)
      if (settings.locale) setLocale(settings.locale)
      if (settings.performanceMode) setPerformanceMode(settings.performanceMode)
      if (settings.defaultExportQuality) setDefaultExportQuality(settings.defaultExportQuality)
      if (settings.defaultExportFormat) setDefaultExportFormat(settings.defaultExportFormat)
      if (settings.showGrid !== undefined) setShowGrid(settings.showGrid)
      if (settings.snapToGrid !== undefined) setSnapToGrid(settings.snapToGrid)
      if (settings.gridSize) setGridSize(settings.gridSize)
      if (settings.autoSave !== undefined) setAutoSave(settings.autoSave)
      if (settings.autoSaveInterval) setAutoSaveInterval(settings.autoSaveInterval)
      if (settings.shortcutsEnabled !== undefined) setShortcutsEnabled(settings.shortcutsEnabled)
      if (settings.toastDuration) setToastDuration(settings.toastDuration)
      if (settings.toastPosition) setToastPosition(settings.toastPosition)
      
      console.log('✅ Einstellungen importiert')
    } catch (error) {
      console.error('❌ Fehler beim Import der Einstellungen:', error)
      throw error
    }
  }
  
  // ===== INITIALIZATION =====
  
  // Theme beim Start setzen
  setTheme(theme.value)
  
  // System-Theme-Änderungen beobachten
  if (theme.value === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (theme.value === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
    })
  }

  // Initiale i18n-Synchronisierung beim Store-Start
  // Das stellt sicher, dass i18n und Store von Anfang an synchron sind
  i18n.global.locale.value = locale.value
  document.documentElement.setAttribute('lang', locale.value)
  console.log(`🌍 Store initialisiert mit Sprache: ${locale.value}`)

  // ===== RETURN =====
  return {
    // State
    theme,
    locale,
    performanceMode,
    defaultExportQuality,
    defaultExportFormat,
    showGrid,
    snapToGrid,
    gridSize,
    autoSave,
    autoSaveInterval,
    shortcutsEnabled,
    debugMode,
    showPerformanceMetrics,
    toastDuration,
    toastPosition,
    
    // Computed
    isDarkMode,
    isGerman,
    availableThemes,
    availableLocales,
    performanceModes,
    exportFormats,
    
    // Actions
    setTheme,
    toggleTheme,
    setLocale,
    toggleLocale,
    setPerformanceMode,
    setDefaultExportQuality,
    setDefaultExportFormat,
    setShowGrid,
    setSnapToGrid,
    setGridSize,
    setAutoSave,
    setAutoSaveInterval,
    setShortcutsEnabled,
    setDebugMode,
    toggleDebugMode,
    setShowPerformanceMetrics,
    togglePerformanceMetrics,
    setToastDuration,
    setToastPosition,
    resetAllSettings,
    exportSettings,
    importSettings
  }
})
