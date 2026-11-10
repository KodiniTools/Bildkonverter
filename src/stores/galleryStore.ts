import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { logger } from '@/utils/logger';
import type { GalleryImage } from '@/composables/gallery/types';

type ImageId = GalleryImage['id'];

/**
 * Gallery Store - Verwaltet die Galerie-Bilder persistent
 */
export const useGalleryStore = defineStore('gallery', () => {
  // State
  const images = ref<GalleryImage[]>([]);
  const selectedImageId = ref<ImageId | null>(null);
  const selectedImageIds = ref<ImageId[]>([]); // Multi-Select für Collage

  // Computed
  const selectedImage = (): GalleryImage | null | undefined => {
    if (!selectedImageId.value) return null;
    return images.value.find((img) => img.id === selectedImageId.value);
  };

  // Computed für Multi-Select
  const selectedImages = computed(() => {
    return images.value.filter((img) => selectedImageIds.value.includes(img.id));
  });

  const hasMultipleSelected = computed(() => {
    return selectedImageIds.value.length > 1;
  });

  // Actions
  function addImage(imageData: GalleryImage): void {
    images.value.push(imageData);
    logger.log(`✅ Bild zur Galerie hinzugefügt: ${imageData.name}`);
  }

  function removeImage(imageId: ImageId): void {
    const index = images.value.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      images.value.splice(index, 1);
      if (selectedImageId.value === imageId) {
        selectedImageId.value = null;
      }
      // Auch aus Multi-Select entfernen
      const multiIndex = selectedImageIds.value.indexOf(imageId);
      if (multiIndex !== -1) {
        selectedImageIds.value.splice(multiIndex, 1);
      }
      logger.log('✅ Bild aus Galerie entfernt');
    }
  }

  function selectImage(imageId: ImageId): void {
    if (selectedImageId.value === imageId) {
      selectedImageId.value = null;
    } else {
      selectedImageId.value = imageId;
    }
  }

  // Multi-Select Funktionen
  function toggleImageSelection(imageId: ImageId): void {
    const index = selectedImageIds.value.indexOf(imageId);
    if (index === -1) {
      selectedImageIds.value.push(imageId);
    } else {
      selectedImageIds.value.splice(index, 1);
    }
  }

  function selectAllImages(): void {
    selectedImageIds.value = images.value.map((img) => img.id);
  }

  function deselectAllImages(): void {
    selectedImageIds.value = [];
  }

  function isImageSelected(imageId: ImageId): boolean {
    return selectedImageIds.value.includes(imageId);
  }

  function clearGallery(): void {
    images.value = [];
    selectedImageId.value = null;
    selectedImageIds.value = [];
  }

  function getImage(imageId: ImageId): GalleryImage | undefined {
    return images.value.find((img) => img.id === imageId);
  }

  function renameImage(imageId: ImageId, newName: string): void {
    const image = images.value.find((img) => img.id === imageId);
    if (image && newName.trim()) {
      image.name = newName.trim();
    }
  }

  return {
    // State
    images,
    selectedImageId,
    selectedImageIds,

    // Computed
    selectedImage,
    selectedImages,
    hasMultipleSelected,

    // Actions
    addImage,
    removeImage,
    renameImage,
    selectImage,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    isImageSelected,
    clearGallery,
    getImage,
  };
});
