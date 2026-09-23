/**
 * conversionUtils - Gemeinsame Konvertierungslogik für Editor-Export,
 * Batch-Konverter und Format-Landingpages.
 *
 * Client-seitig: PNG, JPG, WebP, BMP (Canvas), PDF (jsPDF), SVG-Wrapper.
 * Backend: TIFF, GIF, HEIF und echte SVG-Vektorisierung über ApiClient.
 */

import { ApiClient } from '@/api/api';
import { FORMAT_INFO } from '@/utils/formatInfo';
import { logger } from '@/utils/logger';

/** Formate ohne Transparenz, die einen weißen Hintergrund brauchen */
export const OPAQUE_FORMATS = ['jpg', 'bmp', 'pdf'];

const MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

/** Konvertiert einen Canvas in einen Blob */
export function canvasToBlob(canvas, mimeType = 'image/png', quality) {
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
 *
 * @param {{width:number,height:number}} img
 * @param {{width?:number|null,height?:number|null,maintainAspect?:boolean}} target
 */
export function calculateTargetSize(
  img,
  { width: targetWidth, height: targetHeight, maintainAspect = true }
) {
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
 * @param {HTMLImageElement} img
 * @param {{width:number,height:number}} size
 * @param {string} format Zielformat (bestimmt den weißen Hintergrund)
 */
export function drawImageToCanvas(img, { width, height }, format) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (OPAQUE_FORMATS.includes(format)) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Berechnet Ausrichtung und Bildposition auf einer A4-Seite (mm, 10 mm Rand).
 * @returns {{orientation:string, format:string, width:number, height:number, x:number, y:number}}
 */
export function calculatePdfLayout(canvas) {
  const aspectRatio = canvas.width / canvas.height;
  const a4Width = 210;
  const a4Height = 297;
  let orientation, width, height, x, y;

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

function addCanvasToPdf(pdf, canvas, layout) {
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  pdf.addImage(imgData, 'JPEG', layout.x, layout.y, layout.width, layout.height, undefined, 'FAST');
}

/** Konvertiert einen Canvas in ein einseitiges A4-PDF (jsPDF, dynamischer Import) */
export async function convertCanvasToPdf(canvas) {
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
export async function convertCanvasesToMergedPdf(canvases) {
  const { jsPDF } = await import('jspdf');
  let pdf = null;

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
      pdf.addPage('a4', layout.orientation);
    }
    addCanvasToPdf(pdf, canvas, layout);
  });

  return pdf.output('blob');
}

/** Erstellt einen SVG-Wrapper mit eingebettetem Rasterbild (Client-Fallback) */
export function createSvgWrapper(canvas) {
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
export async function convertCanvasToSvg(canvas, filename) {
  try {
    const sourceBlob = await canvasToBlob(canvas, 'image/png', 1);
    const svgBlob = await ApiClient.convertImage(sourceBlob, 'svg', filename, {});
    if (svgBlob && svgBlob.size > 0) {
      return svgBlob;
    }
  } catch (error) {
    logger.warn('Backend-SVG nicht verfügbar, verwende Client-Fallback:', error.message);
  }
  return createSvgWrapper(canvas);
}

/**
 * Konvertiert einen Canvas in das Zielformat und liefert den Blob.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} format  Schlüssel aus FORMAT_INFO (png, jpg, webp, bmp, tiff, gif, heif, pdf, svg)
 * @param {string} filename Originalname (für Backend-Aufrufe)
 * @param {{quality?:number, onProgress?:(percent:number)=>void}} [options]
 *   quality: 0-1, wirkt bei JPG, WebP und Backend-Formaten
 */
export async function convertCanvasToFormat(canvas, format, filename, options = {}) {
  const { quality, onProgress } = options;
  const report = (p) => onProgress && onProgress(p);

  if (format === 'pdf') {
    return convertCanvasToPdf(canvas);
  }

  if (format === 'svg') {
    return convertCanvasToSvg(canvas, filename);
  }

  const formatInfo = FORMAT_INFO[format];
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
