/** imageStore nach der Aufteilung: gleiche API, Teilmodule unter stores/image/ */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref, shallowRef } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import type {
  DrawSetting,
  DrawTool,
  HistoryHandlers,
  ImageLayer,
  ImageStoreContext,
  Shape,
  StoreText,
} from '@/stores/image/types';
import { useTexts } from '@/stores/image/useTexts';
import { useShapes } from '@/stores/image/useShapes';
import { useHistoryDelegate } from '@/stores/image/useHistoryDelegate';
import {
  createImageLayer,
  createLayerThumbnail,
  useImageLayers,
} from '@/stores/image/useImageLayers';

/** Öffentliche API vor der Aufteilung (stores/imageStore.js, Stand #265) */
const API = [
  'originalImage',
  'workingUrl',
  'imageWidth',
  'imageHeight',
  'texts',
  'selectedTextId',
  'shapes',
  'selectedShapeId',
  'drawTool',
  'drawSettings',
  'imageLayers',
  'selectedLayerId',
  'canvasBackgroundColor',
  'hasImage',
  'canUndo',
  'canRedo',
  'historyIndex',
  'historyLength',
  'hasImageLayers',
  'imageLayerCount',
  'selectedImageLayer',
  'selectedShape',
  'initCanvas',
  'loadImageFromFile',
  'draw',
  'addText',
  'updateText',
  'deleteText',
  'addShape',
  'updateShape',
  'deleteShape',
  'duplicateShape',
  'moveShapeOrder',
  'selectShape',
  'clearShapes',
  'setDrawTool',
  'updateDrawSettings',
  'addFreehandShape',
  'addImageLayer',
  'addImageLayersFromGallery',
  'updateImageLayer',
  'deleteImageLayer',
  'selectImageLayer',
  'moveImageLayerOrder',
  'duplicateImageLayer',
  'clearImageLayers',
  'registerHistory',
  'saveState',
  'undo',
  'redo',
  'serializeImageLayers',
  'restoreImageLayers',
];

function context(): ImageStoreContext {
  return {
    originalImage: ref(null),
    workingUrl: ref(null),
    canvas: ref(null),
    ctx: ref(null),
    imageWidth: ref(400),
    imageHeight: ref(200),
    isImageLoaded: ref(false),
    texts: ref<StoreText[]>([]),
    selectedTextId: ref(null),
    shapes: ref<Shape[]>([]),
    selectedShapeId: ref(null),
    drawTool: ref<DrawTool | null>(null),
    drawSettings: ref<Record<DrawTool, DrawSetting>>({
      pen: { color: '#e53935', width: null, opacity: 100 },
      highlighter: { color: '#ffeb3b', width: null, opacity: 60 },
    }),
    imageLayers: ref<ImageLayer[]>([]),
    selectedLayerId: ref(null),
    historyHandlers: shallowRef<HistoryHandlers | null>(null),
    draw: vi.fn(),
  };
}

const img = (width: number, height: number) => ({ width, height }) as HTMLImageElement;

function layer(id: string, patch: Partial<ImageLayer> = {}): ImageLayer {
  return {
    ...createImageLayer(img(100, 50), { url: `${id}.png` }, { id, index: 0, canvas: null }),
    ...patch,
  };
}

describe('useImageStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('hat dieselbe öffentliche API wie vor der Aufteilung', () => {
    const store = useImageStore();
    const own = Object.keys(store).filter((k) => !k.startsWith('$') && !k.startsWith('_'));
    expect(own.sort()).toEqual([...API].sort());
  });

  it('hält die Auswahl über Text, Form und Ebene exklusiv', () => {
    const store = useImageStore();
    const shape = store.addShape('rect', 400, 200)!;
    expect(store.selectedShapeId).toBe(shape.id);
    store.imageLayers.push(layer('l1'));
    store.selectImageLayer('l1');
    expect(store.selectedShapeId).toBeNull();
    expect(store.selectedLayerId).toBe('l1');
  });
});

describe('useTexts', () => {
  it('hält content/txt und fontSize/size synchron und zeichnet neu', () => {
    const ctx = context();
    const { addText, updateText, deleteText } = useTexts(ctx);
    const text = addText({ content: 'Hallo' });
    expect(text).toMatchObject({ content: 'Hallo', txt: 'Hallo', x: 200, y: 100 });
    expect(ctx.selectedTextId.value).toBe(text.id);

    updateText(text.id, { txt: 'Neu', size: 48 });
    expect(ctx.texts.value[0]).toMatchObject({ content: 'Neu', fontSize: 48 });

    deleteText(text.id);
    expect(ctx.texts.value).toHaveLength(0);
    expect(ctx.selectedTextId.value).toBeNull();
    expect(ctx.draw).toHaveBeenCalledTimes(3);
  });
});

describe('useShapes', () => {
  it('nummeriert Marker, dupliziert versetzt und ordnet um', () => {
    const ctx = context();
    const s = useShapes(ctx);
    const first = s.addShape('marker', 400, 200)!;
    const copy = s.duplicateShape(first.id)!;
    expect(copy.number).toBe(2);
    expect(copy.x).toBeGreaterThan(first.x);
    expect(ctx.selectedShapeId.value).toBe(copy.id);
    expect(s.moveShapeOrder(copy.id, 'up')).toBe(false);
    expect(s.moveShapeOrder(copy.id, 'down')).toBe(true);
    expect(ctx.shapes.value[0]!.id).toBe(copy.id);
  });

  it('schaltet Zeichenwerkzeuge nur für bekannte Werkzeuge', () => {
    const ctx = context();
    const s = useShapes(ctx);
    s.setDrawTool('pen');
    expect(ctx.drawTool.value).toBe('pen');
    s.setDrawTool('laser');
    expect(ctx.drawTool.value).toBeNull();
    s.updateDrawSettings('highlighter', { opacity: 40 });
    s.updateDrawSettings('laser', { opacity: 1 });
    expect(ctx.drawSettings.value.highlighter).toMatchObject({ color: '#ffeb3b', opacity: 40 });
  });
});

describe('useImageLayers', () => {
  it('legt Ebenen mit Standardwerten und begrenzter Größe an', () => {
    const canvas = { width: 500, height: 500 } as HTMLCanvasElement;
    const l = createImageLayer(img(1000, 500), { url: 'a.png' }, { id: 'x', index: 2, canvas });
    expect(l).toMatchObject({ id: 'x', name: 'Layer 3', x: 130, y: 130, width: 200, height: 100 });
    expect(l.filters.brightness).toBe(100);
  });

  it('nutzt die Bild-URL als Vorschau, wenn das Vorschaubild scheitert', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null as never);
    expect(createLayerThumbnail(img(10, 10), 'fallback.png')).toBe('fallback.png');
    getContext.mockRestore();
  });

  it('löscht, dupliziert, verschiebt und serialisiert Ebenen', () => {
    const ctx = context();
    const l = useImageLayers(ctx);
    ctx.imageLayers.value = [layer('a'), layer('b')];
    ctx.selectedLayerId.value = 'b';

    const dup = l.duplicateImageLayer('a')!;
    expect(dup.name).toBe('Layer 1 (Kopie)');
    expect(dup.filters).not.toBe(ctx.imageLayers.value[0]!.filters);

    expect(l.moveImageLayerOrder('a', 'top')).toBe(true);
    expect(ctx.imageLayers.value.at(-1)!.id).toBe('a');

    l.deleteImageLayer(dup.id);
    expect(ctx.selectedLayerId.value).toBe('a');

    // Aufrufer (useLayerPanel.updateFilter) übergeben immer den vollständigen Filtersatz
    const filters = { ...ctx.imageLayers.value.at(-1)!.filters, contrast: 120 };
    l.updateImageLayer('a', { filters });
    expect(ctx.imageLayers.value.at(-1)!.filters).toMatchObject({ brightness: 100, contrast: 120 });

    expect(l.serializeImageLayers().every((x) => x.image === null)).toBe(true);
    expect(l.imageLayerCount.value).toBe(2);
  });
});

describe('useHistoryDelegate', () => {
  it('reicht an die registrierte Historie durch, ohne Editor ohne Effekt', () => {
    const ctx = context();
    const h = useHistoryDelegate(ctx);
    h.undo();
    expect(h.canUndo.value).toBe(false);
    expect(h.historyIndex.value).toBe(-1);

    const handlers: HistoryHandlers = {
      saveHistory: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: ref(true),
      canRedo: ref(false),
      historyIndex: ref(3),
      history: ref([1, 2, 3, 4]),
    };
    h.registerHistory(handlers);
    h.saveState('x');
    h.redo();
    expect(handlers.saveHistory).toHaveBeenCalledWith('x');
    expect(handlers.redo).toHaveBeenCalled();
    expect(h.canUndo.value).toBe(true);
    expect(h.historyLength.value).toBe(4);
  });
});
