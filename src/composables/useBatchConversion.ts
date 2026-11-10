/**
 * useBatchConversion
 *
 * Zustand und Ablauf der Batch-Konvertierung: Dateien aufnehmen (mit Vorschau
 * und Abmessungen), alle Dateien konvertieren (einzeln oder als gemeinsames
 * PDF), Ergebnisse herunterladen (einzeln, alle, als ZIP) und zurücksetzen.
 * Ausgelagert aus BatchView.vue; die View hält nur noch Einstellungen,
 * Drag-and-Drop und Vorschau-Modal.
 */
import { ref, computed, type Ref } from 'vue';
import type { useI18n } from 'vue-i18n';
import type { useConfirm } from '@/composables/useConfirm';
import type { BatchFile, BatchSettings } from '@/composables/batch/types';
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
import { readSourceExif, supportsExif, withExif } from '@/utils/exif';
import { downloadBlob, pickSaveFolder, saveFile, writeFileToFolder } from '@/utils/saveFile';
import { logger } from '@/utils/logger';

export interface BatchConversionDeps {
  /** format, quality, width, height, maintainAspect, prefix, pdfMode, keepExif */
  settings: Ref<BatchSettings>;
  /** i18n-Übersetzungsfunktion */
  t: ReturnType<typeof useI18n>['t'];
  /** Bestätigungsdialog (useConfirm) */
  confirm: ReturnType<typeof useConfirm>['confirm'];
}

/** Gemeinsames PDF aller Bilder (pdfMode 'merged') */
export interface MergedPdfResult {
  id: 'merged-pdf';
  name: string;
  processedBlob: Blob;
  processedSize: number;
  processedPreview: null;
  isMerged: true;
}

/** Eintrag der Ergebnisliste: konvertierte Datei oder gemeinsames PDF */
export type BatchResult = (BatchFile & { isMerged?: undefined }) | MergedPdfResult;

/** Fehlermeldung wie bisher über `error.message` */
function messageOf(error: unknown): string {
  return (error as Error).message;
}

export function useBatchConversion({ settings, t, confirm }: BatchConversionDeps) {
  const files = ref<BatchFile[]>([]);
  const processedFiles = ref<BatchResult[]>([]);
  const isProcessing = ref(false);
  const downloadReady = ref(false);

  // Seitenverhältnis des ersten Bildes als Referenz für die Größen-Eingabe
  const referenceAspectRatio = ref<number | null>(null);

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

  function revokeProcessedPreview(file: Pick<BatchFile, 'processedPreview'>) {
    if (file.processedPreview && file.processedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(file.processedPreview);
    }
  }

  function resetFileResult(file: BatchFile) {
    revokeProcessedPreview(file);
    file.status = 'pending';
    file.progress = 0;
    file.processedBlob = null;
    file.processedPreview = null;
    file.processedSize = 0;
    file.error = null;
  }

  // ===== Dateien aufnehmen =====

  async function addFiles(fileList: File[]) {
    const imageFiles = fileList.filter((f) => isImageFile(f));

    if (imageFiles.length === 0) {
      window.$toast?.warning(t('toast.batch.noImages'));
      return;
    }

    for (const file of imageFiles) {
      try {
        let preview: string;
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
        window.$toast?.error(
          t('toast.batch.fileError', { name: file.name, error: messageOf(error) })
        );
      }
    }

    if (!referenceAspectRatio.value && files.value.length > 0) {
      const first = files.value[0]!;
      if (first.width && first.height) {
        referenceAspectRatio.value = first.width / first.height;
      }
    }

    window.$toast?.success(t('toast.batch.filesAdded', { count: imageFiles.length }));
  }

  // ===== Konvertierung =====

  /** Lädt das Bild und zeichnet es in Zielgröße auf einen Canvas */
  async function prepareCanvas(file: BatchFile) {
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

  async function processFile(file: BatchFile) {
    const format = settings.value.format;
    const canvas = await prepareCanvas(file);

    let blob = await convertCanvasToFormat(canvas, format, file.name, {
      quality: settings.value.quality / 100,
      onProgress: (p) => {
        file.progress = p;
      },
    });
    // Canvas-Ergebnisse sind EXIF-frei; auf Wunsch die Metadaten des Originals
    // übernehmen (gilt auch für den ZIP-Download, der diese Blobs bündelt)
    if (settings.value.keepExif && supportsExif(format)) {
      blob = await withExif(blob, await readSourceExif(file.file));
    }
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
    const canvasesForMerge: { file: BatchFile; canvas: HTMLCanvasElement }[] = [];

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
        file.error = messageOf(error);
        errorCount++;
        window.$toast?.error(
          t('toast.batch.fileError', { name: file.name, error: messageOf(error) })
        );
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
        window.$toast?.error(t('toast.batch.fileError', { name: 'PDF', error: messageOf(error) }));
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

  function removeFile(fileId: BatchFile['id']) {
    const index = files.value.findIndex((f) => f.id === fileId);
    if (index === -1) return;
    const file = files.value[index]!;
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

  function getOutputFilename(file: Pick<BatchResult, 'name' | 'isMerged'>) {
    if (file.isMerged) return mergedPdfFilename();
    const prefix = settings.value.prefix || '';
    const format = settings.value.format;
    const ext =
      (FORMAT_INFO as Readonly<Record<string, { extension?: string } | undefined>>)[format]
        ?.extension || format;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return `${prefix}${baseName}.${ext}`;
  }

  /** Fehler beim Speichern melden (Abbruch durch den Nutzer ist kein Fehler) */
  function reportSaveError(error: unknown) {
    logger.error('Speichern fehlgeschlagen:', error);
    const message = (error as Error | null | undefined)?.message;
    window.$toast?.error(t('save.failed', { error: message || String(error) }));
  }

  /**
   * Einzelne Datei speichern: Systemdialog für Speicherort und Dateinamen,
   * ohne diesen Dialog (Firefox/Safari) Dateinamen-Abfrage und Download.
   * Synchron aus dem Klick heraus aufrufen (Nutzergeste).
   */
  async function downloadFile(file: BatchResult) {
    const blob = file.processedBlob;
    if (!blob) return;
    try {
      const saved = await saveFile({
        suggestedName: getOutputFilename(file),
        mimeType: blob.type || undefined,
        getBlob: () => blob,
      });
      if (saved.outcome === 'cancelled') return;
      downloadReady.value = false;
      window.$toast?.success(
        saved.outcome === 'saved'
          ? t('save.saved', { filename: saved.filename })
          : t('toast.batch.downloadStarted')
      );
    } catch (error) {
      reportSaveError(error);
    }
  }

  /**
   * Alle Dateien speichern: ein Ordnerdialog statt eines Dialogs pro Datei.
   * Vorhandene Dateien im Ordner werden nicht überschrieben („name (1).png“).
   * Ohne Ordnerdialog: klassische Downloads wie bisher.
   */
  async function downloadAll() {
    const only = processedFiles.value[0];
    if (isMergedPdf() && processedFiles.value.length === 1 && only!.isMerged) {
      return downloadFile(only!);
    }

    const ready = processedFiles.value.filter(
      (file): file is BatchResult & { processedBlob: Blob } => !!file.processedBlob
    );
    if (ready.length === 0) return;

    // Synchron in der Geste öffnen
    const folder = await pickSaveFolder();
    if (folder === null) return;

    if (folder) {
      const taken = new Set<string>();
      let count = 0;
      try {
        for (const file of ready) {
          await writeFileToFolder(folder, getOutputFilename(file), file.processedBlob, taken);
          count++;
        }
        window.$toast?.success(t('save.folderSaved', { count }));
      } catch (error) {
        reportSaveError(error);
      } finally {
        if (count > 0) downloadReady.value = false;
      }
      return;
    }

    window.$toast?.info(t('toast.batch.downloadAllStarted', { count: ready.length }));
    ready.forEach((file, index) => {
      setTimeout(() => downloadBlob(file.processedBlob, getOutputFilename(file)), index * 200);
    });
    downloadReady.value = false;
  }

  async function downloadAsZip() {
    try {
      const saved = await saveFile({
        suggestedName: (settings.value.prefix || 'batch_') + 'images.zip',
        mimeType: 'application/zip',
        getBlob: async () => {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          for (const file of processedFiles.value) {
            if (file.processedBlob) {
              zip.file(getOutputFilename(file), file.processedBlob);
            }
          }
          window.$toast?.info(t('toast.batch.zipCreating'));
          return zip.generateAsync({ type: 'blob' });
        },
      });
      if (saved.outcome === 'cancelled') return;
      downloadReady.value = false;
      window.$toast?.success(
        saved.outcome === 'saved'
          ? t('save.saved', { filename: saved.filename })
          : t('toast.batch.zipDownloaded')
      );
    } catch (error) {
      reportSaveError(error);
    }
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
