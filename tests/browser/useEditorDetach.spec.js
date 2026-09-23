/**
 * useEditorDetach: Basisbild vom Hintergrund lösen (als Ebene backen) und
 * wieder verbinden, inklusive Hintergrund-Synchronisation im Ebenen-Modus.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ref, nextTick } from 'vue';
import { useEditorDetach } from '@/composables/editor/useEditorDetach';
import { useFilterManagement } from '@/composables/useFilterManagement';
import { useTransform } from '@/composables/useTransform';
import { useResizeManager } from '@/composables/useResizeManager';
import { makeImage, installToastMock, t } from './helpers';

let image;
beforeAll(async () => {
  image = await makeImage(300, 200);
});

function setup({ addImageLayerFails = false } = {}) {
  const toasts = installToastMock();
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 300;
  canvasEl.height = 200;
  canvasEl.getContext('2d').drawImage(image, 0, 0);

  const filterManagement = useFilterManagement({});
  filterManagement.filters.value.brightness = 150;
  const transform = useTransform();
  transform.transforms.value.rotation = 30;
  const resizeManager = useResizeManager({});
  resizeManager.initFromDimensions(300, 200);

  const imageStore = {
    canvasBackgroundColor: '#000000',
    initCanvas: vi.fn(),
    addImageLayer: vi.fn(async ({ url, name }) => {
      if (addImageLayerFails) throw new Error('kaputt');
      return { id: 'L1', url, name };
    }),
    updateImageLayer: vi.fn(),
    selectImageLayer: vi.fn(),
    clearImageLayers: vi.fn(),
  };

  const deps = {
    canvas: ref(canvasEl),
    currentImage: ref(image),
    originalImage: ref(null),
    isCollageMode: ref(false),
    detachedFromBackground: ref(false),
    background: filterManagement.background,
    currentFileName: ref('foto'),
    imageStore,
    filterManagement,
    transform,
    resizeManager,
    renderImage: vi.fn(),
    renderImageForExport: vi.fn(),
    updateImageInfo: vi.fn(),
    saveHistory: vi.fn(),
    t,
  };
  const detach = useEditorDetach(deps);
  return { ...deps, canvasEl, toasts, detach };
}

describe('useEditorDetach – Ablösen', () => {
  it('backt das Bild als Ebene über den ganzen Canvas und neutralisiert Filter/Transformationen', async () => {
    const s = setup();
    await s.detach.detachImageFromBackground();

    expect(s.renderImageForExport).toHaveBeenCalledWith(true, false);
    expect(s.imageStore.initCanvas).toHaveBeenCalledWith(s.canvasEl);
    const layerArg = s.imageStore.addImageLayer.mock.calls[0][0];
    expect(layerArg.name).toBe('foto');
    expect(layerArg.url.startsWith('data:image/png')).toBe(true);
    expect(s.imageStore.updateImageLayer).toHaveBeenCalledWith('L1', {
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      originalWidth: 300,
      originalHeight: 200,
    });
    expect(s.imageStore.selectImageLayer).toHaveBeenCalledWith('L1');
    expect(s.imageStore.canvasBackgroundColor).toBe('#ffffff'); // aus dem Hintergrund-Panel
    expect(s.filterManagement.filters.value.brightness).toBe(100);
    expect(s.transform.transforms.value.rotation).toBe(0);
    expect(s.detach.detachedFromBackground.value).toBe(true);
    expect(s.isCollageMode.value).toBe(true);
    expect(s.renderImage).toHaveBeenCalledTimes(1);
    expect(s.updateImageInfo).toHaveBeenCalledTimes(1);
    expect(s.saveHistory).toHaveBeenCalledTimes(1);
    expect(s.toasts).toEqual(['success:toast.editor.imageDetached']);
  });

  it('überträgt einen unsichtbaren Hintergrund als transparent', async () => {
    const s = setup();
    s.background.value.opacity = 0;
    await s.detach.detachImageFromBackground();
    expect(s.imageStore.canvasBackgroundColor).toBe('transparent');
  });

  it('tut nichts ohne Bild oder im Collage-Modus', async () => {
    const s = setup();
    s.isCollageMode.value = true;
    await s.detach.detachImageFromBackground();
    s.isCollageMode.value = false;
    s.currentImage.value = null;
    await s.detach.detachImageFromBackground();
    expect(s.imageStore.addImageLayer).not.toHaveBeenCalled();
    expect(s.detach.detachedFromBackground.value).toBe(false);
  });

  it('lässt bei einem Fehler den Editor-Zustand unverändert und meldet ihn', async () => {
    const s = setup({ addImageLayerFails: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await s.detach.detachImageFromBackground();
    expect(s.detach.detachedFromBackground.value).toBe(false);
    expect(s.isCollageMode.value).toBe(false);
    expect(s.filterManagement.filters.value.brightness).toBe(150);
    expect(s.transform.transforms.value.rotation).toBe(30);
    expect(s.saveHistory).not.toHaveBeenCalled();
    expect(s.toasts).toEqual(['error:toast.editor.detachFailed']);
    vi.restoreAllMocks();
  });
});

describe('useEditorDetach – Verbinden und Umschalten', () => {
  it('bäckt die Ebenen zurück in ein Einzelbild', async () => {
    const s = setup();
    await s.detach.detachImageFromBackground();
    const detachedImage = s.currentImage.value;

    await s.detach.reattachImageToBackground();

    expect(s.renderImageForExport).toHaveBeenLastCalledWith(true, false);
    expect(s.imageStore.clearImageLayers).toHaveBeenCalledTimes(1);
    expect(s.imageStore.selectImageLayer).toHaveBeenLastCalledWith(null);
    expect(s.currentImage.value).not.toBe(detachedImage);
    expect([s.currentImage.value.width, s.currentImage.value.height]).toEqual([300, 200]);
    expect(s.originalImage.value).toBe(s.currentImage.value); // vorher leer → übernommen
    expect(s.isCollageMode.value).toBe(false);
    expect(s.detach.detachedFromBackground.value).toBe(false);
    expect([s.canvasEl.width, s.canvasEl.height]).toEqual([300, 200]);
    expect(s.resizeManager.originalWidth.value).toBe(300);
    expect(s.saveHistory).toHaveBeenCalledTimes(2);
    expect(s.toasts.at(-1)).toBe('success:toast.editor.imageReattached');
  });

  it('behält ein vorhandenes Originalbild beim Verbinden', async () => {
    const s = setup();
    s.originalImage.value = image;
    await s.detach.detachImageFromBackground();
    await s.detach.reattachImageToBackground();
    expect(s.originalImage.value).toBe(image);
  });

  it('nutzt den vom Editor geteilten Zustands-Ref', async () => {
    const s = setup();
    expect(s.detach.detachedFromBackground).toBe(s.detachedFromBackground);
    await s.detach.detachImageFromBackground();
    expect(s.detachedFromBackground.value).toBe(true);
  });

  it('handleToggleDetach wechselt zwischen beiden Zuständen', async () => {
    const s = setup();
    s.detach.handleToggleDetach();
    await vi.waitFor(() => expect(s.detach.detachedFromBackground.value).toBe(true));
    s.detach.handleToggleDetach();
    await vi.waitFor(() => expect(s.detach.detachedFromBackground.value).toBe(false));
    expect(s.imageStore.addImageLayer).toHaveBeenCalledTimes(1);
    expect(s.imageStore.clearImageLayers).toHaveBeenCalledTimes(1);
  });

  it('synchronisiert den Canvas-Hintergrund nur im abgelösten Zustand', async () => {
    const s = setup();
    s.background.value.color = '#ff0000';
    await nextTick();
    expect(s.imageStore.canvasBackgroundColor).toBe('#000000'); // nicht abgelöst → unverändert
    expect(s.renderImage).not.toHaveBeenCalled();

    await s.detach.detachImageFromBackground();
    s.renderImage.mockClear();
    s.background.value.color = '#00ff00';
    await nextTick();
    expect(s.imageStore.canvasBackgroundColor).toBe('#00ff00');
    expect(s.renderImage).toHaveBeenCalledTimes(1);

    s.background.value.opacity = 0;
    await nextTick();
    expect(s.imageStore.canvasBackgroundColor).toBe('transparent');
  });
});
