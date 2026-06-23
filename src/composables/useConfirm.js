import { ref } from 'vue';

const state = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  variant: 'default',
  resolve: null,
});

export function useConfirm() {
  function confirm(message, options = {}) {
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

  function respond(result) {
    const { resolve } = state.value;
    state.value = { ...state.value, visible: false, resolve: null };
    if (resolve) resolve(result);
  }

  return { confirm, respond, state };
}
