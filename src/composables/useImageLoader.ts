import { ApiClient } from '@/api/api';
import { needsBackendPreview, readFileAsDataURL, loadImage } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';
import type { Ref } from 'vue';
import type { useImageStore } from '@/stores/imageStore';

type ImageStore = ReturnType<typeof useImageStore>;
type Translate = (key: string) => string;

export interface ImageLoaderDeps {
  /** Dateiendung des aktuellen Bildes (jpeg wird zu jpg) */
  currentImageFormat: Ref<string>;
  originalImageDataUrl: Ref<string | null>;
  originalImage: Ref<HTMLImageElement | null>;
  isDraggingFile: Ref<boolean>;
  imageStore: Pick<ImageStore, 'loadImageFromFile' | 'imageLayers'>;
  /** Dateiname ohne Endung (optional) */
  currentFileName?: Ref<string>;
  /** Originaldatei für EXIF (optional) */
  sourceFile?: Ref<File | null>;
  onImageReady: (img: HTMLImageElement) => unknown;
}

export function useImageLoader({
  currentImageFormat,
  originalImageDataUrl,
  originalImage,
  isDraggingFile,
  imageStore,
  currentFileName,
  sourceFile,
  onImageReady,
}: ImageLoaderDeps) {
  async function loadFileIntoEditor(file: File): Promise<void> {
    const fileType = file.type
      ? file.type.split('/')[1]
      : file.name.split('.').pop()!.toLowerCase();
    currentImageFormat.value = fileType === 'jpeg' ? 'jpg' : fileType;
    if (currentFileName) currentFileName.value = file.name.replace(/\.[^.]+$/, '');

    let imageUrl: string;
    if (needsBackendPreview(file)) {
      const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
      imageUrl = URL.createObjectURL(pngBlob);
    } else {
      imageUrl = await readFileAsDataURL(file);
    }

    const img = await loadImage(imageUrl);

    originalImageDataUrl.value = imageUrl;
    originalImage.value = img;
    if (sourceFile) sourceFile.value = file;
    await onImageReady(img);

    try {
      await imageStore.loadImageFromFile(file);
    } catch (err) {
      logger.warn('Store save failed:', err);
    }
  }

  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files![0];
    // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann
    input.value = '';
    if (!file) return;
    loadFileIntoEditor(file).catch((err) => logger.error('Fehler beim Laden:', err));
  }

  function handleDragLeave(event: DragEvent): void {
    const canvasArea = event.currentTarget as Node;
    if (!canvasArea.contains(event.relatedTarget as Node | null)) {
      isDraggingFile.value = false;
    }
  }

  function handleFileDrop(event: DragEvent): void {
    isDraggingFile.value = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|bmp|svg|tiff?|heic|heif)$/i.test(file.name);
    if (!isImage) return;
    loadFileIntoEditor(file).catch((err) => logger.error('Fehler beim Laden:', err));
  }

  function handlePaste(e: ClipboardEvent): void {
    const active = document.activeElement as HTMLElement | null;
    const isInputFocused =
      active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable;
    if (isInputFocused) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          loadFileIntoEditor(file).catch((err) =>
            logger.error('Fehler beim Einfügen aus Zwischenablage:', err)
          );
        }
        break;
      }
    }
  }

  async function loadGalleryImage(
    galleryImageId: string | number | null | undefined,
    t: Translate
  ): Promise<boolean> {
    if (!galleryImageId) return false;
    try {
      const { useGalleryStore } = await import('@/stores/galleryStore');
      const galleryStore = useGalleryStore();
      const galleryImage = galleryStore.getImage(Number(galleryImageId));
      if (galleryImage) {
        const img = new Image();
        img.onload = async () => {
          originalImageDataUrl.value = galleryImage.url;
          originalImage.value = img;
          if (sourceFile) sourceFile.value = galleryImage.file || null;
          const formatMatch = galleryImage.name.match(/\.(\w+)$/);
          if (formatMatch) {
            const ext = formatMatch[1].toLowerCase();
            currentImageFormat.value = ext === 'jpeg' ? 'jpg' : ext;
          }
          if (currentFileName) currentFileName.value = galleryImage.name.replace(/\.[^.]+$/, '');
          await onImageReady(img);
          if (window.$toast) window.$toast.success(t('toast.editor.galleryLoaded'));
        };
        img.src = galleryImage.url;
        return true;
      }
    } catch (error) {
      logger.error('Fehler beim Laden aus Galerie:', error);
      if (window.$toast) window.$toast.error(t('toast.editor.galleryError'));
    }
    return false;
  }

  async function reloadImageLayers(): Promise<void> {
    const layers = imageStore.imageLayers;
    if (!layers || layers.length === 0) return;
    await Promise.all(
      layers.map(
        (layer) =>
          new Promise<void>((resolve) => {
            if (layer.image?.complete && layer.image.naturalWidth > 0) {
              resolve();
              return;
            }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              layer.image = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = layer.url;
          })
      )
    );
  }

  return {
    loadFileIntoEditor,
    handleFileSelect,
    handleDragLeave,
    handleFileDrop,
    handlePaste,
    loadGalleryImage,
    reloadImageLayers,
  };
}
