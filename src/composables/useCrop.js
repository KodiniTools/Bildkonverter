/**
 * useCrop.js - Composable für Crop-Funktionalität
 * Extrahiert aus EditorView.vue - Alle Crop-Logik in einem Composable
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

  // Methods
  function toggleCropMode() {
    if (cropMode.value && cropping.value) {
      // Signal zum finishCrop aufrufen
      return 'finish'
    }
    
    cropMode.value = !cropMode.value
    
    if (!cropMode.value) {
      clearCropSelection()
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
    cropStart.value = { x: 0, y: 0 }
    cropEnd.value = { x: 0, y: 0 }
  }

  function startCrop(x, y) {
    cropping.value = true
    cropStart.value = { x, y }
    cropEnd.value = { x, y }
  }

  function updateCrop(x, y) {
    cropEnd.value = { x, y }
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
    if (cropMode.value) {
      startCrop(pos.x, pos.y)
      return true // Signal dass Event behandelt wurde
    }
    return false
  }

  function handleMouseMove(pos) {
    if (cropping.value) {
      updateCrop(pos.x, pos.y)
      return true
    }
    return false
  }

  function handleMouseUp() {
    if (cropping.value) {
      return true // Signal zum finishCrop aufrufen
    }
    return false
  }

  return {
    // State
    cropMode,
    cropping,
    hasCropped,
    cropOverlayStyle,
    
    // Methods
    toggleCropMode,
    finishCrop,
    undoCrop,
    resetCropState,
    clearCropSelection,
    
    // Event Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
