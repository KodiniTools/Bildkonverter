import { computed } from 'vue';
import { ValidationUtils } from '@/utils/validationUtils';
import { ApiClient } from '@/api/api';
import { needsBackendPreview } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';
import type { ImageStoreContext } from './types';

/** Basisbild: Canvas anbinden, Bild aus Datei/URL laden, Canvas-Größe setzen */
export function useImageSource(ctx: ImageStoreContext) {
  const { originalImage, workingUrl, canvas, imageWidth, imageHeight, isImageLoaded, draw } = ctx;

  const hasImage = computed(() => isImageLoaded.value && workingUrl.value !== null);

  /** Initialisiert das Canvas-Element */
  function initCanvas(canvasElement: HTMLCanvasElement) {
    canvas.value = canvasElement;
    ctx.ctx.value = canvasElement.getContext('2d', {
      willReadFrequently: true,
      alpha: true,
    });
    logger.log('✅ Canvas initialisiert');
  }

  /** Passt Canvas-Größe an */
  function resizeCanvas(width: number, height: number) {
    if (!canvas.value) return;

    canvas.value.width = width;
    canvas.value.height = height;
    imageWidth.value = width;
    imageHeight.value = height;
  }

  /** Lädt ein Bild von einer URL */
  function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        originalImage.value = img;
        workingUrl.value = url;
        imageWidth.value = img.width;
        imageHeight.value = img.height;

        // Canvas anpassen und zeichnen
        resizeCanvas(img.width, img.height);
        draw();

        resolve(img);
      };

      img.onerror = () => {
        reject(new Error('Fehler beim Laden des Bildes'));
      };

      img.src = url;
    });
  }

  /** Lädt ein Bild aus einer Datei */
  async function loadImageFromFile(file: File) {
    try {
      // Validierung
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Browser-inkompatible Formate (TIFF, HEIC, RAW) via Backend zu PNG konvertieren
      let url: string;
      if (needsBackendPreview(file)) {
        const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
        url = URL.createObjectURL(pngBlob);
      } else {
        url = URL.createObjectURL(file);
      }

      // Bild laden
      await loadImageFromUrl(url);

      isImageLoaded.value = true;
      return true;
    } catch (error) {
      logger.error('Fehler beim Laden:', error);
      throw error;
    }
  }

  return { hasImage, initCanvas, loadImageFromFile };
}
