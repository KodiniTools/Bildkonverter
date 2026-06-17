import { ApiClient } from '@/api/api';

export function useImageLoader({
  currentImageFormat,
  originalImageDataUrl,
  originalImage,
  isDraggingFile,
  imageStore,
  onImageReady,
}) {
  function needsBackendPreview(file) {
    const unsupportedTypes = ['image/tiff', 'image/heic', 'image/heif'];
    if (unsupportedTypes.includes(file.type)) return true;
    return /\.(tiff?|heic|heif)$/i.test(file.name);
  }

  async function loadFileIntoEditor(file) {
    const fileType = file.type ? file.type.split('/')[1] : file.name.split('.').pop().toLowerCase();
    currentImageFormat.value = fileType === 'jpeg' ? 'jpg' : fileType;

    let imageUrl;
    if (needsBackendPreview(file)) {
      const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
      imageUrl = URL.createObjectURL(pngBlob);
    } else {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      i.src = imageUrl;
    });

    originalImageDataUrl.value = imageUrl;
    originalImage.value = img;
    await onImageReady(img);

    try {
      await imageStore.loadImageFromFile(file);
    } catch (err) {
      console.warn('Store save failed:', err);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    loadFileIntoEditor(file).catch((err) => console.error('Fehler beim Laden:', err));
  }

  function handleDragLeave(event) {
    const canvasArea = event.currentTarget;
    if (!canvasArea.contains(event.relatedTarget)) {
      isDraggingFile.value = false;
    }
  }

  function handleFileDrop(event) {
    isDraggingFile.value = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|bmp|svg|tiff?|heic|heif)$/i.test(file.name);
    if (!isImage) return;
    loadFileIntoEditor(file).catch((err) => console.error('Fehler beim Laden:', err));
  }

  function handlePaste(e) {
    const isInputFocused =
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      document.activeElement?.isContentEditable;
    if (isInputFocused) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          loadFileIntoEditor(file).catch((err) =>
            console.error('Fehler beim Einfügen aus Zwischenablage:', err)
          );
        }
        break;
      }
    }
  }

  async function loadGalleryImage(galleryImageId, t) {
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
          const formatMatch = galleryImage.name.match(/\.(\w+)$/);
          if (formatMatch) {
            const ext = formatMatch[1].toLowerCase();
            currentImageFormat.value = ext === 'jpeg' ? 'jpg' : ext;
          }
          await onImageReady(img);
          if (window.$toast) window.$toast.success(t('toast.editor.galleryLoaded'));
        };
        img.src = galleryImage.url;
        return true;
      }
    } catch (error) {
      console.error('Fehler beim Laden aus Galerie:', error);
      if (window.$toast) window.$toast.error(t('toast.editor.galleryError'));
    }
    return false;
  }

  async function reloadImageLayers() {
    const layers = imageStore.imageLayers;
    if (!layers || layers.length === 0) return;
    await Promise.all(
      layers.map(
        (layer) =>
          new Promise((resolve) => {
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
