import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Gallery Store - Verwaltet die Galerie-Bilder persistent
 */
export const useGalleryStore = defineStore('gallery', () => {
  // State
  const images = ref([])
  const selectedImageId = ref(null)

  // Computed
  const selectedImage = () => {
    if (!selectedImageId.value) return null
    return images.value.find(img => img.id === selectedImageId.value)
  }

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

  function clearGallery() {
    images.value = []
    selectedImageId.value = null
  }

  function getImage(imageId) {
    return images.value.find(img => img.id === imageId)
  }

  return {
    // State
    images,
    selectedImageId,
    
    // Computed
    selectedImage,
    
    // Actions
    addImage,
    removeImage,
    selectImage,
    clearGallery,
    getImage
  }
})
