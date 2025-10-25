/**
 * Export Utils - Professionelle Export-Funktionalität für Vue 3
 * Pfad: /src/utils/exportUtils.js
 * 
 * Unterstützte Formate:
 * - PNG: Verlustfrei mit Transparenz (Client-side)
 * - JPEG: Verlustbehaftet, klein (Client-side)
 * - WebP: Modern, effizient (Client-side)
 * - TIFF: Professionell (Backend-API)
 * - HEIF: Modern, hohe Effizienz (Backend-API)
 * - GIF: Einzelbild (Backend-API)
 * - PDF: Dokument (Client-side mit jsPDF)
 */

import { ApiClient } from '@/api/api'

/**
 * Format-Informationen
 */
export const FORMAT_INFO = {
  png: {
    name: 'PNG',
    description: 'Verlustfrei, mit Transparenz',
    extension: 'png',
    mimeType: 'image/png',
    supportsQuality: false,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Logos, UI, Screenshots',
    icon: '🖼️'
  },
  jpeg: {
    name: 'JPEG',
    description: 'Verlustbehaftet, kleine Dateigröße',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Fotos, Bilder',
    icon: '📷'
  },
  jpg: {
    name: 'JPG',
    description: 'Verlustbehaftet, kleine Dateigröße',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Fotos, Bilder',
    icon: '📷'
  },
  webp: {
    name: 'WebP',
    description: 'Modern, effizient, klein',
    extension: 'webp',
    mimeType: 'image/webp',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Web, moderne Browser',
    icon: '🌐'
  },
  tiff: {
    name: 'TIFF',
    description: 'Professionelles Format',
    extension: 'tiff',
    mimeType: 'image/tiff',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '1GB',
    recommended: 'Druck, Archivierung',
    icon: '📄'
  },
  tif: {
    name: 'TIF',
    description: 'Professionelles Format',
    extension: 'tif',
    mimeType: 'image/tiff',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '1GB',
    recommended: 'Druck, Archivierung',
    icon: '📄'
  },
  heif: {
    name: 'HEIF',
    description: 'Modern, hohe Effizienz',
    extension: 'heif',
    mimeType: 'image/heif',
    supportsQuality: true,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'Fotos (neuere Geräte)',
    icon: '📱'
  },
  heic: {
    name: 'HEIC',
    description: 'Modern, hohe Effizienz (Apple)',
    extension: 'heic',
    mimeType: 'image/heic',
    supportsQuality: true,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'iOS, macOS',
    icon: '🍎'
  },
  gif: {
    name: 'GIF',
    description: 'Einzelbild-GIF',
    extension: 'gif',
    mimeType: 'image/gif',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'Kompatibilität, Retro',
    icon: '🎨'
  },
  pdf: {
    name: 'PDF',
    description: 'Dokument, A4-Format',
    extension: 'pdf',
    mimeType: 'application/pdf',
    supportsQuality: false,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Dokumente, Druck',
    icon: '📑'
  }
}

/**
 * Alle unterstützten Formate
 */
export const SUPPORTED_FORMATS = Object.keys(FORMAT_INFO)

/**
 * Client-side Formate (ohne Backend)
 */
export const CLIENT_FORMATS = SUPPORTED_FORMATS.filter(
  format => !FORMAT_INFO[format].requiresBackend
)

/**
 * Backend-Formate (benötigen API-Call)
 */
export const BACKEND_FORMATS = SUPPORTED_FORMATS.filter(
  format => FORMAT_INFO[format].requiresBackend
)

/**
 * Export Manager Class
 */
export class ExportManager {
  constructor() {
    this.jsPDF = null
    this.backendAvailable = false
    this.initializePDF()
  }

  /**
   * Initialisiert jsPDF für PDF-Export
   */
  async initializePDF() {
    try {
      // Dynamischer Import von jsPDF
      const { jsPDF } = await import('jspdf')
      this.jsPDF = jsPDF
      console.log('✅ jsPDF erfolgreich geladen')
      return true
    } catch (error) {
      console.warn('⚠️ jsPDF konnte nicht geladen werden:', error)
      return false
    }
  }

  /**
   * Prüft Backend-Verfügbarkeit
   */
  async checkBackend() {
    this.backendAvailable = await ApiClient.checkBackendAvailability()
    return this.backendAvailable
  }

  /**
   * Hauptmethode: Exportiert ein Bild
   * 
   * @param {HTMLCanvasElement} canvas - Das Canvas-Element
   * @param {string} format - Exportformat
   * @param {string} filename - Dateiname (ohne Extension)
   * @param {Object} options - Export-Optionen
   * @returns {Promise<Object>} - Export-Ergebnis
   */
  async exportImage(canvas, format, filename = 'image', options = {}) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Gültiges Canvas-Element erforderlich')
    }

    format = format.toLowerCase()
    
    if (!SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Format ${format} wird nicht unterstützt`)
    }

    // Validierung
    this.validateCanvas(canvas)

    // Default-Optionen
    const exportOptions = {
      quality: options.quality || 0.92,
      texts: options.texts || [],
      ...options
    }

    try {
      // Format-spezifischer Export
      switch (format) {
        case 'png':
          return await this.exportPNG(canvas, filename, exportOptions)
        
        case 'jpeg':
        case 'jpg':
          return await this.exportJPEG(canvas, filename, exportOptions)
        
        case 'webp':
          return await this.exportWebP(canvas, filename, exportOptions)
        
        case 'tiff':
        case 'tif':
          return await this.exportTIFF(canvas, filename, exportOptions)
        
        case 'heif':
        case 'heic':
          return await this.exportHEIF(canvas, filename, exportOptions)
        
        case 'gif':
          return await this.exportGIF(canvas, filename, exportOptions)
        
        case 'pdf':
          return await this.exportPDF(canvas, filename, exportOptions)
        
        default:
          // Fallback zu PNG
          return await this.exportPNG(canvas, filename, exportOptions)
      }
    } catch (error) {
      console.error(`Export-Fehler (${format}):`, error)
      throw new Error(`Export fehlgeschlagen: ${error.message}`)
    }
  }

  /**
   * Canvas-Validierung
   */
  validateCanvas(canvas) {
    const pixels = canvas.width * canvas.height
    const maxPixels = 50000 * 50000 // 50k x 50k Pixel
    
    if (pixels > maxPixels) {
      const maxDimension = Math.sqrt(maxPixels).toFixed(0)
      throw new Error(
        `Bild zu groß für Export. Maximum: ${maxDimension}x${maxDimension} Pixel`
      )
    }
    
    if (pixels > 10000 * 10000) {
      console.warn('⚠️ Sehr großes Bild - Export kann länger dauern')
    }
  }

  /**
   * PNG Export
   */
  async exportPNG(canvas, filename, options) {
    const dataURL = canvas.toDataURL('image/png')
    this.downloadDataURL(dataURL, `${filename}.png`)
    
    return {
      success: true,
      format: 'png',
      filename: `${filename}.png`,
      size: this.getDataURLSize(dataURL)
    }
  }

  /**
   * JPEG Export
   */
  async exportJPEG(canvas, filename, options) {
    const quality = options.quality || 0.92
    const processedCanvas = this.addWhiteBackground(canvas)
    const dataURL = processedCanvas.toDataURL('image/jpeg', quality)
    this.downloadDataURL(dataURL, `${filename}.jpg`)
    
    return {
      success: true,
      format: 'jpeg',
      filename: `${filename}.jpg`,
      quality: Math.round(quality * 100),
      size: this.getDataURLSize(dataURL)
    }
  }

  /**
   * WebP Export
   */
  async exportWebP(canvas, filename, options) {
    if (!this.supportsWebP()) {
      throw new Error('WebP wird von diesem Browser nicht unterstützt')
    }
    
    const quality = options.quality || 0.85
    const dataURL = canvas.toDataURL('image/webp', quality)
    this.downloadDataURL(dataURL, `${filename}.webp`)
    
    return {
      success: true,
      format: 'webp',
      filename: `${filename}.webp`,
      quality: Math.round(quality * 100),
      size: this.getDataURLSize(dataURL)
    }
  }

  /**
   * TIFF Export (Backend)
   */
  async exportTIFF(canvas, filename, options) {
    const blob = await this.canvasToBlob(canvas, 'image/png')
    const tiffBlob = await ApiClient.convertImage(blob, 'tiff', filename, options)
    this.downloadBlob(tiffBlob, `${filename}.tiff`)
    
    return {
      success: true,
      format: 'tiff',
      filename: `${filename}.tiff`,
      size: this.formatBytes(tiffBlob.size)
    }
  }

  /**
   * HEIF Export (Backend)
   */
  async exportHEIF(canvas, filename, options) {
    const blob = await this.canvasToBlob(canvas, 'image/png')
    const heifBlob = await ApiClient.convertImage(blob, 'heif', filename, options)
    this.downloadBlob(heifBlob, `${filename}.heif`)
    
    return {
      success: true,
      format: 'heif',
      filename: `${filename}.heif`,
      quality: options.quality ? Math.round(options.quality * 100) : null,
      size: this.formatBytes(heifBlob.size)
    }
  }

  /**
   * GIF Export (Backend)
   */
  async exportGIF(canvas, filename, options) {
    const blob = await this.canvasToBlob(canvas, 'image/png')
    const gifBlob = await ApiClient.convertImage(blob, 'gif', filename, options)
    this.downloadBlob(gifBlob, `${filename}.gif`)
    
    return {
      success: true,
      format: 'gif',
      filename: `${filename}.gif`,
      size: this.formatBytes(gifBlob.size)
    }
  }

  /**
   * PDF Export (Client-side mit jsPDF)
   */
  async exportPDF(canvas, filename, options) {
    if (!this.jsPDF) {
      await this.initializePDF()
      if (!this.jsPDF) {
        throw new Error('PDF-Export nicht verfügbar - jsPDF konnte nicht geladen werden')
      }
    }

    // PDF-Dimensionen berechnen
    const pdfConfig = this.calculatePDFDimensions(canvas)
    
    // PDF erstellen
    const pdf = new this.jsPDF({
      orientation: pdfConfig.orientation,
      unit: 'mm',
      format: pdfConfig.format,
      compress: true
    })

    // Metadata setzen
    pdf.setProperties({
      title: filename,
      subject: 'Konvertiertes Bild',
      author: 'Vue Bildkonverter',
      creator: 'KodiniTools'
    })

    // Bild zum PDF hinzufügen
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(
      imgData,
      'JPEG',
      pdfConfig.x,
      pdfConfig.y,
      pdfConfig.width,
      pdfConfig.height,
      undefined,
      'FAST'
    )

    // PDF speichern
    pdf.save(`${filename}.pdf`)

    return {
      success: true,
      format: 'pdf',
      filename: `${filename}.pdf`,
      pages: 1,
      orientation: pdfConfig.orientation
    }
  }

  /**
   * Berechnet PDF-Dimensionen
   */
  calculatePDFDimensions(canvas) {
    const aspectRatio = canvas.width / canvas.height
    let format, orientation, width, height, x, y

    // A4-Maße in mm
    const a4Width = 210
    const a4Height = 297

    if (aspectRatio > 1) {
      // Querformat
      orientation = 'landscape'
      format = 'a4'
      width = a4Height - 20 // Rand
      height = width / aspectRatio
      x = 10
      y = (a4Width - height) / 2
    } else {
      // Hochformat
      orientation = 'portrait'
      format = 'a4'
      width = a4Width - 20 // Rand
      height = width / aspectRatio
      x = 10
      y = (a4Height - height) / 2
      
      // Wenn Bild zu hoch, anpassen
      if (height > a4Height - 20) {
        height = a4Height - 20
        width = height * aspectRatio
        x = (a4Width - width) / 2
        y = 10
      }
    }

    return { orientation, format, width, height, x, y }
  }

  /**
   * Fügt weißen Hintergrund hinzu (für JPEG)
   */
  addWhiteBackground(canvas) {
    const newCanvas = document.createElement('canvas')
    newCanvas.width = canvas.width
    newCanvas.height = canvas.height
    const ctx = newCanvas.getContext('2d')
    
    // Weißer Hintergrund
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)
    
    // Original-Bild darüber
    ctx.drawImage(canvas, 0, 0)
    
    return newCanvas
  }

  /**
   * Konvertiert Canvas zu Blob
   */
  canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas-zu-Blob-Konvertierung fehlgeschlagen'))
        },
        type,
        quality
      )
    })
  }

  /**
   * Download von DataURL
   */
  downloadDataURL(dataURL, filename) {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataURL
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Download von Blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.download = filename
    link.href = url
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /**
   * Berechnet DataURL-Größe
   */
  getDataURLSize(dataURL) {
    const base64Data = dataURL.split(',')[1]
    const sizeInBytes = Math.round((base64Data.length * 3) / 4)
    return this.formatBytes(sizeInBytes)
  }

  /**
   * Formatiert Bytes zu lesbarer Größe
   */
  formatBytes(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  /**
   * Prüft WebP-Support
   */
  supportsWebP() {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    try {
      const dataURL = canvas.toDataURL('image/webp')
      return dataURL.startsWith('data:image/webp')
    } catch (error) {
      return false
    }
  }
}

// Singleton-Instanz
let exportManagerInstance = null

/**
 * Gibt die Export-Manager-Instanz zurück
 */
export function getExportManager() {
  if (!exportManagerInstance) {
    exportManagerInstance = new ExportManager()
  }
  return exportManagerInstance
}

/**
 * Shortcut-Funktion für Export
 */
export async function exportImage(canvas, format, filename, options) {
  const manager = getExportManager()
  return await manager.exportImage(canvas, format, filename, options)
}

/**
 * Gibt Format-Informationen zurück
 */
export function getFormatInfo(format) {
  return FORMAT_INFO[format.toLowerCase()] || null
}

/**
 * Prüft ob Format unterstützt wird
 */
export function isFormatSupported(format) {
  return SUPPORTED_FORMATS.includes(format.toLowerCase())
}

export default {
  ExportManager,
  getExportManager,
  exportImage,
  getFormatInfo,
  isFormatSupported,
  SUPPORTED_FORMATS,
  CLIENT_FORMATS,
  BACKEND_FORMATS,
  FORMAT_INFO
}
