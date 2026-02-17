/**
 * API Configuration
 * Pfad: /src/api/api.js
 */

// Base URL - wird automatisch gesetzt basierend auf der Umgebung
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    // Production: Verwendet den /bildkonverter Pfad
    return '/bildkonverter/api'
  }
  // Development: Verwendet localhost
  return 'http://localhost:3000/api'
}

export const API_BASE_URL = getBaseURL()

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Bildkonvertierung
  convertImage: `${API_BASE_URL}/convert-image`,
  
  // Weitere Endpoints (falls benötigt)
  uploadImage: `${API_BASE_URL}/upload`,
  getFormats: `${API_BASE_URL}/formats`,
}

/**
 * API Helper Functions
 */
export class ApiClient {
  /**
   * Konvertiert ein Bild über das Backend
   * @param {Blob} imageBlob - Das Bild als Blob
   * @param {string} format - Zielformat (tiff, heif, gif)
   * @param {string} filename - Dateiname
   * @param {Object} options - Zusätzliche Optionen
   */
  static async convertImage(imageBlob, format, filename, options = {}) {
    const formData = new FormData()
    // Preserve original filename so the backend can detect the format correctly
    const uploadName = (imageBlob instanceof File && imageBlob.name) ? imageBlob.name : (filename || 'image.png')
    formData.append('image', imageBlob, uploadName)
    formData.append('format', format)
    formData.append('filename', filename)
    
    // Optionale Parameter
    if (options.quality) {
      formData.append('quality', options.quality)
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.convertImage, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server-Fehler: ${response.status}`)
      }
      
      return await response.blob()
    } catch (error) {
      console.error('API-Fehler bei Bildkonvertierung:', error)
      throw error
    }
  }
  
  /**
   * Prüft die Verfügbarkeit des Backends
   */
  static async checkBackendAvailability() {
    try {
      const response = await fetch(API_ENDPOINTS.getFormats, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 Sekunden Timeout
      })
      return response.ok
    } catch (error) {
      console.warn('Backend nicht erreichbar:', error)
      return false
    }
  }
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ApiClient
}
