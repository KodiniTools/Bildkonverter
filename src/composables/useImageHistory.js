/**
 * useImageHistory Composable
 * Verwaltet Undo/Redo-Funktionalität für Bildbearbeitung
 */
import { ref, computed } from 'vue'

/**
 * Composable für Image-History Management
 * @param {Object} options - Optionen
 * @param {number} options.maxHistorySize - Maximale Anzahl der History-Einträge (Standard: 50)
 * @param {Function} options.onRestore - Callback beim Wiederherstellen eines States
 * @returns {Object} History-State und Methoden
 */
export function useImageHistory(options = {}) {
  const { maxHistorySize = 50, onRestore } = options

  // Reaktive State
  const history = ref([])
  const historyIndex = ref(-1)

  // Computed
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const currentState = computed(() => {
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      return history.value[historyIndex.value]
    }
    return null
  })
  const historyLength = computed(() => history.value.length)

  /**
   * Speichert einen neuen State in der History
   * @param {Object} state - Zu speichernder State
   * @param {Object} state.canvasData - Canvas-Daten (DataURL oder ImageData)
   * @param {Object} state.filters - Filter-State
   * @param {Object} state.background - Hintergrund-State
   * @param {Object} state.transforms - Transform-State
   * @param {Array} state.texts - Text-Objekte
   * @param {Object} state.dimensions - Bild-Dimensionen
   */
  function saveState(state) {
    // Entferne alle States nach dem aktuellen Index (Redo-History löschen)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Füge neuen State hinzu
    history.value.push({
      ...state,
      timestamp: Date.now()
    })

    // Begrenze History-Größe
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(-maxHistorySize)
    }

    // Setze Index auf letzten Eintrag
    historyIndex.value = history.value.length - 1
  }

  /**
   * Undo - Gehe einen Schritt zurück
   * @returns {Object|null} Vorheriger State oder null
   */
  function undo() {
    if (!canUndo.value) {
      return null
    }

    historyIndex.value--
    const state = history.value[historyIndex.value]

    if (onRestore && state) {
      onRestore(state)
    }

    return state
  }

  /**
   * Redo - Gehe einen Schritt vorwärts
   * @returns {Object|null} Nächster State oder null
   */
  function redo() {
    if (!canRedo.value) {
      return null
    }

    historyIndex.value++
    const state = history.value[historyIndex.value]

    if (onRestore && state) {
      onRestore(state)
    }

    return state
  }

  /**
   * Springt zu einem bestimmten History-Index
   * @param {number} index - Ziel-Index
   * @returns {Object|null} State am Index oder null
   */
  function goToIndex(index) {
    if (index < 0 || index >= history.value.length) {
      return null
    }

    historyIndex.value = index
    const state = history.value[index]

    if (onRestore && state) {
      onRestore(state)
    }

    return state
  }

  /**
   * Löscht die gesamte History
   */
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }

  /**
   * Ersetzt den aktuellen State (ohne neuen History-Eintrag)
   * @param {Object} state - Neuer State
   */
  function replaceCurrentState(state) {
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      history.value[historyIndex.value] = {
        ...state,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Gibt die History als Array zurück (für Debug/Export)
   * @returns {Array} Kopie der History
   */
  function getHistoryList() {
    return history.value.map((state, index) => ({
      index,
      timestamp: state.timestamp,
      isCurrent: index === historyIndex.value
    }))
  }

  return {
    // State
    history,
    historyIndex,

    // Computed
    canUndo,
    canRedo,
    currentState,
    historyLength,

    // Methoden
    saveState,
    undo,
    redo,
    goToIndex,
    clearHistory,
    replaceCurrentState,
    getHistoryList
  }
}

export default useImageHistory
