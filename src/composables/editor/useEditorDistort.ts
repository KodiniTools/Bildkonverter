/**
 * useEditorDistort
 *
 * "Verzerrung übernehmen": backt die aktuell gezogene Eck-Verzerrung in das
 * Bild (transparente Bereiche außerhalb des Vierecks), beendet den
 * Verzerr-Modus und merkt sich die Umrissform. Danach wirken Schatten,
 * abgerundete Ecken und Rahmen wieder – entlang der verzerrten Form.
 * Filter werden nicht eingebacken, sie bleiben live editierbar.
 */
import { ref, type Ref } from 'vue';
import type { useTransform } from '@/composables/useTransform';
import type { useResizeManager } from '@/composables/useResizeManager';
import type { EditorImage, Translate } from './types';
import { bakeDistortion } from '@/utils/warpImage';
import { loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

export interface EditorDistortDeps {
  canvas: Ref<HTMLCanvasElement | null>;
  currentImage: Ref<EditorImage | null>;
  /** useTransform()-Instanz */
  transform: Pick<
    ReturnType<typeof useTransform>,
    'transforms' | 'hasDistortion' | 'commitDistortion'
  >;
  resizeManager: Pick<ReturnType<typeof useResizeManager>, 'initFromDimensions'>;
  renderImage: () => void;
  updateImageSize?: () => void;
  saveHistory: () => void;
  t: Translate;
}

export function useEditorDistort({
  canvas,
  currentImage,
  transform,
  resizeManager,
  renderImage,
  updateImageSize,
  saveHistory,
  t,
}: EditorDistortDeps) {
  const isApplyingDistort = ref(false);

  /** @returns {Promise<boolean>} true, wenn die Verzerrung übernommen wurde */
  async function applyDistortion() {
    if (isApplyingDistort.value) return false;
    const cv = canvas.value;
    const source = currentImage.value;
    if (!cv || !source || !transform.hasDistortion.value) return false;

    const tf = transform.transforms.value;
    isApplyingDistort.value = true;
    try {
      const baked = bakeDistortion(source, tf.cornerOffsets, tf.shapeQuad);
      const img = await loadImage(baked.canvas.toDataURL('image/png'));

      // Anzeigegröße im selben Maßstab wie bisher, nur auf die neue Bounding-Box
      const width = Math.max(1, Math.round(cv.width * baked.spanU));
      const height = Math.max(1, Math.round(cv.height * baked.spanV));

      currentImage.value = img;
      cv.width = width;
      cv.height = height;
      resizeManager.initFromDimensions(width, height);
      transform.commitDistortion(baked.shapeQuad);

      renderImage();
      if (updateImageSize) updateImageSize();
      saveHistory();
      if (window.$toast) window.$toast.success(t('toast.transform.distortApplied'));
      return true;
    } catch (error) {
      logger.error('❌ Verzerrung übernehmen fehlgeschlagen:', error);
      if (window.$toast) window.$toast.error(t('toast.transform.distortFailed'));
      return false;
    } finally {
      isApplyingDistort.value = false;
    }
  }

  return { isApplyingDistort, applyDistortion };
}
