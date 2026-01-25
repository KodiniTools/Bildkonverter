import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Gallery Store - Verwaltet die Galerie-Bilder persistent
 */
export const useGalleryStore = defineStore('gallery', () => {
  // State
  const images = ref([])
  const selectedImageId = ref(null)
  const selectedImageIds = ref([]) // Multi-Select für Collage

  // Computed
  const selectedImage = () => {
    if (!selectedImageId.value) return null
    return images.value.find(img => img.id === selectedImageId.value)
  }

  // Computed für Multi-Select
  const selectedImages = computed(() => {
    return images.value.filter(img => selectedImageIds.value.includes(img.id))
  })

  const hasMultipleSelected = computed(() => {
    return selectedImageIds.value.length > 1
  })

  // Actions
  function addImage(imageData) {
    images.value.push(imageData)
    console.log(`✅ Bild zur Galerie hinzugefügt: ${imageData.name}`)
  }

  function removeImage(imageId) {
    const index = images.value.findIndex(img => img.id === imageId)
    if (index !== -1) {
      images.value.splice(index, 1)
      if (selectedImageId.value === imageId) {
        selectedImageId.value = null
      }
      // Auch aus Multi-Select entfernen
      const multiIndex = selectedImageIds.value.indexOf(imageId)
      if (multiIndex !== -1) {
        selectedImageIds.value.splice(multiIndex, 1)
      }
      console.log('✅ Bild aus Galerie entfernt')
    }
  }

  function selectImage(imageId) {
    if (selectedImageId.value === imageId) {
      selectedImageId.value = null
    } else {
      selectedImageId.value = imageId
    }
  }

  // Multi-Select Funktionen
  function toggleImageSelection(imageId) {
    const index = selectedImageIds.value.indexOf(imageId)
    if (index === -1) {
      selectedImageIds.value.push(imageId)
    } else {
      selectedImageIds.value.splice(index, 1)
    }
  }

  function selectAllImages() {
    selectedImageIds.value = images.value.map(img => img.id)
  }

  function deselectAllImages() {
    selectedImageIds.value = []
  }

  function isImageSelected(imageId) {
    return selectedImageIds.value.includes(imageId)
  }

  function clearGallery() {
    images.value = []
    selectedImageId.value = null
    selectedImageIds.value = []
  }

  function getImage(imageId) {
    return images.value.find(img => img.id === imageId)
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
    selectImage,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    isImageSelected,
    clearGallery,
    getImage
  }
})
