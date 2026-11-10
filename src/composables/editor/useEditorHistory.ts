/**
 * useEditorHistory
 *
 * Die einzige Undo/Redo-Historie des Editors. Ein Snapshot umfasst Bild,
 * Canvas-Größe, Filter, Hintergrund, Transformationen, Texte, Formen, Crop-Zustand
 * sowie im Ebenen-/Collage-Modus die Bild-Ebenen, ihre Auswahl und den
 * Canvas-Hintergrund. Baut auf useImageHistory (Stack-Verwaltung) auf.
 *
 * Die Historie wird beim imageStore registriert, damit Composables ohne
 * Editor-Kontext (Ebenen-Panel, Text-Dialog, Ebenen-Interaktion) über
 * imageStore.saveState()/undo()/redo() dieselbe Historie nutzen.
 */
import { nextTick, type Ref } from 'vue';
import { useImageHistory } from '@/composables/useImageHistory';
import { logger } from '@/utils/logger';
import { context2d } from '@/utils/canvas2d';
import type { useImageStore } from '@/stores/imageStore';
import type { ImageLayer, StoreText } from '@/stores/image/types';
import type { Shape } from '@/utils/shapes';
import type { TransformState } from '@/types/transform';
import type { useTransform } from '@/composables/useTransform';
import type { useResizeManager } from '@/composables/useResizeManager';
import type { useCrop } from '@/composables/useCrop';
import type {
  EditorBackground,
  EditorFilters,
  useFilterManagement,
} from '@/composables/useFilterManagement';
import type { EditorSnapshot } from '@/lib/project/projectSnapshot';
import type { EditorImage } from './types';

type ImageStore = ReturnType<typeof useImageStore>;

/** Ein Eintrag der Editor-Historie (siehe saveHistory) */
export interface EditorHistoryState {
  description: string;
  /** Gerenderter Canvas (Fallback, wenn das Rohbild fehlt) */
  imageData: string | null;
  /** Rohbild ohne Transformationen */
  rawImageSrc: string | null;
  filters: EditorFilters;
  background: EditorBackground;
  transforms: TransformState;
  texts: StoreText[];
  selectedTextId: StoreText['id'] | null;
  shapes: Shape[];
  selectedShapeId: string | null;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  hasCropped: boolean;
  isCollageMode: boolean;
  detachedFromBackground: boolean;
  imageLayers: ImageLayer[];
  selectedLayerId: ImageLayer['id'] | null;
  canvasBackgroundColor: string;
}

/**
 * Wiederherstellbarer Zustand: Breite/Höhe immer vorhanden, alles andere kann
 * in älteren gespeicherten Projekten fehlen.
 */
export type RestorableState = Pick<EditorHistoryState, 'width' | 'height'> &
  Partial<Omit<EditorHistoryState, 'width' | 'height'>>;

export interface EditorHistoryDeps {
  canvas: Ref<HTMLCanvasElement | null>;
  currentImage: Ref<EditorImage | null>;
  isCollageMode?: Ref<boolean>;
  detachedFromBackground?: Ref<boolean>;
  selectedTextId: Ref<StoreText['id'] | null>;
  /** filters-Ref aus useFilterManagement */
  filters: Ref<EditorFilters>;
  /** background-Ref aus useFilterManagement */
  background: Ref<EditorBackground>;
  imageStore: Pick<
    ImageStore,
    | 'texts'
    | 'shapes'
    | 'selectedShapeId'
    | 'selectedLayerId'
    | 'canvasBackgroundColor'
    | 'restoreImageLayers'
  > &
    Partial<Pick<ImageStore, 'serializeImageLayers' | 'clearImageLayers' | 'registerHistory'>>;
  filterManagement: Pick<ReturnType<typeof useFilterManagement>, 'importState'>;
  /** useTransform()-Instanz */
  transform: Pick<ReturnType<typeof useTransform>, 'transforms'>;
  /** useResizeManager()-Instanz */
  resizeManager: Pick<
    ReturnType<typeof useResizeManager>,
    'naturalWidth' | 'naturalHeight' | 'initFromDimensions' | 'setNaturalSize'
  >;
  /** useCrop()-Instanz */
  crop: Pick<ReturnType<typeof useCrop>, 'hasCropped' | 'resetCropState'>;
  renderImage: () => void;
  updateImageInfo: () => void;
}

export function useEditorHistory({
  canvas,
  currentImage,
  isCollageMode,
  detachedFromBackground,
  selectedTextId,
  filters,
  background,
  imageStore,
  filterManagement,
  transform,
  resizeManager,
  crop,
  renderImage,
  updateImageInfo,
}: EditorHistoryDeps) {
  const imageHistory = useImageHistory<EditorHistoryState>({
    maxHistorySize: 50,
    onRestore: (state) => restoreState(state),
  });
  const { history, historyIndex, canUndo, canRedo } = imageHistory;

  /**
   * Schreibt einen Snapshot des gesamten Editor-Zustands.
   * @param description Kurzbeschreibung der Aktion (für Anzeige/Debugging)
   */
  function saveHistory(description = '') {
    if (!canvas.value) return;

    // Das rohe Bild (ohne Transforms) für verlässliches Undo/Redo speichern
    let rawImageSrc: string | null = null;
    const image = currentImage.value;
    if (image) {
      // Canvas-Quellen haben kein src und landen wie bisher im else-Zweig
      const src = (image as Partial<HTMLImageElement>).src;
      if (src && src.startsWith('data:')) {
        rawImageSrc = src;
      } else {
        // Blob-URL o.ä.: als Data-URL über Hilfs-Canvas sichern
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = canvas.value.width;
        tmpCanvas.height = canvas.value.height;
        context2d(tmpCanvas).drawImage(image, 0, 0, tmpCanvas.width, tmpCanvas.height);
        rawImageSrc = tmpCanvas.toDataURL('image/png');
      }
    }

    imageHistory.saveState({
      description,
      imageData: canvas.value.toDataURL(),
      rawImageSrc,
      filters: { ...filters.value },
      background: { ...background.value },
      transforms: { ...transform.transforms.value },
      // Texte in die gemeinsame Historie aufnehmen, damit Undo/Redo den
      // gesamten Editor-Zustand umfasst (nicht nur Bild/Filter/Transform)
      texts: JSON.parse(JSON.stringify(imageStore.texts || [])),
      selectedTextId: selectedTextId.value,
      // Formen & Symbole
      shapes: JSON.parse(JSON.stringify(imageStore.shapes || [])),
      selectedShapeId: imageStore.selectedShapeId ?? null,
      width: canvas.value.width,
      height: canvas.value.height,
      // Originalgröße des Bildes mitsichern, damit "Ohne Preset" auch nach
      // Undo/Redo das richtige Ziel hat
      naturalWidth: resizeManager.naturalWidth.value,
      naturalHeight: resizeManager.naturalHeight.value,
      hasCropped: crop.hasCropped.value,
      // Ebenen-/Collage-Modus
      isCollageMode: !!isCollageMode?.value,
      detachedFromBackground: !!detachedFromBackground?.value,
      imageLayers: imageStore.serializeImageLayers ? imageStore.serializeImageLayers() : [],
      selectedLayerId: imageStore.selectedLayerId ?? null,
      canvasBackgroundColor: imageStore.canvasBackgroundColor ?? '#ffffff',
    });
  }

  function undo() {
    imageHistory.undo();
  }

  function redo() {
    imageHistory.redo();
  }

  /** Leert die Historie (z.B. bei neuem Bild oder Reset); der nächste saveHistory() ist der neue Startpunkt */
  function resetHistory() {
    imageHistory.clearHistory();
  }

  /** Gemeinsamer Teil der Wiederherstellung (Canvas, Filter, Transform, Texte, Crop) */
  function applyEditorState(state: RestorableState) {
    if (!canvas.value) {
      logger.warn('Historie: Canvas fehlt, Zustand nicht angewendet');
      return;
    }
    canvas.value.width = state.width;
    canvas.value.height = state.height;
    resizeManager.initFromDimensions(state.width, state.height, { natural: false });
    resizeManager.setNaturalSize(
      state.naturalWidth || state.width,
      state.naturalHeight || state.height
    );
    // Verwende filterManagement für konsistenten State
    if (state.filters) {
      filterManagement.importState({
        filters: state.filters,
        background: state.background,
      });
    }
    // Transform-State wiederherstellen (inkl. borderRadius für Kreis-Zuschnitt)
    if (state.transforms) {
      transform.transforms.value = { ...state.transforms };
    }
    // Texte wiederherstellen (gemeinsame Historie)
    if (state.texts) {
      imageStore.texts = JSON.parse(JSON.stringify(state.texts));
    }
    selectedTextId.value = state.selectedTextId ?? null;
    // Formen wiederherstellen (ältere Snapshots ohne Formen → leer)
    imageStore.shapes = JSON.parse(JSON.stringify(state.shapes || []));
    const shapeId = state.selectedShapeId ?? null;
    imageStore.selectedShapeId =
      shapeId && imageStore.shapes.some((s) => s.id === shapeId) ? shapeId : null;
    // Crop-State zurücksetzen wenn der gespeicherte State kein Zuschnitt war
    if (!state.hasCropped) {
      crop.resetCropState();
    }
    // Ebenen-/Collage-Modus
    if (isCollageMode) isCollageMode.value = !!state.isCollageMode;
    if (detachedFromBackground) detachedFromBackground.value = !!state.detachedFromBackground;
    if (state.canvasBackgroundColor !== undefined) {
      imageStore.canvasBackgroundColor = state.canvasBackgroundColor;
    }
    updateImageInfo();
    renderImage();
  }

  function loadSnapshotImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Bild aus der Historie nicht ladbar'));
      img.src = src;
    });
  }

  /**
   * Beim Fortsetzen eines gespeicherten Projekts gibt es noch keinen Canvas
   * (Leerzustand): erst Bild/Modus setzen, dann auf das Rendern warten.
   */
  async function ensureCanvas() {
    if (!canvas.value) await nextTick();
  }

  async function restoreState(state: RestorableState) {
    if (state.isCollageMode) {
      // Ebenen samt Bildern neu laden; das Basisbild bleibt unverändert
      await imageStore.restoreImageLayers(state.imageLayers || [], state.selectedLayerId ?? null);
      // Ohne Basisbild (gespeichertes Projekt im abgelösten Modus): mitladen
      if (currentImage && !currentImage.value && state.rawImageSrc) {
        try {
          currentImage.value = await loadSnapshotImage(state.rawImageSrc);
        } catch (e) {
          logger.warn(e);
        }
      }
      if (isCollageMode) isCollageMode.value = true;
      await ensureCanvas();
      applyEditorState(state);
      return;
    }

    // Einzelbild-Modus: eventuell vorhandene Ebenen verwerfen
    if (imageStore.clearImageLayers) imageStore.clearImageLayers();

    // rawImageSrc enthält das rohe Bild ohne gebackene Transforms → für renderImage() verwenden
    // imageData ist der gerenderte Canvas-Snapshot (Fallback)
    const srcToLoad = state.rawImageSrc || state.imageData;
    if (!srcToLoad) {
      currentImage.value = null;
      applyEditorState(state);
      return;
    }
    let img: HTMLImageElement;
    try {
      img = await loadSnapshotImage(srcToLoad);
    } catch (e) {
      logger.warn(e);
      return;
    }
    currentImage.value = img;
    await ensureCanvas();
    applyEditorState(state);
  }

  /**
   * Gespeichertes Projekt fortsetzen: Zustand wiederherstellen und als neuen
   * Startpunkt der (leeren) Historie setzen.
   * @param snapshot  History-Eintrag (z. B. aus projectSnapshot.unpackSnapshot)
   */
  async function restoreSnapshot(snapshot: EditorSnapshot) {
    // Gespeicherte Projekte stammen aus saveHistory (siehe projectSnapshot)
    const state = snapshot as unknown as RestorableState;
    imageHistory.clearHistory();
    await restoreState(state);
    saveHistory(state.description || 'Projekt fortgesetzt');
  }

  const api = {
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveHistory,
    undo,
    redo,
    resetHistory,
    restoreSnapshot,
  };

  // Beim Store registrieren, damit Ebenen-Panel, Text-Dialog und
  // Ebenen-Interaktion dieselbe Historie nutzen
  if (typeof imageStore.registerHistory === 'function') {
    imageStore.registerHistory(api);
  }

  /** Registrierung beim Verlassen des Editors aufheben */
  function unregisterHistory() {
    if (typeof imageStore.registerHistory === 'function') {
      imageStore.registerHistory(null);
    }
  }

  return { ...api, unregisterHistory };
}
