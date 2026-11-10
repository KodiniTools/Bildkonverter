/**
 * conversionUtils - Gemeinsame Konvertierungslogik für Editor-Export,
 * Batch-Konverter und Format-Landingpages.
 *
 * Client-seitig: PNG, JPG, WebP, BMP (Canvas), PDF (jsPDF), SVG-Wrapper.
 * Backend: TIFF, GIF, HEIF und echte SVG-Vektorisierung über ApiClient.
 */

import { ApiClient } from '@/api/api';
import { FORMAT_INFO, type FormatInfo } from '@/utils/formatInfo';
import { logger } from '@/utils/logger';
import { encodeInWorker } from '@/lib/imageWorker';
import { context2d } from './canvas2d';
import type { jsPDF as JsPdf } from 'jspdf';

export interface Size {
  width: number;
  height: number;
}

export interface TargetSizeSpec {
  width?: number | null;
  height?: number | null;
  maintainAspect?: boolean;
}

/** A4-Layout in mm */
export interface PdfLayout {
  orientation: 'landscape' | 'portrait';
  format: 'a4';
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ConvertOptions {
  /** 0-1 */
  quality?: number;
  onProgress?: (percent: number) => void;
}

/** Formate ohne Transparenz, die einen weißen Hintergrund brauchen */
export const OPAQUE_FORMATS: readonly string[] = ['jpg', 'bmp', 'pdf'];

const MIME_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

/** Formate, die der Bild-Worker zuverlässig kodiert */
const WORKER_ENCODE_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Konvertiert einen Canvas in einen Blob. Kodiert bevorzugt im Web Worker
 * (blockiert die Oberfläche nicht) und fällt sonst auf canvas.toBlob zurück.
 * Der Worker erfasst den Inhalt beim Aufruf; der seltene Rückfall kodiert den
 * Canvas danach erneut, Aufrufer übergeben daher einen stabilen Canvas.
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType = 'image/png',
  quality?: number
): Promise<Blob> {
  if (WORKER_ENCODE_TYPES.includes(mimeType)) {
    const blob = await encodeInWorker(canvas, mimeType, quality);
    if (blob && blob.type === mimeType) return blob;
  }
  return canvasToBlobOnMainThread(canvas, mimeType, quality);
}

/** canvas.toBlob als Promise (Hauptthread) */
export function canvasToBlobOnMainThread(
  canvas: HTMLCanvasElement,
  mimeType = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas-zu-Blob-Konvertierung fehlgeschlagen'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Berechnet Zielgröße für eine optionale Skalierung.
 * Ohne Vorgaben bleibt die Originalgröße erhalten.
 */
export function calculateTargetSize(
  img: Size,
  { width: targetWidth, height: targetHeight, maintainAspect = true }: TargetSizeSpec
): Size {
  let drawWidth = img.width;
  let drawHeight = img.height;

  if (targetWidth || targetHeight) {
    if (targetWidth && targetHeight && !maintainAspect) {
      drawWidth = targetWidth;
      drawHeight = targetHeight;
    } else if (targetWidth && targetHeight) {
      // Seitenverhältnis beibehalten, in die Vorgabe einpassen
      const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
      drawWidth = Math.round(img.width * ratio);
      drawHeight = Math.round(img.height * ratio);
    } else if (targetWidth) {
      const ratio = targetWidth / img.width;
      drawWidth = targetWidth;
      drawHeight = maintainAspect ? Math.round(img.height * ratio) : img.height;
    } else if (targetHeight) {
      const ratio = targetHeight / img.height;
      drawHeight = targetHeight;
      drawWidth = maintainAspect ? Math.round(img.width * ratio) : img.width;
    }
  }

  return { width: drawWidth, height: drawHeight };
}

/**
 * Zeichnet ein Bild auf einen neuen Canvas. Für Formate ohne Transparenz
 * wird ein weißer Hintergrund gesetzt.
 *
 * @param format Zielformat (bestimmt den weißen Hintergrund)
 */
export function drawImageToCanvas(
  img: CanvasImageSource,
  { width, height }: Size,
  format: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = context2d(canvas);

  if (OPAQUE_FORMATS.includes(format)) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Berechnet Ausrichtung und Bildposition auf einer A4-Seite (mm, 10 mm Rand).
 */
export function calculatePdfLayout(canvas: Size): PdfLayout {
  const aspectRatio = canvas.width / canvas.height;
  const a4Width = 210;
  const a4Height = 297;
  let orientation: PdfLayout['orientation'], width: number, height: number, x: number, y: number;

  if (aspectRatio > 1) {
    orientation = 'landscape';
    width = a4Height - 20;
    height = width / aspectRatio;
    x = 10;
    y = (a4Width - height) / 2;
  } else {
    orientation = 'portrait';
    width = a4Width - 20;
    height = width / aspectRatio;
    x = 10;
    y = (a4Height - height) / 2;
    if (height > a4Height - 20) {
      height = a4Height - 20;
      width = height * aspectRatio;
      x = (a4Width - width) / 2;
      y = 10;
    }
  }

  return { orientation, format: 'a4', width, height, x, y };
}

function addCanvasToPdf(pdf: JsPdf, canvas: HTMLCanvasElement, layout: PdfLayout): void {
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  pdf.addImage(imgData, 'JPEG', layout.x, layout.y, layout.width, layout.height, undefined, 'FAST');
}

/** Konvertiert einen Canvas in ein einseitiges A4-PDF (jsPDF, dynamischer Import) */
export async function convertCanvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const layout = calculatePdfLayout(canvas);
  const pdf = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  addCanvasToPdf(pdf, canvas, layout);
  return pdf.output('blob');
}

/** Konvertiert mehrere Canvases in ein PDF mit einer Seite pro Bild */
export async function convertCanvasesToMergedPdf(
  canvases: readonly HTMLCanvasElement[]
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  // Zuweisung im Callback: ohne `as` würde TS pdf dauerhaft auf null einengen
  let pdf = null as JsPdf | null;

  canvases.forEach((canvas, i) => {
    const layout = calculatePdfLayout(canvas);
    if (i === 0) {
      pdf = new jsPDF({
        orientation: layout.orientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
    } else {
      pdf!.addPage('a4', layout.orientation);
    }
    addCanvasToPdf(pdf!, canvas, layout);
  });

  // Wie bisher: ohne Canvases wirft output() (Aufrufer übergeben mind. einen)
  return pdf!.output('blob');
}

/** Erstellt einen SVG-Wrapper mit eingebettetem Rasterbild (Client-Fallback) */
export function createSvgWrapper(canvas: HTMLCanvasElement): Blob {
  const dataURL = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}"
     viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`;
  return new Blob([svgContent], { type: 'image/svg+xml' });
}

/**
 * Konvertiert einen Canvas in SVG. Versucht zuerst die Backend-Vektorisierung,
 * fällt bei Fehler oder leerer Antwort auf den SVG-Wrapper zurück.
 */
export async function convertCanvasToSvg(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<Blob> {
  try {
    const sourceBlob = await canvasToBlob(canvas, 'image/png', 1);
    const svgBlob = await ApiClient.convertImage(sourceBlob, 'svg', filename, {});
    if (svgBlob && svgBlob.size > 0) {
      return svgBlob;
    }
  } catch (error) {
    logger.warn(
      'Backend-SVG nicht verfügbar, verwende Client-Fallback:',
      (error as Error | undefined)?.message
    );
  }
  return createSvgWrapper(canvas);
}

/**
 * Konvertiert einen Canvas in das Zielformat und liefert den Blob.
 *
 * @param format  Schlüssel aus FORMAT_INFO (png, jpg, webp, bmp, tiff, gif, heif, pdf, svg)
 * @param filename Originalname (für Backend-Aufrufe)
 * @param options quality: 0-1, wirkt bei JPG, WebP und Backend-Formaten
 */
export async function convertCanvasToFormat(
  canvas: HTMLCanvasElement,
  format: string,
  filename: string,
  options: ConvertOptions = {}
): Promise<Blob> {
  const { quality, onProgress } = options;
  const report = (p: number) => onProgress && onProgress(p);

  if (format === 'pdf') {
    return convertCanvasToPdf(canvas);
  }

  if (format === 'svg') {
    return convertCanvasToSvg(canvas, filename);
  }

  const formatInfo = (FORMAT_INFO as Readonly<Record<string, FormatInfo | undefined>>)[format];
  if (formatInfo && formatInfo.requiresBackend) {
    // Backend-Konvertierung (TIFF, GIF, HEIF)
    const sourceBlob = await canvasToBlob(canvas, 'image/png', 1);
    report(70);
    return ApiClient.convertImage(sourceBlob, format, filename, { quality });
  }

  // Client-seitige Raster-Konvertierung (PNG, JPG, WebP, BMP)
  const mimeType = MIME_TYPES[format] || 'image/png';
  const useQuality = format === 'jpg' || format === 'webp' ? quality : undefined;
  return canvasToBlob(canvas, mimeType, useQuality);
}
