/**
 * useCrop.js - Composable für Crop-Funktionalität
 * Extrahiert aus EditorView.vue - Alle Crop-Logik in einem Composable
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Seitenverhältnis-Presets
export const ASPECT_RATIO_PRESETS = [
  { id: 'free', label: 'Frei', ratio: null, icon: 'fa-expand' },
  { id: '1:1', label: '1:1', ratio: 1, icon: 'fa-square' },
  { id: '4:3', label: '4:3', ratio: 4 / 3, icon: 'fa-image' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, icon: 'fa-tv' },
  { id: '9:16', label: '9:16', ratio: 9 / 16, icon: 'fa-mobile-alt' }
]

// Resize-Handle Positionen
const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function useCrop() {
  // i18n für Übersetzungen
  const { t } = useI18n()

  // State
  const cropMode = ref(false)
  const cropping = ref(false)
  const cropStart = ref({ x: 0, y: 0 })
  const cropEnd = ref({ x: 0, y: 0 })
  const hasCropped = ref(false)
  const beforeCropImage = ref(null)

  // Seitenverhältnis State
  const selectedAspectRatio = ref('free')
  const canvasSize = ref({ width: 0, height: 0 })

  // Drag & Resize State
  const isDragging = ref(false)
  const isResizing = ref(false)
  const activeHandle = ref(null)
  const dragOffset = ref({ x: 0, y: 0 })

  // Computed
  const cropOverlayStyle = computed(() => {
    if (!cropping.value) return null

    const startX = Math.min(cropStart.value.x, cropEnd.value.x)
    const startY = Math.min(cropStart.value.y, cropEnd.value.y)
    const width = Math.abs(cropEnd.value.x - cropStart.value.x)
    const height = Math.abs(cropEnd.value.y - cropStart.value.y)

    return {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${width}px`,
      height: `${height}px`
    }
  })

  // Berechne die normalisierte Crop-Box (immer positive Werte)
  const normalizedCropBox = computed(() => {
    return {
      x: Math.min(cropStart.value.x, cropEnd.value.x),
      y: Math.min(cropStart.value.y, cropEnd.value.y),
      width: Math.abs(cropEnd.value.x - cropStart.value.x),
      height: Math.abs(cropEnd.value.y - cropStart.value.y)
    }
  })

  // Methods
  function toggleCropMode() {
    if (cropMode.value && cropping.value) {
      // Signal zum finishCrop aufrufen
      return 'finish'
    }

    cropMode.value = !cropMode.value

    if (!cropMode.value) {
      clearCropSelection()
      selectedAspectRatio.value = 'free'
    } else {
      console.log('Crop-Modus aktiviert: Ziehen Sie einen Bereich auf')
      if (window.$toast) {
        window.$toast.info(t('toast.crop.modeActivated'))
      }
    }

    return cropMode.value ? 'activated' : 'deactivated'
  }

  function clearCropSelection() {
    cropping.value = false
    isDragging.value = false
    isResizing.value = false
    activeHandle.value = null
    cropStart.value = { x: 0, y: 0 }
    cropEnd.value = { x: 0, y: 0 }
  }

  function startCrop(x, y) {
    cropping.value = true
    cropStart.value = { x, y }
    cropEnd.value = { x, y }
  }

  // Erstelle eine zentrierte Crop-Box mit dem gewählten Seitenverhältnis
  function createCenteredCropBox(ratio) {
    if (canvasSize.value.width <= 0 || canvasSize.value.height <= 0) return

    const canvasW = canvasSize.value.width
    const canvasH = canvasSize.value.height

    // Berechne maximale Größe die ins Canvas passt (80% des Canvas)
    const maxWidth = canvasW * 0.8
    const maxHeight = canvasH * 0.8

    let boxWidth, boxHeight

    if (ratio === null) {
      // Freie Auswahl - nutze 60% des Canvas
      boxWidth = canvasW * 0.6
      boxHeight = canvasH * 0.6
    } else {
      // Berechne Größe basierend auf Seitenverhältnis
      if (maxWidth / ratio <= maxHeight) {
        boxWidth = maxWidth
        boxHeight = maxWidth / ratio
      } else {
        boxHeight = maxHeight
        boxWidth = maxHeight * ratio
      }
    }

    // Zentriere die Box
    const startX = (canvasW - boxWidth) / 2
    const startY = (canvasH - boxHeight) / 2

    cropStart.value = { x: startX, y: startY }
    cropEnd.value = { x: startX + boxWidth, y: startY + boxHeight }
    cropping.value = true
  }

  function updateCrop(x, y) {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === selectedAspectRatio.value)

    // Wenn kein festes Seitenverhältnis, einfach die Position setzen
    if (!preset || preset.ratio === null) {
      cropEnd.value = { x, y }
      return
    }

    // Berechne Breite und Höhe basierend auf dem Seitenverhältnis
    const ratio = preset.ratio
    const startX = cropStart.value.x
    const startY = cropStart.value.y

    let width = x - startX
    let height = y - startY

    // Berechne die neue Höhe basierend auf der Breite und dem Seitenverhältnis
    const absWidth = Math.abs(width)
    const absHeight = Math.abs(height)

    // Entscheide, ob wir nach Breite oder Höhe skalieren
    let newWidth, newHeight

    if (absWidth / ratio > absHeight) {
      // Breite ist dominant, passe Höhe an
      newWidth = absWidth
      newHeight = absWidth / ratio
    } else {
      // Höhe ist dominant, passe Breite an
      newHeight = absHeight
      newWidth = absHeight * ratio
    }

    // Wende Vorzeichen an (für verschiedene Ziehrichtungen)
    if (width < 0) newWidth = -newWidth
    if (height < 0) newHeight = -newHeight

    // Begrenze auf Canvas-Größe
    let endX = startX + newWidth
    let endY = startY + newHeight

    if (canvasSize.value.width > 0 && canvasSize.value.height > 0) {
      endX = Math.max(0, Math.min(canvasSize.value.width, endX))
      endY = Math.max(0, Math.min(canvasSize.value.height, endY))
    }

    cropEnd.value = { x: endX, y: endY }
  }

  // Verschiebe die Crop-Box
  function moveCropBox(x, y) {
    const box = normalizedCropBox.value

    // Berechne neue Position basierend auf Drag-Offset
    let newX = x - dragOffset.value.x
    let newY = y - dragOffset.value.y

    // Begrenze auf Canvas-Grenzen
    if (canvasSize.value.width > 0 && canvasSize.value.height > 0) {
      newX = Math.max(0, Math.min(canvasSize.value.width - box.width, newX))
      newY = Math.max(0, Math.min(canvasSize.value.height - box.height, newY))
    }

    // Aktualisiere Start und End
    cropStart.value = { x: newX, y: newY }
    cropEnd.value = { x: newX + box.width, y: newY + box.height }
  }

  // Resize die Crop-Box von einem Handle aus
  function resizeCropBox(x, y) {
    if (!activeHandle.value) return

    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === selectedAspectRatio.value)
    const ratio = preset?.ratio || null
    const box = normalizedCropBox.value

    // Begrenze auf Canvas
    x = Math.max(0, Math.min(canvasSize.value.width, x))
    y = Math.max(0, Math.min(canvasSize.value.height, y))

    let newStart = { ...cropStart.value }
    let newEnd = { ...cropEnd.value }

    // Normalisiere Start/End für konsistente Berechnung
    const minX = Math.min(cropStart.value.x, cropEnd.value.x)
    const minY = Math.min(cropStart.value.y, cropEnd.value.y)
    const maxX = Math.max(cropStart.value.x, cropEnd.value.x)
    const maxY = Math.max(cropStart.value.y, cropEnd.value.y)

    // Handle basierte Resize-Logik
    switch (activeHandle.value) {
      case 'nw': // Oben-Links
        newStart = { x: x, y: y }
        newEnd = { x: maxX, y: maxY }
        break
      case 'n': // Oben-Mitte
        newStart = { x: minX, y: y }
        newEnd = { x: maxX, y: maxY }
        break
      case 'ne': // Oben-Rechts
        newStart = { x: minX, y: y }
        newEnd = { x: x, y: maxY }
        break
      case 'e': // Rechts-Mitte
        newStart = { x: minX, y: minY }
        newEnd = { x: x, y: maxY }
        break
      case 'se': // Unten-Rechts
        newStart = { x: minX, y: minY }
        newEnd = { x: x, y: y }
        break
      case 's': // Unten-Mitte
        newStart = { x: minX, y: minY }
        newEnd = { x: maxX, y: y }
        break
      case 'sw': // Unten-Links
        newStart = { x: x, y: minY }
        newEnd = { x: maxX, y: y }
        break
      case 'w': // Links-Mitte
        newStart = { x: x, y: minY }
        newEnd = { x: maxX, y: maxY }
        break
    }

    // Wenn Seitenverhältnis gesetzt, passe an
    if (ratio !== null) {
      const newWidth = Math.abs(newEnd.x - newStart.x)
      const newHeight = Math.abs(newEnd.y - newStart.y)

      // Entscheide basierend auf Handle, welche Dimension führend ist
      const isHorizontalHandle = ['e', 'w'].includes(activeHandle.value)
      const isVerticalHandle = ['n', 's'].includes(activeHandle.value)

      let adjustedWidth, adjustedHeight

      if (isHorizontalHandle) {
        adjustedWidth = newWidth
        adjustedHeight = newWidth / ratio
      } else if (isVerticalHandle) {
        adjustedHeight = newHeight
        adjustedWidth = newHeight * ratio
      } else {
        // Eck-Handle: nutze größere Dimension
        if (newWidth / ratio > newHeight) {
          adjustedWidth = newWidth
          adjustedHeight = newWidth / ratio
        } else {
          adjustedHeight = newHeight
          adjustedWidth = newHeight * ratio
        }
      }

      // Passe die Position basierend auf dem Handle an
      if (activeHandle.value.includes('w')) {
        newStart.x = newEnd.x - adjustedWidth
      } else {
        newEnd.x = newStart.x + adjustedWidth
      }

      if (activeHandle.value.includes('n')) {
        newStart.y = newEnd.y - adjustedHeight
      } else {
        newEnd.y = newStart.y + adjustedHeight
      }
    }

    // Mindestgröße sicherstellen
    const minSize = 20
    if (Math.abs(newEnd.x - newStart.x) >= minSize && Math.abs(newEnd.y - newStart.y) >= minSize) {
      cropStart.value = newStart
      cropEnd.value = newEnd
    }
  }

  // Prüfe ob ein Punkt innerhalb der Crop-Box liegt
  function isPointInCropBox(x, y) {
    if (!cropping.value) return false
    const box = normalizedCropBox.value
    return x >= box.x && x <= box.x + box.width &&
           y >= box.y && y <= box.y + box.height
  }

  // Prüfe welches Handle getroffen wurde (returns null wenn keines)
  function getHandleAtPoint(x, y) {
    if (!cropping.value) return null

    const box = normalizedCropBox.value
    const handleSize = 12 // Größe des Klickbereichs

    const handles = {
      'nw': { x: box.x, y: box.y },
      'n': { x: box.x + box.width / 2, y: box.y },
      'ne': { x: box.x + box.width, y: box.y },
      'e': { x: box.x + box.width, y: box.y + box.height / 2 },
      'se': { x: box.x + box.width, y: box.y + box.height },
      's': { x: box.x + box.width / 2, y: box.y + box.height },
      'sw': { x: box.x, y: box.y + box.height },
      'w': { x: box.x, y: box.y + box.height / 2 }
    }

    for (const [name, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= handleSize && Math.abs(y - pos.y) <= handleSize) {
        return name
      }
    }

    return null
  }

  function setAspectRatio(ratioId) {
    const previousRatio = selectedAspectRatio.value
    selectedAspectRatio.value = ratioId

    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === ratioId)

    // Wenn noch keine Crop-Box existiert, erstelle eine zentrierte
    if (!cropping.value && preset) {
      createCenteredCropBox(preset.ratio)
    } else if (cropping.value && preset && preset.ratio !== null) {
      // Wenn bereits eine Box existiert, passe sie an das neue Seitenverhältnis an
      const box = normalizedCropBox.value
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2

      // Berechne neue Größe mit gleichem Seitenverhältnis
      let newWidth, newHeight
      const ratio = preset.ratio

      // Behalte die größere Dimension und passe die andere an
      if (box.width / ratio <= box.height) {
        newWidth = box.width
        newHeight = box.width / ratio
      } else {
        newHeight = box.height
        newWidth = box.height * ratio
      }

      // Begrenze auf Canvas
      if (newWidth > canvasSize.value.width) {
        newWidth = canvasSize.value.width * 0.9
        newHeight = newWidth / ratio
      }
      if (newHeight > canvasSize.value.height) {
        newHeight = canvasSize.value.height * 0.9
        newWidth = newHeight * ratio
      }

      // Zentriere um den alten Mittelpunkt
      let newX = centerX - newWidth / 2
      let newY = centerY - newHeight / 2

      // Stelle sicher, dass die Box im Canvas bleibt
      newX = Math.max(0, Math.min(canvasSize.value.width - newWidth, newX))
      newY = Math.max(0, Math.min(canvasSize.value.height - newHeight, newY))

      cropStart.value = { x: newX, y: newY }
      cropEnd.value = { x: newX + newWidth, y: newY + newHeight }
    }
  }

  function setCanvasSize(width, height) {
    canvasSize.value = { width, height }
  }

  async function finishCrop(context) {
    const { canvas, currentImage, filters, imageStore } = context
    
    if (!cropping.value || !canvas.value || !currentImage.value) return
    
    cropping.value = false
    
    const startX = Math.min(cropStart.value.x, cropEnd.value.x)
    const startY = Math.min(cropStart.value.y, cropEnd.value.y)
    const width = Math.abs(cropEnd.value.x - cropStart.value.x)
    const height = Math.abs(cropEnd.value.y - cropStart.value.y)
    
    if (width < 10 || height < 10) {
      clearCropSelection()
      console.warn('Crop-Bereich zu klein (mindestens 10x10 Pixel)')
      if (window.$toast) {
        window.$toast.warning(t('toast.crop.tooSmall'), t('toast.crop.tooSmallDetail'))
      }
      return
    }
    
    try {
      // Speichere das Bild VOR dem Zuschneiden (falls noch nicht gespeichert)
      if (!hasCropped.value) {
        // Erstelle temporäres Canvas NUR mit Bild (ohne Texte) für sauberes Backup
        const backupCanvas = document.createElement('canvas')
        const backupCtx = backupCanvas.getContext('2d')
        backupCanvas.width = canvas.value.width
        backupCanvas.height = canvas.value.height
        
        // Kopiere nur das gerenderte Bild (ohne Texte) vom Canvas
        // Dazu müssen wir das currentImage mit Filtern zeichnen
        // Filter-String erstellen (wie in renderImage)
        const filterString = `
          brightness(${filters.value.brightness}%)
          contrast(${filters.value.contrast}%)
          saturate(${filters.value.saturation}%)
          blur(${filters.value.blur}px)
          hue-rotate(${filters.value.hue}deg)
        `
        backupCtx.filter = filterString
        backupCtx.drawImage(currentImage.value, 0, 0, backupCanvas.width, backupCanvas.height)
        backupCtx.filter = 'none'
        
        beforeCropImage.value = {
          dataUrl: backupCanvas.toDataURL('image/png'),
          width: canvas.value.width,
          height: canvas.value.height,
          filters: { ...filters.value },
          texts: imageStore ? [...imageStore.texts] : []
        }
        console.log('Original-Bild (ohne Texte) vor Crop gespeichert')
      }
      
      // cropStart und cropEnd sind bereits Canvas-Koordinaten (nicht Display-Koordinaten)
      // weil getMousePos() in EditorView.vue bereits die Skalierung durchführt
      const cropX = startX
      const cropY = startY
      const cropWidth = width
      const cropHeight = height
      
      console.log(`Crop-Bereich: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`)
      
      // Validierung
      if (cropX < 0 || cropY < 0 || 
          cropX + cropWidth > canvas.value.width || 
          cropY + cropHeight > canvas.value.height) {
        console.error(`Crop außerhalb: Canvas=${canvas.value.width}x${canvas.value.height}, Crop=${cropX},${cropY},${cropWidth},${cropHeight}`)
        if (window.$toast) {
          window.$toast.error(t('toast.crop.outOfBounds'))
        }
        throw new Error('Crop-Bereich muss vollständig auf dem Bild liegen')
      }
      
      // Erstelle temporäres Canvas NUR mit Bild (ohne Texte) für sauberen Crop
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      tempCanvas.width = canvas.value.width
      tempCanvas.height = canvas.value.height
      
      // Rendere das Bild mit Filtern (OHNE Texte) - gleiche Logik wie beim Backup
      const filterString = `
        brightness(${filters.value.brightness}%)
        contrast(${filters.value.contrast}%)
        saturate(${filters.value.saturation}%)
        blur(${filters.value.blur}px)
        hue-rotate(${filters.value.hue}deg)
      `
      tempCtx.filter = filterString
      tempCtx.drawImage(currentImage.value, 0, 0, tempCanvas.width, tempCanvas.height)
      tempCtx.filter = 'none'
      
      // Erstelle neues Canvas für zugeschnittenes Bild
      const cropCanvas = document.createElement('canvas')
      const cropCtx = cropCanvas.getContext('2d')
      
      cropCanvas.width = Math.max(1, Math.round(cropWidth))
      cropCanvas.height = Math.max(1, Math.round(cropHeight))
      
      // High-quality rendering
      cropCtx.imageSmoothingEnabled = true
      cropCtx.imageSmoothingQuality = 'high'
      
      // Kopiere den zugeschnittenen Bereich vom SAUBEREN Canvas (ohne Texte)
      cropCtx.drawImage(
        tempCanvas,
        Math.max(0, cropX),
        Math.max(0, cropY),
        Math.min(cropWidth, tempCanvas.width - cropX),
        Math.min(cropHeight, tempCanvas.height - cropY),
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      )
      
      // Passe Text-Positionen an
      if (imageStore && imageStore.texts) {
        const textsToRemove = []
        
        imageStore.texts.forEach((text) => {
          if (text.x < cropX || text.x > cropX + cropWidth ||
              text.y < cropY || text.y > cropY + cropHeight) {
            textsToRemove.push(text.id)
          } else {
            imageStore.updateText(text.id, {
              x: text.x - cropX,
              y: text.y - cropY
            })
          }
        })
        
        textsToRemove.forEach(id => {
          imageStore.deleteText(id)
        })
        
        console.log(`Text-Positionen angepasst. ${textsToRemove.length} Texte entfernt.`)
      }
      
      // Lade das zugeschnittene Bild
      const croppedDataUrl = cropCanvas.toDataURL('image/png')
      const img = new Image()
      
      img.onload = () => {
        // Callback für externe Updates
        if (context.onCropComplete) {
          context.onCropComplete(img, cropCanvas.width, cropCanvas.height)
        }
        
        // Markiere dass zugeschnitten wurde
        hasCropped.value = true
        
        console.log(`Bild zugeschnitten: ${cropCanvas.width}×${cropCanvas.height}px`)
        if (window.$toast) {
          window.$toast.success(t('toast.crop.success', { 
            width: cropCanvas.width, 
            height: cropCanvas.height 
          }))
        }
      }
      
      img.src = croppedDataUrl
      
      // Beende Crop-Modus
      cropMode.value = false
      clearCropSelection()
      
    } catch (error) {
      console.error('Crop-Fehler:', error)
      if (window.$toast) {
        window.$toast.error(t('toast.crop.error'), error.message)
      }
      clearCropSelection()
    }
  }

  function undoCrop(context) {
    if (!hasCropped.value || !beforeCropImage.value) {
      console.warn('Kein gespeichertes Bild zum Wiederherstellen vorhanden')
      if (window.$toast) {
        window.$toast.warning(t('toast.crop.undoNotAvailable'))
      }
      return
    }
    
    // Bestätigung vom Benutzer
    const confirmUndo = confirm('Möchten Sie den Zuschnitt rückgängig machen und das Original-Bild wiederherstellen?')
    if (!confirmUndo) return
    
    console.log('Stelle Original-Bild vor Crop wieder her...')
    
    const { imageStore } = context
    
    // Lade das gespeicherte Bild vor dem Crop
    const img = new Image()
    img.onload = () => {
      // Stelle Texte wieder her
      if (imageStore && beforeCropImage.value.texts) {
        // Leere das Array komplett
        imageStore.texts.splice(0, imageStore.texts.length)
        
        // Füge Original-Texte wieder ein (behält IDs)
        imageStore.texts.splice(0, 0, ...beforeCropImage.value.texts)
        
        console.log(`✅ ${imageStore.texts.length} Texte wiederhergestellt`)
      }
      
      // Callback für externe Updates
      if (context.onUndoComplete) {
        context.onUndoComplete(img, beforeCropImage.value)
      }
      
      // Zurücksetzen
      hasCropped.value = false
      beforeCropImage.value = null
      
      console.log('✅ Original-Bild erfolgreich wiederhergestellt')
      if (window.$toast) {
        window.$toast.success(t('toast.crop.undoSuccess'))
      }
    }
    
    img.src = beforeCropImage.value.dataUrl
  }

  function resetCropState() {
    if (cropMode.value) {
      cropMode.value = false
      clearCropSelection()
    }
    hasCropped.value = false
    beforeCropImage.value = null
  }

  // Event Handlers für einfache Integration
  function handleMouseDown(pos) {
    if (!cropMode.value) return false

    const { x, y } = pos

    // Prüfe zuerst ob ein Resize-Handle getroffen wurde
    const handle = getHandleAtPoint(x, y)
    if (handle) {
      isResizing.value = true
      activeHandle.value = handle
      return true
    }

    // Prüfe ob innerhalb der bestehenden Crop-Box geklickt wurde
    if (isPointInCropBox(x, y)) {
      isDragging.value = true
      const box = normalizedCropBox.value
      dragOffset.value = { x: x - box.x, y: y - box.y }
      return true
    }

    // Ansonsten starte eine neue Crop-Auswahl
    startCrop(x, y)
    return true
  }

  function handleMouseMove(pos) {
    const { x, y } = pos

    // Resize-Modus
    if (isResizing.value) {
      resizeCropBox(x, y)
      return true
    }

    // Drag-Modus (Box verschieben)
    if (isDragging.value) {
      moveCropBox(x, y)
      return true
    }

    // Neue Auswahl erstellen
    if (cropping.value && !isDragging.value && !isResizing.value) {
      // Nur updaten wenn wir gerade eine neue Auswahl erstellen
      const box = normalizedCropBox.value
      if (box.width < 5 && box.height < 5) {
        updateCrop(x, y)
        return true
      }
    }

    return false
  }

  function handleMouseUp() {
    const wasResizing = isResizing.value
    const wasDragging = isDragging.value

    isResizing.value = false
    isDragging.value = false
    activeHandle.value = null

    // Wenn wir nur verschoben oder resized haben, nicht finishen
    if (wasResizing || wasDragging) {
      return false
    }

    // Nur wenn eine neue Auswahl erstellt wurde
    if (cropping.value) {
      const box = normalizedCropBox.value
      // Nur finishen wenn die Box groß genug ist
      if (box.width >= 10 && box.height >= 10) {
        return false // Wir behalten die Box, User muss Button klicken zum Bestätigen
      }
    }

    return false
  }

  // Cursor-Style basierend auf Position
  function getCursorForPosition(x, y) {
    if (!cropMode.value || !cropping.value) return 'crosshair'

    const handle = getHandleAtPoint(x, y)
    if (handle) {
      const cursors = {
        'nw': 'nwse-resize',
        'se': 'nwse-resize',
        'ne': 'nesw-resize',
        'sw': 'nesw-resize',
        'n': 'ns-resize',
        's': 'ns-resize',
        'e': 'ew-resize',
        'w': 'ew-resize'
      }
      return cursors[handle] || 'move'
    }

    if (isPointInCropBox(x, y)) {
      return 'move'
    }

    return 'crosshair'
  }

  return {
    // State
    cropMode,
    cropping,
    hasCropped,
    cropOverlayStyle,
    selectedAspectRatio,
    isDragging,
    isResizing,
    normalizedCropBox,

    // Methods
    toggleCropMode,
    finishCrop,
    undoCrop,
    resetCropState,
    clearCropSelection,
    setAspectRatio,
    setCanvasSize,
    getCursorForPosition,
    getHandleAtPoint,

    // Event Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
