import { ref } from 'vue';

/**
 * Dateinamen-Abfrage vor dem Download, wenn der Browser keinen
 * Speichern-unter-Dialog hat (Firefox, Safari). Globaler Zustand wie
 * useConfirm, angezeigt von SaveAsDialog.vue in App.vue.
 */
interface SavePromptState {
  visible: boolean;
  filename: string;
  resolve: ((value: string | null) => void) | null;
}

const state = ref<SavePromptState>({
  visible: false,
  filename: '',
  resolve: null,
});

export function useSavePrompt() {
  /** @returns eingegebener Name; null = abgebrochen */
  function prompt(suggestedName: string): Promise<string | null> {
    // Eine noch offene Abfrage gilt als abgebrochen
    state.value.resolve?.(null);
    return new Promise((resolve) => {
      state.value = { visible: true, filename: suggestedName || '', resolve };
    });
  }

  function respond(result: string | null): void {
    const { resolve } = state.value;
    state.value = { ...state.value, visible: false, resolve: null };
    resolve?.(result);
  }

  return { prompt, respond, state };
}
