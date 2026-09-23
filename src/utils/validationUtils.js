/**
 * validationUtils.js - Validierung hochgeladener Bilddateien
 *
 * Wird vom imageStore beim Laden einer Datei genutzt. Die Endungslisten
 * kommen aus fileUtils (einzige Quelle für unterstützte Formate).
 */

import { RAW_EXTENSIONS, IMAGE_EXTENSIONS } from '@/utils/fileUtils';

export class ValidationUtils {
  /**
   * Validiert eine hochgeladene Bild-Datei
   */
  static validateImageFile(file) {
    const errors = [];

    // Datei vorhanden?
    if (!file) {
      errors.push('Keine Datei ausgewählt');
      return { isValid: false, errors };
    }

    // Dateigröße (Max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in Bytes
    if (file.size > maxSize) {
      errors.push(`Datei zu groß (max ${maxSize / 1024 / 1024}MB)`);
    }

    // Dateigröße (Min 1KB)
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      errors.push('Datei zu klein (min 1KB)');
    }

    // Erlaubte MIME-Types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'image/tiff',
      'image/heic',
      'image/heif',
      // RAW-Formate (MIME-Typen variieren je nach Browser/OS)
      'image/x-canon-cr2',
      'image/x-canon-cr3',
      'image/x-nikon-nef',
      'image/x-sony-arw',
      'image/x-adobe-dng',
      'image/x-fuji-raf',
      'image/x-olympus-orf',
      'image/x-panasonic-rw2',
      'image/x-pentax-pef',
      'image/x-sigma-x3f',
      'image/x-raw',
      'application/octet-stream', // Fallback: viele RAW-Dateien haben keinen spezifischen MIME-Typ
    ];

    // RAW-Dateiendungen (werden per Extension erkannt, da MIME-Typ oft fehlt)
    const rawExtensions = RAW_EXTENSIONS.map((ext) => `.${ext}`);
    const extension = file.name.toLowerCase().match(/\.[^.]+$/);
    const isRawByExtension = extension && rawExtensions.includes(extension[0]);

    if (!allowedTypes.includes(file.type) && !isRawByExtension) {
      errors.push(
        `Ungültiger Dateityp: ${file.type}. Erlaubt: JPG, PNG, WEBP, GIF, BMP, SVG, TIFF, HEIC, RAW (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF)`
      );
    }

    // Dateiendung prüfen (gemeinsame Liste aus fileUtils)
    const allowedExtensions = IMAGE_EXTENSIONS.map((ext) => `.${ext}`);

    if (!extension || !allowedExtensions.includes(extension[0])) {
      errors.push('Ungültige Dateiendung');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
