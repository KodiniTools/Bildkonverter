/**
 * imageStore: Delegation der Historie an die registrierte Editor-Historie
 * und Serialisierung/Wiederherstellung der Bild-Ebenen.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { ref, computed } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useImageStore } from '@/stores/imageStore';
import { makeImage } from './helpers';

let image;
beforeAll(async () => {
  image = await makeImage(60, 40);
});

beforeEach(() => {
  setActivePinia(createPinia());
});

function fakeHistory() {
  const history = ref([]);
  const historyIndex = ref(-1);
  return {
    history,
    historyIndex,
    canUndo: computed(() => historyIndex.value > 0),
    canRedo: computed(() => historyIndex.value < history.value.length - 1),
    saveHistory: vi.fn((description) => {
      history.value.push({ description });
      historyIndex.value = history.value.length - 1;
    }),
    undo: vi.fn(() => historyIndex.value--),
    redo: vi.fn(() => historyIndex.value++),
  };
}

describe('imageStore – Historie', () => {
  it('ist ohne registrierte Historie wirkungslos', () => {
    const store = useImageStore();
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
    expect(store.historyIndex).toBe(-1);
    expect(store.historyLength).toBe(0);
    expect(() => {
      store.saveState('x');
      store.undo();
      store.redo();
    }).not.toThrow();
  });

  it('delegiert saveState/undo/redo und spiegelt canUndo/canRedo', () => {
    const store = useImageStore();
    const h = fakeHistory();
    store.registerHistory(h);

    store.saveState('Erster');
    store.saveState('Zweiter');
    expect(h.saveHistory).toHaveBeenNthCalledWith(2, 'Zweiter');
    expect(store.historyLength).toBe(2);
    expect(store.historyIndex).toBe(1);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);

    store.undo();
    expect(h.undo).toHaveBeenCalledTimes(1);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);
    store.redo();
    expect(h.redo).toHaveBeenCalledTimes(1);

    store.registerHistory(null);
    expect(store.canUndo).toBe(false);
    store.saveState('ignoriert');
    expect(h.saveHistory).toHaveBeenCalledTimes(2);
  });

  it('Store-Aktionen schreiben selbst keine Historie mehr', async () => {
    const store = useImageStore();
    const h = fakeHistory();
    store.registerHistory(h);
    const layer = await store.addImageLayer({ url: image.src, name: 'A' });
    store.duplicateImageLayer(layer.id);
    store.moveImageLayerOrder(layer.id, 'top');
    store.deleteImageLayer(layer.id);
    store.addText({ content: 'Hallo' });
    store.deleteText(store.texts[0].id);
    store.clearImageLayers();
    expect(h.saveHistory).not.toHaveBeenCalled();
  });

  it('serialisiert Ebenen ohne Image-Objekt und stellt sie mit neu geladenen Bildern her', async () => {
    const store = useImageStore();
    const a = await store.addImageLayer({ url: image.src, name: 'A' });
    const b = await store.addImageLayer({ url: image.src, name: 'B' });
    store.updateImageLayer(a.id, { x: 123, rotation: 45 });
    store.selectImageLayer(a.id);

    const snapshot = store.serializeImageLayers();
    expect(snapshot.map((l) => [l.id, l.image, l.x])).toEqual([
      [a.id, null, 123],
      [b.id, null, b.x],
    ]);
    // Snapshot ist entkoppelt
    store.updateImageLayer(a.id, { x: 999 });
    expect(snapshot[0].x).toBe(123);

    store.clearImageLayers();
    expect(store.imageLayers).toEqual([]);

    await store.restoreImageLayers(snapshot, a.id);
    expect(store.imageLayers.map((l) => [l.id, l.x, l.rotation])).toEqual([
      [a.id, 123, 45],
      [b.id, b.x, 0],
    ]);
    expect(store.imageLayers[0].image).toBeInstanceOf(HTMLImageElement);
    expect(store.imageLayers[0].image.width).toBe(60);
    expect(store.selectedLayerId).toBe(a.id);
  });

  it('verwirft beim Wiederherstellen eine Auswahl, die es nicht mehr gibt', async () => {
    const store = useImageStore();
    const a = await store.addImageLayer({ url: image.src, name: 'A' });
    const snapshot = store.serializeImageLayers();
    await store.restoreImageLayers(snapshot, 'gibt-es-nicht');
    expect(store.imageLayers.map((l) => l.id)).toEqual([a.id]);
    expect(store.selectedLayerId).toBeNull();
    await store.restoreImageLayers([], null);
    expect(store.imageLayers).toEqual([]);
  });
});
