import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ValidationUtils } from '@/utils/validationUtils'
import {
  drawText,
  drawTextSelection,
  createDefaultText,
  normalizeText,
  validateText,
  scaleTextForExport
} from '@/utils/textUtils'

/**
 * Image Store - Erweiterte Version mit fortgeschrittenen Text-Funktionen
 * 
 * Dieser Store ist das Herzstück der Anwendung und verwaltet:
 * - Das geladene Bild und Canvas
 * - Filter-Einstellungen
 * - Text-Elemente mit erweiterten Funktionen
 * - History/Undo-Redo
 */
export const useImageStore = defineStore('image', () => {
  // ===== STATE =====
  
  // Bild-Daten
  const originalImage = ref(null) // HTMLImageElement
  const workingUrl = ref(null) // Aktuelle Bild-URL
  const canvas = ref(null) // Canvas-Element Referenz
  const ctx = ref(null) // Canvas-Context
  
  // Bild-Eigenschaften
  const imageWidth = ref(0)
  const imageHeight = ref(0)
  const originalWidth = ref(0)
  const originalHeight = ref(0)
  
  // Filter-Werte (reaktiv)
  const filters = reactive({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    sharpen: 0,
    zoom: 1.0
  })
  
  // Text-Elemente
  const texts = ref([])
  const selectedTextId = ref(null)

  // Bild-Layer für Collage
  const imageLayers = ref([])
  const selectedLayerId = ref(null)

  // History für Undo/Redo
  const history = ref([])
  const historyIndex = ref(-1)
  const maxHistoryStates = ref(50)
  
  // UI State
  const isProcessing = ref(false)
  const isImageLoaded = ref(false)
  const isDragging = ref(false)
  
  // ===== COMPUTED =====
  
  const hasImage = computed(() => isImageLoaded.value && workingUrl.value !== null)
  
  const canUndo = computed(() => historyIndex.value > 0)
  
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  
  const selectedText = computed(() => {
    if (!selectedTextId.value) return null
    return texts.value.find(t => t.id === selectedTextId.value)
  })
  
  const aspectRatio = computed(() => {
    if (originalWidth.value === 0) return 1
    return originalWidth.value / originalHeight.value
  })
  
  const filtersApplied = computed(() => {
    return filters.brightness !== 100 ||
           filters.contrast !== 100 ||
           filters.saturation !== 100 ||
           filters.grayscale !== 0 ||
           filters.sepia !== 0 ||
           filters.sharpen !== 0
  })
  
  const hasTexts = computed(() => texts.value.length > 0)

  const textCount = computed(() => texts.value.length)

  // Computed für Bild-Layer
  const hasImageLayers = computed(() => imageLayers.value.length > 0)

  const imageLayerCount = computed(() => imageLayers.value.length)

  const selectedImageLayer = computed(() => {
    if (!selectedLayerId.value) return null
    return imageLayers.value.find(l => l.id === selectedLayerId.value)
  })

  const isCollageMode = computed(() => imageLayers.value.length > 0)
  
  // ===== ACTIONS =====
  
  /**
   * Initialisiert das Canvas-Element
   */
  function initCanvas(canvasElement) {
    canvas.value = canvasElement
    ctx.value = canvasElement.getContext('2d', { 
      willReadFrequently: true,
      alpha: true 
    })
    console.log('✅ Canvas initialisiert')
  }
  
  /**
   * Lädt ein Bild aus einer Datei
   */
  async function loadImageFromFile(file) {
    try {
      // Validierung
      const validation = ValidationUtils.validateImageFile(file)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      isProcessing.value = true
      
      // Bild laden
      const url = URL.createObjectURL(file)
      await loadImageFromUrl(url)
      
      // State aktualisieren
      isImageLoaded.value = true
      
      // History-Eintrag
      saveState('Bild hochgeladen', 'upload')
      
      return true
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }
  
  /**
   * Lädt ein Bild von einer URL
   */
  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        originalImage.value = img
        workingUrl.value = url
        originalWidth.value = img.width
        originalHeight.value = img.height
        imageWidth.value = img.width
        imageHeight.value = img.height
        
        // Canvas anpassen und zeichnen
        resizeCanvas(img.width, img.height)
        draw()
        
        resolve(img)
      }
      
      img.onerror = () => {
        reject(new Error('Fehler beim Laden des Bildes'))
      }
      
      img.src = url
    })
  }
  
  /**
   * Passt Canvas-Größe an
   */
  function resizeCanvas(width, height) {
    if (!canvas.value) return
    
    canvas.value.width = width
    canvas.value.height = height
    imageWidth.value = width
    imageHeight.value = height
  }
  
  /**
   * Zeichnet das Bild mit allen Filtern, Bild-Layern und Texten
   */
  function draw() {
    if (!ctx.value) return

    const c = ctx.value

    // Canvas leeren
    c.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Collage-Modus: Zeichne Bild-Layer
    if (imageLayers.value.length > 0) {
      drawImageLayers(c)
    } else if (originalImage.value) {
      // Normaler Modus: Einzelnes Bild
      const filterString = buildFilterString()
      c.filter = filterString
      c.drawImage(originalImage.value, 0, 0, imageWidth.value, imageHeight.value)
    }

    // Filter zurücksetzen für Texte
    c.filter = 'none'

    // Texte zeichnen
    drawTexts(c)
  }

  /**
   * Zeichnet alle Bild-Layer
   */
  function drawImageLayers(context) {
    imageLayers.value.forEach(layer => {
      if (!layer.visible) return

      context.save()

      // Deckkraft
      context.globalAlpha = layer.opacity / 100

      // Filter für diesen Layer
      const filterParts = []
      if (layer.filters.brightness !== 100) filterParts.push(`brightness(${layer.filters.brightness}%)`)
      if (layer.filters.contrast !== 100) filterParts.push(`contrast(${layer.filters.contrast}%)`)
      if (layer.filters.saturation !== 100) filterParts.push(`saturate(${layer.filters.saturation}%)`)
      if (layer.filters.grayscale > 0) filterParts.push(`grayscale(${layer.filters.grayscale}%)`)
      if (layer.filters.sepia > 0) filterParts.push(`sepia(${layer.filters.sepia}%)`)
      context.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none'

      // Rotation um Mittelpunkt
      if (layer.rotation !== 0) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        context.translate(centerX, centerY)
        context.rotate((layer.rotation * Math.PI) / 180)
        context.translate(-centerX, -centerY)
      }

      // Bild zeichnen
      context.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)

      context.restore()

      // Auswahl-Rahmen zeichnen
      if (layer.id === selectedLayerId.value) {
        drawLayerSelection(context, layer)
      }
    })
  }

  /**
   * Zeichnet den Auswahl-Rahmen für einen Layer
   */
  function drawLayerSelection(context, layer) {
    context.save()

    // Rotation für Auswahl-Rahmen
    if (layer.rotation !== 0) {
      const centerX = layer.x + layer.width / 2
      const centerY = layer.y + layer.height / 2
      context.translate(centerX, centerY)
      context.rotate((layer.rotation * Math.PI) / 180)
      context.translate(-centerX, -centerY)
    }

    // Gestrichelter Rahmen
    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2
    context.setLineDash([5, 5])
    context.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4)

    // Resize-Handles
    context.setLineDash([])
    context.fillStyle = '#3b82f6'
    const handleSize = 8
    const handles = [
      { x: layer.x - handleSize / 2, y: layer.y - handleSize / 2 }, // NW
      { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y - handleSize / 2 }, // N
      { x: layer.x + layer.width - handleSize / 2, y: layer.y - handleSize / 2 }, // NE
      { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 }, // E
      { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height - handleSize / 2 }, // SE
      { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y + layer.height - handleSize / 2 }, // S
      { x: layer.x - handleSize / 2, y: layer.y + layer.height - handleSize / 2 }, // SW
      { x: layer.x - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 } // W
    ]

    handles.forEach(handle => {
      context.fillRect(handle.x, handle.y, handleSize, handleSize)
    })

    context.restore()
  }
  
  /**
   * Erstellt den CSS-Filter-String aus den Filter-Werten
   */
  function buildFilterString() {
    const parts = []
    
    if (filters.brightness !== 100) {
      parts.push(`brightness(${filters.brightness}%)`)
    }
    if (filters.contrast !== 100) {
      parts.push(`contrast(${filters.contrast}%)`)
    }
    if (filters.saturation !== 100) {
      parts.push(`saturate(${filters.saturation}%)`)
    }
    if (filters.grayscale > 0) {
      parts.push(`grayscale(${filters.grayscale}%)`)
    }
    if (filters.sepia > 0) {
      parts.push(`sepia(${filters.sepia}%)`)
    }
    
    return parts.length > 0 ? parts.join(' ') : 'none'
  }
  
  /**
   * Zeichnet alle Text-Elemente
   */
  function drawTexts(context) {
    if (!context) return
    
    texts.value.forEach(text => {
      const normalizedText = normalizeText(text)
      drawText(context, normalizedText)
      
      // Zeige Selection für ausgewählten Text
      if (text.id === selectedTextId.value) {
        drawTextSelection(context, normalizedText, true)
      }
    })
  }
  
  /**
   * Setzt einen Filter-Wert
   */
  function setFilter(filterName, value) {
    if (filters.hasOwnProperty(filterName)) {
      const validation = ValidationUtils.validateFilterValue(filterName, value)
      if (validation.isValid) {
        filters[filterName] = validation.value
        draw()
      }
    }
  }
  
  /**
   * Wendet ein Preset an
   */
  function applyPreset(preset) {
    Object.entries(preset.filters).forEach(([key, value]) => {
      if (filters.hasOwnProperty(key)) {
        filters[key] = value
      }
    })
    draw()
    saveState(`Preset "${preset.name}" angewendet`, 'preset')
  }
  
  /**
   * Setzt alle Filter zurück
   */
  function resetFilters() {
    filters.brightness = 100
    filters.contrast = 100
    filters.saturation = 100
    filters.grayscale = 0
    filters.sepia = 0
    filters.sharpen = 0
    filters.zoom = 1.0
    draw()
    saveState('Filter zurückgesetzt', 'reset')
  }
  
  /**
   * Fügt einen Text hinzu
   */
  function addText(textData = {}) {
    // Erstelle Default-Text wenn keine Daten übergeben
    const defaultText = createDefaultText(
      textData.content || textData.txt || 'Neuer Text',
      textData.x !== undefined ? textData.x : imageWidth.value / 2,
      textData.y !== undefined ? textData.y : imageHeight.value / 2
    )
    
    // Merge mit übergebenen Daten
    const newText = {
      ...defaultText,
      ...textData,
      id: Date.now() + Math.random()
    }
    
    // Normalisiere für Rückwärtskompatibilität
    newText.txt = newText.content
    newText.size = newText.fontSize
    
    // Validierung
    const validation = validateText(newText)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    texts.value.push(newText)
    selectedTextId.value = newText.id
    draw()
    saveState('Text hinzugefügt', 'text')
    
    return newText
  }
  
  /**
   * Aktualisiert einen Text
   */
  function updateText(textId, updates) {
    const text = texts.value.find(t => t.id === textId)
    if (!text) {
      console.warn(`Text mit ID ${textId} nicht gefunden`)
      return
    }
    
    // Update durchführen
    Object.assign(text, updates)
    
    // Synchronisiere alte und neue Eigenschaften
    if (updates.content !== undefined) {
      text.txt = updates.content
    }
    if (updates.txt !== undefined) {
      text.content = updates.txt
    }
    if (updates.fontSize !== undefined) {
      text.size = updates.fontSize
    }
    if (updates.size !== undefined) {
      text.fontSize = updates.size
    }
    
    // Validierung
    const validation = validateText(text)
    if (!validation.isValid) {
      console.warn('Text-Validierung fehlgeschlagen:', validation.errors)
    }
    
    draw()
  }
  
  /**
   * Löscht einen Text
   */
  function deleteText(textId) {
    const index = texts.value.findIndex(t => t.id === textId)
    if (index !== -1) {
      texts.value.splice(index, 1)
      if (selectedTextId.value === textId) {
        selectedTextId.value = null
      }
      draw()
      saveState('Text gelöscht', 'text')
    }
  }
  
  /**
   * Löscht alle Texte
   */
  function clearTexts() {
    if (texts.value.length === 0) return
    
    texts.value = []
    selectedTextId.value = null
    draw()
    saveState('Alle Texte gelöscht', 'text')
  }
  
  /**
   * Wählt einen Text aus
   */
  function selectText(textId) {
    if (textId === null || texts.value.some(t => t.id === textId)) {
      selectedTextId.value = textId
      draw()
    }
  }
  
  /**
   * Dupliziert einen Text
   */
  function duplicateText(textId) {
    const original = texts.value.find(t => t.id === textId)
    if (!original) return null
    
    const duplicate = {
      ...original,
      id: Date.now() + Math.random(),
      x: original.x + 20,
      y: original.y + 20
    }
    
    texts.value.push(duplicate)
    selectedTextId.value = duplicate.id
    draw()
    saveState('Text dupliziert', 'text')
    
    return duplicate
  }
  
  /**
   * Verschiebt einen Text in der Z-Order
   */
  function moveTextLayer(textId, direction) {
    const index = texts.value.findIndex(t => t.id === textId)
    if (index === -1) return false

    let newIndex = index

    if (direction === 'up' && index < texts.value.length - 1) {
      newIndex = index + 1
    } else if (direction === 'down' && index > 0) {
      newIndex = index - 1
    } else if (direction === 'top') {
      newIndex = texts.value.length - 1
    } else if (direction === 'bottom') {
      newIndex = 0
    } else {
      return false
    }

    const [text] = texts.value.splice(index, 1)
    texts.value.splice(newIndex, 0, text)

    draw()
    saveState('Text-Ebene verschoben', 'text')

    return true
  }

  // ===== BILD-LAYER FUNKTIONEN (COLLAGE) =====

  // Counter für eindeutige Layer-IDs
  let layerIdCounter = 0

  /**
   * Fügt einen neuen Bild-Layer hinzu
   */
  function addImageLayer(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // Berechne initiale Größe (max 40% der Canvas-Größe für bessere Übersicht)
        const maxWidth = canvas.value ? canvas.value.width * 0.4 : 400
        const maxHeight = canvas.value ? canvas.value.height * 0.4 : 300
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

        // Eindeutige ID generieren
        layerIdCounter++
        const layerId = `layer_${Date.now()}_${layerIdCounter}`

        const layer = {
          id: layerId,
          image: img,
          url: imageData.url,
          name: imageData.name || `Layer ${imageLayers.value.length + 1}`,
          x: 50 + (imageLayers.value.length * 40), // Versetzt positionieren
          y: 50 + (imageLayers.value.length * 40),
          width: img.width * scale,
          height: img.height * scale,
          originalWidth: img.width,
          originalHeight: img.height,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          // Filter pro Layer
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
            hue: 0
          },
          // Umrandung
          border: {
            width: 0,
            color: '#000000',
            radius: 0
          },
          // Schlagschatten
          shadow: {
            enabled: false,
            offsetX: 5,
            offsetY: 5,
            blur: 10,
            color: '#000000',
            opacity: 50
          }
        }

        imageLayers.value.push(layer)
        selectedLayerId.value = layer.id

        resolve(layer)
      }

      img.onerror = (err) => {
        console.error('Bild konnte nicht geladen werden:', imageData.url, err)
        reject(new Error(`Fehler beim Laden des Bildes: ${imageData.name}`))
      }

      img.src = imageData.url
    })
  }

  /**
   * Fügt mehrere Bild-Layer hinzu (für Collage aus Galerie)
   */
  async function addImageLayersFromGallery(galleryImages) {
    // Erst alle bestehenden Layer löschen
    imageLayers.value = []
    selectedLayerId.value = null

    console.log(`🖼️ Starte Hinzufügen von ${galleryImages.length} Bildern...`)

    const addedLayers = []

    for (let i = 0; i < galleryImages.length; i++) {
      const imageData = galleryImages[i]
      try {
        console.log(`  [${i + 1}/${galleryImages.length}] Lade: ${imageData.name}`)
        const layer = await addImageLayer(imageData)
        addedLayers.push(layer)
        console.log(`  ✓ ${imageData.name} hinzugefügt`)
      } catch (error) {
        console.error(`  ✗ Fehler beim Hinzufügen von ${imageData.name}:`, error)
      }
    }

    console.log(`✅ ${addedLayers.length}/${galleryImages.length} Bilder hinzugefügt`)
    return addedLayers
  }

  /**
   * Aktualisiert einen Bild-Layer
   */
  function updateImageLayer(layerId, updates) {
    const layer = imageLayers.value.find(l => l.id === layerId)
    if (!layer) {
      console.warn(`Layer mit ID ${layerId} nicht gefunden`)
      return
    }

    // Updates anwenden
    Object.assign(layer, updates)

    // Wenn Filter aktualisiert werden, merge sie
    if (updates.filters) {
      layer.filters = { ...layer.filters, ...updates.filters }
    }

    draw()
  }

  /**
   * Löscht einen Bild-Layer
   */
  function deleteImageLayer(layerId) {
    const index = imageLayers.value.findIndex(l => l.id === layerId)
    if (index !== -1) {
      imageLayers.value.splice(index, 1)
      if (selectedLayerId.value === layerId) {
        selectedLayerId.value = imageLayers.value.length > 0
          ? imageLayers.value[imageLayers.value.length - 1].id
          : null
      }
      draw()
      saveState('Bild-Layer gelöscht', 'layer')
    }
  }

  /**
   * Wählt einen Bild-Layer aus
   */
  function selectImageLayer(layerId) {
    if (layerId === null || imageLayers.value.some(l => l.id === layerId)) {
      selectedLayerId.value = layerId
      // Text-Auswahl aufheben wenn Layer ausgewählt wird
      if (layerId !== null) {
        selectedTextId.value = null
      }
      draw()
    }
  }

  /**
   * Verschiebt einen Bild-Layer in der Z-Order
   */
  function moveImageLayerOrder(layerId, direction) {
    const index = imageLayers.value.findIndex(l => l.id === layerId)
    if (index === -1) return false

    let newIndex = index

    if (direction === 'up' && index < imageLayers.value.length - 1) {
      newIndex = index + 1
    } else if (direction === 'down' && index > 0) {
      newIndex = index - 1
    } else if (direction === 'top') {
      newIndex = imageLayers.value.length - 1
    } else if (direction === 'bottom') {
      newIndex = 0
    } else {
      return false
    }

    const [layer] = imageLayers.value.splice(index, 1)
    imageLayers.value.splice(newIndex, 0, layer)

    draw()
    saveState('Layer-Reihenfolge geändert', 'layer')

    return true
  }

  /**
   * Dupliziert einen Bild-Layer
   */
  function duplicateImageLayer(layerId) {
    const original = imageLayers.value.find(l => l.id === layerId)
    if (!original) return null

    const duplicate = {
      ...original,
      id: Date.now() + Math.random(),
      name: `${original.name} (Kopie)`,
      x: original.x + 30,
      y: original.y + 30,
      filters: { ...original.filters }
    }

    imageLayers.value.push(duplicate)
    selectedLayerId.value = duplicate.id
    draw()
    saveState('Bild-Layer dupliziert', 'layer')

    return duplicate
  }

  /**
   * Löscht alle Bild-Layer
   */
  function clearImageLayers() {
    if (imageLayers.value.length === 0) return

    imageLayers.value = []
    selectedLayerId.value = null
    draw()
    saveState('Alle Bild-Layer gelöscht', 'layer')
  }

  /**
   * Speichert den aktuellen State in der History
   */
  function saveState(description, type = 'generic') {
    // Entferne zukünftige States wenn wir nicht am Ende sind
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    // Erstelle State-Snapshot (ohne image-Objekte für Serialisierung)
    const layersForHistory = imageLayers.value.map(l => ({
      ...l,
      image: null, // Image-Objekt nicht serialisieren
      url: l.url   // URL behalten für Wiederherstellung
    }))

    const state = {
      timestamp: Date.now(),
      description,
      type,
      filters: { ...filters },
      texts: JSON.parse(JSON.stringify(texts.value)),
      selectedTextId: selectedTextId.value,
      imageLayers: JSON.parse(JSON.stringify(layersForHistory)),
      selectedLayerId: selectedLayerId.value,
      imageData: canvas.value ? canvas.value.toDataURL('image/png', 0.5) : null
    }
    
    history.value.push(state)
    historyIndex.value = history.value.length - 1
    
    // Begrenze History-Größe
    if (history.value.length > maxHistoryStates.value) {
      history.value.shift()
      historyIndex.value--
    }
  }
  
  /**
   * Macht die letzte Aktion rückgängig
   */
  function undo() {
    if (!canUndo.value) return
    
    historyIndex.value--
    restoreState(history.value[historyIndex.value])
  }
  
  /**
   * Wiederholt die letzte rückgängig gemachte Aktion
   */
  function redo() {
    if (!canRedo.value) return
    
    historyIndex.value++
    restoreState(history.value[historyIndex.value])
  }
  
  /**
   * Stellt einen State aus der History wieder her
   */
  async function restoreState(state) {
    if (!state) return

    // Filter wiederherstellen
    Object.assign(filters, state.filters)

    // Texte wiederherstellen
    texts.value = JSON.parse(JSON.stringify(state.texts))

    // Selection wiederherstellen
    selectedTextId.value = state.selectedTextId || null

    // Bild-Layer wiederherstellen (mit Image-Objekten neu laden)
    if (state.imageLayers && state.imageLayers.length > 0) {
      const restoredLayers = []
      for (const layerData of state.imageLayers) {
        if (layerData.url) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = layerData.url
            })
            restoredLayers.push({ ...layerData, image: img })
          } catch (e) {
            console.warn('Layer konnte nicht wiederhergestellt werden:', e)
          }
        }
      }
      imageLayers.value = restoredLayers
      selectedLayerId.value = state.selectedLayerId || null
    } else {
      imageLayers.value = []
      selectedLayerId.value = null
    }

    // Neu zeichnen
    draw()
  }
  
  /**
   * Löscht die komplette History
   */
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }
  
  /**
   * Exportiert das aktuelle Bild als Blob
   */
  async function exportImage(format = 'png', quality = 0.95) {
    if (!canvas.value) {
      throw new Error('Kein Bild geladen')
    }
    
    return new Promise((resolve, reject) => {
      canvas.value.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Fehler beim Erstellen des Blobs'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }
  
  /**
   * Exportiert Texte für ein skaliertes Bild
   */
  function getScaledTexts(scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0) {
    return texts.value.map(text => 
      scaleTextForExport(normalizeText(text), scaleX, scaleY, offsetX, offsetY)
    )
  }
  
  /**
   * Setzt den kompletten Store zurück
   */
  function resetStore() {
    originalImage.value = null
    workingUrl.value = null
    imageWidth.value = 0
    imageHeight.value = 0
    originalWidth.value = 0
    originalHeight.value = 0
    texts.value = []
    selectedTextId.value = null
    imageLayers.value = []
    selectedLayerId.value = null
    isImageLoaded.value = false
    resetFilters()
    clearHistory()
  }
  
  // ===== RETURN =====
  return {
    // State
    originalImage,
    workingUrl,
    canvas,
    ctx,
    imageWidth,
    imageHeight,
    originalWidth,
    originalHeight,
    filters,
    texts,
    selectedTextId,
    imageLayers,
    selectedLayerId,
    history,
    historyIndex,
    isProcessing,
    isImageLoaded,
    isDragging,

    // Computed
    hasImage,
    canUndo,
    canRedo,
    selectedText,
    aspectRatio,
    filtersApplied,
    hasTexts,
    textCount,
    hasImageLayers,
    imageLayerCount,
    selectedImageLayer,
    isCollageMode,

    // Actions - Image
    initCanvas,
    loadImageFromFile,
    loadImageFromUrl,
    resizeCanvas,
    draw,

    // Actions - Filters
    setFilter,
    applyPreset,
    resetFilters,

    // Actions - Text
    addText,
    updateText,
    deleteText,
    clearTexts,
    selectText,
    duplicateText,
    moveTextLayer,

    // Actions - Image Layers (Collage)
    addImageLayer,
    addImageLayersFromGallery,
    updateImageLayer,
    deleteImageLayer,
    selectImageLayer,
    moveImageLayerOrder,
    duplicateImageLayer,
    clearImageLayers,

    // Actions - History
    saveState,
    undo,
    redo,
    clearHistory,

    // Actions - Export
    exportImage,
    getScaledTexts,

    // Actions - General
    resetStore
  }
})
