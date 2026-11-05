import { computed } from 'vue';
import type { HistoryHandlers, ImageStoreContext } from './types';

/**
 * Delegation an die Editor-Historie (useEditorHistory). Es gibt genau eine
 * Undo/Redo-Historie; ohne registrierten Editor haben die Aufrufe keinen Effekt.
 */
export function useHistoryDelegate({
  historyHandlers,
}: Pick<ImageStoreContext, 'historyHandlers'>) {
  const canUndo = computed(() => historyHandlers.value?.canUndo.value ?? false);
  const canRedo = computed(() => historyHandlers.value?.canRedo.value ?? false);
  const historyIndex = computed(() => historyHandlers.value?.historyIndex.value ?? -1);
  const historyLength = computed(() => historyHandlers.value?.history.value.length ?? 0);

  /**
   * Registriert die Editor-Historie. Übergeben wird das Objekt aus
   * useEditorHistory (saveHistory, undo, redo, canUndo, canRedo, history,
   * historyIndex); null hebt die Registrierung auf (Editor verlassen).
   */
  function registerHistory(handlers: HistoryHandlers | null) {
    historyHandlers.value = handlers;
  }

  /** Schreibt einen Snapshot in die Editor-Historie (ohne Editor: kein Effekt) */
  function saveState(description = '') {
    historyHandlers.value?.saveHistory(description);
  }

  function undo() {
    historyHandlers.value?.undo();
  }

  function redo() {
    historyHandlers.value?.redo();
  }

  return { canUndo, canRedo, historyIndex, historyLength, registerHistory, saveState, undo, redo };
}
