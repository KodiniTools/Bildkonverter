import { computed } from 'vue';
import { logger } from '@/utils/logger';
import type { ImageLayer, ImageStoreContext, LayerSource } from './types';

/** Seitenlänge des Ebenen-Vorschaubilds in px */
export const LAYER_THUMB_SIZE = 64;

/** Neue Ebene mit Standardwerten; Größe höchstens 40 % des Canvas (bessere Übersicht) */
export function createImageLayer(
  img: HTMLImageElement,
  source: LayerSource,
  options: { id: string; index: number; canvas: HTMLCanvasElement | null }
): ImageLayer {
  const { canvas, index } = options;
  const maxWidth = canvas ? canvas.width * 0.4 : 400;
  const maxHeight = canvas ? canvas.height * 0.4 : 300;
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

  return {
    id: options.id,
    image: img,
    url: source.url,
    name: source.name || `Layer ${index + 1}`,
    x: 50 + index * 40, // Versetzt positionieren
    y: 50 + index * 40,
    width: img.width * scale,
    height: img.height * scale,
    originalWidth: img.width,
    originalHeight: img.height,
    rotation: 0,
    opacity: 100,
    visible: true,
    locked: false,
    // Filter pro Layer
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0,
      hue: 0,
    },
    // Umrandung
    border: {
      width: 0,
      color: '#000000',
      radius: 0,
    },
    // Schlagschatten
    shadow: {
      enabled: false,
      offsetX: 5,
      offsetY: 5,
      blur: 10,
      color: '#000000',
      opacity: 50,
    },
    // Spiegelung
    flipX: false,
    flipY: false,
  };
}

/** Vorschaubild 64×64 als JPEG-Data-URL; fällt die Erzeugung aus, die Bild-URL */
export function createLayerThumbnail(img: HTMLImageElement, fallbackUrl: string): string {
  try {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = LAYER_THUMB_SIZE;
    thumbCanvas.height = LAYER_THUMB_SIZE;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    const scale = Math.min(LAYER_THUMB_SIZE / img.width, LAYER_THUMB_SIZE / img.height);
    const tw = img.width * scale;
    const th = img.height * scale;
    thumbCtx.drawImage(img, (LAYER_THUMB_SIZE - tw) / 2, (LAYER_THUMB_SIZE - th) / 2, tw, th);
    return thumbCanvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return fallbackUrl;
  }
}

/** Bild-Ebenen für den Collage-/Ebenen-Modus inkl. Snapshot für die Historie */
export function useImageLayers({
  canvas,
  imageLayers,
  selectedLayerId,
  selectedTextId,
  selectedShapeId,
  draw,
}: ImageStoreContext) {
  // Counter für eindeutige Layer-IDs
  let layerIdCounter = 0;

  const hasImageLayers = computed(() => imageLayers.value.length > 0);
  const imageLayerCount = computed(() => imageLayers.value.length);
  const selectedImageLayer = computed(() => {
    if (!selectedLayerId.value) return null;
    return imageLayers.value.find((l) => l.id === selectedLayerId.value);
  });

  /** Fügt einen neuen Bild-Layer hinzu */
  function addImageLayer(imageData: LayerSource): Promise<ImageLayer> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Eindeutige ID generieren
        layerIdCounter++;
        const layer = createImageLayer(img, imageData, {
          id: `layer_${Date.now()}_${layerIdCounter}`,
          index: imageLayers.value.length,
          canvas: canvas.value,
        });
        layer.thumbnail = createLayerThumbnail(img, imageData.url);

        imageLayers.value.push(layer);
        selectedLayerId.value = layer.id;

        resolve(layer);
      };

      img.onerror = (err) => {
        logger.error('Bild konnte nicht geladen werden:', imageData.url, err);
        reject(new Error(`Fehler beim Laden des Bildes: ${imageData.name}`));
      };

      img.src = imageData.url;
    });
  }

  /** Fügt mehrere Bild-Layer hinzu (für Collage aus Galerie) */
  async function addImageLayersFromGallery(galleryImages: LayerSource[]) {
    // Erst alle bestehenden Layer löschen
    imageLayers.value = [];
    selectedLayerId.value = null;

    logger.log(`🖼️ Starte Hinzufügen von ${galleryImages.length} Bildern...`);

    const addedLayers: ImageLayer[] = [];

    for (let i = 0; i < galleryImages.length; i++) {
      const imageData = galleryImages[i]!;
      try {
        logger.log(`  [${i + 1}/${galleryImages.length}] Lade: ${imageData.name}`);
        const layer = await addImageLayer(imageData);
        addedLayers.push(layer);
        logger.log(`  ✓ ${imageData.name} hinzugefügt`);
      } catch (error) {
        logger.error(`  ✗ Fehler beim Hinzufügen von ${imageData.name}:`, error);
      }
    }

    logger.log(`✅ ${addedLayers.length}/${galleryImages.length} Bilder hinzugefügt`);
    return addedLayers;
  }

  /** Aktualisiert einen Bild-Layer (Filter werden zusammengeführt) */
  function updateImageLayer(layerId: ImageLayer['id'], updates: Partial<ImageLayer>) {
    const layer = imageLayers.value.find((l) => l.id === layerId);
    if (!layer) {
      logger.warn(`Layer mit ID ${layerId} nicht gefunden`);
      return;
    }

    // Updates anwenden
    Object.assign(layer, updates);

    // Wenn Filter aktualisiert werden, merge sie
    if (updates.filters) {
      layer.filters = { ...layer.filters, ...updates.filters };
    }

    draw();
  }

  /** Löscht einen Bild-Layer; die Auswahl wandert auf die oberste Ebene */
  function deleteImageLayer(layerId: ImageLayer['id']) {
    const index = imageLayers.value.findIndex((l) => l.id === layerId);
    if (index !== -1) {
      imageLayers.value.splice(index, 1);
      if (selectedLayerId.value === layerId) {
        selectedLayerId.value =
          imageLayers.value.length > 0 ? imageLayers.value[imageLayers.value.length - 1]!.id : null;
      }
      draw();
    }
  }

  /** Wählt einen Bild-Layer aus; hebt Text- und Formen-Auswahl auf */
  function selectImageLayer(layerId: ImageLayer['id'] | null) {
    if (layerId === null || imageLayers.value.some((l) => l.id === layerId)) {
      selectedLayerId.value = layerId;
      // Text- und Formen-Auswahl aufheben wenn Layer ausgewählt wird
      if (layerId !== null) {
        selectedTextId.value = null;
        selectedShapeId.value = null;
      }
      draw();
    }
  }

  /** Verschiebt einen Bild-Layer in der Z-Order */
  function moveImageLayerOrder(
    layerId: ImageLayer['id'],
    direction: 'up' | 'down' | 'top' | 'bottom'
  ) {
    const index = imageLayers.value.findIndex((l) => l.id === layerId);
    if (index === -1) return false;

    let newIndex: number;

    if (direction === 'up' && index < imageLayers.value.length - 1) {
      newIndex = index + 1;
    } else if (direction === 'down' && index > 0) {
      newIndex = index - 1;
    } else if (direction === 'top') {
      newIndex = imageLayers.value.length - 1;
    } else if (direction === 'bottom') {
      newIndex = 0;
    } else {
      return false;
    }

    const [layer] = imageLayers.value.splice(index, 1);
    imageLayers.value.splice(newIndex, 0, layer!);

    draw();

    return true;
  }

  /** Dupliziert einen Bild-Layer (versetzt, eigene Filter-Kopie) */
  function duplicateImageLayer(layerId: ImageLayer['id']) {
    const original = imageLayers.value.find((l) => l.id === layerId);
    if (!original) return null;

    const duplicate: ImageLayer = {
      ...original,
      id: Date.now() + Math.random(),
      name: `${original.name} (Kopie)`,
      x: original.x + 30,
      y: original.y + 30,
      filters: { ...original.filters },
    };

    imageLayers.value.push(duplicate);
    selectedLayerId.value = duplicate.id;
    draw();

    return duplicate;
  }

  /** Löscht alle Bild-Layer */
  function clearImageLayers() {
    if (imageLayers.value.length === 0) return;

    imageLayers.value = [];
    selectedLayerId.value = null;
    draw();
  }

  /**
   * Bild-Ebenen ohne Image-Objekte für einen History-Snapshot
   * (die Bilder werden beim Wiederherstellen aus der URL neu geladen)
   */
  function serializeImageLayers(): ImageLayer[] {
    return JSON.parse(
      JSON.stringify(imageLayers.value.map((layer) => ({ ...layer, image: null })))
    );
  }

  /**
   * Stellt Bild-Ebenen aus einem Snapshot wieder her und lädt ihre Bilder neu.
   * @param layers  Ergebnis von serializeImageLayers()
   * @param selectedId  Auswahl nach der Wiederherstellung
   */
  async function restoreImageLayers(
    layers: ImageLayer[] | null | undefined,
    selectedId: ImageLayer['id'] | null = null
  ) {
    const restored: ImageLayer[] = [];
    for (const layerData of layers || []) {
      if (!layerData.url) continue;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = layerData.url;
        });
        restored.push({ ...layerData, image: img });
      } catch (e) {
        logger.warn('Layer konnte nicht wiederhergestellt werden:', e);
      }
    }
    imageLayers.value = restored;
    selectedLayerId.value =
      selectedId && restored.some((l) => l.id === selectedId) ? selectedId : null;
  }

  return {
    hasImageLayers,
    imageLayerCount,
    selectedImageLayer,
    addImageLayer,
    addImageLayersFromGallery,
    updateImageLayer,
    deleteImageLayer,
    selectImageLayer,
    moveImageLayerOrder,
    duplicateImageLayer,
    clearImageLayers,
    serializeImageLayers,
    restoreImageLayers,
  };
}
