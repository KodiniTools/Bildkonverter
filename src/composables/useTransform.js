/**
 * useTransform.js - Composable für Transformationen
 * Deckkraft, Rotation, Drehen, Spiegeln, Zoom, Pan, etc.
 */

import { ref, computed } from 'vue'

export function useTransform() {
  // State
  const transforms = ref({
    opacity: 100,          // 0-100%
    rotation: 0,           // -180 bis +180 Grad
    scale: 100,            // 10-200%
    flipHorizontal: false, // true/false
    flipVertical: false,   // true/false
    borderRadius: 0,       // 0-50px
    borderWidth: 0,        // 0-20px
    borderColor: '#000000', // Hex color
    panX: 0,               // Pan-Offset X (in Pixeln)
    panY: 0                // Pan-Offset Y (in Pixeln)
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
  
  /**
   * Setze Deckkraft
   */
  function setOpacity(value) {
    transforms.value.opacity = Math.max(0, Math.min(100, value))
  }

  /**
   * Setze Rotation
   */
  function setRotation(degrees) {
    transforms.value.rotation = degrees
    // Normalisiere auf -180 bis +180
    while (transforms.value.rotation > 180) {
      transforms.value.rotation -= 360
    }
    while (transforms.value.rotation < -180) {
      transforms.value.rotation += 360
    }
  }

  /**
   * Drehe um fixe Grad
   */
  function rotate(degrees) {
    setRotation(transforms.value.rotation + degrees)
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
  }

  /**
   * Spiegeln vertikal
   */
  function flipVertical() {
    transforms.value.flipVertical = !transforms.value.flipVertical
  }

  /**
   * Setze Zoom/Skalierung
   */
  function setScale(value) {
    transforms.value.scale = Math.max(10, Math.min(200, value))
    // Bei Zoom <= 100% Pan zurücksetzen
    if (transforms.value.scale <= 100) {
      transforms.value.panX = 0
      transforms.value.panY = 0
    }
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
  function setBorderRadius(value) {
    transforms.value.borderRadius = Math.max(0, Math.min(50, value))
  }

  /**
   * Setze Rahmen-Dicke
   */
  function setBorderWidth(value) {
    transforms.value.borderWidth = Math.max(0, Math.min(20, value))
  }

  /**
   * Setze Rahmen-Farbe
   */
  function setBorderColor(color) {
    transforms.value.borderColor = color
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
  function resetTransforms() {
    transforms.value = {
      opacity: 100,
      rotation: 0,
      scale: 100,
      flipHorizontal: false,
      flipVertical: false,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#000000',
      panX: 0,
      panY: 0
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
    resetTransforms
  }
}
