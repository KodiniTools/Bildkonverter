/**
 * useBackgroundRemoval
 *
 * „Hintergrund entfernen“ im Editor: segmentiert das (ungefilterte) Bild mit
 * dem KI-Modell im Browser und ersetzt es durch eine Version mit transparentem
 * Hintergrund. Filter bleiben live editierbar, Rückgängig stellt das Original
 * wieder her. Damit die Transparenz sichtbar und beim Export erhalten bleibt,
 * wird die Hintergrundfarbe ausgeblendet und der Export auf PNG mit
 * Transparenz gestellt.
 */
import { computed, ref, type Ref } from 'vue';
import type { EditorBackground } from '@/composables/useFilterManagement';
import type { EditorImage, Translate } from './types';
import {
  MODEL_SIZE_MB,
  isBackgroundRemovalSupported,
  removeBackground,
  type RemovalPhase,
} from '@/lib/backgroundRemoval';
import { loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

export interface BackgroundRemovalDeps {
  currentImage: Ref<EditorImage | null>;
  isCollageMode?: Ref<boolean>;
  /** background-Ref aus useFilterManagement */
  background: Ref<EditorBackground>;
  outputFormat: Ref<string>;
  exportTransparent: Ref<boolean>;
  renderImage: () => void;
  updateImageSize?: () => void;
  saveHistory: () => void;
  t: Translate;
  /** Ersatz für removeBackground (Tests) */
  remove?: typeof removeBackground;
}

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
}: BackgroundRemovalDeps) {
  const busy = ref(false);
  const phase = ref<RemovalPhase | null>(null);
  const fraction = ref<number | null>(null);
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
