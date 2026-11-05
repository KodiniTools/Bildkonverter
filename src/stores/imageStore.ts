import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useImageDraw } from './image/useImageDraw';
import { useImageSource } from './image/useImageSource';
import { useTexts } from './image/useTexts';
import { useShapes } from './image/useShapes';
import { useImageLayers } from './image/useImageLayers';
import { useHistoryDelegate } from './image/useHistoryDelegate';
import type {
  DrawSetting,
  DrawTool,
  HistoryHandlers,
  ImageLayer,
  ImageStoreContext,
  Shape,
  StoreText,
} from './image/types';

export type * from './image/types';

/**
 * Image Store
 *
 * Gemeinsamer Zustand des Editors:
 * - das geladene Basisbild (Referenz für Galerie/Handoff)
 * - Text-Ebenen
 * - Formen-Ebenen (Formen & Symbole aus der Galerie)
 * - Bild-Ebenen und Canvas-Hintergrund für den Collage-/Ebenen-Modus
 *
 * Der Zustand liegt hier, die Aktionen in den Teilmodulen unter
 * stores/image/ (Muster: Collage-Maker stores/collage/). Die öffentliche
 * API ist dieselbe wie vor der Aufteilung.
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
  const originalImage = ref<HTMLImageElement | null>(null);
  const workingUrl = ref<string | null>(null); // Aktuelle Bild-URL
  const canvas = ref<HTMLCanvasElement | null>(null); // Canvas-Element Referenz
  const ctx = ref<CanvasRenderingContext2D | null>(null); // Canvas-Context

  // Bild-Eigenschaften
  const imageWidth = ref(0);
  const imageHeight = ref(0);

  // Text-Elemente
  const texts = ref<StoreText[]>([]);
  const selectedTextId = ref<StoreText['id'] | null>(null);

  // Formen & Symbole (Overlay-Ebenen unter den Texten)
  const shapes = ref<Shape[]>([]);
  const selectedShapeId = ref<string | null>(null);
  // Zeichenmodus: null | 'pen' | 'highlighter' und Stil je Werkzeug (width null = automatisch)
  const drawTool = ref<DrawTool | null>(null);
  const drawSettings = ref<Record<DrawTool, DrawSetting>>({
    pen: { color: '#e53935', width: null, opacity: 100 },
    highlighter: { color: '#ffeb3b', width: null, opacity: 60 },
  });

  // Bild-Layer für Collage
  const imageLayers = ref<ImageLayer[]>([]);
  const selectedLayerId = ref<ImageLayer['id'] | null>(null);

  // Canvas Hintergrundfarbe (für Collage-Modus)
  const canvasBackgroundColor = ref('#ffffff');

  // Undo/Redo: vom Editor registrierte Historie (useEditorHistory)
  const historyHandlers = shallowRef<HistoryHandlers | null>(null);

  // UI State
  const isImageLoaded = ref(false);

  // ===== TEILMODULE =====

  const state = {
    originalImage,
    workingUrl,
    canvas,
    ctx,
    imageWidth,
    imageHeight,
    isImageLoaded,
    texts,
    selectedTextId,
    shapes,
    selectedShapeId,
    drawTool,
    drawSettings,
    imageLayers,
    selectedLayerId,
    historyHandlers,
  };
  const { draw } = useImageDraw(state);
  const context: ImageStoreContext = { ...state, draw };

  const { hasImage, initCanvas, loadImageFromFile } = useImageSource(context);
  const { addText, updateText, deleteText } = useTexts(context);
  const shapeActions = useShapes(context);
  const layerActions = useImageLayers(context);
  const history = useHistoryDelegate(context);

  // ===== RETURN =====
  return {
    // State
    originalImage,
    workingUrl,
    imageWidth,
    imageHeight,
    texts,
    selectedTextId,
    shapes,
    selectedShapeId,
    drawTool,
    drawSettings,
    imageLayers,
    selectedLayerId,
    canvasBackgroundColor,

    // Computed
    hasImage,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    historyIndex: history.historyIndex,
    historyLength: history.historyLength,
    hasImageLayers: layerActions.hasImageLayers,
    imageLayerCount: layerActions.imageLayerCount,
    selectedImageLayer: layerActions.selectedImageLayer,
    selectedShape: shapeActions.selectedShape,

    // Actions - Image
    initCanvas,
    loadImageFromFile,
    draw,

    // Actions - Text
    addText,
    updateText,
    deleteText,

    // Actions - Formen & Symbole
    addShape: shapeActions.addShape,
    updateShape: shapeActions.updateShape,
    deleteShape: shapeActions.deleteShape,
    duplicateShape: shapeActions.duplicateShape,
    moveShapeOrder: shapeActions.moveShapeOrder,
    selectShape: shapeActions.selectShape,
    clearShapes: shapeActions.clearShapes,
    setDrawTool: shapeActions.setDrawTool,
    updateDrawSettings: shapeActions.updateDrawSettings,
    addFreehandShape: shapeActions.addFreehandShape,

    // Actions - Image Layers (Collage)
    addImageLayer: layerActions.addImageLayer,
    addImageLayersFromGallery: layerActions.addImageLayersFromGallery,
    updateImageLayer: layerActions.updateImageLayer,
    deleteImageLayer: layerActions.deleteImageLayer,
    selectImageLayer: layerActions.selectImageLayer,
    moveImageLayerOrder: layerActions.moveImageLayerOrder,
    duplicateImageLayer: layerActions.duplicateImageLayer,
    clearImageLayers: layerActions.clearImageLayers,

    // Historie (Delegation an useEditorHistory)
    registerHistory: history.registerHistory,
    saveState: history.saveState,
    undo: history.undo,
    redo: history.redo,
    serializeImageLayers: layerActions.serializeImageLayers,
    restoreImageLayers: layerActions.restoreImageLayers,
  };
});
