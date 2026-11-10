/**
 * useImageHistory Composable
 * Verwaltet Undo/Redo-Funktionalität für Bildbearbeitung
 */
import { ref, computed, type Ref } from 'vue';

/** Gespeicherter Zustand plus Zeitstempel */
export type HistoryEntry<S extends object> = S & { timestamp: number };

export interface ImageHistoryOptions<S extends object> {
  /** Maximale Anzahl der History-Einträge (Standard: 50) */
  maxHistorySize?: number;
  /** Callback beim Wiederherstellen eines States */
  onRestore?: (state: HistoryEntry<S>) => void;
}

export interface HistoryListItem {
  index: number;
  timestamp: number;
  isCurrent: boolean;
}

/**
 * Composable für Image-History Management
 * @typeParam S - Form eines gespeicherten Zustands (z. B. Canvas-Daten, Filter, Texte)
 */
export function useImageHistory<S extends object = Record<string, unknown>>(
  options: ImageHistoryOptions<S> = {}
) {
  const { maxHistorySize = 50, onRestore } = options;

  // Reaktive State (Ref-Typ ausdrücklich, damit generische Einträge nicht entpackt werden)
  const history = ref([]) as Ref<HistoryEntry<S>[]>;
  const historyIndex = ref(-1);

  // Computed
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  const currentState = computed(() => {
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      return history.value[historyIndex.value];
    }
    return null;
  });
  const historyLength = computed(() => history.value.length);

  /**
   * Speichert einen neuen State in der History
   * (z. B. canvasData, filters, background, transforms, texts, dimensions)
   */
  function saveState(state: S): void {
    // Entferne alle States nach dem aktuellen Index (Redo-History löschen)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    // Füge neuen State hinzu
    history.value.push({
      ...state,
      timestamp: Date.now(),
    } as HistoryEntry<S>);

    // Begrenze History-Größe
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(-maxHistorySize);
    }

    // Setze Index auf letzten Eintrag
    historyIndex.value = history.value.length - 1;
  }

  /**
   * Undo - Gehe einen Schritt zurück
   * @returns Vorheriger State oder null
   */
  function undo(): HistoryEntry<S> | null {
    if (!canUndo.value) {
      return null;
    }

    historyIndex.value--;
    const state = history.value[historyIndex.value];

    if (onRestore && state) {
      onRestore(state);
    }

    return state;
  }

  /**
   * Redo - Gehe einen Schritt vorwärts
   * @returns Nächster State oder null
   */
  function redo(): HistoryEntry<S> | null {
    if (!canRedo.value) {
      return null;
    }

    historyIndex.value++;
    const state = history.value[historyIndex.value];

    if (onRestore && state) {
      onRestore(state);
    }

    return state;
  }

  /**
   * Springt zu einem bestimmten History-Index
   * @returns State am Index oder null
   */
  function goToIndex(index: number): HistoryEntry<S> | null {
    if (index < 0 || index >= history.value.length) {
      return null;
    }

    historyIndex.value = index;
    const state = history.value[index];

    if (onRestore && state) {
      onRestore(state);
    }

    return state;
  }

  /**
   * Löscht die gesamte History
   */
  function clearHistory(): void {
    history.value = [];
    historyIndex.value = -1;
  }

  /**
   * Ersetzt den aktuellen State (ohne neuen History-Eintrag)
   */
  function replaceCurrentState(state: S): void {
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      history.value[historyIndex.value] = {
        ...state,
        timestamp: Date.now(),
      } as HistoryEntry<S>;
    }
  }

  /**
   * Gibt die History als Array zurück (für Debug/Export)
   * @returns Kopie der History
   */
  function getHistoryList(): HistoryListItem[] {
    return history.value.map((state, index) => ({
      index,
      timestamp: state.timestamp,
      isCurrent: index === historyIndex.value,
    }));
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
    getHistoryList,
  };
}

export default useImageHistory;
