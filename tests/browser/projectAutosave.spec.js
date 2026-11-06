/**
 * Projekt speichern: Snapshot <-> IndexedDB (echte IndexedDB in Chromium)
 * und die automatische Sicherung im Editor (useProjectAutosave).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import {
  dataUrlToBlob,
  packSnapshot,
  unpackSnapshot,
  urlToBlob,
} from '@/lib/project/projectSnapshot';
import {
  deleteProject,
  loadProject,
  saveProject,
  resetProjectStorageForTests,
  PROJECT_FORMAT_VERSION,
} from '@/lib/project/projectStorage';
import { useProjectAutosave } from '@/composables/editor/useProjectAutosave';
import { loadImage } from '@/utils/fileUtils';
import { makeImage, makePngFile } from './helpers';

async function blobText(blob) {
  return new Uint8Array(await blob.arrayBuffer()).join(',');
}

async function sampleSnapshot() {
  const img = await makeImage(60, 40);
  const layerFile = await makePngFile('ebene.png', 30, 20, '#ff0000');
  const layerUrl = URL.createObjectURL(layerFile);
  return {
    description: 'Bearbeitung',
    imageData: 'data:image/png;base64,AAAA',
    rawImageSrc: img.src,
    filters: { brightness: 120 },
    texts: [{ id: 't1', content: 'Hallo' }],
    shapes: [{ id: 's1', type: 'rect' }],
    isCollageMode: true,
    imageLayers: [{ id: 'l1', name: 'Ebene', url: layerUrl, image: null, x: 5 }],
    selectedLayerId: 'l1',
    width: 60,
    height: 40,
  };
}

describe('projectSnapshot', () => {
  it('wandelt Data-URLs ohne Netz in Blobs um', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,SGFsbG8=');
    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('Hallo');
    expect(await dataUrlToBlob('data:text/plain,a%20b').text()).toBe('a b');
    expect(() => dataUrlToBlob('blob:xyz')).toThrow();
    expect(await urlToBlob('')).toBeNull();
  });

  it('packt Bilder als Blobs und stellt sie als ladbare URLs wieder her', async () => {
    const snapshot = await sampleSnapshot();
    const packed = await packSnapshot(snapshot);

    // keine URLs im JSON-Teil, gerendertes Vorschaubild fällt weg
    expect(JSON.stringify(packed.state)).not.toMatch(/blob:|data:/);
    expect(packed.state.imageData).toBeUndefined();
    expect(packed.rawImage.type).toBe('image/png');
    expect(packed.layerImages).toHaveLength(1);
    expect(packed.layerImages[0].type).toBe('image/png');

    const restored = unpackSnapshot(packed);
    expect(restored.filters).toEqual({ brightness: 120 });
    expect(restored.texts).toEqual(snapshot.texts);
    expect(restored.imageLayers[0]).toMatchObject({ id: 'l1', x: 5 });
    expect(restored.imageLayers[0].url.startsWith('blob:')).toBe(true);
    const layerImg = await loadImage(restored.imageLayers[0].url);
    expect(layerImg.naturalWidth).toBe(30);
    const raw = await loadImage(restored.rawImageSrc);
    expect(raw.naturalWidth).toBe(60);
  });

  it('nutzt das gerenderte Bild, wenn kein Rohbild vorliegt; ohne Ebenen-Bild fällt die Ebene weg', async () => {
    const img = await makeImage(10, 10);
    const packed = await packSnapshot({ imageData: img.src, rawImageSrc: null, imageLayers: [] });
    expect(packed.rawImage).not.toBeNull();

    const restored = unpackSnapshot({
      state: { imageLayers: [{ id: 'a' }, { id: 'b' }] },
      rawImage: null,
      layerImages: [null, packed.rawImage],
      layerThumbnails: [null, null],
    });
    expect(restored.rawImageSrc).toBeNull();
    expect(restored.imageLayers.map((l) => l.id)).toEqual(['b']);
  });
});

describe('projectStorage (IndexedDB)', () => {
  beforeEach(() => resetProjectStorageForTests());

  it('speichert, lädt und löscht das Projekt samt Blobs', async () => {
    expect(await loadProject()).toBeNull();
    const packed = await packSnapshot(await sampleSnapshot());
    await saveProject({
      version: PROJECT_FORMAT_VERSION,
      savedAt: 123,
      name: 'foto',
      format: 'png',
      thumbnail: null,
      original: packed.rawImage,
      sourceFile: null,
      snapshot: packed,
    });

    const loaded = await loadProject();
    expect(loaded.name).toBe('foto');
    expect(loaded.snapshot.state.texts).toEqual([{ id: 't1', content: 'Hallo' }]);
    expect(await blobText(loaded.snapshot.layerImages[0])).toBe(
      await blobText(packed.layerImages[0])
    );

    await deleteProject();
    expect(await loadProject()).toBeNull();
  });

  it('verwirft Einträge in fremdem Format', async () => {
    await saveProject({ version: 99, snapshot: {} });
    expect(await loadProject()).toBeNull();
  });
});

describe('useProjectAutosave', () => {
  let stored;
  let storage;

  beforeEach(() => {
    stored = null;
    storage = {
      save: vi.fn(async (p) => {
        stored = p;
      }),
      load: vi.fn(async () => stored),
      remove: vi.fn(async () => {
        stored = null;
      }),
      available: () => true,
    };
  });
  async function setup(overrides = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 40;
    const deps = {
      canvas: ref(canvas),
      history: ref([]),
      historyIndex: ref(-1),
      currentFileName: ref('urlaub'),
      currentImageFormat: ref('jpg'),
      originalImageDataUrl: ref(''),
      originalImage: ref(null),
      sourceFile: ref(await makePngFile('urlaub.png', 4, 4)),
      restoreSnapshot: vi.fn(async () => {}),
      delay: 20,
      storage,
      ...overrides,
    };
    return { deps, autosave: useProjectAutosave(deps) };
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  it('sichert den aktuellen Historien-Eintrag kurz nach einer Änderung', async () => {
    const { deps, autosave } = await setup();
    const snapshot = await sampleSnapshot();
    deps.history.value = [snapshot];
    deps.historyIndex.value = 0;
    expect(storage.save).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(autosave.status.value).toBe('saved'));
    expect(storage.save).toHaveBeenCalledTimes(1);
    expect(stored.name).toBe('urlaub');
    expect(stored.format).toBe('jpg');
    expect(stored.sourceFile.name).toBe('urlaub.png');
    expect(stored.snapshot.state.texts).toEqual(snapshot.texts);
    expect(autosave.status.value).toBe('saved');
  });

  it('löscht die Sicherung, wenn die Historie geleert wird', async () => {
    const { deps } = await setup();
    stored = { version: PROJECT_FORMAT_VERSION };
    deps.history.value = [{ width: 1 }];
    deps.historyIndex.value = 0;
    await nextTick();
    deps.history.value = [];
    deps.historyIndex.value = -1;
    await vi.waitFor(() => expect(storage.remove).toHaveBeenCalled());
    expect(storage.save).not.toHaveBeenCalled();
    expect(stored).toBeNull();
  });

  it('meldet einen Speicherfehler nur einmal', async () => {
    const onError = vi.fn();
    storage.save = vi.fn(async () => {
      throw new DOMException('voll', 'QuotaExceededError');
    });
    const { deps, autosave } = await setup({ onError });
    deps.history.value = [{ width: 1 }];
    deps.historyIndex.value = 0;
    await vi.waitFor(() => expect(autosave.status.value).toBe('error'));
    deps.history.value = [{ width: 1 }, { width: 2 }];
    deps.historyIndex.value = 1;
    await vi.waitFor(() => expect(storage.save).toHaveBeenCalledTimes(2));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('bietet ein gespeichertes Projekt an und setzt es fort', async () => {
    const packed = await packSnapshot(await sampleSnapshot());
    stored = {
      version: PROJECT_FORMAT_VERSION,
      savedAt: Date.now(),
      name: 'collage',
      format: 'png',
      thumbnail: packed.rawImage,
      original: packed.rawImage,
      sourceFile: { blob: packed.rawImage, name: 'orig.png', type: 'image/png', lastModified: 1 },
      snapshot: packed,
    };
    const { deps, autosave } = await setup({
      currentFileName: ref(''),
      sourceFile: ref(null),
    });

    expect(await autosave.checkForSavedProject()).toBe(true);
    expect(autosave.savedProject.value).toMatchObject({
      name: 'collage',
      isCollage: true,
      layerCount: 1,
      textCount: 1,
      shapeCount: 1,
    });
    expect(autosave.savedProject.value.thumbnailUrl).toMatch(/^blob:/);

    expect(await autosave.resumeProject()).toBe(true);
    const state = deps.restoreSnapshot.mock.calls[0][0];
    expect(state.isCollageMode).toBe(true);
    expect(state.imageLayers[0].url).toMatch(/^blob:/);
    expect(deps.currentFileName.value).toBe('collage');
    expect(deps.sourceFile.value).toBeInstanceOf(File);
    expect(deps.sourceFile.value.name).toBe('orig.png');
    expect(deps.originalImage.value).toBeInstanceOf(HTMLImageElement);
    expect(deps.originalImageDataUrl.value).toMatch(/^blob:/);
    expect(autosave.savedProject.value).toBeNull();
  });

  it('verwerfen löscht die Sicherung', async () => {
    stored = { version: PROJECT_FORMAT_VERSION };
    const { autosave } = await setup();
    await autosave.discardProject();
    expect(storage.remove).toHaveBeenCalled();
    expect(stored).toBeNull();
  });

  it('ohne IndexedDB passiert nichts', async () => {
    storage.available = () => false;
    const { deps, autosave } = await setup();
    expect(autosave.enabled).toBe(false);
    deps.history.value = [{ width: 1 }];
    deps.historyIndex.value = 0;
    await nextTick();
    await wait(80);
    expect(storage.save).not.toHaveBeenCalled();
    expect(await autosave.checkForSavedProject()).toBe(false);
  });
});
