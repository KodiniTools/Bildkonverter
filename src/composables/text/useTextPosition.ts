import { computed, ref, watch, type Ref } from 'vue';
import type { EditorText } from './types';

export interface TextPositionOptions {
  selectedText: Ref<EditorText | null | undefined>;
  canvasWidth: Ref<number>;
  canvasHeight: Ref<number>;
}

/**
 * X/Y-Regler des Text-Panels: gerundete Position, Reglerbereich und die
 * Position beim Auswählen (Ziel des Rückgängig-Buttons im SliderField).
 */
export function useTextPosition({ selectedText, canvasWidth, canvasHeight }: TextPositionOptions) {
  // Position: Werte aus dem Canvas-Drag können gebrochen sein → gerundet anzeigen
  const posX = computed(() => Math.round(Number(selectedText.value?.x) || 0));
  const posY = computed(() => Math.round(Number(selectedText.value?.y) || 0));

  // Reglerbereich = Canvas; liegt der Text (per Drag) außerhalb, wird der
  // Bereich erweitert, damit der aktuelle Wert nicht abgeschnitten wird.
  const rangeX = computed(() => ({
    min: Math.min(0, posX.value),
    max: Math.max(1, canvasWidth.value, posX.value),
  }));
  const rangeY = computed(() => ({
    min: Math.min(0, posY.value),
    max: Math.max(1, canvasHeight.value, posY.value),
  }));

  // Position beim Auswählen des Textes merken – Ziel des Rückgängig-Buttons (↺)
  const startPos = ref({ x: 0, y: 0 });
  watch(
    () => selectedText.value?.id,
    () => {
      startPos.value = { x: posX.value, y: posY.value };
    },
    { immediate: true }
  );

  return { posX, posY, rangeX, rangeY, startPos };
}
