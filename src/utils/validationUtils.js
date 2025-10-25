/**
 * validationUtils.js - Validierungs-Utilities
 * 
 * Zentrale Validierungsfunktionen für das gesamte Projekt
 */

export class ValidationUtils {
  /**
   * Validiert eine hochgeladene Bild-Datei
   */
  static validateImageFile(file) {
    const errors = []
    
    // Datei vorhanden?
    if (!file) {
      errors.push('Keine Datei ausgewählt')
      return { isValid: false, errors }
    }
    
    // Dateigröße (Max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB in Bytes
    if (file.size > maxSize) {
      errors.push(`Datei zu groß (max ${maxSize / 1024 / 1024}MB)`)
    }
    
    // Dateigröße (Min 1KB)
    const minSize = 1024 // 1KB
    if (file.size < minSize) {
      errors.push('Datei zu klein (min 1KB)')
    }
    
    // Erlaubte MIME-Types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Ungültiger Dateityp: ${file.type}. Erlaubt: JPG, PNG, WEBP, GIF, BMP, SVG`)
    }
    
    // Dateiendung prüfen
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)
    
    if (!extension || !allowedExtensions.includes(extension[0])) {
      errors.push('Ungültige Dateiendung')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validiert einen Filter-Wert
   */
  static validateFilterValue(filterName, value) {
    const numValue = parseFloat(value)
    
    // Prüfen ob Zahl
    if (isNaN(numValue)) {
      return { 
        isValid: false, 
        value: 100,
        error: 'Wert muss eine Zahl sein'
      }
    }
    
    // Min/Max Ranges für verschiedene Filter
    const ranges = {
      brightness: { min: 0, max: 200, default: 100 },
      contrast: { min: 0, max: 200, default: 100 },
      saturation: { min: 0, max: 200, default: 100 },
      grayscale: { min: 0, max: 100, default: 0 },
      sepia: { min: 0, max: 100, default: 0 },
      sharpen: { min: 0, max: 100, default: 0 },
      blur: { min: 0, max: 50, default: 0 },
      hue: { min: 0, max: 360, default: 0 },
      zoom: { min: 0.1, max: 5, default: 1 }
    }
    
    const range = ranges[filterName] || { min: 0, max: 100, default: 100 }
    
    // Wert auf Range begrenzen
    const clampedValue = Math.max(range.min, Math.min(range.max, numValue))
    
    return {
      isValid: true,
      value: clampedValue,
      wasClipped: clampedValue !== numValue
    }
  }
  
  /**
   * Validiert Text-Eigenschaften
   */
  static validateTextProperties(content, fontSize, color) {
    const errors = []
    
    // Text-Inhalt
    if (!content || typeof content !== 'string') {
      errors.push('Text muss ein String sein')
    } else if (content.trim().length === 0) {
      errors.push('Text darf nicht leer sein')
    } else if (content.length > 1000) {
      errors.push('Text zu lang (max 1000 Zeichen)')
    }
    
    // Schriftgröße
    const numFontSize = parseFloat(fontSize)
    if (isNaN(numFontSize)) {
      errors.push('Schriftgröße muss eine Zahl sein')
    } else if (numFontSize < 8) {
      errors.push('Schriftgröße zu klein (min 8px)')
    } else if (numFontSize > 500) {
      errors.push('Schriftgröße zu groß (max 500px)')
    }
    
    // Farbe (Hex-Format)
    if (!color || typeof color !== 'string') {
      errors.push('Farbe muss ein String sein')
    } else if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Ungültige Farbe (Format: #RRGGBB)')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validiert ein vollständiges Text-Objekt
   */
  static validateTextObject(text) {
    const errors = []
    
    // ID
    if (!text.id) {
      errors.push('Text-ID fehlt')
    }
    
    // Content
    const content = text.content || text.txt
    if (!content || content.trim().length === 0) {
      errors.push('Text-Inhalt darf nicht leer sein')
    }
    
    // Position
    if (typeof text.x !== 'number' || typeof text.y !== 'number') {
      errors.push('Position muss Zahlen enthalten')
    }
    
    // Schriftgröße
    const fontSize = text.fontSize || text.size
    if (!fontSize || fontSize < 8 || fontSize > 500) {
      errors.push('Ungültige Schriftgröße (8-500px)')
    }
    
    // Farbe
    if (!text.color || !text.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Ungültige Farbe')
    }
    
    // Deckkraft (optional)
    if (text.opacity !== undefined) {
      if (typeof text.opacity !== 'number' || text.opacity < 0 || text.opacity > 100) {
        errors.push('Deckkraft muss zwischen 0 und 100 liegen')
      }
    }
    
    // Rotation (optional)
    if (text.rotation !== undefined) {
      if (typeof text.rotation !== 'number' || text.rotation < -360 || text.rotation > 360) {
        errors.push('Rotation muss zwischen -360 und 360 Grad liegen')
      }
    }
    
    // Umrandung (optional)
    if (text.stroke && text.strokeWidth !== undefined) {
      if (text.strokeWidth < 1 || text.strokeWidth > 20) {
        errors.push('Umrandungsbreite muss zwischen 1 und 20px liegen')
      }
    }
    
    // Schatten (optional)
    if (text.shadow && text.shadowBlur !== undefined) {
      if (text.shadowBlur < 0 || text.shadowBlur > 50) {
        errors.push('Schatten-Weichheit muss zwischen 0 und 50px liegen')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validiert Export-Einstellungen
   */
  static validateExportSettings(format, quality) {
    const errors = []
    
    // Format
    const allowedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif']
    if (!allowedFormats.includes(format.toLowerCase())) {
      errors.push(`Ungültiges Format: ${format}. Erlaubt: ${allowedFormats.join(', ')}`)
    }
    
    // Qualität (nur für verlustbehaftete Formate)
    if (['jpg', 'jpeg', 'webp'].includes(format.toLowerCase())) {
      const numQuality = parseFloat(quality)
      if (isNaN(numQuality) || numQuality < 0 || numQuality > 1) {
        errors.push('Qualität muss zwischen 0 und 1 liegen')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validiert Canvas-Dimensionen
   */
  static validateCanvasDimensions(width, height) {
    const errors = []
    
    // Min/Max Werte
    const minDimension = 1
    const maxDimension = 8192 // Typisches Canvas-Limit
    
    // Breite
    if (!Number.isInteger(width) || width < minDimension || width > maxDimension) {
      errors.push(`Breite muss zwischen ${minDimension} und ${maxDimension}px liegen`)
    }
    
    // Höhe
    if (!Number.isInteger(height) || height < minDimension || height > maxDimension) {
      errors.push(`Höhe muss zwischen ${minDimension} und ${maxDimension}px liegen`)
    }
    
    // Gesamtgröße (Max Pixel)
    const maxPixels = 16777216 // 4096 x 4096
    if (width * height > maxPixels) {
      errors.push(`Gesamtgröße überschreitet Maximum (${maxPixels} Pixel)`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Sanitiert/Bereinigt Text-Input
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') {
      return ''
    }
    
    return text
      .trim()
      .replace(/[\r\n\t]+/g, ' ') // Zeilenumbrüche/Tabs durch Leerzeichen ersetzen
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen zusammenfassen
      .slice(0, 1000) // Max Länge
  }
  
  /**
   * Validiert Farb-String
   */
  static validateColor(color) {
    if (typeof color !== 'string') {
      return { isValid: false, error: 'Farbe muss ein String sein' }
    }
    
    // Hex-Format: #RRGGBB
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    if (hexPattern.test(color)) {
      return { isValid: true, format: 'hex' }
    }
    
    // RGB-Format: rgb(r, g, b)
    const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
    if (rgbPattern.test(color)) {
      const match = color.match(rgbPattern)
      const [, r, g, b] = match.map(Number)
      if (r <= 255 && g <= 255 && b <= 255) {
        return { isValid: true, format: 'rgb' }
      }
    }
    
    // RGBA-Format: rgba(r, g, b, a)
    const rgbaPattern = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/
    if (rgbaPattern.test(color)) {
      const match = color.match(rgbaPattern)
      const [, r, g, b] = match.slice(1, 4).map(Number)
      if (r <= 255 && g <= 255 && b <= 255) {
        return { isValid: true, format: 'rgba' }
      }
    }
    
    return { 
      isValid: false, 
      error: 'Ungültiges Farbformat. Verwenden Sie #RRGGBB, rgb() oder rgba()' 
    }
  }
  
  /**
   * Konvertiert Farbe zu Hex-Format
   */
  static toHexColor(color) {
    // Bereits Hex?
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return color.toUpperCase()
    }
    
    // RGB/RGBA zu Hex konvertieren
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      const toHex = (n) => n.toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
    }
    
    // Fallback
    return '#000000'
  }
  
  /**
   * Validiert eine URL
   */
  static validateUrl(url) {
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { 
        isValid: false, 
        error: 'Ungültige URL' 
      }
    }
  }
  
  /**
   * Validiert Preset-Daten
   */
  static validatePreset(preset) {
    const errors = []
    
    if (!preset.name || typeof preset.name !== 'string' || preset.name.trim().length === 0) {
      errors.push('Preset-Name fehlt oder ist ungültig')
    }
    
    if (!preset.filters || typeof preset.filters !== 'object') {
      errors.push('Preset-Filter fehlen oder sind ungültig')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Hilfsfunktionen für häufige Validierungen
 */

export function isValidNumber(value, min = -Infinity, max = Infinity) {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

export function isValidInteger(value, min = -Infinity, max = Infinity) {
  const num = parseInt(value)
  return Number.isInteger(num) && num >= min && num <= max
}

export function isValidString(value, minLength = 0, maxLength = Infinity) {
  return typeof value === 'string' && 
         value.length >= minLength && 
         value.length <= maxLength
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

export function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Ersetze ungültige Zeichen
    .replace(/_{2,}/g, '_') // Ersetze mehrfache Unterstriche
    .toLowerCase()
}
