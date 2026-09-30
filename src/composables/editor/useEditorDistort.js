/**
 * useEditorDistort
 *
 * "Verzerrung übernehmen": backt die aktuell gezogene Eck-Verzerrung in das
 * Bild (transparente Bereiche außerhalb des Vierecks), beendet den
 * Verzerr-Modus und merkt sich die Umrissform. Danach wirken Schatten,
 * abgerundete Ecken und Rahmen wieder – entlang der verzerrten Form.
 * Filter werden nicht eingebacken, sie bleiben live editierbar.
 *
 * @param {object}   deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.currentImage
 * @param {object}   deps.transform        useTransform()-Instanz
 * @param {object}   deps.resizeManager
 * @param {Function} deps.renderImage
 * @param {Function} [deps.updateImageSize]
 * @param {Function} deps.saveHistory
 * @param {Function} deps.t
 */
import { ref } from 'vue';
import { bakeDistortion } from '@/utils/warpImage';
import { loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

export function useEditorDistort({
  canvas,
  currentImage,
  transform,
  resizeManager,
  renderImage,
  updateImageSize,
  saveHistory,
  t,
}) {
  const isApplyingDistort = ref(false);

  /** @returns {Promise<boolean>} true, wenn die Verzerrung übernommen wurde */
  async function applyDistortion() {
    if (isApplyingDistort.value) return false;
    if (!canvas.value || !currentImage.value || !transform.hasDistortion.value) return false;

    const tf = transform.transforms.value;
    isApplyingDistort.value = true;
    try {
      const baked = bakeDistortion(currentImage.value, tf.cornerOffsets, tf.shapeQuad);
      const img = await loadImage(baked.canvas.toDataURL('image/png'));

      // Anzeigegröße im selben Maßstab wie bisher, nur auf die neue Bounding-Box
      const width = Math.max(1, Math.round(canvas.value.width * baked.spanU));
      const height = Math.max(1, Math.round(canvas.value.height * baked.spanV));

      currentImage.value = img;
      canvas.value.width = width;
      canvas.value.height = height;
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
