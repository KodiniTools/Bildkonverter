/**
 * useEditorHistory: Snapshot des gesamten Editor-Zustands, Undo/Redo mit
 * Wiederherstellung von Bild, Canvas-Größe, Filtern, Transformationen,
 * Texten und Crop-Zustand.
 */
import { describe, it, expect, vi, beforeAll, type Mock } from 'vitest';
import { ref } from 'vue';
import { useEditorHistory, type EditorHistoryDeps } from '@/composables/editor/useEditorHistory';
import { useFilterManagement } from '@/composables/useFilterManagement';
import { useTransform } from '@/composables/useTransform';
import { useResizeManager } from '@/composables/useResizeManager';
import { loadImage } from '@/utils/fileUtils';
import { makeImage } from './helpers';
import { context2d } from '@/utils/canvas2d';
import type { EditorImage } from '@/composables/editor/types';
import type { ImageLayer, StoreText } from '@/stores/image/types';
import type { Shape } from '@/utils/shapes';

/** Ebene der Attrappe: `image` ist ein Platzhalter-Objekt statt eines echten Bildes */
type FakeLayer = Omit<Partial<ImageLayer>, 'image'> & { image?: unknown };

/** Store-Attrappe: nur die Felder und Ebenen-Funktionen, die die Historie nutzt */
interface StoreFake {
  texts: StoreText[];
  shapes?: Shape[];
  selectedShapeId?: string | null;
  imageLayers: FakeLayer[];
  selectedLayerId: ImageLayer['id'] | null;
  canvasBackgroundColor: string;
  registerHistory: Mock;
  serializeImageLayers: Mock;
  restoreImageLayers: Mock;
  clearImageLayers: Mock;
}

/** Die Attrappe deckt den Teil des Stores ab, den useEditorHistory liest und schreibt */
const asHistoryStore = (fake: StoreFake) => fake as unknown as EditorHistoryDeps['imageStore'];

let dataUrlImage: HTMLImageElement;
beforeAll(async () => {
  dataUrlImage = await makeImage(200, 100);
});

function setup(image: HTMLImageElement = dataUrlImage) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 200;
  canvasEl.height = 100;
  context2d(canvasEl).drawImage(image, 0, 0);

  const currentImage = ref<EditorImage | null>(image);
  const selectedTextId = ref<StoreText['id'] | null>(null);
  const filterManagement = useFilterManagement({});
  const transform = useTransform();
  const resizeManager = useResizeManager({});
  resizeManager.initFromDimensions(200, 100);
  const crop = { hasCropped: ref(false), resetCropState: vi.fn() };
  const isCollageMode = ref(false);
  const detachedFromBackground = ref(false);
  // Store-Attrappe mit den Ebenen-Funktionen der Historie
  const imageStore: StoreFake = {
    texts: [],
    imageLayers: [],
    selectedLayerId: null,
    canvasBackgroundColor: '#ffffff',
    registerHistory: vi.fn(),
    serializeImageLayers: vi.fn(function (this: StoreFake) {
      return JSON.parse(JSON.stringify(this.imageLayers.map((l) => ({ ...l, image: null }))));
    }),
    restoreImageLayers: vi.fn(async function (
      this: StoreFake,
      layers: FakeLayer[],
      selectedId: ImageLayer['id'] | null
    ) {
      this.imageLayers = layers.map((l) => ({ ...l, image: {} }));
      this.selectedLayerId = selectedId;
    }),
    clearImageLayers: vi.fn(function (this: StoreFake) {
      this.imageLayers = [];
      this.selectedLayerId = null;
    }),
  };
  const renderImage = vi.fn();
  const updateImageInfo = vi.fn();

  const history = useEditorHistory({
    canvas: ref(canvasEl),
    currentImage,
    isCollageMode,
    detachedFromBackground,
    selectedTextId,
    filters: filterManagement.filters,
    background: filterManagement.background,
    imageStore: asHistoryStore(imageStore),
    filterManagement,
    transform,
    resizeManager,
    crop,
    renderImage,
    updateImageInfo,
  });

  return {
    canvasEl,
    currentImage,
    isCollageMode,
    detachedFromBackground,
    selectedTextId,
    filterManagement,
    transform,
    resizeManager,
    crop,
    imageStore,
    renderImage,
    updateImageInfo,
    history,
  };
}

/** Wartet, bis restoreState() das Bild geladen und neu gezeichnet hat */
const restored = (renderImage: Mock, calls: number) =>
  vi.waitFor(() => expect(renderImage).toHaveBeenCalledTimes(calls));

describe('useEditorHistory', () => {
  it('der erste Snapshot erlaubt weder Undo noch Redo', () => {
    const { history } = setup();
    history.saveHistory();
    expect(history.history.value).toHaveLength(1);
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
  });

  it('speichert Kopien, keine Referenzen', () => {
    const { history, filterManagement, imageStore, transform } = setup();
    imageStore.texts.push({ id: 1, content: 'A' });
    history.saveHistory();
    filterManagement.filters.value.brightness = 150;
    transform.transforms.value.rotation = 90;
    imageStore.texts[0].content = 'B';
    const entry = history.history.value[0];
    expect(entry.filters.brightness).toBe(100);
    expect(entry.transforms.rotation).toBe(0);
    expect(entry.texts[0].content).toBe('A');
    expect(entry.width).toBe(200);
    expect(entry.naturalWidth).toBe(200);
  });

  it('sichert Bilder mit Blob-URL als Data-URL', async () => {
    const blob = await new Promise<Blob | null>((r) => {
      const c = document.createElement('canvas');
      c.width = 40;
      c.height = 20;
      c.toBlob(r, 'image/png');
    });
    const blobImage = await loadImage(URL.createObjectURL(blob!));
    const { history } = setup(blobImage);
    history.saveHistory();
    expect(history.history.value[0].rawImageSrc!.startsWith('data:image/png')).toBe(true);

    const { history: h2 } = setup(dataUrlImage);
    h2.saveHistory();
    expect(h2.history.value[0].rawImageSrc).toBe(dataUrlImage.src);
  });

  it('Undo stellt den vorherigen Zustand vollständig wieder her, Redo den nachfolgenden', async () => {
    const s = setup();
    const {
      history,
      canvasEl,
      filterManagement,
      transform,
      imageStore,
      selectedTextId,
      resizeManager,
      crop,
    } = s;
    history.saveHistory(); // Zustand A: 200x100, Standardwerte

    // Zustand B: alles verändert
    canvasEl.width = 300;
    canvasEl.height = 150;
    filterManagement.filters.value.brightness = 150;
    filterManagement.background.value.color = '#123456';
    transform.transforms.value.rotation = 45;
    imageStore.texts.push({ id: 7, content: 'Text' });
    selectedTextId.value = 7;
    resizeManager.initFromDimensions(300, 150, { natural: false });
    crop.hasCropped.value = true;
    history.saveHistory();
    expect(history.canUndo.value).toBe(true);

    history.undo();
    await restored(s.renderImage, 1);
    expect(canvasEl.width).toBe(200);
    expect(canvasEl.height).toBe(100);
    expect(s.currentImage.value).toBeInstanceOf(HTMLImageElement);
    expect(filterManagement.filters.value.brightness).toBe(100);
    expect(filterManagement.background.value.color).toBe('#ffffff');
    expect(transform.transforms.value.rotation).toBe(0);
    expect(imageStore.texts).toEqual([]);
    expect(selectedTextId.value).toBeNull();
    expect(resizeManager.resizeWidth.value).toBe(200);
    expect(resizeManager.naturalWidth.value).toBe(200);
    expect(crop.resetCropState).toHaveBeenCalledTimes(1); // Zustand A war kein Zuschnitt
    expect(s.updateImageInfo).toHaveBeenCalledTimes(1);
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(true);

    history.redo();
    await restored(s.renderImage, 2);
    expect(canvasEl.width).toBe(300);
    expect(filterManagement.filters.value.brightness).toBe(150);
    expect(transform.transforms.value.rotation).toBe(45);
    expect(imageStore.texts).toEqual([{ id: 7, content: 'Text' }]);
    expect(selectedTextId.value).toBe(7);
    expect(crop.resetCropState).toHaveBeenCalledTimes(1); // Zustand B war ein Zuschnitt → kein Reset
    expect(history.canRedo.value).toBe(false);
  });

  it('ein neuer Snapshot nach Undo verwirft den Redo-Zweig', async () => {
    const s = setup();
    s.history.saveHistory();
    s.canvasEl.width = 250;
    s.history.saveHistory();
    s.history.undo();
    await restored(s.renderImage, 1);
    s.history.saveHistory();
    expect(s.history.history.value).toHaveLength(2);
    expect(s.history.canRedo.value).toBe(false);
  });

  it('resetHistory leert den Stack', () => {
    const { history } = setup();
    history.saveHistory();
    history.saveHistory();
    history.resetHistory();
    expect(history.history.value).toEqual([]);
    expect(history.historyIndex.value).toBe(-1);
    expect(history.canUndo.value).toBe(false);
  });

  it('registriert sich beim Store und meldet sich wieder ab', () => {
    const { history, imageStore } = setup();
    expect(imageStore.registerHistory).toHaveBeenCalledTimes(1);
    const api = imageStore.registerHistory.mock.calls[0][0];
    expect(api.saveHistory).toBe(history.saveHistory);
    expect(api.canUndo).toBe(history.canUndo);
    history.unregisterHistory();
    expect(imageStore.registerHistory).toHaveBeenLastCalledWith(null);
  });

  it('sichert die Beschreibung der Aktion im Snapshot', () => {
    const { history } = setup();
    history.saveHistory('Bild geladen');
    expect(history.history.value[0].description).toBe('Bild geladen');
  });

  it('tut ohne Canvas nichts', () => {
    const s = setup();
    const history = useEditorHistory({
      ...s,
      imageStore: asHistoryStore(s.imageStore),
      canvas: ref(null),
      filters: s.filterManagement.filters,
      background: s.filterManagement.background,
    });
    history.saveHistory();
    expect(history.history.value).toEqual([]);
  });
});

describe('useEditorHistory – Ebenen-/Collage-Modus', () => {
  const layer = (id: string) => ({
    id,
    url: dataUrlImage.src,
    name: id,
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    visible: true,
    image: { tag: 'HTMLImageElement' },
  });

  it('sichert Ebenen ohne Image-Objekte, Auswahl, Hintergrund und Modus', () => {
    const s = setup();
    s.isCollageMode.value = true;
    s.detachedFromBackground.value = true;
    s.imageStore.imageLayers = [layer('L1'), layer('L2')];
    s.imageStore.selectedLayerId = 'L2';
    s.imageStore.canvasBackgroundColor = 'transparent';
    s.history.saveHistory('Ebene dupliziert');
    const entry = s.history.history.value[0];
    expect(entry.isCollageMode).toBe(true);
    expect(entry.detachedFromBackground).toBe(true);
    expect(entry.imageLayers.map((l) => [l.id, l.image])).toEqual([
      ['L1', null],
      ['L2', null],
    ]);
    expect(entry.selectedLayerId).toBe('L2');
    expect(entry.canvasBackgroundColor).toBe('transparent');
  });

  it('Undo nach dem Duplizieren einer Ebene führt zu einer Ebene zurück, nicht zu null', async () => {
    const s = setup();
    // Abgelöst: eine Ebene, Snapshot
    s.isCollageMode.value = true;
    s.detachedFromBackground.value = true;
    s.imageStore.imageLayers = [layer('L1')];
    s.imageStore.selectedLayerId = 'L1';
    s.history.saveHistory('Abgelöst');
    // Dupliziert, Snapshot
    s.imageStore.imageLayers = [layer('L1'), layer('L1-copy')];
    s.imageStore.selectedLayerId = 'L1-copy';
    s.history.saveHistory('Ebene dupliziert');

    s.history.undo();
    await restored(s.renderImage, 1);
    expect(s.imageStore.restoreImageLayers).toHaveBeenCalledTimes(1);
    expect(s.imageStore.imageLayers.map((l) => l.id)).toEqual(['L1']);
    expect(s.imageStore.selectedLayerId).toBe('L1');
    expect(s.isCollageMode.value).toBe(true);
    expect(s.detachedFromBackground.value).toBe(true);
    expect(s.imageStore.clearImageLayers).not.toHaveBeenCalled();
    expect(s.currentImage.value).toBe(dataUrlImage); // Basisbild bleibt unangetastet
  });

  it('Undo vor das Ablösen verlässt den Ebenen-Modus und stellt das Einzelbild her', async () => {
    const s = setup();
    s.history.saveHistory('Bild geladen'); // Einzelbild, 200x100
    // Ablösen: Canvas bleibt, Ebene entsteht, Modus wechselt
    s.isCollageMode.value = true;
    s.detachedFromBackground.value = true;
    s.imageStore.imageLayers = [layer('L1')];
    s.imageStore.selectedLayerId = 'L1';
    s.imageStore.canvasBackgroundColor = '#ff0000';
    s.currentImage.value = null;
    s.history.saveHistory('Abgelöst');

    s.history.undo();
    await restored(s.renderImage, 1);
    expect(s.imageStore.clearImageLayers).toHaveBeenCalledTimes(1);
    expect(s.imageStore.imageLayers).toEqual([]);
    expect(s.isCollageMode.value).toBe(false);
    expect(s.detachedFromBackground.value).toBe(false);
    expect(s.imageStore.canvasBackgroundColor).toBe('#ffffff');
    expect(s.currentImage.value).toBeInstanceOf(HTMLImageElement);
    expect([s.canvasEl.width, s.canvasEl.height]).toEqual([200, 100]);

    // Redo: wieder abgelöst, Ebene aus dem Snapshot geladen
    s.history.redo();
    await restored(s.renderImage, 2);
    expect(s.imageStore.restoreImageLayers).toHaveBeenCalledTimes(1);
    expect(s.imageStore.imageLayers.map((l) => l.id)).toEqual(['L1']);
    expect(s.isCollageMode.value).toBe(true);
    expect(s.imageStore.canvasBackgroundColor).toBe('#ff0000');
  });
});

describe('useEditorHistory – Formen', () => {
  it('Undo/Redo stellt Formen und ihre Auswahl wieder her (Kopien, keine Referenzen)', async () => {
    const s = setup();
    s.imageStore.shapes = [];
    s.imageStore.selectedShapeId = null;
    s.history.saveHistory(); // A: keine Formen

    s.imageStore.shapes.push({ id: 'f1', type: 'rect', x: 50, y: 40, width: 30, height: 20 });
    s.imageStore.selectedShapeId = 'f1';
    s.history.saveHistory(); // B: eine Form, ausgewählt
    s.imageStore.shapes[0].x = 999; // nachträgliche Änderung darf B nicht verändern

    s.history.undo();
    await restored(s.renderImage, 1);
    expect(s.imageStore.shapes).toEqual([]);
    expect(s.imageStore.selectedShapeId).toBeNull();

    s.history.redo();
    await restored(s.renderImage, 2);
    expect(s.imageStore.shapes).toEqual([
      { id: 'f1', type: 'rect', x: 50, y: 40, width: 30, height: 20 },
    ]);
    expect(s.imageStore.selectedShapeId).toBe('f1');
  });
});

describe('useEditorHistory.restoreSnapshot (Projekt fortsetzen)', () => {
  it('stellt einen gespeicherten Zustand her und beginnt die Historie neu', async () => {
    const source = setup();
    source.filterManagement.filters.value.brightness = 140;
    source.imageStore.texts.push({ id: 't1', content: 'Hallo' });
    source.imageStore.shapes = [{ id: 's1', type: 'rect', x: 1, y: 2, width: 3, height: 4 }];
    source.history.saveHistory('Bearbeitung');
    const saved = JSON.parse(JSON.stringify(source.history.history.value[0]));

    const target = setup();
    target.currentImage.value = null;
    target.history.saveHistory('alt');
    target.history.saveHistory('alt 2');
    await target.history.restoreSnapshot(saved);

    expect(target.history.history.value).toHaveLength(1);
    expect(target.history.canUndo.value).toBe(false);
    expect(target.currentImage.value).toBeInstanceOf(HTMLImageElement);
    expect(target.filterManagement.filters.value.brightness).toBe(140);
    expect(target.imageStore.texts).toEqual([{ id: 't1', content: 'Hallo' }]);
    expect(target.imageStore.shapes![0].id).toBe('s1');
    expect(target.canvasEl.width).toBe(200);
    expect(target.renderImage).toHaveBeenCalled();
  });

  it('Ebenen-Modus: lädt Ebenen und fehlendes Basisbild, setzt den Modus', async () => {
    const s = setup();
    s.currentImage.value = null;
    const state = {
      isCollageMode: true,
      detachedFromBackground: true,
      rawImageSrc: dataUrlImage.src,
      imageLayers: [{ id: 'l1', url: dataUrlImage.src, name: 'A' }],
      selectedLayerId: 'l1',
      canvasBackgroundColor: '#123456',
      width: 300,
      height: 150,
      filters: { ...s.filterManagement.filters.value },
      background: { ...s.filterManagement.background.value },
      transforms: { ...s.transform.transforms.value },
      texts: [],
      shapes: [],
      hasCropped: false,
    };
    await s.history.restoreSnapshot(state);

    expect(s.imageStore.restoreImageLayers).toHaveBeenCalledWith(state.imageLayers, 'l1');
    expect(s.isCollageMode.value).toBe(true);
    expect(s.detachedFromBackground.value).toBe(true);
    expect(s.currentImage.value).toBeInstanceOf(HTMLImageElement);
    expect(s.imageStore.canvasBackgroundColor).toBe('#123456');
    expect(s.canvasEl.width).toBe(300);
    expect(s.history.history.value).toHaveLength(1);
  });
});
