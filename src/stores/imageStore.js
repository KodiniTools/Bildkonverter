import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { ValidationUtils } from '@/utils/validationUtils';
import { ApiClient } from '@/api/api';
import { getAdjustedImage } from '@/utils/imageAdjustments';
import { needsBackendPreview } from '@/utils/fileUtils';
import { drawLayerSelection } from '@/composables/useCanvasRenderer';
import {
  drawText,
  drawTextSelection,
  createDefaultText,
  normalizeText,
  validateText,
} from '@/utils/textUtils';

/**
 * Image Store
 *
 * Gemeinsamer Zustand des Editors:
 * - das geladene Basisbild (Referenz für Galerie/Handoff)
 * - Text-Ebenen
 * - Bild-Ebenen und Canvas-Hintergrund für den Collage-/Ebenen-Modus
 *
 * Es gibt genau eine Undo/Redo-Historie: useEditorHistory im Editor. Der
 * Store hält dafür nur eine Delegationsschicht (registerHistory), damit
 * Composables ohne Editor-Kontext (Ebenen-Panel, Text-Dialog,
 * Ebenen-Interaktion) saveState/undo/redo aufrufen können. Filter,
 * Transformationen und Rendering liegen ebenfalls in den Editor-Composables;
 * draw() zeichnet nur eine schnelle Zwischenansicht nach Store-Aktionen.
 */
export const useImageStore = defineStore('image', () => {
  // ===== STATE =====

  // Bild-Daten
  const originalImage = ref(null); // HTMLImageElement
  const workingUrl = ref(null); // Aktuelle Bild-URL
  const canvas = ref(null); // Canvas-Element Referenz
  const ctx = ref(null); // Canvas-Context

  // Bild-Eigenschaften
  const imageWidth = ref(0);
  const imageHeight = ref(0);

  // Text-Elemente
  const texts = ref([]);
  const selectedTextId = ref(null);

  // Bild-Layer für Collage
  const imageLayers = ref([]);
  const selectedLayerId = ref(null);

  // Canvas Hintergrundfarbe (für Collage-Modus)
  const canvasBackgroundColor = ref('#ffffff');

  // Undo/Redo: vom Editor registrierte Historie (useEditorHistory)
  const historyHandlers = shallowRef(null);

  // UI State
  const isImageLoaded = ref(false);

  // ===== COMPUTED =====

  const hasImage = computed(() => isImageLoaded.value && workingUrl.value !== null);

  const canUndo = computed(() => historyHandlers.value?.canUndo.value ?? false);
  const canRedo = computed(() => historyHandlers.value?.canRedo.value ?? false);
  const historyIndex = computed(() => historyHandlers.value?.historyIndex.value ?? -1);
  const historyLength = computed(() => historyHandlers.value?.history.value.length ?? 0);

  // Computed für Bild-Layer
  const hasImageLayers = computed(() => imageLayers.value.length > 0);

  const imageLayerCount = computed(() => imageLayers.value.length);

  const selectedImageLayer = computed(() => {
    if (!selectedLayerId.value) return null;
    return imageLayers.value.find((l) => l.id === selectedLayerId.value);
  });

  // ===== ACTIONS =====

  /**
   * Initialisiert das Canvas-Element
   */
  function initCanvas(canvasElement) {
    canvas.value = canvasElement;
    ctx.value = canvasElement.getContext('2d', {
      willReadFrequently: true,
      alpha: true,
    });
    console.log('✅ Canvas initialisiert');
  }

  /**
   * Lädt ein Bild aus einer Datei
   */
  async function loadImageFromFile(file) {
    try {
      // Validierung
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Browser-inkompatible Formate (TIFF, HEIC, RAW) via Backend zu PNG konvertieren
      let url;
      if (needsBackendPreview(file)) {
        const pngBlob = await ApiClient.convertImage(file, 'png', file.name, {});
        url = URL.createObjectURL(pngBlob);
      } else {
        url = URL.createObjectURL(file);
      }

      // Bild laden
      await loadImageFromUrl(url);

      isImageLoaded.value = true;
      return true;
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      throw error;
    }
  }

  /**
   * Lädt ein Bild von einer URL
   */
  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        originalImage.value = img;
        workingUrl.value = url;
        imageWidth.value = img.width;
        imageHeight.value = img.height;

        // Canvas anpassen und zeichnen
        resizeCanvas(img.width, img.height);
        draw();

        resolve(img);
      };

      img.onerror = () => {
        reject(new Error('Fehler beim Laden des Bildes'));
      };

      img.src = url;
    });
  }

  /**
   * Passt Canvas-Größe an
   */
  function resizeCanvas(width, height) {
    if (!canvas.value) return;

    canvas.value.width = width;
    canvas.value.height = height;
    imageWidth.value = width;
    imageHeight.value = height;
  }

  /**
   * Schnelle Zwischenansicht nach Store-Aktionen: Bild oder Bild-Layer
   * plus Texte. Die vollständige Darstellung (Filter, Transformationen,
   * Schatten, Rahmen) übernimmt useCanvasRenderer im Editor.
   */
  function draw() {
    if (!ctx.value) return;

    const c = ctx.value;

    // Canvas leeren
    c.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Collage-Modus: Zeichne Bild-Layer
    if (imageLayers.value.length > 0) {
      drawImageLayers(c);
    } else if (originalImage.value) {
      // Normaler Modus: Einzelnes Bild
      c.drawImage(originalImage.value, 0, 0, imageWidth.value, imageHeight.value);
    }

    c.filter = 'none';

    // Texte zeichnen
    drawTexts(c);
  }

  /**
   * Zeichnet alle Bild-Layer
   */
  function drawImageLayers(context) {
    imageLayers.value.forEach((layer) => {
      if (!layer.visible) return;

      context.save();

      // Deckkraft
      context.globalAlpha = layer.opacity / 100;

      // Echte, pixelbasierte Tonwert-Anpassungen in die Ebenen-Quelle backen;
      // Effekt-Filter (Graustufen, Sepia) bleiben CSS-Filter.
      const { el: layerSource, cssFilter: layerCssFilter } = getAdjustedImage(
        layer.image,
        layer.filters
      );
      context.filter = layerCssFilter;

      // Rotation um Mittelpunkt
      if (layer.rotation !== 0) {
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        context.translate(centerX, centerY);
        context.rotate((layer.rotation * Math.PI) / 180);
        context.translate(-centerX, -centerY);
      }

      // Bild zeichnen
      context.drawImage(layerSource, layer.x, layer.y, layer.width, layer.height);

      context.restore();

      // Auswahl-Rahmen zeichnen
      if (layer.id === selectedLayerId.value) {
        drawLayerSelection(context, layer);
      }
    });
  }

  /**
   * Zeichnet alle Text-Elemente
   */
  function drawTexts(context) {
    if (!context) return;

    texts.value.forEach((text) => {
      const normalizedText = normalizeText(text);
      drawText(context, normalizedText);

      // Zeige Selection für ausgewählten Text
      if (text.id === selectedTextId.value) {
        drawTextSelection(context, normalizedText, true);
      }
    });
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
    );

    // Merge mit übergebenen Daten
    const newText = {
      ...defaultText,
      ...textData,
      id: Date.now() + Math.random(),
    };

    // Normalisiere für Rückwärtskompatibilität
    newText.txt = newText.content;
    newText.size = newText.fontSize;

    // Validierung
    const validation = validateText(newText);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    texts.value.push(newText);
    selectedTextId.value = newText.id;
    draw();

    return newText;
  }

  /**
   * Aktualisiert einen Text
   */
  function updateText(textId, updates) {
    const text = texts.value.find((t) => t.id === textId);
    if (!text) {
      console.warn(`Text mit ID ${textId} nicht gefunden`);
      return;
    }

    // Update durchführen
    Object.assign(text, updates);

    // Synchronisiere alte und neue Eigenschaften
    if (updates.content !== undefined) {
      text.txt = updates.content;
    }
    if (updates.txt !== undefined) {
      text.content = updates.txt;
    }
    if (updates.fontSize !== undefined) {
      text.size = updates.fontSize;
    }
    if (updates.size !== undefined) {
      text.fontSize = updates.size;
    }

    // Validierung
    const validation = validateText(text);
    if (!validation.isValid) {
      console.warn('Text-Validierung fehlgeschlagen:', validation.errors);
    }

    draw();
  }

  /**
   * Löscht einen Text
   */
  function deleteText(textId) {
    const index = texts.value.findIndex((t) => t.id === textId);
    if (index !== -1) {
      texts.value.splice(index, 1);
      if (selectedTextId.value === textId) {
        selectedTextId.value = null;
      }
      draw();
    }
  }

  // ===== BILD-LAYER FUNKTIONEN (COLLAGE) =====

  // Counter für eindeutige Layer-IDs
  let layerIdCounter = 0;

  /**
   * Fügt einen neuen Bild-Layer hinzu
   */
  function addImageLayer(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Berechne initiale Größe (max 40% der Canvas-Größe für bessere Übersicht)
        const maxWidth = canvas.value ? canvas.value.width * 0.4 : 400;
        const maxHeight = canvas.value ? canvas.value.height * 0.4 : 300;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

        // Eindeutige ID generieren
        layerIdCounter++;
        const layerId = `layer_${Date.now()}_${layerIdCounter}`;

        const layer = {
          id: layerId,
          image: img,
          url: imageData.url,
          name: imageData.name || `Layer ${imageLayers.value.length + 1}`,
          x: 50 + imageLayers.value.length * 40, // Versetzt positionieren
          y: 50 + imageLayers.value.length * 40,
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
            hue: 0,
          },
          // Umrandung
          border: {
            width: 0,
            color: '#000000',
            radius: 0,
          },
          // Schlagschatten
          shadow: {
            enabled: false,
            offsetX: 5,
            offsetY: 5,
            blur: 10,
            color: '#000000',
            opacity: 50,
          },
          // Spiegelung
          flipX: false,
          flipY: false,
        };

        // Thumbnail generieren (64x64 canvas data URL)
        try {
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = 64;
          thumbCanvas.height = 64;
          const thumbCtx = thumbCanvas.getContext('2d');
          const scale = Math.min(64 / img.width, 64 / img.height);
          const tw = img.width * scale;
          const th = img.height * scale;
          thumbCtx.drawImage(img, (64 - tw) / 2, (64 - th) / 2, tw, th);
          layer.thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);
        } catch {
          layer.thumbnail = imageData.url;
        }

        imageLayers.value.push(layer);
        selectedLayerId.value = layer.id;

        resolve(layer);
      };

      img.onerror = (err) => {
        console.error('Bild konnte nicht geladen werden:', imageData.url, err);
        reject(new Error(`Fehler beim Laden des Bildes: ${imageData.name}`));
      };

      img.src = imageData.url;
    });
  }

  /**
   * Fügt mehrere Bild-Layer hinzu (für Collage aus Galerie)
   */
  async function addImageLayersFromGallery(galleryImages) {
    // Erst alle bestehenden Layer löschen
    imageLayers.value = [];
    selectedLayerId.value = null;

    console.log(`🖼️ Starte Hinzufügen von ${galleryImages.length} Bildern...`);

    const addedLayers = [];

    for (let i = 0; i < galleryImages.length; i++) {
      const imageData = galleryImages[i];
      try {
        console.log(`  [${i + 1}/${galleryImages.length}] Lade: ${imageData.name}`);
        const layer = await addImageLayer(imageData);
        addedLayers.push(layer);
        console.log(`  ✓ ${imageData.name} hinzugefügt`);
      } catch (error) {
        console.error(`  ✗ Fehler beim Hinzufügen von ${imageData.name}:`, error);
      }
    }

    console.log(`✅ ${addedLayers.length}/${galleryImages.length} Bilder hinzugefügt`);
    return addedLayers;
  }

  /**
   * Aktualisiert einen Bild-Layer
   */
  function updateImageLayer(layerId, updates) {
    const layer = imageLayers.value.find((l) => l.id === layerId);
    if (!layer) {
      console.warn(`Layer mit ID ${layerId} nicht gefunden`);
      return;
    }

    // Updates anwenden
    Object.assign(layer, updates);

    // Wenn Filter aktualisiert werden, merge sie
    if (updates.filters) {
      layer.filters = { ...layer.filters, ...updates.filters };
    }

    draw();
  }

  /**
   * Löscht einen Bild-Layer
   */
  function deleteImageLayer(layerId) {
    const index = imageLayers.value.findIndex((l) => l.id === layerId);
    if (index !== -1) {
      imageLayers.value.splice(index, 1);
      if (selectedLayerId.value === layerId) {
        selectedLayerId.value =
          imageLayers.value.length > 0 ? imageLayers.value[imageLayers.value.length - 1].id : null;
      }
      draw();
    }
  }

  /**
   * Wählt einen Bild-Layer aus
   */
  function selectImageLayer(layerId) {
    if (layerId === null || imageLayers.value.some((l) => l.id === layerId)) {
      selectedLayerId.value = layerId;
      // Text-Auswahl aufheben wenn Layer ausgewählt wird
      if (layerId !== null) {
        selectedTextId.value = null;
      }
      draw();
    }
  }

  /**
   * Verschiebt einen Bild-Layer in der Z-Order
   */
  function moveImageLayerOrder(layerId, direction) {
    const index = imageLayers.value.findIndex((l) => l.id === layerId);
    if (index === -1) return false;

    let newIndex = index;

    if (direction === 'up' && index < imageLayers.value.length - 1) {
      newIndex = index + 1;
    } else if (direction === 'down' && index > 0) {
      newIndex = index - 1;
    } else if (direction === 'top') {
      newIndex = imageLayers.value.length - 1;
    } else if (direction === 'bottom') {
      newIndex = 0;
    } else {
      return false;
    }

    const [layer] = imageLayers.value.splice(index, 1);
    imageLayers.value.splice(newIndex, 0, layer);

    draw();

    return true;
  }

  /**
   * Dupliziert einen Bild-Layer
   */
  function duplicateImageLayer(layerId) {
    const original = imageLayers.value.find((l) => l.id === layerId);
    if (!original) return null;

    const duplicate = {
      ...original,
      id: Date.now() + Math.random(),
      name: `${original.name} (Kopie)`,
      x: original.x + 30,
      y: original.y + 30,
      filters: { ...original.filters },
    };

    imageLayers.value.push(duplicate);
    selectedLayerId.value = duplicate.id;
    draw();

    return duplicate;
  }

  /**
   * Löscht alle Bild-Layer
   */
  function clearImageLayers() {
    if (imageLayers.value.length === 0) return;

    imageLayers.value = [];
    selectedLayerId.value = null;
    draw();
  }

  // ===== HISTORIE (delegiert an useEditorHistory) =====

  /**
   * Registriert die Editor-Historie. Übergeben wird das Objekt aus
   * useEditorHistory (saveHistory, undo, redo, canUndo, canRedo, history,
   * historyIndex); null hebt die Registrierung auf (Editor verlassen).
   */
  function registerHistory(handlers) {
    historyHandlers.value = handlers;
  }

  /** Schreibt einen Snapshot in die Editor-Historie (ohne Editor: kein Effekt) */
  function saveState(description = '') {
    historyHandlers.value?.saveHistory(description);
  }

  function undo() {
    historyHandlers.value?.undo();
  }

  function redo() {
    historyHandlers.value?.redo();
  }

  /**
   * Bild-Ebenen ohne Image-Objekte für einen History-Snapshot
   * (die Bilder werden beim Wiederherstellen aus der URL neu geladen)
   */
  function serializeImageLayers() {
    return JSON.parse(
      JSON.stringify(imageLayers.value.map((layer) => ({ ...layer, image: null })))
    );
  }

  /**
   * Stellt Bild-Ebenen aus einem Snapshot wieder her und lädt ihre Bilder neu.
   * @param {Array} layers  Ergebnis von serializeImageLayers()
   * @param {string|null} selectedId  Auswahl nach der Wiederherstellung
   */
  async function restoreImageLayers(layers, selectedId = null) {
    const restored = [];
    for (const layerData of layers || []) {
      if (!layerData.url) continue;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = layerData.url;
        });
        restored.push({ ...layerData, image: img });
      } catch (e) {
        console.warn('Layer konnte nicht wiederhergestellt werden:', e);
      }
    }
    imageLayers.value = restored;
    selectedLayerId.value =
      selectedId && restored.some((l) => l.id === selectedId) ? selectedId : null;
  }

  // ===== RETURN =====
  return {
    // State
    originalImage,
    workingUrl,
    imageWidth,
    imageHeight,
    texts,
    selectedTextId,
    imageLayers,
    selectedLayerId,
    canvasBackgroundColor,

    // Computed
    hasImage,
    canUndo,
    canRedo,
    historyIndex,
    historyLength,
    hasImageLayers,
    imageLayerCount,
    selectedImageLayer,

    // Actions - Image
    initCanvas,
    loadImageFromFile,
    draw,

    // Actions - Text
    addText,
    updateText,
    deleteText,

    // Actions - Image Layers (Collage)
    addImageLayer,
    addImageLayersFromGallery,
    updateImageLayer,
    deleteImageLayer,
    selectImageLayer,
    moveImageLayerOrder,
    duplicateImageLayer,
    clearImageLayers,

    // Historie (Delegation an useEditorHistory)
    registerHistory,
    saveState,
    undo,
    redo,
    serializeImageLayers,
    restoreImageLayers,
  };
});
