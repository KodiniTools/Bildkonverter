/**
 * Export Utils - Professionelle Export-Funktionalität für Vue 3
 * Pfad: /src/utils/exportUtils.ts
 *
 * Unterstützte Formate:
 * - PNG: Verlustfrei mit Transparenz (Client-side)
 * - JPEG: Verlustbehaftet, klein (Client-side)
 * - WebP: Modern, effizient (Client-side)
 * - TIFF: Professionell (Backend-API)
 * - HEIF: Modern, hohe Effizienz (Backend-API)
 * - GIF: Einzelbild (Backend-API)
 * - PDF: Dokument (Client-side mit jsPDF)
 */

import { ApiClient } from '@/api/api';
import {
  FORMAT_INFO,
  SUPPORTED_FORMATS,
  CLIENT_FORMATS,
  BACKEND_FORMATS,
  type FormatInfo,
} from './formatInfo';
import type { jsPDF as JsPdf } from 'jspdf';
import {
  calculatePdfLayout,
  createSvgWrapper,
  canvasToBlob as canvasToBlobUtil,
  type PdfLayout,
} from './conversionUtils';
import { context2d } from './canvas2d';
import { logger } from '@/utils/logger';
import { encodeForExport, type TargetSizeOptions } from './targetSize';
import { withExif } from './exif';
import { downloadBlob as downloadBlobViaLink } from './saveFile';

export { FORMAT_INFO, SUPPORTED_FORMATS, CLIENT_FORMATS, BACKEND_FORMATS };

export interface ExportOptions {
  /** 0-1 */
  quality?: number;
  texts?: unknown[];
  /** Ziel-Dateigröße (JPEG/WebP) */
  targetSize?: TargetSizeOptions | null;
  /** Normalisierter TIFF-Block aus exif.ts; ohne bleibt die Datei EXIF-frei */
  exif?: Uint8Array | null;
  /** false: nur `result.blob` liefern, nicht herunterladen */
  download?: boolean;
  [key: string]: unknown;
}

export interface ExportResult {
  success: true;
  format: string;
  filename: string;
  /** Lesbare Größe, z. B. „12.3 KB“ */
  size?: string;
  /** Bei PDF mit Download undefined */
  blob?: Blob;
  /** Prozent (0-100) */
  quality?: number | null;
  bytes?: number;
  width?: number;
  height?: number;
  targetReached?: boolean;
  pages?: number;
  orientation?: string;
}

type JsPdfConstructor = typeof JsPdf;

export class ExportManager {
  jsPDF: JsPdfConstructor | null;
  backendAvailable: boolean;

  constructor() {
    this.jsPDF = null;
    this.backendAvailable = false;
    this.initializePDF();
  }

  /**
   * Initialisiert jsPDF für PDF-Export
   */
  async initializePDF(): Promise<boolean> {
    try {
      // Dynamischer Import von jsPDF
      const { jsPDF } = await import('jspdf');
      this.jsPDF = jsPDF;
      logger.log('✅ jsPDF erfolgreich geladen');
      return true;
    } catch (error) {
      logger.warn('⚠️ jsPDF konnte nicht geladen werden:', error);
      return false;
    }
  }

  /**
   * Prüft Backend-Verfügbarkeit
   */
  async checkBackend(): Promise<boolean> {
    this.backendAvailable = await ApiClient.checkBackendAvailability();
    return this.backendAvailable;
  }

  /**
   * Hauptmethode: Exportiert ein Bild
   *
   * @param canvas - Das Canvas-Element
   * @param format - Exportformat
   * @param filename - Dateiname (ohne Extension)
   * @param options - Export-Optionen; `exif` (Uint8Array, exif.ts)
   *   übernimmt Metadaten in PNG/JPEG/WebP, ohne bleibt die Datei EXIF-frei;
   *   `download: false` liefert die Datei nur als `result.blob` (z. B. zum Teilen)
   */
  async exportImage(
    canvas: HTMLCanvasElement,
    format: string,
    filename = 'image',
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Gültiges Canvas-Element erforderlich');
    }

    format = format.toLowerCase();

    if (!(SUPPORTED_FORMATS as readonly string[]).includes(format)) {
      throw new Error(`Format ${format} wird nicht unterstützt`);
    }

    // Validierung
    this.validateCanvas(canvas);

    // Default-Optionen
    const exportOptions: ExportOptions = {
      quality: options.quality || 0.92,
      texts: options.texts || [],
      ...options,
    };

    try {
      // Format-spezifischer Export
      switch (format) {
        case 'png':
          return await this.exportPNG(canvas, filename, exportOptions);

        case 'jpeg':
        case 'jpg':
          return await this.exportJPEG(canvas, filename, exportOptions);

        case 'webp':
          return await this.exportWebP(canvas, filename, exportOptions);

        case 'tiff':
        case 'tif':
          return await this.exportTIFF(canvas, filename, exportOptions);

        case 'heif':
        case 'heic':
          return await this.exportHEIF(canvas, filename, exportOptions);

        case 'gif':
          return await this.exportGIF(canvas, filename, exportOptions);

        case 'pdf':
          return await this.exportPDF(canvas, filename, exportOptions);

        case 'svg':
          return await this.exportSVG(canvas, filename, exportOptions);

        default:
          // Fallback zu PNG
          return await this.exportPNG(canvas, filename, exportOptions);
      }
    } catch (error) {
      logger.error(`Export-Fehler (${format}):`, error);
      throw new Error(`Export fehlgeschlagen: ${(error as Error | undefined)?.message}`);
    }
  }

  /**
   * Canvas-Validierung
   */
  validateCanvas(canvas: HTMLCanvasElement): void {
    const pixels = canvas.width * canvas.height;
    const maxPixels = 50000 * 50000; // 50k x 50k Pixel

    if (pixels > maxPixels) {
      const maxDimension = Math.sqrt(maxPixels).toFixed(0);
      throw new Error(`Bild zu groß für Export. Maximum: ${maxDimension}x${maxDimension} Pixel`);
    }

    if (pixels > 10000 * 10000) {
      logger.warn('⚠️ Sehr großes Bild - Export kann länger dauern');
    }
  }

  /**
   * PNG Export
   */
  async exportPNG(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    // Kodierung im Web Worker (Fallback: canvas.toBlob im Hauptthread)
    const blob = await withExif(await this.canvasToBlob(canvas, 'image/png'), options.exif);
    this.deliver(blob, `${filename}.png`, options);

    return {
      success: true,
      format: 'png',
      filename: `${filename}.png`,
      size: this.formatBytes(blob.size),
      blob,
    };
  }

  /**
   * JPEG Export
   */
  async exportJPEG(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const quality = options.quality || 0.92;
    const processedCanvas = this.addWhiteBackground(canvas);
    if (options.targetSize) {
      return this.exportWithTargetSize(processedCanvas, 'jpeg', 'jpg', filename, quality, options);
    }
    const blob = await withExif(
      await this.canvasToBlob(processedCanvas, 'image/jpeg', quality),
      options.exif
    );
    this.deliver(blob, `${filename}.jpg`, options);

    return {
      success: true,
      format: 'jpeg',
      filename: `${filename}.jpg`,
      quality: Math.round(quality * 100),
      size: this.formatBytes(blob.size),
      blob,
    };
  }

  /**
   * WebP Export
   */
  async exportWebP(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    if (!this.supportsWebP()) {
      throw new Error('WebP wird von diesem Browser nicht unterstützt');
    }

    const quality = options.quality || 0.85;
    if (options.targetSize) {
      return this.exportWithTargetSize(canvas, 'webp', 'webp', filename, quality, options);
    }
    const blob = await withExif(
      await this.canvasToBlob(canvas, 'image/webp', quality),
      options.exif
    );
    this.deliver(blob, `${filename}.webp`, options);

    return {
      success: true,
      format: 'webp',
      filename: `${filename}.webp`,
      quality: Math.round(quality * 100),
      size: this.formatBytes(blob.size),
      blob,
    };
  }

  /**
   * Export mit Ziel-Dateigröße (JPEG/WebP): Qualität und ggf. Abmessungen
   * werden so gewählt, dass die Datei höchstens options.targetSize.maxBytes
   * groß ist. Die gewählte Qualität wird dabei nie überschritten.
   */
  async exportWithTargetSize(
    canvas: HTMLCanvasElement,
    format: string,
    ext: string,
    filename: string,
    quality: number,
    options: ExportOptions
  ): Promise<ExportResult> {
    const result = await encodeForExport(
      canvas,
      format,
      quality,
      options.targetSize,
      undefined,
      options.exif
    );
    this.deliver(result.blob, `${filename}.${ext}`, options);

    return {
      success: true,
      format,
      filename: `${filename}.${ext}`,
      quality: Math.round(result.quality * 100),
      size: this.formatBytes(result.blob.size),
      blob: result.blob,
      bytes: result.blob.size,
      width: result.width,
      height: result.height,
      targetReached: result.reached,
    };
  }

  /**
   * TIFF Export (Backend)
   */
  async exportTIFF(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const blob = await this.canvasToBlob(canvas, 'image/png');
    const tiffBlob = await ApiClient.convertImage(blob, 'tiff', filename, options);
    this.deliver(tiffBlob, `${filename}.tiff`, options);

    return {
      success: true,
      format: 'tiff',
      filename: `${filename}.tiff`,
      size: this.formatBytes(tiffBlob.size),
      blob: tiffBlob,
    };
  }

  /**
   * HEIF Export (Backend)
   */
  async exportHEIF(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const blob = await this.canvasToBlob(canvas, 'image/png');
    const heifBlob = await ApiClient.convertImage(blob, 'heif', filename, options);
    this.deliver(heifBlob, `${filename}.heif`, options);

    return {
      success: true,
      format: 'heif',
      filename: `${filename}.heif`,
      quality: options.quality ? Math.round(options.quality * 100) : null,
      size: this.formatBytes(heifBlob.size),
      blob: heifBlob,
    };
  }

  /**
   * GIF Export (Backend)
   */
  async exportGIF(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const blob = await this.canvasToBlob(canvas, 'image/png');
    const gifBlob = await ApiClient.convertImage(blob, 'gif', filename, options);
    this.deliver(gifBlob, `${filename}.gif`, options);

    return {
      success: true,
      format: 'gif',
      filename: `${filename}.gif`,
      size: this.formatBytes(gifBlob.size),
      blob: gifBlob,
    };
  }

  /**
   * PDF Export (Client-side mit jsPDF)
   */
  async exportPDF(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (!this.jsPDF) {
      await this.initializePDF();
      if (!this.jsPDF) {
        throw new Error('PDF-Export nicht verfügbar - jsPDF konnte nicht geladen werden');
      }
    }

    // PDF-Dimensionen berechnen
    const pdfConfig = this.calculatePDFDimensions(canvas);

    // PDF erstellen
    const pdf = new this.jsPDF({
      orientation: pdfConfig.orientation,
      unit: 'mm',
      format: pdfConfig.format,
      compress: true,
    });

    // Metadata setzen
    pdf.setProperties({
      title: filename,
      subject: 'Konvertiertes Bild',
      author: 'Vue Bildkonverter',
      creator: 'KodiniTools',
    });

    // Bild zum PDF hinzufügen
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(
      imgData,
      'JPEG',
      pdfConfig.x,
      pdfConfig.y,
      pdfConfig.width,
      pdfConfig.height,
      undefined,
      'FAST'
    );

    // PDF speichern (oder nur als Blob zurückgeben)
    let blob: Blob | undefined;
    if (options.download === false) {
      blob = pdf.output('blob');
    } else {
      pdf.save(`${filename}.pdf`);
    }

    return {
      success: true,
      format: 'pdf',
      filename: `${filename}.pdf`,
      blob,
      pages: 1,
      orientation: pdfConfig.orientation,
    };
  }

  /**
   * SVG Export (Backend mit Client-Fallback)
   * Versucht zuerst echte Vektorisierung über Backend (potrace/vtracer),
   * fällt bei Fehler auf SVG-Wrapper mit eingebettetem Rasterbild zurück.
   */
  async exportSVG(
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    let svgBlob: Blob;

    // Versuch 1: Backend-Vektorisierung
    try {
      const blob = await this.canvasToBlob(canvas, 'image/png');
      svgBlob = await ApiClient.convertImage(blob, 'svg', filename, options);
    } catch (error) {
      logger.warn(
        'Backend-SVG nicht verfügbar, verwende Client-Fallback:',
        (error as Error | undefined)?.message
      );
      // Fallback: SVG-Wrapper mit eingebettetem Rasterbild
      svgBlob = this.createSVGWrapper(canvas);
    }

    this.deliver(svgBlob, `${filename}.svg`, options);

    return {
      success: true,
      format: 'svg',
      filename: `${filename}.svg`,
      size: this.formatBytes(svgBlob.size),
      blob: svgBlob,
    };
  }

  /**
   * Erstellt einen SVG-Wrapper mit eingebettetem Rasterbild (Fallback)
   */
  createSVGWrapper(canvas: HTMLCanvasElement): Blob {
    return createSvgWrapper(canvas);
  }

  /**
   * Berechnet PDF-Dimensionen (A4, 10 mm Rand)
   */
  calculatePDFDimensions(canvas: HTMLCanvasElement): PdfLayout {
    return calculatePdfLayout(canvas);
  }

  /**
   * Fügt weißen Hintergrund hinzu (für JPEG)
   */
  addWhiteBackground(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const ctx = context2d(newCanvas);

    // Weißer Hintergrund
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

    // Original-Bild darüber
    ctx.drawImage(canvas, 0, 0);

    return newCanvas;
  }

  /**
   * Konvertiert Canvas zu Blob
   */
  canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<Blob> {
    return canvasToBlobUtil(canvas, type, quality);
  }

  /**
   * Liefert die fertige Datei aus: Download, außer `options.download === false`
   * (dann gibt der Aufrufer `result.blob` selbst weiter, z. B. an navigator.share)
   */
  deliver(blob: Blob, filename: string, options: ExportOptions = {}): void {
    if (options.download === false) return;
    this.downloadBlob(blob, filename);
  }

  /**
   * Download von DataURL
   */
  downloadDataURL(dataURL: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download von Blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    downloadBlobViaLink(blob, filename);
  }

  /**
   * Berechnet DataURL-Größe
   */
  getDataURLSize(dataURL: string): string {
    const base64Data = dataURL.split(',')[1];
    const sizeInBytes = Math.round((base64Data.length * 3) / 4);
    return this.formatBytes(sizeInBytes);
  }

  /**
   * Formatiert Bytes zu lesbarer Größe
   */
  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Prüft WebP-Support
   */
  supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    try {
      const dataURL = canvas.toDataURL('image/webp');
      return dataURL.startsWith('data:image/webp');
    } catch (error) {
      return false;
    }
  }
}

// Singleton-Instanz
let exportManagerInstance: ExportManager | null = null;

/**
 * Gibt die Export-Manager-Instanz zurück
 */
export function getExportManager(): ExportManager {
  if (!exportManagerInstance) {
    exportManagerInstance = new ExportManager();
  }
  return exportManagerInstance;
}

/**
 * Shortcut-Funktion für Export
 */
export async function exportImage(
  canvas: HTMLCanvasElement,
  format: string,
  filename?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  const manager = getExportManager();
  return await manager.exportImage(canvas, format, filename, options);
}

/**
 * Gibt Format-Informationen zurück
 */
export function getFormatInfo(format: string): FormatInfo | null {
  return (FORMAT_INFO as Readonly<Record<string, FormatInfo>>)[format.toLowerCase()] || null;
}

/**
 * Prüft ob Format unterstützt wird
 */
export function isFormatSupported(format: string): boolean {
  return (SUPPORTED_FORMATS as readonly string[]).includes(format.toLowerCase());
}

export default {
  ExportManager,
  getExportManager,
  exportImage,
  getFormatInfo,
  isFormatSupported,
  SUPPORTED_FORMATS,
  CLIENT_FORMATS,
  BACKEND_FORMATS,
  FORMAT_INFO,
};
