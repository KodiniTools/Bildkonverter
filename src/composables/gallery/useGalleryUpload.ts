import { onMounted, onUnmounted } from 'vue';
import { handoffImageToCanvas } from '@/lib/core/handoff';
import { logger } from '@/utils/logger';
import type { GalleryImage } from './types';

/** Größte erlaubte Datei (Bytes) */
export const MAX_GALLERY_FILE_SIZE = 50 * 1024 * 1024;
/** Kantenlänge der Vorschaubilder */
export const THUMBNAIL_SIZE = 300;

/** Bild aus einem anderen Kodini-Tool (siehe HandoffReceiver) */
export interface HandoffImage {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface GalleryUploadOptions {
  addImage: (image: GalleryImage) => void;
  t: (key: string, fallbackOrParams?: string | Record<string, unknown>) => string;
}

/** Verkleinert ein Bild auf höchstens maxWidth × maxHeight (JPEG, Qualität 0.8) */
export function createThumbnail(
  img: CanvasImageSource & { width: number; height: number },
  maxWidth: number,
  maxHeight: number
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** Galerie-id wie bisher: Zeitstempel plus Zufallsanteil */
const newId = () => Date.now() + Math.random();

/**
 * Bilder in die Galerie holen: Datei- und Ordner-Upload, Einfügen aus der
 * Zwischenablage (Strg+V, solange kein Eingabefeld fokussiert ist) und
 * Übernahme aus anderen Tools (Handoff).
 */
export function useGalleryUpload({ addImage, t }: GalleryUploadOptions) {
  function addImageToGallery(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Datei ist kein Bild'));
        return;
      }
      if (file.size > MAX_GALLERY_FILE_SIZE) {
        reject(new Error('Datei zu groß (max. 50MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          addImage({
            id: newId(),
            name: file.name,
            url,
            thumbnail: createThumbnail(img, THUMBNAIL_SIZE, THUMBNAIL_SIZE),
            width: img.width,
            height: img.height,
            size: file.size,
            uploadedAt: new Date(),
            file,
          });
          resolve();
        };
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
        img.src = url;
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    for (const file of Array.from(input.files ?? [])) {
      try {
        await addImageToGallery(file);
      } catch (error) {
        logger.error(`Fehler beim Laden von ${file.name}:`, error);
        window.$toast?.error(
          t('gallery.uploadError', { name: file.name }) + ': ' + (error as Error).message
        );
      }
    }
    input.value = '';
  }

  async function handleFolderSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      try {
        await addImageToGallery(file);
      } catch (err) {
        logger.error(err);
      }
    }
    input.value = '';
  }

  function handlePaste(e: ClipboardEvent) {
    const active = document.activeElement as HTMLElement | null;
    const isInputFocused =
      active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable;
    if (isInputFocused) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      const name = `clipboard-${Date.now()}.${item.type.split('/')[1] || 'png'}`;
      addImageToGallery(new File([file], name, { type: item.type }))
        .then(() => {
          window.$toast?.success(t('toast.gallery.pasted', 'Bild aus Zwischenablage hinzugefügt'));
        })
        .catch((err) => logger.error('Paste error:', err));
    }
  }

  async function handleHandoffAccept(images: HandoffImage[]) {
    for (const img of images) {
      try {
        const canvas = (await handoffImageToCanvas(img)) as HTMLCanvasElement;
        addImage({
          id: newId(),
          name: img.name,
          url: img.dataUrl,
          thumbnail: createThumbnail(canvas, THUMBNAIL_SIZE, THUMBNAIL_SIZE),
          width: img.width,
          height: img.height,
          size: Math.round(img.dataUrl.length * 0.75),
          uploadedAt: new Date(),
          file: null,
        });
      } catch (error) {
        logger.error(`[Handoff] Fehler beim Import von ${img.name}:`, error);
      }
    }
  }

  onMounted(() => window.addEventListener('paste', handlePaste));
  onUnmounted(() => window.removeEventListener('paste', handlePaste));

  return {
    addImageToGallery,
    handleFileSelect,
    handleFolderSelect,
    handlePaste,
    handleHandoffAccept,
  };
}
