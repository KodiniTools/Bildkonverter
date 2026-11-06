/**
 * useBackgroundRemoval
 *
 * „Hintergrund entfernen“ im Editor: segmentiert das (ungefilterte) Bild mit
 * dem KI-Modell im Browser und ersetzt es durch eine Version mit transparentem
 * Hintergrund. Filter bleiben live editierbar, Rückgängig stellt das Original
 * wieder her. Damit die Transparenz sichtbar und beim Export erhalten bleibt,
 * wird die Hintergrundfarbe ausgeblendet und der Export auf PNG mit
 * Transparenz gestellt.
 *
 * @param {object}   deps
 * @param {import('vue').Ref} deps.currentImage
 * @param {import('vue').Ref<boolean>} deps.isCollageMode
 * @param {import('vue').Ref} deps.background        background-Ref aus useFilterManagement
 * @param {import('vue').Ref<string>} deps.outputFormat
 * @param {import('vue').Ref<boolean>} deps.exportTransparent
 * @param {Function} deps.renderImage
 * @param {Function} [deps.updateImageSize]
 * @param {Function} deps.saveHistory
 * @param {Function} deps.t
 * @param {Function} [deps.remove]  Ersatz für removeBackground (Tests)
 */
import { computed, ref } from 'vue';
import {
  MODEL_SIZE_MB,
  isBackgroundRemovalSupported,
  removeBackground,
} from '@/lib/backgroundRemoval';
import { loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

export function useBackgroundRemoval({
  currentImage,
  isCollageMode,
  background,
  outputFormat,
  exportTransparent,
  renderImage,
  updateImageSize,
  saveHistory,
  t,
  remove = removeBackground,
}) {
  const busy = ref(false);
  const phase = ref(null);
  const fraction = ref(null);
  const available = isBackgroundRemovalSupported();

  /** Zustand für das Panel */
  const state = computed(() => ({
    available,
    busy: busy.value,
    phase: phase.value,
    fraction: fraction.value,
    modelSizeMb: MODEL_SIZE_MB,
  }));

  /** @returns {Promise<boolean>} true, wenn der Hintergrund entfernt wurde */
  async function removeImageBackground() {
    if (busy.value || !currentImage.value) return false;
    if (isCollageMode?.value) {
      window.$toast?.info(t('toast.editor.backgroundCollage'));
      return false;
    }
    busy.value = true;
    phase.value = null;
    fraction.value = null;
    try {
      const result = await remove(currentImage.value, (p) => {
        phase.value = p.phase;
        fraction.value = p.fraction ?? null;
      });
      const img = await loadImage(result.toDataURL('image/png'));

      currentImage.value = img;
      // Transparenz sichtbar machen und beim Export behalten
      background.value = { ...background.value, opacity: 0 };
      if (outputFormat.value !== 'png' && outputFormat.value !== 'webp') outputFormat.value = 'png';
      if (outputFormat.value === 'png') exportTransparent.value = true;

      renderImage();
      if (updateImageSize) updateImageSize();
      saveHistory();
      window.$toast?.success(t('toast.editor.backgroundRemoved'));
      return true;
    } catch (error) {
      logger.error('Hintergrund entfernen fehlgeschlagen:', error);
      window.$toast?.error(t('toast.editor.backgroundRemoveFailed'));
      return false;
    } finally {
      busy.value = false;
      phase.value = null;
      fraction.value = null;
    }
  }

  return { bgRemovalState: state, removeImageBackground };
}
