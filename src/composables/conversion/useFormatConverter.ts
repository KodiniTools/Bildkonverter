import { computed, ref, type Ref } from 'vue';
import { FORMAT_INFO } from '@/utils/exportUtils';
import { saveFile } from '@/utils/saveFile';
import { ApiClient } from '@/api/api';
import { needsBackendPreview, readFileAsDataURL, loadImage } from '@/utils/fileUtils';
import { drawImageToCanvas, convertCanvasToFormat } from '@/utils/conversionUtils';

/** Eintrag aus formatConversions (router/index.js) */
export interface ConversionPair {
  pair?: string;
  from: string;
  to: string;
}

export interface FormatConverterOptions {
  conversion: Ref<ConversionPair>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

/** Formatname der Seite (z. B. „WebP“) → Export-Schlüssel */
const FORMAT_MAP: Record<string, string> = {
  JPG: 'jpg',
  JPEG: 'jpg',
  PNG: 'png',
  WebP: 'webp',
  WEBP: 'webp',
  TIFF: 'tiff',
  GIF: 'gif',
  BMP: 'bmp',
  HEIC: 'heic',
  HEIF: 'heif',
  SVG: 'svg',
  PDF: 'pdf',
};

/** Endungen für Formate, die FORMAT_INFO nicht kennt */
const EXT_MAP: Record<string, string> = {
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  bmp: 'bmp',
  tiff: 'tiff',
  gif: 'gif',
  heic: 'heic',
  heif: 'heif',
  pdf: 'pdf',
  svg: 'svg',
};

const formatInfo = FORMAT_INFO as Record<string, { extension?: string } | undefined>;

/** Export-Schlüssel des Zielformats; unbekannt → png */
export function outputFormatFor(to: string): string {
  return FORMAT_MAP[to] || 'png';
}

/** Dateiname des Ergebnisses: Basisname der Quelle plus Endung des Zielformats */
export function outputFilenameFor(sourceName: string, format: string): string {
  const baseName = sourceName.replace(/\.[^.]+$/, '');
  const ext = formatInfo[format]?.extension || EXT_MAP[format] || format;
  return `${baseName}.${ext}`;
}

/** Qualität der Konvertierung: WebP 0.85, sonst 0.92 */
export const qualityFor = (format: string): number => (format === 'webp' ? 0.85 : 0.92);

/**
 * Zustand und Ablauf des Konverter-Widgets auf den Formatseiten:
 * Datei laden, in Originalgröße auf einen Canvas zeichnen, ins Zielformat
 * umwandeln, herunterladen und zurücksetzen.
 */
export function useFormatConverter({ conversion, t }: FormatConverterOptions) {
  const sourceFile = ref<File | null>(null);
  const sourcePreview = ref<string | null>(null);
  const isConverting = ref(false);
  const conversionError = ref<string | null>(null);
  const convertedUrl = ref<string | null>(null);
  const convertedBlob = ref<Blob | null>(null);
  const convertedSize = ref(0);

  const outputFormat = computed(() => outputFormatFor(conversion.value.to));

  const outputFilename = computed(() =>
    sourceFile.value ? outputFilenameFor(sourceFile.value.name, outputFormat.value) : ''
  );

  async function startConversion(file: File) {
    sourceFile.value = file;
    isConverting.value = true;
    conversionError.value = null;
    convertedUrl.value = null;
    convertedBlob.value = null;

    window.$toast?.info(t('toast.conversion.uploadReceived'));

    try {
      let previewUrl: string;

      if (needsBackendPreview(file)) {
        // Browser can't display TIFF/HEIC natively – convert to PNG via backend
        const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
        previewUrl = URL.createObjectURL(pngBlob);
      } else {
        previewUrl = await readFileAsDataURL(file);
      }

      sourcePreview.value = previewUrl;

      // Bild in Originalgröße auf einen Canvas zeichnen (weißer Grund für JPG/BMP/PDF)
      const img = await loadImage(previewUrl);
      const format = outputFormat.value;
      const canvas = drawImageToCanvas(img, { width: img.width, height: img.height }, format);

      // PDF/SVG/Backend/Client-Raster – Qualität: WebP 0.85, sonst 0.92
      const blob: Blob = await convertCanvasToFormat(canvas, format, file.name, {
        quality: qualityFor(format),
      });
      convertedBlob.value = blob;
      convertedSize.value = blob.size;
      convertedUrl.value = URL.createObjectURL(blob);

      window.$toast?.success(
        t('toast.conversion.success', {
          from: conversion.value.from,
          to: conversion.value.to,
        })
      );
    } catch (error) {
      const message = (error as Error | undefined)?.message;
      conversionError.value = message || t('conversion.widget.converting');
      window.$toast?.error(t('toast.conversion.error', { error: message }));
    } finally {
      isConverting.value = false;
    }
  }

  /**
   * Speichern mit Systemdialog (Speicherort + Dateiname), ohne diesen Dialog
   * Dateinamen-Abfrage und Download. Synchron aus dem Klick aufrufen.
   */
  async function downloadResult() {
    const blob = convertedBlob.value;
    if (!blob) return;
    try {
      const saved = await saveFile({
        suggestedName: outputFilename.value,
        mimeType: blob.type || undefined,
        getBlob: () => blob,
      });
      if (saved.outcome === 'cancelled') return;
      window.$toast?.success(
        saved.outcome === 'saved'
          ? t('save.saved', { filename: saved.filename })
          : t('toast.conversion.downloadStarted', { filename: saved.filename })
      );
    } catch (error) {
      window.$toast?.error(
        t('save.failed', { error: (error as Error | undefined)?.message || String(error) })
      );
    }
  }

  function resetConverter() {
    if (convertedUrl.value && convertedUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(convertedUrl.value);
    }
    sourceFile.value = null;
    sourcePreview.value = null;
    isConverting.value = false;
    conversionError.value = null;
    convertedUrl.value = null;
    convertedBlob.value = null;
    convertedSize.value = 0;
  }

  return {
    sourceFile,
    sourcePreview,
    isConverting,
    conversionError,
    convertedUrl,
    convertedSize,
    outputFormat,
    outputFilename,
    startConversion,
    downloadResult,
    resetConverter,
  };
}
