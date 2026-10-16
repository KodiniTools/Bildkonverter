/**
 * useEditorExport
 *
 * Export-Dialog, Datei-Export, Drucken und die optionale Weiterleitung des
 * exportierten Bildes an ein anderes Kodini-Tool (Handoff). Ausgelagert aus
 * EditorView.vue, Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.outputFormat
 * @param {import('vue').Ref} deps.currentFileName
 * @param {object}   deps.imageStore
 * @param {Function} deps.renderImage
 * @param {Function} deps.renderImageForExport
 * @param {Function} deps.t
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { exportImage } from '@/utils/exportUtils';
import { canvasToBlob } from '@/utils/conversionUtils';
import {
  TARGET_KB_DEFAULT,
  clampTargetKb,
  encodeForExport,
  kbToBytes,
  supportsTargetSize,
  withWhiteBackground,
} from '@/utils/targetSize';
import { prepareHandoff } from '@/lib/core/handoff';
import { printImage } from '@/utils/printUtils';
import { logger } from '@/utils/logger';

export function useEditorExport({
  canvas,
  outputFormat,
  currentFileName,
  imageStore,
  renderImage,
  renderImageForExport,
  t,
}) {
  // ===== EXPORT STATE =====
  const exportQuality = ref(92); // Quality-Wert (0-100)
  const isExporting = ref(false); // Loading-State beim Export
  const exportTransparent = ref(false); // Transparenter Hintergrund beim PNG-Export
  const showExportDialog = ref(false);
  const exportDialogFilename = ref('');

  // ===== ZIEL-DATEIGRÖSSE (nur JPEG/WebP) =====
  const targetSizeEnabled = ref(false);
  const targetSizeKb = ref(TARGET_KB_DEFAULT);
  // Notfalls Abmessungen verkleinern, wenn die Mindestqualität nicht reicht
  const targetSizeDownscale = ref(false);

  const targetSizeAvailable = computed(() => supportsTargetSize(outputFormat.value));

  /** Zielgröße für den Export; null = aus, nicht unterstützt oder ungültig */
  const targetSizeOptions = computed(() => {
    if (!targetSizeEnabled.value || !targetSizeAvailable.value) return null;
    const kb = clampTargetKb(targetSizeKb.value);
    if (!kb) return null;
    return { maxBytes: kbToBytes(kb), allowDownscale: targetSizeDownscale.value };
  });

  // ===== GRÖSSENSCHÄTZUNG VORAB =====
  // Kodiert den aktuellen Canvas mit denselben Einstellungen wie der Export
  // (JPEG/WebP inkl. Zielgröße, PNG). Entprellt, weil Kodieren großer Bilder
  // spürbar dauert; veraltete Ergebnisse werden verworfen.
  const sizeEstimate = ref(null);
  const isEstimating = ref(false);
  let estimateTimer = null;
  let estimateRequest = 0;

  function estimatableFormat() {
    return outputFormat.value === 'png' || targetSizeAvailable.value;
  }

  async function runEstimate() {
    estimateTimer = null;
    const request = ++estimateRequest;
    const source = canvas.value;
    if (!source || !source.width || !source.height || !estimatableFormat()) {
      sizeEstimate.value = null;
      isEstimating.value = false;
      return;
    }

    isEstimating.value = true;
    try {
      let result;
      if (outputFormat.value === 'png') {
        const blob = await canvasToBlob(source, 'image/png');
        result = { bytes: blob.size, width: source.width, height: source.height, reached: true };
      } else {
        const prepared = outputFormat.value === 'webp' ? source : withWhiteBackground(source);
        const target = targetSizeOptions.value;
        const encoded = await encodeForExport(
          prepared,
          outputFormat.value,
          exportQuality.value / 100,
          target
        );
        result = {
          bytes: encoded.blob.size,
          quality: Math.round(encoded.quality * 100),
          width: encoded.width,
          height: encoded.height,
          reached: encoded.reached,
          scaled: encoded.scale < 1,
        };
      }
      if (request === estimateRequest) sizeEstimate.value = result;
    } catch (error) {
      logger.warn('Größenschätzung fehlgeschlagen:', error);
      if (request === estimateRequest) sizeEstimate.value = null;
    } finally {
      if (request === estimateRequest) isEstimating.value = false;
    }
  }

  /** Schätzung nach kurzer Pause neu berechnen (z. B. nach jedem Neuzeichnen) */
  function scheduleEstimate(delay = 600) {
    if (estimateTimer) clearTimeout(estimateTimer);
    if (isExporting.value) return;
    estimateTimer = setTimeout(runEstimate, delay);
  }

  watch([outputFormat, exportQuality, targetSizeEnabled, targetSizeKb, targetSizeDownscale], () =>
    scheduleEstimate(300)
  );

  onBeforeUnmount(() => {
    if (estimateTimer) clearTimeout(estimateTimer);
    estimateRequest++;
  });

  // ===== FORWARD/HANDOFF STATE (nach Download zu anderem Tool weiterleiten) =====
  const showForwardOffer = ref(false);
  const forwardCanvasSnapshot = ref(null); // Kopie des exportierten Canvas
  const forwardFilename = ref('');

  // Export mit Dateiname-Dialog
  function downloadImage() {
    if (!canvas.value) return;
    exportDialogFilename.value = currentFileName.value || 'image';
    showExportDialog.value = true;
  }

  async function confirmExport() {
    showExportDialog.value = false;
    const filename = exportDialogFilename.value.trim() || currentFileName.value || 'image';

    isExporting.value = true;

    try {
      const useTransparent = outputFormat.value === 'png' && exportTransparent.value;
      renderImageForExport(useTransparent);

      const result = await exportImage(canvas.value, outputFormat.value, filename, {
        quality: exportQuality.value / 100,
        texts: imageStore.texts || [],
        targetSize: targetSizeOptions.value,
      });

      logger.log('✅ Export erfolgreich:', result);

      // Snapshot des exportierten Canvas sichern, solange der Export-Render aktiv ist.
      // Wird für die optionale Weiterleitung an ein anderes Kodini-Tool genutzt.
      try {
        const snap = document.createElement('canvas');
        snap.width = canvas.value.width;
        snap.height = canvas.value.height;
        snap.getContext('2d').drawImage(canvas.value, 0, 0);
        forwardCanvasSnapshot.value = snap;
        forwardFilename.value = filename;
        showForwardOffer.value = true;
      } catch (snapErr) {
        logger.warn('[Handoff] Snapshot für Weiterleitung fehlgeschlagen:', snapErr);
      }

      if (window.$toast) {
        window.$toast.success(
          `Bild erfolgreich als ${result.format.toUpperCase()} exportiert` +
            (result.size ? ` (${result.size})` : '')
        );
        if (result.targetReached === false) {
          window.$toast.warning(
            t('toast.editor.targetSizeMissed', { size: result.size, max: targetSizeKb.value })
          );
        }
      }
    } catch (error) {
      logger.error('❌ Export fehlgeschlagen:', error);

      if (window.$toast) {
        window.$toast.error(`Export fehlgeschlagen: ${error.message}`);
      }
    } finally {
      isExporting.value = false;
      renderImage();
    }
  }

  // Drucken
  async function printCurrentImage() {
    if (!canvas.value) return;

    let dataUrl = '';
    try {
      // Ohne Auswahl-Markierung rendern (wie beim Export), Hintergrund wie konfiguriert
      renderImageForExport();
      dataUrl = canvas.value.toDataURL('image/png');
    } catch (error) {
      logger.error('❌ Druck-Rendering fehlgeschlagen:', error);
    } finally {
      // On-Screen-Canvas wieder mit Auswahl-Markierung herstellen
      renderImage();
    }

    try {
      await printImage(dataUrl, currentFileName.value || 'image');
    } catch (error) {
      logger.error('❌ Drucken fehlgeschlagen:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.editor.printFailed', 'Drucken fehlgeschlagen'));
      }
    }
  }

  // Weiterleitung an anderes Kodini-Tool (Color-Extractor / Visualizer)
  function forwardTo(target) {
    const snap = forwardCanvasSnapshot.value;
    showForwardOffer.value = false;

    if (!snap) return;

    const name = forwardFilename.value || 'image';
    const url = prepareHandoff([{ name, canvas: snap }], target, 'bildkonverter');

    if (url) {
      // Cross-App-Navigation: die Tools liegen unter unterschiedlichen Base-Pfaden,
      // daher vollständiger Seitenwechsel statt Vue-Router.
      window.location.href = url;
    } else if (window.$toast) {
      window.$toast.error('Weiterleitung fehlgeschlagen');
    }
  }

  function dismissForwardOffer() {
    showForwardOffer.value = false;
    forwardCanvasSnapshot.value = null;
  }

  return {
    exportQuality,
    isExporting,
    exportTransparent,
    showExportDialog,
    exportDialogFilename,
    targetSizeEnabled,
    targetSizeKb,
    targetSizeDownscale,
    targetSizeAvailable,
    sizeEstimate,
    isEstimating,
    scheduleEstimate,
    showForwardOffer,
    downloadImage,
    confirmExport,
    printCurrentImage,
    forwardTo,
    dismissForwardOffer,
  };
}
