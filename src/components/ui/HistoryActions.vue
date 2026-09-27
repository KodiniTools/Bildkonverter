<template>
  <div class="history-actions" :class="{ 'history-actions--compact': compact }">
    <button
      type="button"
      class="btn-history btn-undo"
      :disabled="!canUndo"
      :title="undoTitle || $t('common.undo')"
      @click="emit('undo')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7v6h6" />
        <path d="M3 13C5.33 7.5 10 4 16 4a9 9 0 0 1 0 18H8" />
      </svg>
      <span class="btn-history__label">{{ $t('common.undo') }}</span>
    </button>
    <button
      type="button"
      class="btn-history btn-redo"
      :disabled="!canRedo"
      :title="redoTitle || $t('common.redo')"
      @click="emit('redo')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 7v6h-6" />
        <path d="M21 13C18.67 7.5 14 4 8 4a9 9 0 0 0 0 18h8" />
      </svg>
      <span class="btn-history__label">{{ $t('common.redo') }}</span>
    </button>
    <button
      v-if="resetLabel"
      type="button"
      class="btn-history btn-reset"
      :disabled="!canReset"
      :title="resetLabel"
      @click="emit('reset')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      <span class="btn-history__label">{{ resetLabel }}</span>
    </button>
    <slot />
  </div>
</template>

<script setup>
/**
 * HistoryActions – Zeile aus beschrifteten Rückgängig-/Wiederholen-Buttons
 * (optional Zurücksetzen), Muster aus dem Visualizer. Weitere Buttons im
 * gleichen Stil können über den Default-Slot angehängt werden.
 */
defineProps({
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  /** Tooltip, z. B. mit Tastenkürzel; sonst die Beschriftung. */
  undoTitle: { type: String, default: '' },
  redoTitle: { type: String, default: '' },
  /** Beschriftung des Zurücksetzen-Buttons; ohne Angabe kein Button. */
  resetLabel: { type: String, default: '' },
  canReset: { type: Boolean, default: true },
  /** Inhaltsbreite statt gleich breiter Buttons (für Kopf-/Werkzeugleisten). */
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['undo', 'redo', 'reset']);
</script>
