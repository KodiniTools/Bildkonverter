/**
 * useGalleryIntegration Composable
 * Verwaltet das Laden von Bildern aus der Galerie in den Editor
 */
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Composable für Gallery-Integration
 * @param {Object} options - Optionen
 * @param {Function} options.onImageLoad - Callback wenn Bild geladen wird (erhält { url, name, type })
 * @param {Function} options.onError - Callback bei Fehlern
 * @returns {Object} Gallery-Integration State und Methoden
 */
export function useGalleryIntegration(options = {}) {
  const { onImageLoad, onError } = options

  const route = useRoute()

  // Reaktive State
  const isLoadingFromGallery = ref(false)
  const lastLoadedImageId = ref(null)
  const galleryStore = ref(null)

  /**
   * Lädt den Gallery Store dynamisch (um zirkuläre Abhängigkeiten zu vermeiden)
   * @returns {Promise<Object>} Gallery Store
   */
  async function getGalleryStore() {
    if (!galleryStore.value) {
      const { useGalleryStore } = await import('@/stores/galleryStore')
      galleryStore.value = useGalleryStore()
    }
    return galleryStore.value
  }

  /**
   * Lädt ein Bild aus der Galerie anhand der ID
   * @param {string} imageId - ID des Galerie-Bildes
   * @returns {Promise<Object|null>} Bild-Daten oder null bei Fehler
   */
  async function loadImageById(imageId) {
    if (!imageId || isLoadingFromGallery.value) {
      return null
    }

    isLoadingFromGallery.value = true

    try {
      const store = await getGalleryStore()
      const image = store.images.find(img => img.id === imageId)

      if (!image) {
        throw new Error(`Bild mit ID ${imageId} nicht gefunden`)
      }

      lastLoadedImageId.value = imageId

      const imageData = {
        url: image.url || image.dataUrl,
        name: image.name || 'Galerie-Bild',
        type: image.type || 'image/png',
        id: imageId,
        metadata: {
          uploadedAt: image.uploadedAt,
          size: image.size
        }
      }

      if (onImageLoad) {
        await onImageLoad(imageData)
      }

      // Toast-Benachrichtigung
      if (window.$toast) {
        window.$toast.success('Bild aus Galerie geladen')
      }

      return imageData

    } catch (error) {
      console.error('Fehler beim Laden aus Galerie:', error)

      if (onError) {
        onError(error)
      }

      if (window.$toast) {
        window.$toast.error('Fehler beim Laden aus Galerie', error.message)
      }

      return null

    } finally {
      isLoadingFromGallery.value = false
    }
  }

  /**
   * Prüft Route-Query und lädt Bild wenn galleryImageId vorhanden
   */
  async function checkRouteAndLoad() {
    const imageId = route.query?.galleryImageId

    if (imageId && imageId !== lastLoadedImageId.value) {
      await loadImageById(imageId)
    }
  }

  /**
   * Lädt das zuletzt bearbeitete Bild aus der Galerie
   * @returns {Promise<Object|null>} Bild-Daten oder null
   */
  async function loadLastEdited() {
    try {
      const store = await getGalleryStore()
      const images = store.images

      if (!images || images.length === 0) {
        return null
      }

      // Sortiere nach Bearbeitungsdatum (neueste zuerst)
      const sorted = [...images].sort((a, b) => {
        const dateA = a.editedAt || a.uploadedAt || 0
        const dateB = b.editedAt || b.uploadedAt || 0
        return dateB - dateA
      })

      return await loadImageById(sorted[0].id)

    } catch (error) {
      console.error('Fehler beim Laden des letzten Bildes:', error)
      return null
    }
  }

  /**
   * Gibt alle verfügbaren Galerie-Bilder zurück
   * @returns {Promise<Array>} Array von Bild-Objekten
   */
  async function getAvailableImages() {
    try {
      const store = await getGalleryStore()
      return store.images || []
    } catch (error) {
      console.error('Fehler beim Abrufen der Galerie-Bilder:', error)
      return []
    }
  }

  // Route-Query Watcher
  watch(
    () => route.query?.galleryImageId,
    async (newId) => {
      if (newId) {
        await loadImageById(newId)
      }
    }
  )

  // Initialisierung beim Mounten
  onMounted(() => {
    checkRouteAndLoad()
  })

  return {
    // State
    isLoadingFromGallery,
    lastLoadedImageId,

    // Methoden
    loadImageById,
    loadLastEdited,
    getAvailableImages,
    checkRouteAndLoad
  }
}

export default useGalleryIntegration
