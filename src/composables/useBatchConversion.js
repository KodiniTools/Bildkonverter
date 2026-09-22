/**
 * useBatchConversion
 *
 * Zustand und Ablauf der Batch-Konvertierung: Dateien aufnehmen (mit Vorschau
 * und Abmessungen), alle Dateien konvertieren (einzeln oder als gemeinsames
 * PDF), Ergebnisse herunterladen (einzeln, alle, als ZIP) und zurücksetzen.
 * Ausgelagert aus BatchView.vue; die View hält nur noch Einstellungen,
 * Drag-and-Drop und Vorschau-Modal.
 *
 * @param {object} deps
 * @param {import('vue').Ref<object>} deps.settings  format, quality, width, height, maintainAspect, prefix, pdfMode
 * @param {Function} deps.t                            i18n-Übersetzungsfunktion
 * @param {Function} deps.confirm                      Bestätigungsdialog (useConfirm)
 */
import { ref, computed } from 'vue';
import { ApiClient } from '@/api/api';
import { FORMAT_INFO } from '@/utils/exportUtils';
import {
  isImageFile,
  needsBackendPreview,
  readFileAsDataURL,
  loadImage,
  getImageDimensions,
} from '@/utils/fileUtils';
import {
  calculateTargetSize,
  drawImageToCanvas,
  convertCanvasesToMergedPdf,
  convertCanvasToFormat,
} from '@/utils/conversionUtils';

export function useBatchConversion({ settings, t, confirm }) {
  const files = ref([]);
  const processedFiles = ref([]);
  const isProcessing = ref(false);
  const downloadReady = ref(false);

  // Seitenverhältnis des ersten Bildes als Referenz für die Größen-Eingabe
  const referenceAspectRatio = ref(null);

  const hasConvertableFiles = computed(() => files.value.some((f) => f.status !== 'completed'));
  const hasCompletedFiles = computed(() => files.value.some((f) => f.status === 'completed'));
  const processedCount = computed(() => files.value.filter((f) => f.status === 'completed').length);
  const overallProgress = computed(() => {
    if (files.value.length === 0) return 0;
    const total = files.value.reduce((sum, file) => sum + (file.progress || 0), 0);
    return Math.round(total / files.value.length);
  });

  const isMergedPdf = () => settings.value.format === 'pdf' && settings.value.pdfMode === 'merged';
  const mergedPdfFilename = () => (settings.value.prefix || '') + 'merged.pdf';

  function revokeProcessedPreview(file) {
    if (file.processedPreview && file.processedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(file.processedPreview);
    }
  }

  function resetFileResult(file) {
    revokeProcessedPreview(file);
    file.status = 'pending';
    file.progress = 0;
    file.processedBlob = null;
    file.processedPreview = null;
    file.processedSize = 0;
    file.error = null;
  }

  // ===== Dateien aufnehmen =====

  async function addFiles(fileList) {
    const imageFiles = fileList.filter((f) => isImageFile(f));

    if (imageFiles.length === 0) {
      window.$toast?.warning(t('toast.batch.noImages'));
      return;
    }

    for (const file of imageFiles) {
      try {
        let preview;
        if (needsBackendPreview(file)) {
          // Browser kann TIFF/HEIC/RAW nicht anzeigen – Vorschau als PNG über das Backend
          const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
          preview = URL.createObjectURL(pngBlob);
        } else {
          preview = await readFileAsDataURL(file);
        }
        const dimensions = await getImageDimensions(preview);

        files.value.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          preview,
          width: dimensions.width,
          height: dimensions.height,
          status: 'pending',
          progress: 0,
          processedPreview: null,
          processedBlob: null,
          processedSize: 0,
          error: null,
        });
      } catch (error) {
        window.$toast?.error(t('toast.batch.fileError', { name: file.name, error: error.message }));
      }
    }

    if (!referenceAspectRatio.value && files.value.length > 0) {
      const first = files.value[0];
      if (first.width && first.height) {
        referenceAspectRatio.value = first.width / first.height;
      }
    }

    window.$toast?.success(t('toast.batch.filesAdded', { count: imageFiles.length }));
  }

  // ===== Konvertierung =====

  /** Lädt das Bild und zeichnet es in Zielgröße auf einen Canvas */
  async function prepareCanvas(file) {
    file.progress = 10;
    const img = await loadImage(file.preview);
    file.progress = 30;

    const size = calculateTargetSize(img, {
      width: settings.value.width,
      height: settings.value.height,
      maintainAspect: settings.value.maintainAspect,
    });
    const canvas = drawImageToCanvas(img, size, settings.value.format);
    file.progress = 60;
    return canvas;
  }

  async function processFile(file) {
    const format = settings.value.format;
    const canvas = await prepareCanvas(file);

    const blob = await convertCanvasToFormat(canvas, format, file.name, {
      quality: settings.value.quality / 100,
      onProgress: (p) => {
        file.progress = p;
      },
    });
    file.progress = 90;

    file.processedBlob = blob;
    file.processedSize = blob.size;
    // PDF hat keine Bildvorschau, dort bleibt die Originalvorschau stehen
    file.processedPreview = format === 'pdf' ? file.preview : URL.createObjectURL(blob);
    file.progress = 100;
  }

  async function startProcessing() {
    isProcessing.value = true;
    downloadReady.value = false;

    // Alle Dateien zurücksetzen, damit eine erneute Konvertierung möglich ist
    files.value.forEach(resetFileResult);
    processedFiles.value = [];

    const pendingFiles = files.value.filter((f) => f.status !== 'completed');
    window.$toast?.info(t('toast.batch.processingStarted', { count: pendingFiles.length }));

    let errorCount = 0;
    const merged = isMergedPdf();
    const canvasesForMerge = [];

    for (const file of files.value) {
      file.status = 'processing';
      file.progress = 0;

      try {
        if (merged) {
          // Canvas vorbereiten, PDF wird erst am Ende gemeinsam erzeugt
          const canvas = await prepareCanvas(file);
          file.progress = 80;
          file.processedPreview = file.preview;
          canvasesForMerge.push({ file, canvas });
        } else {
          await processFile(file);
          processedFiles.value.push(file);
        }
        file.status = 'completed';
        file.progress = 100;
      } catch (error) {
        file.status = 'error';
        file.error = error.message;
        errorCount++;
        window.$toast?.error(t('toast.batch.fileError', { name: file.name, error: error.message }));
      }
    }

    if (merged && canvasesForMerge.length > 0) {
      try {
        const mergedBlob = await convertCanvasesToMergedPdf(canvasesForMerge.map((c) => c.canvas));
        processedFiles.value = [
          {
            id: 'merged-pdf',
            name: t('batch.mergedPdfFilename'),
            processedBlob: mergedBlob,
            processedSize: mergedBlob.size,
            processedPreview: null,
            isMerged: true,
          },
        ];
        canvasesForMerge.forEach(({ file }) => {
          file.processedBlob = mergedBlob;
          file.processedSize = mergedBlob.size;
          file.processedPreview = file.preview;
        });
      } catch (error) {
        window.$toast?.error(t('toast.batch.fileError', { name: 'PDF', error: error.message }));
        errorCount++;
      }
    }

    isProcessing.value = false;
    downloadReady.value = processedFiles.value.length > 0;

    const successCount = merged ? canvasesForMerge.length : processedFiles.value.length;
    if (errorCount === 0) {
      window.$toast?.success(t('toast.batch.processingCompleteAll', { count: successCount }));
    } else {
      window.$toast?.warning(
        t('toast.batch.processingComplete', { success: successCount, total: pendingFiles.length })
      );
    }
  }

  // ===== Verwaltung =====

  function removeFile(fileId) {
    const index = files.value.findIndex((f) => f.id === fileId);
    if (index === -1) return;
    const file = files.value[index];
    revokeProcessedPreview(file);
    files.value.splice(index, 1);
    window.$toast?.info(t('toast.batch.fileRemoved', { name: file.name }));
  }

  async function clearAll() {
    const confirmed = await confirm(t('batch.confirmClear'), {
      title: t('batch.clearAllTitle', 'Alle Dateien entfernen?'),
      confirmText: t('confirm.delete', 'Entfernen'),
      cancelText: t('confirm.cancel', 'Abbrechen'),
      variant: 'warning',
    });
    if (!confirmed) return;

    files.value.forEach(revokeProcessedPreview);
    files.value = [];
    processedFiles.value = [];
    referenceAspectRatio.value = null;
    window.$toast?.info(t('toast.batch.cleared'));
  }

  /** Setzt die Konvertierung zurück, behält aber die hochgeladenen Dateien */
  function resetConversion() {
    files.value.forEach(resetFileResult);
    processedFiles.value = [];
    downloadReady.value = false;
    window.$toast?.info(t('toast.batch.conversionReset'));
  }

  // ===== Download =====

  function getOutputFilename(file) {
    if (file.isMerged) return mergedPdfFilename();
    const prefix = settings.value.prefix || '';
    const format = settings.value.format;
    const ext = FORMAT_INFO[format]?.extension || format;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return `${prefix}${baseName}.${ext}`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadFile(file, showToast = true) {
    if (!file.processedBlob) return;
    triggerDownload(file.processedBlob, getOutputFilename(file));
    downloadReady.value = false;
    if (showToast) {
      window.$toast?.success(t('toast.batch.downloadStarted'));
    }
  }

  function downloadAll() {
    if (isMergedPdf() && processedFiles.value.length === 1 && processedFiles.value[0].isMerged) {
      downloadFile(processedFiles.value[0]);
      return;
    }

    window.$toast?.info(
      t('toast.batch.downloadAllStarted', { count: processedFiles.value.length })
    );
    processedFiles.value.forEach((file, index) => {
      setTimeout(() => downloadFile(file, false), index * 200);
    });
    downloadReady.value = false;
  }

  async function downloadAsZip() {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const file of processedFiles.value) {
      if (file.processedBlob) {
        zip.file(getOutputFilename(file), file.processedBlob);
      }
    }

    window.$toast?.info(t('toast.batch.zipCreating'));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, (settings.value.prefix || 'batch_') + 'images.zip');
    downloadReady.value = false;

    window.$toast?.success(t('toast.batch.zipDownloaded'));
  }

  return {
    files,
    processedFiles,
    isProcessing,
    downloadReady,
    referenceAspectRatio,
    hasConvertableFiles,
    hasCompletedFiles,
    processedCount,
    overallProgress,
    addFiles,
    startProcessing,
    removeFile,
    clearAll,
    resetConversion,
    getOutputFilename,
    downloadFile,
    downloadAll,
    downloadAsZip,
  };
}
