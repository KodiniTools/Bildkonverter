/**
 * useEditorHistory: Snapshot des gesamten Editor-Zustands, Undo/Redo mit
 * Wiederherstellung von Bild, Canvas-Größe, Filtern, Transformationen,
 * Texten und Crop-Zustand.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ref } from 'vue';
import { useEditorHistory } from '@/composables/editor/useEditorHistory';
import { useFilterManagement } from '@/composables/useFilterManagement';
import { useTransform } from '@/composables/useTransform';
import { useResizeManager } from '@/composables/useResizeManager';
import { loadImage } from '@/utils/fileUtils';
import { makeImage } from './helpers';

let dataUrlImage;
beforeAll(async () => {
  dataUrlImage = await makeImage(200, 100);
});

function setup(image = dataUrlImage) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 200;
  canvasEl.height = 100;
  canvasEl.getContext('2d').drawImage(image, 0, 0);

  const currentImage = ref(image);
  const selectedTextId = ref(null);
  const filterManagement = useFilterManagement({});
  const transform = useTransform();
  const resizeManager = useResizeManager({});
  resizeManager.initFromDimensions(200, 100);
  const crop = { hasCropped: ref(false), resetCropState: vi.fn() };
  const imageStore = { texts: [] };
  const renderImage = vi.fn();
  const updateImageInfo = vi.fn();

  const history = useEditorHistory({
    canvas: ref(canvasEl),
    currentImage,
    selectedTextId,
    filters: filterManagement.filters,
    background: filterManagement.background,
    imageStore,
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
const restored = (renderImage, calls) =>
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
    const blob = await new Promise((r) => {
      const c = document.createElement('canvas');
      c.width = 40;
      c.height = 20;
      c.toBlob(r, 'image/png');
    });
    const blobImage = await loadImage(URL.createObjectURL(blob));
    const { history } = setup(blobImage);
    history.saveHistory();
    expect(history.history.value[0].rawImageSrc.startsWith('data:image/png')).toBe(true);

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

  it('tut ohne Canvas nichts', () => {
    const s = setup();
    const history = useEditorHistory({
      ...s,
      canvas: ref(null),
      filters: s.filterManagement.filters,
      background: s.filterManagement.background,
    });
    history.saveHistory();
    expect(history.history.value).toEqual([]);
  });
});
