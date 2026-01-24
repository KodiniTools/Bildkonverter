/**
 * useTextHistory.js - Composable für Text-spezifische Undo/Redo-Funktionalität
 *
 * Verwaltet eine separate History für Textänderungen mit bis zu 50 Schritten
 */

import { ref, computed } from 'vue'

const MAX_HISTORY_SIZE = 50

/**
 * Composable für Text-History
 * @param {Object} options - Konfigurationsoptionen
 * @param {Function} options.getTexts - Funktion zum Abrufen der aktuellen Texte
 * @param {Function} options.setTexts - Funktion zum Setzen der Texte
 * @param {Function} options.getSelectedTextId - Funktion zum Abrufen der ausgewählten Text-ID
 * @param {Function} options.setSelectedTextId - Funktion zum Setzen der ausgewählten Text-ID
 */
export function useTextHistory(options) {
  const { getTexts, setTexts, getSelectedTextId, setSelectedTextId } = options

  // History state
  const history = ref([])
  const historyIndex = ref(-1)
  const isUndoRedoAction = ref(false)

  // Computed properties
  const canUndoText = computed(() => historyIndex.value > 0)
  const canRedoText = computed(() => historyIndex.value < history.value.length - 1)

  /**
   * Erstellt einen Snapshot des aktuellen Text-Zustands
   */
  function createSnapshot() {
    const texts = getTexts()
    const selectedId = getSelectedTextId()

    return {
      texts: JSON.parse(JSON.stringify(texts || [])),
      selectedTextId: selectedId
    }
  }

  /**
   * Speichert den aktuellen Zustand in der History
   */
  function saveTextHistory() {
    if (isUndoRedoAction.value) return

    const snapshot = createSnapshot()

    // Entferne alle Redo-States wenn wir nicht am Ende sind
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Füge neuen State hinzu
    history.value.push(snapshot)

    // Begrenze die History-Größe
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  /**
   * Initialisiert die History mit dem aktuellen Zustand
   */
  function initTextHistory() {
    history.value = [createSnapshot()]
    historyIndex.value = 0
  }

  /**
   * Macht die letzte Textänderung rückgängig
   */
  function undoText() {
    if (!canUndoText.value) return

    isUndoRedoAction.value = true
    historyIndex.value--

    const snapshot = history.value[historyIndex.value]

    // Stelle den Zustand wieder her
    setTexts(JSON.parse(JSON.stringify(snapshot.texts)))
    setSelectedTextId(snapshot.selectedTextId)

    // Flag zurücksetzen
    setTimeout(() => {
      isUndoRedoAction.value = false
    }, 0)
  }

  /**
   * Stellt die letzte rückgängig gemachte Änderung wieder her
   */
  function redoText() {
    if (!canRedoText.value) return

    isUndoRedoAction.value = true
    historyIndex.value++

    const snapshot = history.value[historyIndex.value]

    // Stelle den Zustand wieder her
    setTexts(JSON.parse(JSON.stringify(snapshot.texts)))
    setSelectedTextId(snapshot.selectedTextId)

    // Flag zurücksetzen
    setTimeout(() => {
      isUndoRedoAction.value = false
    }, 0)
  }

  /**
   * Löscht die gesamte History
   */
  function clearTextHistory() {
    history.value = []
    historyIndex.value = -1
  }

  return {
    // State
    canUndoText,
    canRedoText,
    historyIndex,
    historyLength: computed(() => history.value.length),

    // Methods
    saveTextHistory,
    initTextHistory,
    undoText,
    redoText,
    clearTextHistory
  }
}
