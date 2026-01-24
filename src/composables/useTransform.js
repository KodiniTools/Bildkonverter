/**
 * useTransform.js - Composable für Transformationen
 * Deckkraft, Rotation, Drehen, Spiegeln, Zoom, Pan, etc.
 * Mit Undo/Redo History
 */

import { ref, computed } from 'vue'

// Standardwerte für Transformationen
const DEFAULT_TRANSFORMS = {
  opacity: 100,          // 0-100%
  rotation: 0,           // -180 bis +180 Grad
  scale: 100,            // 10-200%
  flipHorizontal: false, // true/false
  flipVertical: false,   // true/false
  borderRadius: 0,       // 0-50% (50% = vollständiger Kreis)
  borderWidth: 0,        // 0-20px
  borderColor: '#000000', // Hex color
  panX: 0,               // Pan-Offset X (in Pixeln)
  panY: 0                // Pan-Offset Y (in Pixeln)
}

export function useTransform() {
  // State
  const transforms = ref({ ...DEFAULT_TRANSFORMS })

  // History für Undo/Redo
  const transformHistory = ref([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 50

  // History-Funktionen

  /**
   * Speichert aktuellen Zustand in History
   */
  function saveToHistory() {
    // Entferne alle Einträge nach dem aktuellen Index (bei Redo-Überschreibung)
    if (historyIndex.value < transformHistory.value.length - 1) {
      transformHistory.value = transformHistory.value.slice(0, historyIndex.value + 1)
    }

    // Kopiere aktuellen Zustand
    const snapshot = JSON.parse(JSON.stringify(transforms.value))

    // Prüfe ob sich etwas geändert hat
    const lastEntry = transformHistory.value[transformHistory.value.length - 1]
    if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(snapshot)) {
      return // Keine Änderung, nicht speichern
    }

    transformHistory.value.push(snapshot)

    // Begrenze History-Größe
    if (transformHistory.value.length > MAX_HISTORY) {
      transformHistory.value.shift()
    } else {
      historyIndex.value++
    }
  }

  /**
   * Undo - Gehe einen Schritt zurück
   */
  function undoTransform() {
    if (!canUndoTransform.value) return false

    historyIndex.value--
    const previousState = transformHistory.value[historyIndex.value]
    if (previousState) {
      transforms.value = JSON.parse(JSON.stringify(previousState))
      return true
    }
    return false
  }

  /**
   * Redo - Gehe einen Schritt vorwärts
   */
  function redoTransform() {
    if (!canRedoTransform.value) return false

    historyIndex.value++
    const nextState = transformHistory.value[historyIndex.value]
    if (nextState) {
      transforms.value = JSON.parse(JSON.stringify(nextState))
      return true
    }
    return false
  }

  /**
   * Initialisiere History (beim Laden eines neuen Bildes)
   */
  function initTransformHistory() {
    transformHistory.value = [JSON.parse(JSON.stringify(DEFAULT_TRANSFORMS))]
    historyIndex.value = 0
    transforms.value = { ...DEFAULT_TRANSFORMS }
  }

  /**
   * Prüfe ob Undo möglich ist
   */
  const canUndoTransform = computed(() => {
    return historyIndex.value > 0
  })

  /**
   * Prüfe ob Redo möglich ist
   */
  const canRedoTransform = computed(() => {
    return historyIndex.value < transformHistory.value.length - 1
  })

  // Computed - CSS Transform String
  const transformStyle = computed(() => {
    const parts = []
    
    // Rotation
    if (transforms.value.rotation !== 0) {
      parts.push(`rotate(${transforms.value.rotation}deg)`)
    }
    
    // Scale
    const scaleValue = transforms.value.scale / 100
    if (scaleValue !== 1) {
      parts.push(`scale(${scaleValue})`)
    }
    
    // Flip
    const flipX = transforms.value.flipHorizontal ? -1 : 1
    const flipY = transforms.value.flipVertical ? -1 : 1
    if (flipX !== 1 || flipY !== 1) {
      parts.push(`scale(${flipX}, ${flipY})`)
    }
    
    return parts.length > 0 ? parts.join(' ') : 'none'
  })

  // Methods
  
  // Methods (mit automatischer History-Speicherung bei wichtigen Änderungen)

  /**
   * Setze Deckkraft
   */
  function setOpacity(value, saveHistory = false) {
    transforms.value.opacity = Math.max(0, Math.min(100, value))
    if (saveHistory) saveToHistory()
  }

  /**
   * Setze Rotation
   */
  function setRotation(degrees, saveHistory = false) {
    transforms.value.rotation = degrees
    // Normalisiere auf -180 bis +180
    while (transforms.value.rotation > 180) {
      transforms.value.rotation -= 360
    }
    while (transforms.value.rotation < -180) {
      transforms.value.rotation += 360
    }
    if (saveHistory) saveToHistory()
  }

  /**
   * Drehe um fixe Grad
   */
  function rotate(degrees) {
    setRotation(transforms.value.rotation + degrees, true)
  }

  /**
   * Drehe 90° im Uhrzeigersinn
   */
  function rotate90() {
    rotate(90)
  }

  /**
   * Drehe 90° gegen Uhrzeigersinn
   */
  function rotate90Counter() {
    rotate(-90)
  }

  /**
   * Drehe 180°
   */
  function rotate180() {
    rotate(180)
  }

  /**
   * Spiegeln horizontal
   */
  function flipHorizontal() {
    transforms.value.flipHorizontal = !transforms.value.flipHorizontal
    saveToHistory()
  }

  /**
   * Spiegeln vertikal
   */
  function flipVertical() {
    transforms.value.flipVertical = !transforms.value.flipVertical
    saveToHistory()
  }

  /**
   * Setze Zoom/Skalierung
   */
  function setScale(value, saveHistory = false) {
    transforms.value.scale = Math.max(10, Math.min(200, value))
    // Bei Zoom <= 100% Pan zurücksetzen
    if (transforms.value.scale <= 100) {
      transforms.value.panX = 0
      transforms.value.panY = 0
    }
    if (saveHistory) saveToHistory()
  }

  /**
   * Setze Pan-Offset
   */
  function setPan(x, y) {
    // Pan nur erlauben wenn gezoomt
    if (transforms.value.scale <= 100) {
      transforms.value.panX = 0
      transforms.value.panY = 0
      return
    }
    transforms.value.panX = x
    transforms.value.panY = y
  }

  /**
   * Pan-Offset verschieben (relativ)
   */
  function pan(deltaX, deltaY) {
    if (transforms.value.scale <= 100) return

    // Begrenze Pan basierend auf Zoom-Level
    const maxPan = (transforms.value.scale - 100) * 3 // Skalierter Max-Wert

    const newX = transforms.value.panX + deltaX
    const newY = transforms.value.panY + deltaY

    transforms.value.panX = Math.max(-maxPan, Math.min(maxPan, newX))
    transforms.value.panY = Math.max(-maxPan, Math.min(maxPan, newY))
  }

  /**
   * Pan zurücksetzen
   */
  function resetPan() {
    transforms.value.panX = 0
    transforms.value.panY = 0
  }

  /**
   * Setze Ecken-Rundung
   */
  function setBorderRadius(value, saveHistory = false) {
    transforms.value.borderRadius = Math.max(0, Math.min(50, value))
    if (saveHistory) saveToHistory()
  }

  /**
   * Setze Rahmen-Dicke
   */
  function setBorderWidth(value, saveHistory = false) {
    transforms.value.borderWidth = Math.max(0, Math.min(20, value))
    if (saveHistory) saveToHistory()
  }

  /**
   * Setze Rahmen-Farbe
   */
  function setBorderColor(color, saveHistory = false) {
    transforms.value.borderColor = color
    if (saveHistory) saveToHistory()
  }

  /**
   * Speichere aktuellen Zustand manuell (für Slider-Ende-Events)
   */
  function commitTransform() {
    saveToHistory()
  }

  /**
   * Wende Transformationen auf Canvas an
   */
  function applyToCanvas(canvas, context) {
    if (!canvas || !context) return

    // Deckkraft
    context.globalAlpha = transforms.value.opacity / 100

    // Transform matrix anwenden
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    context.save()
    context.translate(centerX, centerY)

    // Pan-Offset anwenden (nur bei Zoom > 100%)
    if (transforms.value.scale > 100 && (transforms.value.panX !== 0 || transforms.value.panY !== 0)) {
      context.translate(transforms.value.panX, transforms.value.panY)
    }

    // Rotation
    if (transforms.value.rotation !== 0) {
      const radians = (transforms.value.rotation * Math.PI) / 180
      context.rotate(radians)
    }

    // Scale
    const scaleValue = transforms.value.scale / 100
    if (scaleValue !== 1) {
      context.scale(scaleValue, scaleValue)
    }

    // Flip
    if (transforms.value.flipHorizontal || transforms.value.flipVertical) {
      const flipX = transforms.value.flipHorizontal ? -1 : 1
      const flipY = transforms.value.flipVertical ? -1 : 1
      context.scale(flipX, flipY)
    }

    context.translate(-centerX, -centerY)

    return () => {
      context.restore()
      context.globalAlpha = 1
    }
  }

  /**
   * Wende Transformationen permanent auf Bild an (erstellt neues Bild)
   */
  async function applyPermanently(currentImage, canvas) {
    if (!currentImage || !canvas) return null

    return new Promise((resolve, reject) => {
      try {
        // Berechne neue Dimensionen basierend auf Rotation und Scale
        const radians = (transforms.value.rotation * Math.PI) / 180
        const cos = Math.abs(Math.cos(radians))
        const sin = Math.abs(Math.sin(radians))
        
        const scaleValue = transforms.value.scale / 100
        const newWidth = Math.round((canvas.width * cos + canvas.height * sin) * scaleValue)
        const newHeight = Math.round((canvas.width * sin + canvas.height * cos) * scaleValue)
        
        // Erstelle temporäres Canvas
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = newWidth
        tempCanvas.height = newHeight
        const tempCtx = tempCanvas.getContext('2d')
        
        // High quality
        tempCtx.imageSmoothingEnabled = true
        tempCtx.imageSmoothingQuality = 'high'
        
        // Deckkraft
        tempCtx.globalAlpha = transforms.value.opacity / 100
        
        // Zentriere und transformiere
        tempCtx.save()
        tempCtx.translate(newWidth / 2, newHeight / 2)
        
        // Rotation
        if (transforms.value.rotation !== 0) {
          tempCtx.rotate(radians)
        }
        
        // Scale
        if (scaleValue !== 1) {
          tempCtx.scale(scaleValue, scaleValue)
        }
        
        // Flip
        if (transforms.value.flipHorizontal || transforms.value.flipVertical) {
          const flipX = transforms.value.flipHorizontal ? -1 : 1
          const flipY = transforms.value.flipVertical ? -1 : 1
          tempCtx.scale(flipX, flipY)
        }
        
        // Zeichne Bild
        tempCtx.drawImage(
          currentImage,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        )
        
        tempCtx.restore()
        
        // Konvertiere zu Bild
        const dataUrl = tempCanvas.toDataURL('image/png')
        const img = new Image()
        
        img.onload = () => {
          resolve({ img, width: newWidth, height: newHeight })
        }
        
        img.onerror = () => {
          reject(new Error('Fehler beim Laden des transformierten Bildes'))
        }
        
        img.src = dataUrl
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Alle Transformationen zurücksetzen
   */
  function resetTransforms(addToHistory = true) {
    transforms.value = { ...DEFAULT_TRANSFORMS }
    if (addToHistory) {
      saveToHistory()
    }
  }

  /**
   * Prüfe ob Transformationen aktiv sind
   */
  const hasTransforms = computed(() => {
    return (
      transforms.value.opacity !== 100 ||
      transforms.value.rotation !== 0 ||
      transforms.value.scale !== 100 ||
      transforms.value.flipHorizontal ||
      transforms.value.flipVertical ||
      transforms.value.borderRadius !== 0 ||
      transforms.value.borderWidth !== 0
    )
  })

  /**
   * Prüfe ob Pan aktiv ist
   */
  const hasPan = computed(() => {
    return transforms.value.panX !== 0 || transforms.value.panY !== 0
  })

  /**
   * Prüfe ob Panning erlaubt ist (nur bei Zoom > 100%)
   */
  const canPan = computed(() => {
    return transforms.value.scale > 100
  })

  return {
    // State
    transforms,
    transformStyle,
    hasTransforms,
    hasPan,
    canPan,

    // History State
    canUndoTransform,
    canRedoTransform,

    // Methods
    setOpacity,
    setRotation,
    rotate,
    rotate90,
    rotate90Counter,
    rotate180,
    flipHorizontal,
    flipVertical,
    setScale,
    setPan,
    pan,
    resetPan,
    setBorderRadius,
    setBorderWidth,
    setBorderColor,
    applyToCanvas,
    applyPermanently,
    resetTransforms,

    // History Methods
    saveToHistory,
    undoTransform,
    redoTransform,
    initTransformHistory,
    commitTransform
  }
}
