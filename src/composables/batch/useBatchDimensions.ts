import { watch, type Ref } from 'vue';
import type { BatchSettings } from './types';

/**
 * Breite/Höhe der Batch-Einstellungen: Mit „Seitenverhältnis beibehalten“
 * folgt die jeweils andere Seite dem Seitenverhältnis des ersten Bildes.
 */
export function useBatchDimensions(
  settings: Ref<BatchSettings>,
  referenceAspectRatio: Ref<number | null>
) {
  function onWidthInput() {
    const s = settings.value;
    const ratio = referenceAspectRatio.value;
    if (!s.maintainAspect || !s.width || !ratio) return;
    s.height = Math.max(1, Math.round(s.width / ratio));
  }

  function onHeightInput() {
    const s = settings.value;
    const ratio = referenceAspectRatio.value;
    if (!s.maintainAspect || !s.height || !ratio) return;
    s.width = Math.max(1, Math.round(s.height * ratio));
  }

  // Beim Einschalten von „Seitenverhältnis beibehalten“ die Höhe aus der Breite ableiten
  watch(
    () => settings.value.maintainAspect,
    (on) => {
      if (on) onWidthInput();
    }
  );

  return { onWidthInput, onHeightInput };
}
