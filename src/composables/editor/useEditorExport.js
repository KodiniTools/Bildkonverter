/**
 * useEditorExport
 *
 * Export-Dialog, Datei-Export, Teilen (Systemdialog/Zwischenablage), Drucken
 * und die optionale Weiterleitung des exportierten Bildes an ein anderes
 * Kodini-Tool (Handoff). Ausgelagert aus EditorView.vue.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.outputFormat
 * @param {import('vue').Ref} deps.currentFileName
 * @param {import('vue').Ref<Blob|null>} [deps.sourceFile] Originaldatei (für EXIF)
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
import { readSourceExif, supportsExif, withExif } from '@/utils/exif';
import { prepareHandoff } from '@/lib/core/handoff';
import { printImage } from '@/utils/printUtils';
import {
  copyImageToClipboard,
  canCopyImage,
  mimeForFormat,
  pickShareStrategy,
  shareFile,
} from '@/utils/shareUtils';
import { logger } from '@/utils/logger';

export function useEditorExport({
  canvas,
  outputFormat,
  currentFileName,
  sourceFile = ref(null),
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
  // 'download' oder 'share': derselbe Dialog (Dateiname) für beide Aktionen
  const exportDialogMode = ref('download');
  // Fertig kodierte Datei, falls der Systemdialog einen zweiten Klick braucht
  const pendingShareFile = ref(null);

  // ===== ZIEL-DATEIGRÖSSE (nur JPEG/WebP) =====
  const targetSizeEnabled = ref(false);
  const targetSizeKb = ref(TARGET_KB_DEFAULT);
  // Notfalls Abmessungen verkleinern, wenn die Mindestqualität nicht reicht
  const targetSizeDownscale = ref(false);

  const targetSizeAvailable = computed(() => supportsTargetSize(outputFormat.value));

  // ===== EXIF (Standard: entfernen) =====
  // Canvas-Exporte enthalten nie EXIF. Auf Wunsch werden die Metadaten der
  // Originaldatei in PNG/JPEG/WebP übernommen (Orientation = 1, ohne Vorschaubild).
  const keepExif = ref(false);
  const exifAvailable = computed(() => supportsExif(outputFormat.value) && !!sourceFile.value);

  /** Normalisierter EXIF-Block für den Export; null = entfernen/keiner vorhanden */
  async function exportExif() {
    if (!keepExif.value || !exifAvailable.value) return null;
    return readSourceExif(sourceFile.value);
  }

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
      const exif = await exportExif();
      if (outputFormat.value === 'png') {
        const blob = await withExif(await canvasToBlob(source, 'image/png'), exif);
        result = { bytes: blob.size, width: source.width, height: source.height, reached: true };
      } else {
        const prepared = outputFormat.value === 'webp' ? source : withWhiteBackground(source);
        const target = targetSizeOptions.value;
        const encoded = await encodeForExport(
          prepared,
          outputFormat.value,
          exportQuality.value / 100,
          target,
          undefined,
          exif
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

  watch(
    [
      outputFormat,
      exportQuality,
      targetSizeEnabled,
      targetSizeKb,
      targetSizeDownscale,
      keepExif,
      sourceFile,
    ],
    () => scheduleEstimate(300)
  );

  onBeforeUnmount(() => {
    if (estimateTimer) clearTimeout(estimateTimer);
    estimateRequest++;
  });

  // ===== FORWARD/HANDOFF STATE (nach Download zu anderem Tool weiterleiten) =====
  const showForwardOffer = ref(false);
  const forwardCanvasSnapshot = ref(null); // Kopie des exportierten Canvas
  const forwardFilename = ref('');

  /** Dateiname aus dem Dialog, mit sicherem Default */
  function dialogFilename() {
    return exportDialogFilename.value.trim() || currentFileName.value || 'image';
  }

  function openExportDialog(mode) {
    if (!canvas.value) return;
    exportDialogMode.value = mode;
    pendingShareFile.value = null;
    exportDialogFilename.value = currentFileName.value || 'image';
    showExportDialog.value = true;
  }

  function closeExportDialog() {
    showExportDialog.value = false;
    pendingShareFile.value = null;
  }

  // Export mit Dateiname-Dialog
  function downloadImage() {
    openExportDialog('download');
  }

  // Teilen mit Dateiname-Dialog
  function shareImage() {
    openExportDialog('share');
  }

  /**
   * Rendert ohne Auswahl-Markierung und kodiert mit den Export-Einstellungen
   * (Format, Qualität, Zielgröße, EXIF). `download: false` liefert nur den Blob.
   */
  async function renderAndExport(filename, { download }) {
    // Vor dem Export-Render lesen: Zwischen Render und Kodierung darf kein
    // await liegen, sonst könnte ein Vorschau-Neuzeichnen dazwischenkommen
    const exif = await exportExif();
    const useTransparent = outputFormat.value === 'png' && exportTransparent.value;
    renderImageForExport(useTransparent);

    return exportImage(canvas.value, outputFormat.value, filename, {
      quality: exportQuality.value / 100,
      texts: imageStore.texts || [],
      targetSize: targetSizeOptions.value,
      exif,
      download,
    });
  }

  function confirmExportDialog() {
    if (exportDialogMode.value === 'share') return confirmShare();
    return confirmExport();
  }

  async function confirmExport() {
    showExportDialog.value = false;
    const filename = dialogFilename();

    isExporting.value = true;

    try {
      const result = await renderAndExport(filename, { download: true });

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

  // ===== TEILEN =====
  // Systemdialog mit Datei, sonst Zwischenablage, sonst Download.
  // Die Strategie wird synchron gewählt, solange die Nutzergeste noch gilt.
  async function confirmShare() {
    const strategy = pickShareStrategy(mimeForFormat(outputFormat.value));

    if (strategy === 'clipboard') {
      showExportDialog.value = false;
      return copyToClipboard();
    }
    if (strategy === 'download') {
      window.$toast?.info(t('toast.editor.shareUnsupported'));
      return confirmExport();
    }

    const filename = dialogFilename();
    isExporting.value = true;
    let file = null;

    try {
      const result = await renderAndExport(filename, { download: false });
      file = new File([result.blob], result.filename, {
        type: result.blob.type || mimeForFormat(result.format),
      });
      if (result.targetReached === false) {
        window.$toast?.warning(
          t('toast.editor.targetSizeMissed', { size: result.size, max: targetSizeKb.value })
        );
      }
    } catch (error) {
      logger.error('❌ Export zum Teilen fehlgeschlagen:', error);
      window.$toast?.error(`Export fehlgeschlagen: ${error.message}`);
      showExportDialog.value = false;
      return;
    } finally {
      isExporting.value = false;
      renderImage();
    }

    await openShareSheet(file);
  }

  /** Zweiter Klick, wenn der Browser die erste Geste nach dem Kodieren nicht mehr gelten ließ */
  function shareNow() {
    const file = pendingShareFile.value;
    if (file) return openShareSheet(file);
  }

  async function openShareSheet(file) {
    try {
      const outcome = await shareFile(file, { title: file.name });
      pendingShareFile.value = null;
      showExportDialog.value = false;
      if (outcome === 'shared') window.$toast?.success(t('toast.editor.shared'));
    } catch (error) {
      if (error?.name === 'NotAllowedError' && !pendingShareFile.value) {
        // Geste abgelaufen (v. a. Safari nach längerem Kodieren): Dialog bleibt
        // offen und bietet „Jetzt teilen“ mit der fertigen Datei an
        pendingShareFile.value = file;
        return;
      }
      logger.error('❌ Teilen fehlgeschlagen:', error);
      pendingShareFile.value = null;
      showExportDialog.value = false;
      window.$toast?.error(t('toast.editor.shareFailed'));
    }
  }

  // ===== ZWISCHENABLAGE =====
  // Immer PNG (die Clipboard API unterstützt Bilder verlässlich nur als PNG).
  async function copyToClipboard() {
    if (!canvas.value) return;
    if (!canCopyImage()) {
      window.$toast?.error(t('toast.editor.copyUnsupported'));
      return;
    }

    let pngPromise;
    try {
      // Snapshot synchron nach dem Export-Render, damit das Neuzeichnen der
      // Vorschau (mit Auswahl-Markierung) die Kodierung nicht beeinflusst
      renderImageForExport(outputFormat.value === 'png' && exportTransparent.value);
      const snap = document.createElement('canvas');
      snap.width = canvas.value.width;
      snap.height = canvas.value.height;
      snap.getContext('2d').drawImage(canvas.value, 0, 0);
      pngPromise = canvasToBlob(snap, 'image/png');
    } catch (error) {
      logger.error('❌ Kopieren fehlgeschlagen:', error);
      window.$toast?.error(t('toast.editor.copyFailed'));
      return;
    } finally {
      renderImage();
    }

    try {
      // clipboard.write startet synchron in der Geste, der Blob folgt
      await copyImageToClipboard(pngPromise);
      window.$toast?.success(t('toast.editor.copied'));
    } catch (error) {
      logger.error('❌ Kopieren fehlgeschlagen:', error);
      window.$toast?.error(t('toast.editor.copyFailed'));
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
    exportDialogMode,
    pendingShareFile,
    targetSizeEnabled,
    targetSizeKb,
    targetSizeDownscale,
    targetSizeAvailable,
    sizeEstimate,
    isEstimating,
    scheduleEstimate,
    keepExif,
    exifAvailable,
    showForwardOffer,
    downloadImage,
    shareImage,
    confirmExport,
    confirmExportDialog,
    closeExportDialog,
    shareNow,
    copyToClipboard,
    printCurrentImage,
    forwardTo,
    dismissForwardOffer,
  };
}
