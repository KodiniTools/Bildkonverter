import { ref } from 'vue';

/** z. B. 'default' oder 'danger' (Farbe des Bestätigen-Knopfs) */
export type ConfirmVariant = string;

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  resolve: ((result: boolean) => void) | null;
}

const state = ref<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  variant: 'default',
  resolve: null,
});

export function useConfirm() {
  function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        visible: true,
        title: options.title || '',
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Abbrechen',
        variant: options.variant || 'default',
        resolve,
      };
    });
  }

  function respond(result: boolean): void {
    const { resolve } = state.value;
    state.value = { ...state.value, visible: false, resolve: null };
    if (resolve) resolve(result);
  }

  return { confirm, respond, state };
}
